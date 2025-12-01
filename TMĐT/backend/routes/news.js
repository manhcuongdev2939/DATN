import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/news
router.get('/', async (req, res) => {
  try {
    // Try to read from a 'news' table (if exists)
    const [rows] = await pool.query(
      `SELECT ID AS id, title, excerpt, content, published_at FROM news ORDER BY published_at DESC LIMIT 50`
    );

    if (Array.isArray(rows) && rows.length > 0) {
      return res.json(rows.map(r => ({
        id: r.id,
        title: r.title,
        excerpt: r.excerpt,
        content: r.content,
        date: r.published_at
      })));
    }
  } catch (err) {
    // likely table doesn't exist or other DB error; fallthrough to sample data
    console.warn('News route DB read failed, returning sample data:', err.message);
  }

  // Fallback sample data
  const sample = [
    { id: 1, title: 'Mở bán laptop mới', excerpt: 'Bộ sưu tập laptop mới đã có mặt tại cửa hàng.', content: 'Chi tiết sản phẩm và khuyến mãi.', date: new Date() },
    { id: 2, title: 'Hướng dẫn bảo quản pin', excerpt: 'Mẹo giúp pin bền hơn.', content: 'Nội dung hướng dẫn chi tiết.', date: new Date() }
  ];
  res.json(sample);
});

export default router;
