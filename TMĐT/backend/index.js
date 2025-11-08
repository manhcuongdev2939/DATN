import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';

// Import routes
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

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   - Auth: /api/auth/register, /api/auth/login`);
  console.log(`   - Products: /api/products`);
  console.log(`   - Categories: /api/categories`);
  console.log(`   - Cart: /api/cart`);
  console.log(`   - Orders: /api/orders`);
  console.log(`   - Reviews: /api/reviews`);
  console.log(`   - Wishlist: /api/wishlist`);
  console.log(`   - Addresses: /api/addresses`);
  console.log(`   - Vouchers: /api/vouchers`);
});


