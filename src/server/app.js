import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

export const allowedOrigins = clientOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed === "*") return true;
      if (allowed.startsWith("*.")) {
        const suffix = allowed.slice(1); // ".example.com"
        return origin.endsWith(suffix);
      }
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

export const createApp = () => {
  const app = express();

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/orders", orderRoutes);

  // Serve static files from the React app
  const distPath = path.resolve(__dirname, "../../dist");
  app.use(express.static(distPath));

  // For any other request, send back index.html (for SPA routing)
  app.get("*", (req, res) => {
    // Only if not an API call
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          // If index.html is missing (e.g. before first build), send a friendly message
          res.status(200).send("API is running. Frontend not built yet.");
        }
      });
    } else {
      res.status(404).json({ error: "API route not found" });
    }
  });

  return app;
};
