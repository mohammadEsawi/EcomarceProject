# Backend API

This backend powers the full dynamic e-commerce flow:

- user registration and login
- admin login and admin account creation
- product CRUD
- order creation and order history

Data is stored in JSON files under `Backend/data/` so the app stays dynamic without a database setup.

## Setup

1. Copy `.env.example` to `.env`.
2. Install dependencies:
   - `npm install`
3. Start the server:
   - `npm run dev`

Server default URL: `http://localhost:4000`

## Environment

- `PORT` - server port, default `4000`
- `JWT_SECRET` - token signing secret
- `ADMIN_EMAIL` - bootstrap admin email for the first admin account
- `ADMIN_PASSWORD` - bootstrap admin password for the first admin account

## Endpoints

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Admin

- `POST /api/admin/login`
- `POST /api/admin/accounts` (admin token required)

### Products

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin token required)
- `PUT /api/products/:id` (admin token required)
- `DELETE /api/products/:id` (admin token required)

### Orders

- `GET /api/orders/my` (user token required)
- `POST /api/orders` (user token required)
- `GET /api/orders` (admin token required)
- `PATCH /api/orders/:id/status` (admin token required)

## Auth Header

Use this header on protected routes:

- `Authorization: Bearer <token>`

## Default Admin Bootstrap

If no admin user exists yet, the backend creates one from `.env` values.

- default email: `admin@store.com`
- default password: `Admin123!`

That password is only a starter value. Change it in `.env` before using the app in a real environment.
