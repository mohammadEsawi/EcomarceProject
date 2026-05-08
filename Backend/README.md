# Ecommerce Backend API

Node.js + Express REST API for a clothing store. Data is currently stored in JSON files; the `database/` directory contains PostgreSQL migration and seed scripts ready for when you switch to a relational database.

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18+ |
| npm | 9+ |
| PostgreSQL | 14+ (required only for `migrate` / `seed` scripts) |

---

## Installation

```bash
# Install dependencies
npm install
```

---

## Environment Variables

Create a `.env` file in the `Backend/` directory. All variables have sensible defaults except `JWT_SECRET` and `DB_PASSWORD`, which must be set explicitly.

```env
# Server
PORT=4000

# JWT (required — use a long random string in production)
JWT_SECRET=your_super_secret_key_here

# Admin account (used by the seed script and auto-bootstrapped on first run)
ADMIN_EMAIL=admin@store.com
ADMIN_PASSWORD=Admin123!

# PostgreSQL (only needed if using migrate / seed scripts)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

---

## Database Setup (PostgreSQL)

These steps are only required if you are migrating from the JSON file store to PostgreSQL.

### 1. Create the database

```sql
-- run in psql or pgAdmin
CREATE DATABASE ecommerce_db;
```

### 2. Apply the schema

```bash
node database/migrate.js
```

This reads `database/schema.sql` and creates all tables.

### 3. Seed initial data

```bash
node database/seed.js
```

This runs `database/seed.sql` (product and category data) and then uses bcrypt to hash and insert the admin and a test user account. Default credentials printed on completion:

```
Admin : admin@store.com / Admin123!
User  : user@test.com  / User123!
```

You can override the admin credentials via the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables before running the seed.

---

## Running the Server

```bash
# Development (with auto-restart via nodemon)
npm run dev

# Production
npm start
```

The API listens on `http://localhost:4000` by default.

Health check:

```
GET /api/health
```

---

## API Endpoints

All protected routes require an `Authorization: Bearer <token>` header. Tokens are obtained from the login endpoints.

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register a new user account |
| POST | `/api/auth/login` | Public | Log in and receive a JWT |
| GET | `/api/auth/me` | User | Get the currently authenticated user |

### Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/login` | Public | Log in as admin and receive a JWT |
| POST | `/api/admin/accounts` | Admin | Create a new admin account |

### Products — `/api/products`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | Public | List / search / filter products |
| GET | `/api/products/:id` | Public | Get a single product by ID |
| POST | `/api/products` | Admin | Create a new product |
| PUT | `/api/products/:id` | Admin | Update a product |
| DELETE | `/api/products/:id` | Admin | Delete a product |

**Query parameters for `GET /api/products`:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search across name, category, and brand |
| `category` | string | Comma-separated list — e.g. `Men,Women` |
| `subCategory` | string | `Topwear`, `Bottomwear`, or `WinterWear` (comma-separated) |
| `size` | string | Comma-separated sizes — e.g. `S,M,L` |
| `color` | string | Comma-separated colours |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `popular` | boolean | Pass `true` to return popular items only |
| `sort` | string | `newest`, `price-asc`, `price-desc`, `best-selling` |

### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | User | Place a new order |
| GET | `/api/orders/my` | User | Get orders belonging to the logged-in user |
| GET | `/api/orders/:id` | User/Admin | Get a single order (owner or admin only) |
| GET | `/api/orders` | Admin | List all orders |
| PATCH | `/api/orders/:id/status` | Admin | Update order status (`processing`, `delivered`, `cancelled`) |
| PATCH | `/api/orders/:id/cancel` | User | Cancel a processing order |

### Wishlist — `/api/wishlist`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wishlist/me` | User | Get the authenticated user's wishlist |
| POST | `/api/wishlist/toggle` | User | Add or remove a product (toggle by productId) |
| DELETE | `/api/wishlist/:productId` | User | Remove a specific product from the wishlist |

### Reviews — `/api/reviews`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews/product/:productId` | Public | Get all reviews for a product |
| POST | `/api/reviews/product/:productId` | User | Submit a review for a product |
| PATCH | `/api/reviews/:id/hide` | Admin | Hide a review |
| POST | `/api/reviews/:id/helpful` | User | Increment a review's helpful vote count |

### Profile — `/api/profile`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile/me` | User | Get the authenticated user's profile |
| PUT | `/api/profile/me` | User | Update profile details (name, email, phone, addresses) |
| POST | `/api/profile/me/addresses` | User | Add a new delivery address |

### Coupons — `/api/coupons`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/coupons/active` | Public | List all active coupon codes |
| POST | `/api/coupons/validate` | Public | Validate a coupon code and calculate the discount |
| POST | `/api/coupons` | Admin | Create a new coupon code |

---

## Project Structure

```
Backend/
├── data/                  # JSON file store (runtime data)
├── database/
│   ├── schema.sql         # PostgreSQL table definitions
│   ├── seed.sql           # Seed data (products, categories)
│   ├── migrate.js         # Applies schema.sql to PostgreSQL
│   └── seed.js            # Seeds data and hashes admin password via bcrypt
├── src/
│   ├── middleware/
│   │   └── auth.js        # requireAuth / requireAdmin middleware
│   ├── routes/            # One file per resource
│   ├── services/          # JSON file store helpers
│   ├── utils/             # Password hashing and JWT signing utilities
│   └── server.js          # Express app entry point
├── .env                   # Environment variables (not committed)
└── package.json
```

---

## Default Admin Bootstrap

If no admin exists in the data store, the server automatically creates one using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` on the first request to `/api/admin/login`. Change these values before deploying to any non-local environment.
