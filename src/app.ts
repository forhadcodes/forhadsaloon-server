import express from "express";

const app = express();

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

export default app;
