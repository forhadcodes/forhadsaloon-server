import { z } from "zod";

import { APPOINTMENT_STATUS, TIME_SLOTS } from "../config/constants.js";

export const createAppointmentSchema = z
  .object({
    serviceId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid service id"),
    appointmentDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Appointment date must be in YYYY-MM-DD format"),
    timeSlot: z.enum(TIME_SLOTS, "Invalid time slot"),
    message: z.string().trim().max(500, "Message must not exceed 500 characters").optional(),
  })
  .strict();

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const appointmentListQuerySchema = z.object({
  status: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.enum(APPOINTMENT_STATUS).optional(),
  ),
  page: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.number().int().min(1).default(1),
  ),
  limit: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.number().int().min(1).max(50).default(12),
  ),
});

export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;

export const availabilityQuerySchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
