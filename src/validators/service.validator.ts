import { z } from "zod";

import { CATEGORIES, SERVICE_STATUS } from "../config/constants.js";

/** Only images that came back from our own ImgBB upload endpoint are accepted. */
const IMGBB_HOSTS = new Set(["i.ibb.co", "ibb.co", "www.ibb.co"]);

const imageField = z
  .string()
  .trim()
  .min(1, "Service image is required")
  .max(500, "Image URL is too long")
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && IMGBB_HOSTS.has(url.hostname.toLowerCase());
    } catch {
      return false;
    }
  }, "Image must be an ImgBB https URL uploaded from the dashboard");

const priceField = z.coerce
  .number()
  .positive("Price must be greater than 0")
  .max(100000, "Price is too large");

const durationField = z.coerce
  .number()
  .int("Duration must be a whole number of minutes")
  .positive("Duration must be greater than 0")
  .max(600, "Duration is too long");

const serviceNameField = z
  .string()
  .trim()
  .min(3, "Service name must be at least 3 characters")
  .max(120, "Service name is too long");

const descriptionField = z
  .string()
  .trim()
  .min(10, "Description must be at least 10 characters")
  .max(2000, "Description is too long");

export const serviceCreateSchema = z
  .object({
    serviceName: serviceNameField,
    category: z.enum(CATEGORIES),
    description: descriptionField,
    price: priceField,
    duration: durationField,
    image: imageField,
    status: z.enum(SERVICE_STATUS).default("active"),
  })
  .strict();

export const serviceUpdateSchema = z
  .object({
    serviceName: serviceNameField.optional(),
    category: z.enum(CATEGORIES).optional(),
    description: descriptionField.optional(),
    price: priceField.optional(),
    duration: durationField.optional(),
    image: imageField.optional(),
    status: z.enum(SERVICE_STATUS).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const serviceStatusSchema = z
  .object({
    status: z.enum(SERVICE_STATUS),
  })
  .strict();

const SORT_OPTIONS = ["price_asc", "price_desc", "newest"] as const;

/** `?search=` and `?category=` arrive as empty strings; treat them as absent. */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max, "Search term is too long").optional());

const optionalCategory = z.preprocess(blankToUndefined, z.enum(CATEGORIES).optional());

const optionalServiceStatus = z.preprocess(blankToUndefined, z.enum(SERVICE_STATUS).optional());

export const serviceListQuerySchema = z.object({
  search: optionalText(100),
  category: optionalCategory,
  sort: z.preprocess(blankToUndefined, z.enum(SORT_OPTIONS).default("newest")),
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).default(1)),
  limit: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(50).default(12)),
});

export const adminServiceListQuerySchema = serviceListQuerySchema.extend({
  status: optionalServiceStatus,
});

export const featuredServicesQuerySchema = z.object({
  limit: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(24).default(6)),
});

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;
export type AdminServiceListQuery = z.infer<typeof adminServiceListQuerySchema>;
