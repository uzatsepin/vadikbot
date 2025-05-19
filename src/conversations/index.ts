import { MyContext, MyConversationContext, MyConversation } from '../types/bot';
import { createCar, getCarStatistics } from '../handlers/car';
import { createPayment } from '../handlers/payment';
import { getUserByTelegramId } from '../handlers/user';
import { createCarKeyboard } from '../config/bot';
import { SUCCESS_MESSAGES } from '../config/bot';

// --- Conversation for adding a car ---
export async function addCarConversation(conversation: MyConversation, ctx: MyConversationContext) {
  await ctx.reply('🚗 Йоу! Какую тачку берём, братишка? Название или модель?');
  const { message } = await conversation.wait();
  if (!message?.text) {
    await ctx.reply('🤨 Брат, ты чего? Напиши нормально название тачки!');
    return;
  }
  const carName = message.text;

  await ctx.reply('💰 А теперь скажи, сколько бабла осталось скинуть за неё (в $)?\nМожно даже как на сокаре посчитать, я шарю 😎');
  const { message: amountMessage } = await conversation.wait();
  if (!amountMessage?.text) {
    await ctx.reply('🤔 Это не похоже на сумму, братишка... Давай по новой!');
    return;
  }
  const amount = parseFloat(amountMessage.text);

  if (isNaN(amount)) {
    await ctx.reply('😅 Брат, ты что-то не то пишешь... Нужна сумма цифрами!');
    return;
  }

  const user = await getUserByTelegramId(ctx.from!.id);
  if (!user) return;

  const car = await createCar(user.id, carName, amount, amount);
  
  const keyboard = createCarKeyboard(car.id);

  await ctx.reply(
    SUCCESS_MESSAGES.car_added(car.name, Number(car.remainingAmount)),
    { reply_markup: keyboard }
  );
}

// --- Conversation for adding a payment ---
export async function addPaymentConversation(conversation: MyConversation, ctx: MyConversationContext) {
  if (!ctx.callbackQuery?.data) {
    await ctx.reply('😅 Братан, что-то не то нажал... Давай по новой!');
    return;
  }

  const match = ctx.callbackQuery.data.match(/^add_payment_(\d+)$/);
  if (!match?.[1]) {
    await ctx.reply('🤔 Не могу найти тачку в базе... Может глянем, что есть?');
    return;
  }

  const carId = parseInt(match[1]);
  
  const user = await getUserByTelegramId(ctx.from!.id);
  if (!user) return;

  const car = await getCarStatistics(carId);
  if (!car) {
    await ctx.reply('😬 Братиш, тачка куда-то пропала из базы... Может, уже продал?');
    return;
  }

  if (car.userId !== user.id) {
    await ctx.reply('🚫 Э, брат, ты чего? Это не твоя тачка! Давай посмотрим твои!');
    return;
  }

  await ctx.reply('💸 Сколько заносишь в кассу, братишка (в $)?\nТолько по-честному, без крипты 😅');
  const { message } = await conversation.wait();
  if (!message?.text) {
    await ctx.reply('🤨 Брат, это не похоже на сумму... Давай нормально!');
    return;
  }
  const amount = parseFloat(message.text);

  if (isNaN(amount)) {
    await ctx.reply('😅 Ты что-то не то пишешь... Нужна сумма цифрами, как в обменнике!');
    return;
  }

  const payment = await createPayment(user.id, carId, amount);
  const updatedCar = await getCarStatistics(carId);

  if (!updatedCar) {
    await ctx.reply('😬 Что-то база лагает... Давай по новой замутим!');
    return;
  }

  const keyboard = createCarKeyboard(carId);

  await ctx.reply(
    SUCCESS_MESSAGES.payment_added(amount, updatedCar.remaining_amount),
    { reply_markup: keyboard }
  );
} 