# Frontend App

This is the React storefront and admin interface for the Ecomarce project.

## What it does

- browse products and product details
- manage cart state
- register and log in users
- place orders and view order history
- log in as admin and manage products
- create new admin accounts from the dashboard

## Setup

1. Install dependencies:
   - `npm install`
2. Run the app:
   - `npm run dev`

## Environment

Create a `.env` file if you need to override the API URL:

- `VITE_API_BASE_URL=http://localhost:4000/api`

## Main Flow

- `ShopContextProvider` handles shared state for products, cart, user auth, and admin auth.
- User auth lives under `/login`, `/signup`, `/orders`, and `/place-order`.
- Admin auth lives under `/admin/login` and `/admin/dashboard`.

## Notes

- Product data can fall back to local sample data if the API is unavailable.
- Orders are persisted through the backend API, not mocked in the frontend.
- Admin users can create additional admin accounts from the dashboard.
