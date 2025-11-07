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

// Products endpoints
app.get('/api/products', async (req, res) => {
  const { category, limit = 50 } = req.query; // optional: 'laptop' | 'phone'
  try {
    const params = [];
    let sql = 'SELECT id, name, price, brand, category, image_url FROM products';
    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(Number(limit));
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('MySQL error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/products/:category', async (req, res) => {
  const { category } = req.params; // 'laptop' | 'phone'
  try {
    const [rows] = await pool.query(
      'SELECT id, name, price, brand, category, image_url FROM products WHERE category = ? ORDER BY id DESC LIMIT 50',
      [category]
    );
    res.json(rows);
  } catch (error) {
    console.error('MySQL error:', error);
    res.status(500).json({ error: 'Database error' });
  }
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


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});


