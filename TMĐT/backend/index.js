import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import categoriesRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import ordersRoutes from './routes/orders.js';
import reviewsRoutes from './routes/reviews.js';
import wishlistRoutes from './routes/wishlist.js';
import addressesRoutes from './routes/addresses.js';
import vouchersRoutes from './routes/vouchers.js';
import newsletterRoutes from './routes/newsletter.js';
import newsRoutes from './routes/news.js';
import contactRoutes from './routes/contacts.js';
import uploadsRoutes from './routes/uploads.js';
import adminRoutes from './routes/admin.js';
import paymentsRoutes, { payosWebhook } from './routes/payments.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Basic startup logs to help debugging
console.log('Starting backend app', {
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGINS || 'default',
});
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:5173'];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau.',
  standardHeaders: true,
  legacyHeaders: false,
});

const logger = pinoHttp({
  level: process.env.LOG_LEVEL || 'info',
});

app.use(logger);
app.use(cors(corsOptions));
// Apply rate limiting only in production by default. For local development, set DISABLE_RATE_LIMIT=true to disable.
if (process.env.DISABLE_RATE_LIMIT !== 'true' && process.env.NODE_ENV === 'production') {
  app.use(globalLimiter);
} else {
  console.log('Rate limiter disabled for development (DISABLE_RATE_LIMIT=true to force).');
}
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  console.log('/api/health requested');
  res.json({ status: 'ok', db: pool ? 'connected' : 'unknown' });
});

// Apply auth routes without a global limiter here; specific routes (OTP) are limited inside the route file.
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/vouchers', vouchersRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/admin', adminRoutes);
// PayOS webhook needs raw body to verify signature
app.post('/api/payments/payos/webhook', express.raw({ type: '*/*' }), (req, res, next) => {
  // attach raw buffer and parse JSON body for handler
  req.rawBody = req.body;
  try {
    req.body = JSON.parse(req.body.toString('utf8'));
  } catch (e) {
    req.body = {};
  }
  return payosWebhook(req, res, next);
});

app.use('/api/payments', paymentsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
  console.log('DB pool present:', !!pool);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

