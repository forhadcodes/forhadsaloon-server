// Shared constants — keep identical to client/lib/constants.ts
export const SALON_TIMEZONE = "Asia/Dhaka";

export const CATEGORIES = [
  "Haircut & Styling",
  "Hair Coloring",
  "Hair Treatment",
  "Facial & Skincare",
  "Makeup",
  "Manicure & Pedicure",
  "Spa & Massage",
] as const;
export type ServiceCategory = (typeof CATEGORIES)[number];

export const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export const APPOINTMENT_STATUS = ["pending", "confirmed", "cancelled"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

export const PAYMENT_STATUS = ["unpaid", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const SERVICE_STATUS = ["active", "inactive"] as const;
export type ServiceStatus = (typeof SERVICE_STATUS)[number];

export const TRANSACTION_STATUS = ["paid", "failed"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUS)[number];