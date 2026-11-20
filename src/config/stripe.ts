import Stripe from "stripe";

import { env } from "./env.js";

/** Stripe only ever exists on the server. The key comes from env, never code. */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY);
