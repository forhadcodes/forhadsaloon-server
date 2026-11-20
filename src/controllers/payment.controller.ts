import type { Request, RequestHandler, Response } from "express";
import type Stripe from "stripe";

import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { stripe } from "../config/stripe.js";
import { Appointment, Transaction } from "../models/index.js";
import {
  ApiError,
  asyncHandler,
  assertObjectId,
  getPagination,
  getTotalPages,
  isValidObjectId,
  parseQuery,
  toTransactionDTO,
} from "../utils/index.js";
import {
  createCheckoutSchema,
  transactionListQuerySchema,
} from "../validators/payment.validator.js";

const customerId = (req: Request): string => {
  if (!req.user) throw new ApiError(401, "Authentication required");
  return req.user.id;
};

/**
 * POST /api/payments/create-checkout-session
 * The amount ALWAYS comes from the database snapshot, never from the client.
 */
export const createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
  const { appointmentId } = createCheckoutSchema.parse(req.body);

  const appointment = await Appointment.findOne({
    _id: assertObjectId(appointmentId, "appointment"),
    customerId: customerId(req),
  }).populate("serviceId", "serviceName");

  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (appointment.status !== "confirmed" || appointment.paymentStatus !== "unpaid") {
    throw new ApiError(400, "Only confirmed, unpaid appointments can be paid");
  }

  const service = appointment.serviceId as unknown as { serviceName: string };
  const unitAmount = Math.round(appointment.servicePrice * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: service.serviceName },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    metadata: { appointmentId, customerId: customerId(req) },
    client_reference_id: appointmentId,
    success_url: `${env.CLIENT_URL.replace(/\/+$/, "")}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL.replace(/\/+$/, "")}/payment/cancel`,
  });

  if (!session.url) {
    throw new ApiError(500, "Could not create the payment session. Please try again.");
  }

  res.json({ success: true, data: { url: session.url } });
});

/**
 * POST /api/webhooks/stripe
 * Registered BEFORE express.json() so `req.body` is the raw Buffer the
 * signature was computed over. Every mutation here is idempotent.
 */
export const stripeWebhook: RequestHandler = asyncHandler(async (req, res) => {
  await connectDB();

  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") throw new ApiError(400, "Missing Stripe signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    throw new ApiError(400, "Invalid Stripe signature");
  }

  // Event id/type only — never log the payload or any key material.
  console.info(`[stripe] ${event.type} ${event.id}`);

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const appointmentId = session.metadata?.appointmentId;
    const sessionCustomerId = session.metadata?.customerId;

    if (appointmentId && isValidObjectId(appointmentId) && sessionCustomerId) {
      const appointment = await Appointment.findById(appointmentId).lean();

      if (appointment && String(appointment.customerId) === sessionCustomerId) {
        const expectedAmount = Math.round(appointment.servicePrice * 100);

        if (
          event.type === "checkout.session.completed" &&
          session.payment_status === "paid" &&
          session.amount_total === expectedAmount &&
          (session.currency ?? "usd").toLowerCase() === "usd"
        ) {
          await Transaction.updateOne(
            { stripeSessionId: session.id },
            {
              $setOnInsert: {
                appointmentId: appointment._id,
                customerId: appointment.customerId,
                amount: (session.amount_total ?? 0) / 100,
                currency: session.currency ?? "usd",
                stripeSessionId: session.id,
                status: "paid",
                createdAt: new Date(),
              },
            },
            { upsert: true },
          );

          // Only this verified webhook path may mark an appointment paid.
          await Appointment.updateOne(
            { _id: appointment._id, paymentStatus: "unpaid" },
            { $set: { paymentStatus: "paid" } },
          );
        }

        if (
          event.type === "checkout.session.expired" ||
          event.type === "checkout.session.async_payment_failed"
        ) {
          await Transaction.updateOne(
            { stripeSessionId: session.id },
            {
              $setOnInsert: {
                appointmentId: appointment._id,
                customerId: appointment.customerId,
                amount: (session.amount_total ?? expectedAmount) / 100,
                currency: session.currency ?? "usd",
                stripeSessionId: session.id,
                status: "failed",
                createdAt: new Date(),
              },
            },
            { upsert: true },
          );
          // Appointment deliberately stays "unpaid" so the customer can retry.
        }
      }
    }
  }

  res.json({ received: true });
});

/**
 * GET /api/payments/session/:sessionId — READ ONLY.
 * The browser polls this after Stripe redirects back; it never writes state.
 */
export const getPaymentSessionStatus = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = String(req.params.sessionId ?? "");
  if (!/^cs_(test|live)_[\w]+$/.test(sessionId)) {
    throw new ApiError(400, "Invalid checkout session id");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.customerId !== customerId(req)) {
    throw new ApiError(403, "You do not have permission to view this payment");
  }

  const appointmentId = session.metadata?.appointmentId;
  if (!appointmentId || !isValidObjectId(appointmentId)) {
    throw new ApiError(404, "Appointment not found");
  }

  const appointment = await Appointment.findById(appointmentId)
    .populate("serviceId", "serviceName")
    .lean();
  if (!appointment) throw new ApiError(404, "Appointment not found");

  const paidTransaction = await Transaction.findOne({
    stripeSessionId: sessionId,
    appointmentId: appointment._id,
    status: "paid",
  }).lean();

  const service = appointment.serviceId as unknown as { serviceName: string };

  res.json({
    success: true,
    data: {
      confirmed: Boolean(paidTransaction),
      amount: (session.amount_total ?? Math.round(appointment.servicePrice * 100)) / 100,
      currency: session.currency ?? "usd",
      appointment: {
        id: String(appointment._id),
        serviceName: service?.serviceName ?? "",
        appointmentDate: appointment.appointmentDate,
        timeSlot: appointment.timeSlot,
        paymentStatus: appointment.paymentStatus,
      },
    },
  });
});

/** GET /api/admin/transactions?status=&page= — read-only for admins. */
export const listAdminTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = parseQuery(transactionListQuerySchema, req.query);
  const { skip } = getPagination(page, limit);
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const [docs, total] = await Promise.all([
    Transaction.find(filter)
      .populate("customerId", "name email")
      .populate({
        path: "appointmentId",
        select: "appointmentDate timeSlot serviceId",
        populate: { path: "serviceId", select: "serviceName" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: docs.map(toTransactionDTO),
      total,
      page,
      pages: getTotalPages(total, limit),
    },
  });
});
