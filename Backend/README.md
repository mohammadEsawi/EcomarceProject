# Backend API

This backend provides REST APIs for product management and admin login.

## Setup

1. Copy `.env.example` to `.env`.
2. Install dependencies:
   - `npm install`
3. Start development server:
   - `npm run dev`

Server default URL: `http://localhost:4000`

## Endpoints

### Health

- `GET /api/health`

### Admin

- `POST /api/admin/login`

Request body:

```json
{
  "email": "admin@store.com",
  "password": "Admin123!"
}
```

### Products

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin token required)
- `PUT /api/products/:id` (admin token required)
- `DELETE /api/products/:id` (admin token required)

Use header for protected routes:

- `Authorization: Bearer <token>`
