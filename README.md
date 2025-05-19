# Car Payment Tracking Bot

Telegram bot for tracking car payments and managing car buyout schedules.

## Features

- User registration and car management
- Payment tracking and history
- Statistics and analytics
- Inline keyboard navigation
- PostgreSQL database for reliable data storage

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Telegram Bot Token

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgresql://username:password@localhost:5432/car_payments
```

4. Create a PostgreSQL database named `car_payments`

5. Start the bot:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Database Schema

### Users
- id (SERIAL PRIMARY KEY)
- telegram_id (BIGINT UNIQUE)
- username (VARCHAR)
- first_name (VARCHAR)
- last_name (VARCHAR)
- created_at (TIMESTAMP)

### Cars
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER REFERENCES users)
- name (VARCHAR)
- remaining_amount (DECIMAL)
- total_amount (DECIMAL)
- created_at (TIMESTAMP)

### Payments
- id (SERIAL PRIMARY KEY)
- car_id (INTEGER REFERENCES cars)
- user_id (INTEGER REFERENCES users)
- amount (DECIMAL)
- payment_date (TIMESTAMP)
- created_at (TIMESTAMP)

## Commands

- `/start` - Start the bot and register user
- Add car - Add a new car to track
- View cars - List all your cars
- Add payment - Record a new payment
- View payments - See payment history
- Statistics - View payment statistics 