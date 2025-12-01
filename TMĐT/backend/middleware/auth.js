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
    console.log('authenticateToken: no token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  // Mask token for logs (only show first/last 6 chars)
  try {
    const masked = `${token.slice(0, 6)}...${token.slice(-6)}`;
    console.log('authenticateToken: token present', { masked });
  } catch (e) {
    console.log('authenticateToken: token present (could not mask)');
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('authenticateToken: token verify error', err && err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('authenticateToken: token decoded', { id: user && user.id, role: user && user.role });
    req.user = user;
    next();
  });
};

// Middleware kiểm tra quyền admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    console.log('requireAdmin: req.user missing');
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (req.user.role !== 'admin') {
    console.log('requireAdmin: insufficient role', { role: req.user.role });
    return res.status(403).json({ error: 'Admin access required' });
  }
  console.log('requireAdmin: authorized admin', { id: req.user.id });
  next();
};

export { JWT_SECRET };

