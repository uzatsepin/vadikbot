import cron from 'node-cron';
import { Bot } from 'grammy';
import { MyConversationContext } from '../types/bot';
import { getUserCars, getCarStatistics } from '../handlers/car';
import { getPaymentsForWeek } from '../handlers/payment';
import prisma from './prisma';

const REMINDER_MESSAGES = [
  "🤑 Йоу, братишка! Где деньги за тачку? Вадик беспокоится!",
  "💰 Слушай, брат, там по тачке движение нужно... Давай замутим платёж?",
  "🚗 Братан, твоя ласточка ждёт оплаты! Не подведи её!",
  "💸 Эй, темщик! Пора занести бабки за тачку, не забыл?",
  "🎵 Брат, я как криптан на медвежьем рынке - жду твоего заноса за тачку!",
  "🚨 Слышь, братишка! Эта неделя пустая, как холодный кошелёк... Может замутим платёж?",
  "📅 Новая неделя, новые движения! Давай порешаем вопрос с оплатой?",
  "🏎 Братан, на сокаре уже все платежи замутили, а ты что?",
  "💎 Не храни бабки в крипте - занеси их за тачку! Вадик плохого не посоветует 😉",
  "🤝 Слушай, тут такое дело... Тачка просит немного любви в виде платежа!"
];

function getRandomMessage(): string {
  const randomIndex = Math.floor(Math.random() * REMINDER_MESSAGES.length);
  return REMINDER_MESSAGES[randomIndex];
}

export async function setupPaymentReminders(bot: Bot<MyConversationContext>) {
  // Schedule for every Wednesday at 12:00
  cron.schedule('0 12 * * 3', async () => {
    try {
      // Get all users
      const users = await prisma.user.findMany();

      for (const user of users) {
        const cars = await getUserCars(user.id);
        
        if (cars.length === 0) continue;

        // Check if there were any payments this week
        let needsReminder = false;
        const carDetails = [];

        for (const car of cars) {
          const payments = await getPaymentsForWeek(car.id);
          const stats = await getCarStatistics(car.id);
          
          if (!stats) continue;
          
          // Only remind if there's still an amount to pay and no payments this week
          if (stats.remaining_amount > 0 && payments.length === 0) {
            needsReminder = true;
            carDetails.push({
              name: car.name,
              remaining: stats.remaining_amount
            });
          }
        }

        if (needsReminder && carDetails.length > 0) {
          const message = getRandomMessage() + "\n\n";
          const details = carDetails.map(car => 
            `🚗 ${car.name}\n` +
            `┌──────────────────────\n` +
            `│ 💸 Надо занести: $${car.remaining}\n` +
            `└──────────────────────`
          ).join('\n\n');

          try {
            await bot.api.sendMessage(Number(user.telegramId), 
              message + details + "\n\n" +
              "Вадик на связи, братишка! Как надумаешь - жми 'Занести бабки' 💪"
            );
          } catch (error) {
            console.error(`Failed to send reminder to user ${user.telegramId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error in payment reminder cron job:', error);
    }
  }, {
    timezone: "Europe/Kiev" // Adjust timezone as needed
  });
} 