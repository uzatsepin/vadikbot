import { MyContext, MyConversationContext, MyConversation } from '../types/bot';
import { createCar, getCarStatistics } from '../handlers/car';
import { createPayment } from '../handlers/payment';
import { getUserByTelegramId } from '../handlers/user';
import { createCarKeyboard } from '../config/bot';
import { SUCCESS_MESSAGES } from '../config/bot';

// --- Conversation for adding a car ---
export async function addCarConversation(conversation: MyConversation, ctx: MyConversationContext) {
  console.log('Starting addCarConversation for user:', ctx.from?.id);
  
  await ctx.reply('🚗 Йоу! Какую тачку берём, братишка? Название или модель?');
  const { message } = await conversation.wait();
  console.log('Received car name message:', message);
  
  if (!message?.text) {
    console.log('Invalid car name input received');
    await ctx.reply('🤨 Брат, ты чего? Напиши нормально название тачки!');
    return;
  }
  const carName = message.text;
  console.log('Car name received:', carName);

  await ctx.reply('💰 А теперь скажи, сколько бабла осталось скинуть за неё (в $)?\nМожно даже как на сокаре посчитать, я шарю 😎');
  const { message: amountMessage } = await conversation.wait();
  console.log('Received amount message:', amountMessage);
  
  if (!amountMessage?.text) {
    console.log('Invalid amount input received');
    await ctx.reply('🤔 Это не похоже на сумму, братишка... Давай по новой!');
    return;
  }
  const amount = parseFloat(amountMessage.text);
  console.log('Parsed amount:', amount);

  if (isNaN(amount)) {
    console.log('Invalid number format for amount');
    await ctx.reply('😅 Брат, ты что-то не то пишешь... Нужна сумма цифрами!');
    return;
  }

  console.log('Getting user by telegram ID:', ctx.from?.id);
  const user = await getUserByTelegramId(ctx.from!.id);
  if (!user) {
    console.log('User not found for telegram ID:', ctx.from?.id);
    await ctx.reply('😬 Что-то пошло не так с твоим профилем, братишка...');
    return;
  }
  console.log('User found:', user);

  console.log('Creating car with params:', { userId: user.id, carName, amount });
  try {
    const car = await createCar(user.id, carName, amount, amount);
    console.log('Car created successfully:', car);
    
    const keyboard = createCarKeyboard(car.id);
    console.log('Created keyboard for car ID:', car.id);

    await ctx.reply(
      SUCCESS_MESSAGES.car_added(car.name, Number(car.remainingAmount)),
      { reply_markup: keyboard }
    );
    console.log('Success message sent to user');
  } catch (error) {
    console.error('Error creating car:', error);
    await ctx.reply('😬 Упс, что-то пошло не так при добавлении тачки. Давай попробуем еще раз!');
  }
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