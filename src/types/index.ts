export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  created_at: Date;
}

export interface Car {
  id: number;
  user_id: number;
  name: string;
  remaining_amount: number;
  total_amount: number;
  created_at: Date;
}

export interface Payment {
  id: number;
  car_id: number;
  user_id: number;
  amount: number;
  payment_date: Date;
  created_at: Date;
}

export interface CarWithPayments extends Car {
  payments: Payment[];
  last_payment_date: Date | null;
  remaining_months: number;
  remaining_weeks: number;
} 