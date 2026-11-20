// @ts-nocheck
import cors from "cors";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

interface AuthRequest extends Request {
  userId?: string;
}

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);
app.use(express.json({ limit: "1mb" }));

function verifyAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h) return next(new Error("Authentication required"));
  const p = h.split(" ");
  if (p.length !== 2 || p[0].toLowerCase() !== "bearer") return next(new Error("Invalid token"));
  req.userId = p[1];
  next();
}

app.get("/api/profile", verifyAuth, (req: AuthRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ success: false, message: "Auth required" });
  res.json({ success: true, data: { id: req.userId, name: "User", email: "u@test.com" } });
});

app.get("/api/health", (req: Request, res: Response) => res.json({ success: true, status: "ok" }));

app.use((req: Request, res: Response, next: NextFunction) => next(new Error("Not found")));

app.use(function(_err: any, _req: Request, _res: Response, _next: any) {
  const status = 500;
  _res.status(status).json({ success: false, message: "Server error" });
});

export default app;