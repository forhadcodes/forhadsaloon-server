// Vercel serverless entry point. The Express app is exported so every /api/*
// route is handled by a single function (see vercel.json rewrites).
import app from "../dist/app.js";

export default app;
