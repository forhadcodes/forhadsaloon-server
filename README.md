# SalonBook Server

REST API for the SalonBook salon appointment booking platform. It verifies Better Auth JWTs through the client app's JWKS endpoint, stores data in MongoDB, uploads images to ImgBB, and processes Stripe Checkout payments through a verified webhook.

## Important Features

- JWT verification (`jose` + remote JWKS), database-backed role and blocked-user guards on every protected route; admin routers guarded at mount time.
- Strict zod validation rejects unknown body keys, so clients can never set `role`, `isBlocked`, `paymentStatus`, `servicePrice` or appointment `status`.
- Services API with search, category filter, sorting and pagination; admin service CRUD with ImgBB uploads.
- Appointments: salon-wide duplicate date/time prevention, availability lookup, customer/admin listing, confirm and cancel rules.
- Stripe Checkout for confirmed unpaid appointments; payment status becomes `paid` **only** in the verified webhook, which is idempotent and also records failed payments.
- Admin user management (block/unblock revokes Better Auth sessions) and dashboard statistics.

## Technology Stack

Node.js, Express 5, TypeScript, MongoDB (Mongoose), zod, jose, Stripe, multer, helmet, cors, express-rate-limit, morgan. Deployed on Vercel.

## Installation

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your own values (never commit it).

## Run Locally

```bash
# Apply all model indexes (once per environment)
npm run db:indexes

# Start the API on port 5000
npm run dev

# In another terminal, forward Stripe test events to the local webhook
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

Then start the client (salonbook-client repo) with `npm run dev`. Other commands: `npm run typecheck`, `npm run build`, `npm start`.

## Required Environment Variables

`PORT`, `NODE_ENV`, `MONGODB_URI`, `MONGODB_DB_NAME`, `CLIENT_URL`, `BETTER_AUTH_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `IMGBB_API_KEY`

`MONGODB_DB_NAME` is optional (defaults to `forhadsaloondb`) but must match the client's value — both apps share one database. `CLIENT_URL` and `BETTER_AUTH_URL` both point to the deployed client origin (no trailing slash). Never commit real values.

## API Routes

| Method | Path | Access |
|---|---|---|
| GET | `/api/health` | Public |
| GET | `/api/services` | Public |
| GET | `/api/services/featured` | Public |
| GET | `/api/services/categories` | Public |
| GET | `/api/services/:id` | Signed in |
| POST | `/api/appointments` | Customer |
| GET | `/api/appointments/availability` | Signed in |
| GET | `/api/appointments/my` | Customer |
| GET | `/api/appointments/my/stats` | Customer |
| GET | `/api/appointments/:id` | Customer (own) |
| PATCH | `/api/appointments/:id/cancel` | Customer (own, pending) |
| POST | `/api/payments/create-checkout-session` | Customer |
| GET | `/api/payments/session/:sessionId` | Customer (own, read-only) |
| POST | `/api/webhooks/stripe` | Stripe signature |
| POST | `/api/upload/image` | Signed in |
| POST | `/api/upload/public` | Public (rate limited) |
| GET | `/api/profile` | Signed in |
| PATCH | `/api/profile` | Signed in |
| GET | `/api/admin/services` | Admin |
| POST | `/api/admin/services` | Admin |
| PATCH | `/api/admin/services/:id` | Admin |
| PATCH | `/api/admin/services/:id/status` | Admin |
| DELETE | `/api/admin/services/:id` | Admin |
| GET | `/api/admin/appointments` | Admin |
| GET | `/api/admin/appointments/:id` | Admin |
| PATCH | `/api/admin/appointments/:id/confirm` | Admin |
| PATCH | `/api/admin/appointments/:id/cancel` | Admin |
| GET | `/api/admin/users` | Admin |
| GET | `/api/admin/users/:id` | Admin |
| PATCH | `/api/admin/users/:id/block` | Admin |
| PATCH | `/api/admin/users/:id/unblock` | Admin |
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/transactions` | Admin (read-only) |

## Live Website

To be added after deployment.

## Repositories

- Client: https://github.com/forhadsaloon/salonbook-client
- Server: https://github.com/forhadsaloon/salonbook-server
