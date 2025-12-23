import jwt from "jsonwebtoken";
import pool from "../db.js";
import crypto from "crypto";

// Yêu cầu biến môi trường JWT_SECRET phải được thiết lập
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Environment variable JWT_SECRET is required");
  }
  console.warn(
    "JWT_SECRET is not set, using insecure default for development. Set JWT_SECRET in production!"
  );
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Middleware xác thực JWT
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Keep raw token available so older tokens (without jti) can be revoked by hash
    req.rawToken = token;

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    } catch (err) {
      // Log error details only in development
      if (process.env.NODE_ENV === "development") {
        console.error("Token verification failed:", err.message);
      }
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Compute revocation identifier: prefer jti, fallback to hash of raw token
    const identifier =
      decoded.jti ||
      `raw:${crypto.createHash("sha256").update(token).digest("hex")}`;

    // Check if token has been revoked
    try {
      const [rows] = await pool.query(
        "SELECT 1 FROM revoked_tokens WHERE jti = ? AND expires_at > NOW()",
        [identifier]
      );
      if (rows.length > 0) {
        return res.status(401).json({ error: "Token revoked" });
      }
    } catch (err) {
      // If DB check fails, log and reject for safety
      console.error("Failed to check revoked tokens:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

// Middleware kiểm tra quyền admin
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ error: "Admin access required" });
  }
  // Allow 'super_admin' as well as 'admin'
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export { JWT_SECRET };
