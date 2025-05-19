import { Context } from 'grammy';
import prisma from '../lib/prisma';
import { User } from '@prisma/client';

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export const createUser = async (telegramUser: TelegramUser): Promise<User> => {
  console.log('Creating user with data:', telegramUser);
  try {
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(telegramUser.id) },
      update: {
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
        username: telegramUser.username || null,
      },
      create: {
        telegramId: BigInt(telegramUser.id),
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
        username: telegramUser.username || null,
      },
    });
    console.log('User created/updated:', user);
    return user;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

export const getUserByTelegramId = async (telegramId: number): Promise<User | null> => {
  console.log('Looking up user by telegram ID:', telegramId);
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
    console.log('User lookup result:', user);
    return user;
  } catch (error) {
    console.error('Error in getUserByTelegramId:', error);
    throw error;
  }
};

export const getUserCars = async (userId: number) => {
  return prisma.car.findMany({
    where: { userId },
    include: {
      payments: {
        orderBy: { paymentDate: 'desc' },
        take: 1,
      },
      _count: {
        select: { payments: true },
      },
    },
  });
}; 