import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
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
    }) || (process.env.VERCEL === "1" && origin.endsWith(".vercel.app"));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false); // Just fail CORS normally instead of throwing an error
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

export const createApp = () => {
  const app = express();

  // Enable trust proxy for Vercel/proxies to correctly identify visitor IPs
  app.set("trust proxy", 1);

  app.use(compression());

  // Advanced Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://*.supabase.co"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://*.supabase.co", "https://checkout.razorpay.com"],
        connectSrc: ["'self'", "https://*.supabase.co", "https://lapi.razorpay.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://api.razorpay.com", "https://*.razorpay.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Hide server technology
  app.disable("x-powered-by");

  // Rate Limiting to prevent brute-force
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: "Too many requests from this IP, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiter specifically to API routes
  // app.use("/api/", limiter); // Temporarily disabled to check if causing 500 on Vercel environment

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/orders", orderRoutes);

  // Serve static files from the React app
  const distPath = path.resolve(__dirname, "../../dist");
  app.use(express.static(distPath, {
    maxAge: "1d",
    etag: true,
    lastModified: true,
  }));

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

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error("Express Error Handler:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  });

  return app;
};
