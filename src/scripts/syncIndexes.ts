import "dotenv/config";
import mongoose from "mongoose";

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  const db = mongoose.connection.db;

  // Verify User collection exists and has expected fields
  const userCount = await db!.collection("users").countDocuments();
  console.log("User documents:", userCount);

  // Verify Service, Appointment, Transaction collections
  for (const name of ["services", "appointments", "transactions"]) {
    const count = await db!.collection(name).countDocuments();
    console.log(`${name} documents:`, count);
  }

  // List indexes for each relevant collection
  for (const name of ["services", "appointments", "transactions", "users"]) {
    const idxs = await db!.collection(name).indexes();
    console.log(`${name} indexes:`, idxs.length, "index(es)");
  }

  await mongoose.disconnect();
  console.log("✅ Index verification complete.");
})().catch((err) => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});