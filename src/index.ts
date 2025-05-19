import { Bot, session, InlineKeyboard } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { MyContext, MyConversationContext, SessionData } from './types/bot';
import { WELCOME_MESSAGE, MAIN_MENU, createMainKeyboard, createCarKeyboard } from './config/bot';
import { getUserByTelegramId, createUser } from './handlers/user';
import { getUserCars, getCarStatistics } from './handlers/car';
import { getCarPayments } from './handlers/payment';
import { addCarConversation, addPaymentConversation } from './conversations';
import { setupPaymentReminders } from './lib/reminders';
import dotenv from 'dotenv';
import { ERROR_MESSAGES } from './config/bot';

dotenv.config();

// Create bot instance
const bot = new Bot<MyConversationContext>(process.env.BOT_TOKEN || '');

// Middleware
bot.use(session({
  initial: (): SessionData => ({
    conversationState: {}
  })
}));

// Add conversation support
bot.use(conversations());

// Register conversations
bot.use(createConversation(addCarConversation));
bot.use(createConversation(addPaymentConversation));

// Start command handler
bot.command('start', async (ctx) => {
  const user = await getUserByTelegramId(ctx.from!.id);
  
  if (!user) {
    // New user
    await createUser(ctx.from!.id);
    await ctx.reply(
      `${WELCOME_MESSAGE}\n\nПохоже, у вас пока нет добавленных автомобилей. Давайте добавим ваш первый автомобиль!`,
      { reply_markup: createMainKeyboard() }
    );
  } else {
    // Existing user
    const cars = await getUserCars(user.id);
    if (cars.length > 0) {
      const firstCar = await getCarStatistics(cars[0].id);
      if (firstCar) {
        const totalPaid = firstCar.total_paid;
        const remainingAmount = firstCar.remaining_amount;
        const monthlyPayment = Number(120); // Assuming 12 months payment plan
        const remainingMonths = Math.ceil(remainingAmount / monthlyPayment);
        const remainingWeeks = Math.ceil(remainingMonths * 4.33); // Average weeks in a month

        await ctx.reply(
          `${WELCOME_MESSAGE}\n\n` +
          `Статистика по автомобилю "${firstCar.name}":\n` +
          `💰 Общая стоимость: $${firstCar.totalAmount}\n` +
          `✅ Выплачено: $${totalPaid}\n` +
          `📊 Осталось выплатить: $${remainingAmount}\n` +
          `📅 Осталось примерно: ${remainingMonths} месяцев (${remainingWeeks} недель)`,
          { reply_markup: createMainKeyboard() }
        );
      }
    } else {
      await ctx.reply(
        `${WELCOME_MESSAGE}\n\nУ вас пока нет добавленных автомобилей. Давайте добавим ваш первый автомобиль!`,
        { reply_markup: createMainKeyboard() }
      );
    }
  }
});

// Callback query handlers
bot.callbackQuery('add_car', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter('addCarConversation');
});

bot.callbackQuery('main_menu', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(WELCOME_MESSAGE, { reply_markup: createMainKeyboard() });
});

bot.callbackQuery('view_cars', async (ctx) => {
  await ctx.answerCallbackQuery();
  const user = await getUserByTelegramId(ctx.from!.id);
  if (!user) return;

  const cars = await getUserCars(user.id);
  if (cars.length === 0) {
    await ctx.reply(ERROR_MESSAGES.no_cars, {
      reply_markup: createMainKeyboard()
    });
    return;
  }

  const carsList = await Promise.all(cars.map(async (car) => {
    const stats = await getCarStatistics(car.id);
    if (!stats) return '';
    
    const monthlyPayment = Number(120);
    const remainingMonths = Math.ceil(stats.remaining_amount / monthlyPayment);
    const remainingWeeks = Math.ceil(remainingMonths * 4.33);

    return `🚗 ${car.name}\n` +
           `┌──────────────────────\n` +
           `│ 💵 Стоимость: $${stats.totalAmount}\n` +
           `│ 🎯 Уже вложено: $${stats.total_paid}\n` +
           `│ 💰 Осталось закинуть: $${stats.remaining_amount}\n` +
           `│ ⏳ Ещё примерно: ${remainingMonths} мес. (${remainingWeeks} нед.)\n` +
           `└──────────────────────`;
  }));

  const keyboard = new InlineKeyboard();
  cars.forEach(car => {
    keyboard
      .text(`🚗 ${car.name}`, `car_details_${car.id}`)
      .row();
  });
  keyboard.text(MAIN_MENU.back, 'main_menu');

  await ctx.reply('🏎 Твой автопарк:\n\n' + carsList.join('\n\n'), {
    reply_markup: keyboard
  });
});

bot.callbackQuery(/^car_details_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const match = ctx.match;
  if (!match?.[1]) {
    await ctx.reply(ERROR_MESSAGES.invalid_car_id, {
      reply_markup: createMainKeyboard()
    });
    return;
  }
  const carId = parseInt(match[1]);

  const stats = await getCarStatistics(carId);
  if (!stats) {
    await ctx.reply(ERROR_MESSAGES.car_not_found, {
      reply_markup: createMainKeyboard()
    });
    return;
  }

  const monthlyPayment = Number(120);
  const remainingMonths = Math.ceil(stats.remaining_amount / monthlyPayment);
  const remainingWeeks = Math.ceil(remainingMonths * 4.33);

  const message = `🚗 ${stats.name}\n` +
                 `┌──────────────────────\n` +
                 `│ 💵 Стоимость: $${stats.totalAmount}\n` +
                 `│ 🎯 Уже вложено: $${stats.total_paid}\n` +
                 `│ 💰 Осталось закинуть: $${stats.remaining_amount}\n` +
                 `│ ⏳ Ещё примерно: ${remainingMonths} мес. (${remainingWeeks} нед.)\n` +
                 `└──────────────────────`;

  await ctx.reply(message, {
    reply_markup: createCarKeyboard(carId)
  });
});

bot.callbackQuery('add_payment', async (ctx) => {
  await ctx.answerCallbackQuery();
  const user = await getUserByTelegramId(ctx.from!.id);
  if (!user) return;

  const cars = await getUserCars(user.id);
  if (cars.length === 0) {
    await ctx.reply('У вас пока нет добавленных автомобилей.', {
      reply_markup: createMainKeyboard()
    });
    return;
  }

  const keyboard = new InlineKeyboard();
  cars.forEach(car => {
    keyboard.text(car.name, `add_payment_${car.id}`).row();
  });
  keyboard.text(MAIN_MENU.back, 'main_menu');

  await ctx.reply('Выберите автомобиль для добавления платежа:', {
    reply_markup: keyboard
  });
});

bot.callbackQuery(/^add_payment_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter('addPaymentConversation');
});

bot.callbackQuery('view_payments', async (ctx) => {
  await ctx.answerCallbackQuery();
  const user = await getUserByTelegramId(ctx.from!.id);
  if (!user) return;

  const cars = await getUserCars(user.id);
  if (cars.length === 0) {
    await ctx.reply('У вас пока нет добавленных автомобилей.', {
      reply_markup: createMainKeyboard()
    });
    return;
  }

  const keyboard = new InlineKeyboard();
  cars.forEach(car => {
    keyboard.text(car.name, `view_payments_${car.id}`).row();
  });
  keyboard.text(MAIN_MENU.back, 'main_menu');

  await ctx.reply('Выберите автомобиль для просмотра выплат:', {
    reply_markup: keyboard
  });
});

bot.callbackQuery(/^view_payments_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const match = ctx.match;
  if (!match?.[1]) {
    await ctx.reply(ERROR_MESSAGES.invalid_car_id, {
      reply_markup: createMainKeyboard()
    });
    return;
  }
  const carId = parseInt(match[1]);

  const car = await getCarStatistics(carId);
  if (!car) {
    await ctx.reply(ERROR_MESSAGES.car_not_found, {
      reply_markup: createMainKeyboard()
    });
    return;
  }

  const payments = await getCarPayments(carId);
  if (payments.length === 0) {
    await ctx.reply(ERROR_MESSAGES.no_payments, {
      reply_markup: createCarKeyboard(carId)
    });
    return;
  }

  const paymentsList = payments.map(payment => 
    `┌──────────────────────\n` +
    `│ 💸 Вложено: $${payment.amount}\n` +
    `│ 📅 Когда: ${payment.paymentDate.toLocaleDateString()}\n` +
    `└──────────────────────`
  ).join('\n');

  const monthlyPayment = Number(120);
  const remainingMonths = Math.ceil(car.remaining_amount / monthlyPayment);
  const remainingWeeks = Math.ceil(remainingMonths * 4.33);

  await ctx.reply(
    `💰 История платежей для "${car.name}":\n\n${paymentsList}\n\n` +
    `┌──────────────────────\n` +
    `│ 💵 Стоимость: $${car.totalAmount}\n` +
    `│ 🎯 Уже вложено: $${car.total_paid}\n` +
    `│ 💰 Осталось закинуть: $${car.remaining_amount}\n` +
    `│ ⏳ Ещё примерно: ${remainingMonths} мес. (${remainingWeeks} нед.)\n` +
    `└──────────────────────`,
    { reply_markup: createCarKeyboard(carId) }
  );
});

bot.callbackQuery('statistics', async (ctx) => {
  await ctx.answerCallbackQuery();
  const user = await getUserByTelegramId(ctx.from!.id);
  if (!user) return;

  const cars = await getUserCars(user.id);
  if (cars.length === 0) {
    await ctx.reply('У вас пока нет добавленных автомобилей.');
    return;
  }

  const carsList = await Promise.all(cars.map(async (car) => {
    const stats = await getCarStatistics(car.id);
    if (!stats) return '';
    
    const monthlyPayment = Number(120);
    const remainingMonths = Math.ceil(stats.remaining_amount / monthlyPayment);
    const remainingWeeks = Math.ceil(remainingMonths * 4.33);

    return `🚗 ${car.name}\n` +
           `┌──────────────────────\n` +
           `│ 💰 Общая стоимость: $${stats.totalAmount}\n` +
           `│ ✅ Выплачено: $${stats.total_paid}\n` +
           `│ 📊 Осталось: $${stats.remaining_amount}\n` +
           `│ 📅 Осталось примерно: ${remainingMonths} месяцев (${remainingWeeks} недель)\n` +
           `└──────────────────────`;
  }));

  const totalStats = cars.reduce((acc, car) => {
    acc.totalAmount += Number(car.totalAmount);
    acc.remainingAmount += Number(car.remainingAmount);
    return acc;
  }, { totalAmount: 0, remainingAmount: 0 });

  const message = `📊 Общая статистика по всем автомобилям:\n\n` +
                 carsList.join('\n\n') + '\n\n' +
                 `┌──────────────────────\n` +
                 `│ 💰 Общая сумма по всем авто: $${totalStats.totalAmount}\n` +
                 `│ 📊 Осталось выплатить: $${totalStats.remainingAmount}\n` +
                 `└──────────────────────`;

  await ctx.reply(message, { reply_markup: createMainKeyboard() });
});

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Start the bot
bot.start();

// Setup payment reminders
setupPaymentReminders(bot); 