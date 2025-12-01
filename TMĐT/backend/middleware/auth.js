import jwt from 'jsonwebtoken';

// Yêu cầu biến môi trường JWT_SECRET phải được thiết lập
if (!process.env.JWT_SECRET) {
  throw new Error('Environment variable JWT_SECRET is required');
}

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware xác thực JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware kiểm tra quyền admin
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export { JWT_SECRET };

