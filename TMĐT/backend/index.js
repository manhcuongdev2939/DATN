import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Example: featured products (static mock)
app.get('/api/featured', (req, res) => {
  const products = Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    name: `Sản phẩm #${i + 1}`,
    price: 199000 + i * 10000,
    brand: 'BrandX',
  }));
  res.json(products);
});

// Brands endpoints
app.get('/api/brands', async (req, res) => {
  const { category } = req.query; // optional: 'laptop' | 'phone'
  try {
    const params = [];
    let sql = 'SELECT id, name, category, country, logo_url FROM brands';
    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY name ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('MySQL error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/brands/:category', async (req, res) => {
  const { category } = req.params; // 'laptop' | 'phone'
  try {
    const [rows] = await pool.query(
      'SELECT id, name, category, country, logo_url FROM brands WHERE category = ? ORDER BY name ASC',
      [category]
    );
    res.json(rows);
  } catch (error) {
    console.error('MySQL error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Example: fetch products from MySQL
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, price, brand FROM products ORDER BY id DESC LIMIT 50'
    );
    res.json(rows);
  } catch (error) {
    console.error('MySQL error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});


