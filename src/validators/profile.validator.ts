import { z } from "zod";

/**
 * Whitelist: role, isBlocked, email and id can never be changed through this
 * endpoint. `.strict()` rejects any extra key with a 400.
 */
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(60).optional(),
    image: z
      .string()
      .trim()
      .url("Image must be a valid URL")
      .refine((value) => value.startsWith("https://"), "Image must be an https URL")
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s\-()]{7,20}$/, "Enter a valid phone number")
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "No valid fields to update");

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
