import { z } from "zod";

import { TRANSACTION_STATUS } from "../config/constants.js";

export const createCheckoutSchema = z
  .object({
    appointmentId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid appointment id"),
  })
  .strict();

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

export const transactionListQuerySchema = z.object({
  status: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.enum(TRANSACTION_STATUS).optional(),
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

export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;
