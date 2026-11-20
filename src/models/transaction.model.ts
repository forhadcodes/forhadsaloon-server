import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITransaction extends Document {
  appointmentId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amount: number; // in dollars (major units)
  currency: string;
  stripeSessionId: string; // unique
  status: string;
  createdAt: Date;
}

export interface ITransactionInput {
  appointmentId: string;
  customerId: string;
  amount: number;
  currency?: string;
}

const TransactionSchema = new Schema(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: "usd" },
    stripeSessionId: { type: String, required: true, unique: true },
    status: { type: String, enum: ["paid", "failed"], default: "paid" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const Transaction: Model<ITransaction> = mongoose.model<ITransaction>("Transaction", TransactionSchema);