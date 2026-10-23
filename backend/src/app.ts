import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import mongoose from "mongoose";
import { requirementsRouter } from "./routes/requirements.js";

export function createApp(
  options: { origins?: string[]; trustProxy?: number; rateLimit?: number } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", options.trustProxy ?? 0);
  app.use(helmet());
  app.use(
    cors({
      origin: options.origins ?? ["http://localhost:3000"],
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Idempotency-Key"],
    }),
  );
  app.use(express.json({ limit: "20kb" }));
  app.get("/api/health", (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res
      .status(connected ? 200 : 503)
      .json({
        status: connected ? "ok" : "unavailable",
        database: connected ? "connected" : "disconnected",
      });
  });
  app.use(
    "/api/requirements",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: options.rateLimit ?? 40,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        message: "Too many submissions. Please try again in a few minutes.",
      },
    }),
    requirementsRouter,
  );
  app.use((_req, res) => res.status(404).json({ message: "Route not found." }));
  const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error.type === "entity.parse.failed") {
      res.status(400).json({ message: "Request body must be valid JSON." });
      return;
    }
    if (error.type === "entity.too.large") {
      res.status(413).json({ message: "Request is too large." });
      return;
    }
    console.error("Request failed:", error.name ?? "Error");
    res
      .status(503)
      .json({
        message: "We couldn't save your requirement. Please try again shortly.",
      });
  };
  app.use(handleError);
  return app;
}
