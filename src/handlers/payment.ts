import { Context } from 'grammy';
import prisma from '../lib/prisma';
import { Payment } from '@prisma/client';
import { startOfWeek, endOfWeek } from 'date-fns';

export const createPayment = async (
  userId: number,
  carId: number,
  amount: number
): Promise<Payment> => {
  return prisma.$transaction(async (tx) => {
    // Create payment
    const payment = await tx.payment.create({
      data: {
        userId,
        carId,
        amount,
        paymentDate: new Date(),
      },
    });

    // Update car's remaining amount
    await tx.car.update({
      where: { id: carId },
      data: {
        remainingAmount: {
          decrement: amount,
        },
      },
    });

    return payment;
  });
};

export const getCarPayments = async (carId: number) => {
  return prisma.payment.findMany({
    where: { carId },
    orderBy: { paymentDate: 'desc' },
  });
};

export const getPaymentStatistics = async (carId: number) => {
  const payments = await prisma.payment.findMany({
    where: { carId },
    orderBy: { paymentDate: 'asc' },
  });

  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const averagePayment = payments.length > 0 ? totalAmount / payments.length : 0;

  return {
    total_payments: payments.length,
    total_amount: totalAmount,
    average_payment: averagePayment,
    first_payment: payments[0]?.paymentDate || null,
    last_payment: payments[payments.length - 1]?.paymentDate || null,
  };
};

export async function getPaymentsForWeek(carId: number) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start from Monday
  const end = endOfWeek(new Date(), { weekStartsOn: 1 }); // End on Sunday

  return prisma.payment.findMany({
    where: {
      carId,
      paymentDate: {
        gte: start,
        lte: end
      }
    }
  });
} 