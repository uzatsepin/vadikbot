import dotenv from 'dotenv';
import { InlineKeyboard } from 'grammy';

dotenv.config();

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN must be provided!');
}

// Welcome message
export const WELCOME_MESSAGE = `Йоу, братишка! 🤙

Это я, Вадик, твой личный консильери по автотемам! 

Короче, я тут на связи, чтобы помогать тебе следить за всеми мутками с тачками. Знаешь, как сейчас без колёс - как криптан без холодного кошелька 😅

Что я могу:
• 🚗 Замучу любую тачку в твой список
• 💸 Отслежу все твои заносы бабла
• 📊 Покажу, сколько ещё накопить до мечты
• ⏰ Если что, напомню про оплату (а то знаю я вас, все "завтра закину" 😏)

Кстати, если что, я шарю за все темы на сокаре, могу подсказать, как там правильно мутиться 😎

Давай замутим твою первую тачку в списке! Жми "Замутить тачку" и погнали! 🚀`;

// Error messages
export const ERROR_MESSAGES = {
  no_cars: '😅 Брат, у тебя пока ни одной тачки нет! Давай замутим что-нибудь?',
  car_not_found: '🤔 Братиш, тачка куда-то съехала... Может на сокаре уже кто-то взял? 😅',
  invalid_car_id: '😬 Упс, что-то пошло не по плану... Давай по новой!',
  no_payments: '💸 Пока ни одного заноса! Как говорится, нет денег - нет вписки на тачку!'
};

// Success messages
export const SUCCESS_MESSAGES = {
  car_added: (name: string, amount: number) => 
    `🔥 Красава! Замутил себе ${name}!\n` +
    `💰 Осталось занести: $${amount}\n` +
    `Не боись, братишка, порешаем! Вадик на связи 💪`,
  payment_added: (amount: number, remaining: number) =>
    `💸 Изи! Занёс ${amount}$ в кассу!\n` +
    `${remaining > 0 
      ? `😎 Осталось совсем по-братски: $${remaining}\nСкоро будешь как босс на своей тачке 🔥` 
      : '🎊 БРАТИИИИШ! ТАЧКА ВЫПЛАЧЕНА! ЭТО ПОБЕДА! 🎊'}`
};

// Inline keyboard options
export const MAIN_MENU = {
  add_car: '🚗 Замутить тачку',
  view_cars: '🏎 Мои ласточки',
  add_payment: '💸 Занести бабки',
  view_payments: '📊 Движение бабла',
  statistics: '📈 Статистика',
  back: '⬅️ Назад',
  main_menu: '🏠 На главную'
};

// Keyboard builders
export const createMainKeyboard = () => {
  return new InlineKeyboard()
    .text(MAIN_MENU.add_car, 'add_car').row()
    .text(MAIN_MENU.view_cars, 'view_cars').row()
    .text(MAIN_MENU.add_payment, 'add_payment').row()
    .text(MAIN_MENU.view_payments, 'view_payments').row()
    .text(MAIN_MENU.statistics, 'statistics');
};

export const createCarKeyboard = (carId: number) => {
  return new InlineKeyboard()
    .text(MAIN_MENU.add_payment, `add_payment_${carId}`).row()
    .text(MAIN_MENU.view_payments, `view_payments_${carId}`).row()
    .text(MAIN_MENU.statistics, `statistics_${carId}`).row()
    .text(MAIN_MENU.back, 'view_cars');
};

export const createPaymentKeyboard = () => {
  return new InlineKeyboard()
    .text(MAIN_MENU.back, 'view_cars');
};

export const createBackToMainKeyboard = () => {
  return new InlineKeyboard()
    .text(MAIN_MENU.main_menu, 'main_menu');
};