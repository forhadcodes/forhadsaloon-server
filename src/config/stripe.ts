import Stripe from "stripe";

import { env } from "./env.js";

/** Stripe only ever exists on the server. The key comes from env, never code. */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

/** Placeholder values let the rest of the app boot without a Stripe account. */
export const stripeConfigured = /^sk_(test|live)_[A-Za-z0-9]+$/.test(env.STRIPE_SECRET_KEY);
