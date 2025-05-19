import { Context } from 'grammy';
import prisma from '../lib/prisma';
import { User } from '@prisma/client';

export const createUser = async (telegramId: number): Promise<User> => {
  return prisma.user.upsert({
    where: { telegramId: BigInt(telegramId) },
    update: {},
    create: {
      telegramId: BigInt(telegramId),
      firstName: null,
      lastName: null,
      username: null,
    },
  });
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