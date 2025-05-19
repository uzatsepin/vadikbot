import { Context } from 'grammy';
import prisma from '../lib/prisma';
import { Car } from '@prisma/client';

export const createCar = async (
  userId: number,
  name: string,
  remainingAmount: number,
  totalAmount: number
): Promise<Car> => {
  return prisma.car.create({
    data: {
      userId,
      name,
      remainingAmount,
      totalAmount,
    },
  });
};

export const getCarById = async (carId: number): Promise<Car | null> => {
  return prisma.car.findUnique({
    where: { id: carId },
  });
};

export const updateCarRemainingAmount = async (
  carId: number,
  newAmount: number
): Promise<Car | null> => {
  return prisma.car.update({
    where: { id: carId },
    data: { remainingAmount: newAmount },
  });
};

export const getUserCars = async (userId: number) => {
  return prisma.car.findMany({
    where: { userId },
    include: {
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
      },
    },
  });
};

export const getCarStatistics = async (carId: number) => {
  const car = await prisma.car.findUnique({
    where: { id: carId },
    include: {
      payments: true,
    },
  });

  if (!car) return null;

  const totalPaid = car.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remainingAmount = Number(car.totalAmount) - totalPaid;

  return {
    ...car,
    total_payments: car.payments.length,
    total_paid: totalPaid,
    last_payment_date: car.payments[0]?.paymentDate || null,
    remaining_amount: remainingAmount,
  };
}; 