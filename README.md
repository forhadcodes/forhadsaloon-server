# SalonBook Server

REST API for the SalonBook salon appointment booking platform.

## Important Features

- Express REST API with strict validation and centralized error handling
- JWT verification against the Next.js Better Auth JWKS endpoint (added in later steps)
- MongoDB persistence with Mongoose
- Stripe Checkout with verified webhook and ImgBB image uploads (added in later steps)

## Technology Stack

Node.js, Express, TypeScript, MongoDB (Mongoose), zod, jose, Stripe, multer, helmet, cors, express-rate-limit, morgan.

## Installation

```bash
npm install
```

## Run Locally

```bash
cp .env.example .env
npm run dev
```

## Required Environment Variables

PORT, NODE_ENV, MONGODB_URI, CLIENT_URL, BETTER_AUTH_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, IMGBB_API_KEY

## Live Website

To be added.

## Repositories

- Client: https://github.com/forhadsaloon/salonbook-client
- Server: https://github.com/forhadsaloon/salonbook-server
