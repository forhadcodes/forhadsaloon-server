import { z } from "zod";

export const userListQuerySchema = z.object({
  search: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(100).optional(),
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

export type UserListQuery = z.infer<typeof userListQuerySchema>;
