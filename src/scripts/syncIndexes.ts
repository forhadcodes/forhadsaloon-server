import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import { Appointment, Service, Transaction, User } from "../models/index.js";

/**
 * Serverless auto-indexing is unreliable — run `npm run db:indexes` once against
 * each environment (dev and production) after deployment.
 */
(async () => {
  await connectDB();

  for (const model of [User, Service, Appointment, Transaction]) {
    await model.syncIndexes();
    console.log(`${model.modelName}: indexes synced`);
  }

  await mongoose.disconnect();
  console.log("Index sync complete.");
})().catch((error: unknown) => {
  console.error("Index sync failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
