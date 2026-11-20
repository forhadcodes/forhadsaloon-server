import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAppointment extends Document {
  serviceId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  timeSlot: string;
  message?: string;
  servicePrice: number;
  paymentStatus: string;
  status: string;
  createdAt: Date;
}

export interface IAppointmentInput {
  serviceId: string;
  appointmentDate: string; // "YYYY-MM-DD"
  timeSlot: string;
  message?: string;
}

const AppointmentSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    message: { type: String, maxlength: 500, default: "" },
    servicePrice: { type: Number, required: true, min: 0.01 },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Indexes
// 1. Unique partial index: one active appointment per date+time slot (salon-wide)
AppointmentSchema.index(
  { appointmentDate: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
);
// 2. Customer's appointments sorted newest first
AppointmentSchema.index({ customerId: 1, createdAt: -1 });
// 3. Status filter
AppointmentSchema.index({ status: 1 });

export const Appointment: Model<IAppointment> = mongoose.model<IAppointment>("Appointment", AppointmentSchema);