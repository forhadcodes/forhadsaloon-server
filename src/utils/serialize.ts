import type { Types } from "mongoose";

type ServiceDoc = {
  _id: Types.ObjectId | string;
  serviceName: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  status: string;
  createdAt: Date;
};

type UserDoc = {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  image?: string | null;
  role: "admin" | "customer";
  isBlocked?: boolean;
  phone?: string | null;
  createdAt?: Date;
};

/** Shapes a service document for the client (uses `id`, drops `__v`). */
export const toServiceDTO = (doc: ServiceDoc) => ({
  id: String(doc._id),
  serviceName: doc.serviceName,
  category: doc.category,
  description: doc.description,
  price: doc.price,
  duration: doc.duration,
  image: doc.image,
  status: doc.status,
  createdAt: doc.createdAt,
});

/** Shapes a user document without sensitive fields. */
export const toUserDTO = (doc: UserDoc) => ({
  id: String(doc._id),
  name: doc.name,
  email: doc.email,
  image: doc.image ?? null,
  role: doc.role,
  isBlocked: doc.isBlocked ?? false,
  phone: doc.phone ?? null,
  createdAt: doc.createdAt,
});
