import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Thiếu token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.role) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ" });
  }
};
