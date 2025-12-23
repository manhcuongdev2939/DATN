import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";

import authRoutes from "./routes/auth.js";
import productsRoutes from "./routes/products.js";
import categoriesRoutes from "./routes/categories.js";
import cartRoutes from "./routes/cart.js";
import ordersRoutes from "./routes/orders.js";
import reviewsRoutes from "./routes/reviews.js";
import wishlistRoutes from "./routes/wishlist.js";
import addressesRoutes from "./routes/addresses.js";
import vouchersRoutes from "./routes/vouchers.js";
import newsletterRoutes from "./routes/newsletter.js";
import contactRoutes from "./routes/contacts.js";
import uploadsRoutes from "./routes/uploads.js";
import newsRoutes from "./routes/news.js";
import paymentsRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";

import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

/* =========================
   Startup logs
========================= */
if (process.env.NODE_ENV !== "production") {
  console.log("🚀 Backend starting", {
    NODE_ENV: process.env.NODE_ENV || "development",
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
    CORS_ORIGINS: process.env.CORS_ORIGINS || "default",
    RATE_LIMIT:
      process.env.DISABLE_RATE_LIMIT === "true" ? "disabled" : "enabled",
  });
}

/* =========================
   CORS
========================= */
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : ["http://localhost:5173"];

const corsOptions = {
  origin(origin, callback) {
    // allow server-to-server, Postman, mobile apps
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    console.error("❌ CORS blocked:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

/* =========================
   Rate limit
========================= */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau.",
  standardHeaders: true,
  legacyHeaders: false,
});

/* =========================
   Logger
========================= */
const logger = pinoHttp({
  level: process.env.LOG_LEVEL || "info",
  genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),
});

/* =========================
   Global middleware
========================= */
app.use(logger);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   Rate limit apply
========================= */
if (
  process.env.NODE_ENV === "production" &&
  process.env.DISABLE_RATE_LIMIT !== "true"
) {
  app.use("/api", globalLimiter);
} else {
  console.log("⚠️ Rate limiter disabled");
}

/* =========================
   Health check
========================= */
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

/* =========================
   Routes
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/vouchers", vouchersRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);

/* =========================
   Error handling
========================= */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
