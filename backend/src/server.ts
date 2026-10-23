import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { Requirement } from "./models/requirement.js";

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!uri) {
  console.error("Set DATABASE_URL in backend/.env before starting the API.");
  process.exit(1);
}

try {
  mongoose.set("bufferCommands", false);
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || "event-manager",
    serverSelectionTimeoutMS: 10000,
  });
  await Requirement.init();
  const app = createApp({
    origins: (process.env.CLIENT_ORIGIN || "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim()),
    trustProxy: Number(process.env.TRUST_PROXY || 0),
  });
  const server = app.listen(Number(process.env.PORT || 4000), () =>
    console.log(`API ready at http://localhost:${process.env.PORT || 4000}`),
  );
  const shutdown = () => {
    server.close(() => {
      void mongoose.disconnect().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
} catch (error) {
  console.error(
    "Could not connect to MongoDB. Check the connection string and Atlas network access.",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
