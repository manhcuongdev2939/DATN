import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { successResponse, errorResponse } from '../utils/response.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Định dạng file không được hỗ trợ'));
    }
    cb(null, true);
  },
});

router.post('/product-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'Không tìm thấy file upload', 400);
  }

  const publicPath = `/uploads/${req.file.filename}`;
  return successResponse(
    res,
    {
      filename: req.file.filename,
      url: publicPath,
    },
    {},
    201
  );
});

// Multer error handler cho router này
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return errorResponse(res, `Upload lỗi: ${err.message}`, 400);
  }
  return errorResponse(res, err.message || 'Upload thất bại', err.status || 500);
});

export default router;

