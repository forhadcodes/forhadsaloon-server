// Loads the global Express.Request augmentation (userId / user). Keep this
// import: Vercel's build only type-checks files reachable from the entry point.
import "./types/express.js";

import cors from "cors";
import express, { type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import adminRoutes from "./routes/admin.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import appointmentsRoutes from "./routes/appointments.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { stripeWebhook } from "./controllers/payment.controller.js";
import { ApiError } from "./utils/index.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    optionsSuccessStatus: 204,
  }),
);

app.get("/", (_req: Request, res: Response) => {
  res.type("text/plain").send("forhadsaloon server is running");
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: "ok" } });
});

/* ---------------------------------------------------------------------------
 * Stripe webhook: registered HERE, above express.json(), because signature
 * verification needs the raw request body. Do not move this below the parser.
 * ------------------------------------------------------------------------- */
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhook);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health",
  message: { success: false, message: "Too many requests. Please try again later." },
});

app.use(globalLimiter);

// Serverless-safe cached connection, opened before any route touches a model.
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    next(new ApiError(503, "Database is unavailable. Please try again."));
  }
});

app.use(express.json({ limit: "1mb" }));

app.use("/api", serviceRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api", paymentRoutes);
app.use("/api", adminRoutes);
app.use("/api", profileRoutes);
app.use("/api", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
