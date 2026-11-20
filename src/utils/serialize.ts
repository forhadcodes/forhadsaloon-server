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

type PopulatedService = {
  _id?: Types.ObjectId | string;
  serviceName?: string;
  image?: string;
  category?: string;
  duration?: number;
  price?: number;
};

type PopulatedCustomer = {
  _id?: Types.ObjectId | string;
  name?: string;
  email?: string;
  phone?: string | null;
  image?: string | null;
};

type AppointmentDoc = {
  _id: Types.ObjectId | string;
  serviceId: Types.ObjectId | string | PopulatedService;
  customerId: Types.ObjectId | string | PopulatedCustomer;
  appointmentDate: Date;
  timeSlot: string;
  message?: string;
  servicePrice: number;
  paymentStatus: string;
  status: string;
  createdAt: Date;
  transaction?: {
    _id: Types.ObjectId | string;
    amount: number;
    currency: string;
    createdAt: Date;
  } | null;
};

const isPopulatedObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !("_bsontype" in value);

const isPopulatedService = (value: AppointmentDoc["serviceId"]): value is PopulatedService =>
  isPopulatedObject(value);

const isPopulatedCustomer = (value: AppointmentDoc["customerId"]): value is PopulatedCustomer =>
  typeof value === "object" && value !== null && !("_bsontype" in value);

/** Shapes an appointment document, including optional populated relations. */
export const toAppointmentDTO = (doc: AppointmentDoc) => {
  const service = isPopulatedService(doc.serviceId) ? doc.serviceId : null;
  const customer = isPopulatedCustomer(doc.customerId) ? doc.customerId : null;

  return {
    id: String(doc._id),
    serviceId: service
      ? {
          id: String(service._id ?? ""),
          serviceName: service.serviceName ?? "",
          image: service.image ?? "",
          category: service.category ?? "",
          duration: service.duration ?? 0,
          price: service.price ?? 0,
        }
      : String(doc.serviceId),
    customerId: customer
      ? {
          id: String(customer._id ?? ""),
          name: customer.name ?? "",
          email: customer.email ?? "",
          phone: customer.phone ?? null,
          image: customer.image ?? null,
        }
      : String(doc.customerId),
    appointmentDate: doc.appointmentDate,
    timeSlot: doc.timeSlot,
    message: doc.message ?? "",
    servicePrice: doc.servicePrice,
    paymentStatus: doc.paymentStatus,
    status: doc.status,
    createdAt: doc.createdAt,
    ...(doc.transaction
      ? {
          transaction: {
            id: String(doc.transaction._id),
            amount: doc.transaction.amount,
            currency: doc.transaction.currency,
            createdAt: doc.transaction.createdAt,
          },
        }
      : {}),
  };
};

type PopulatedAppointment = PopulatedService & {
  appointmentDate?: Date;
  timeSlot?: string;
  serviceId?: { serviceName?: string } | Types.ObjectId | string;
};

type TransactionDoc = {
  _id: Types.ObjectId | string;
  appointmentId: Types.ObjectId | string | PopulatedAppointment;
  customerId: Types.ObjectId | string | PopulatedCustomer;
  amount: number;
  currency: string;
  stripeSessionId: string;
  status: string;
  createdAt: Date;
};

/** Shapes a transaction for the admin read-only table. */
export const toTransactionDTO = (doc: TransactionDoc) => {
  const appointment = isPopulatedService(doc.appointmentId) ? doc.appointmentId : null;
  const customer = isPopulatedCustomer(doc.customerId) ? doc.customerId : null;
  const nestedService = appointment?.serviceId;
  const serviceName =
    appointment?.serviceName ??
    (isPopulatedObject(nestedService) && typeof nestedService.serviceName === "string"
      ? nestedService.serviceName
      : "");

  return {
    id: String(doc._id),
    appointmentId: appointment
      ? {
          id: String(appointment._id ?? ""),
          serviceName,
          appointmentDate: appointment.appointmentDate ?? null,
          timeSlot: appointment.timeSlot ?? "",
        }
      : String(doc.appointmentId),
    customerId: customer
      ? {
          id: String(customer._id ?? ""),
          name: customer.name ?? "",
          email: customer.email ?? "",
        }
      : String(doc.customerId),
    amount: doc.amount,
    currency: doc.currency,
    stripeSessionId: doc.stripeSessionId,
    status: doc.status,
    createdAt: doc.createdAt,
  };
};

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
