import express from "express";
import pool from "../db.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = express.Router();

// Lấy danh sách voucher có sẵn (cached)
let _vouchersCache = { data: null, expiresAt: 0 };
const VOUCHERS_TTL_MS = Number(process.env.VOUCHERS_TTL_MS) || 60 * 1000;

router.get("/", async (req, res) => {
  try {
    const now = Date.now();
    if (_vouchersCache.data && _vouchersCache.expiresAt > now) {
      if (process.env.NODE_ENV === "development") {
        console.log("Returning vouchers from server cache");
      }
      return successResponse(res, { vouchers: _vouchersCache.data });
    }

    const [vouchers] = await pool.query(
      `SELECT * FROM voucher 
       WHERE Trang_thai = 'active' 
       AND Ngay_bat_dau <= CURDATE() 
       AND Ngay_ket_thuc >= CURDATE() 
       AND So_luong_su_dung_con_lai > 0
       ORDER BY Ngay_ket_thuc ASC`
    );

    _vouchersCache.data = vouchers;
    _vouchersCache.expiresAt = Date.now() + VOUCHERS_TTL_MS;

    return successResponse(res, { vouchers });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Get vouchers error:", error);
    }
    return errorResponse(res, "Lỗi lấy danh sách voucher", 500);
  }
});

// Kiểm tra voucher
router.post("/check", async (req, res) => {
  try {
    const { Ma_voucher } = req.body;

    if (!Ma_voucher) {
      return errorResponse(res, "Mã voucher là bắt buộc", 400);
    }

    const [vouchers] = await pool.query(
      `SELECT * FROM voucher 
       WHERE Ma_voucher = ? 
       AND Trang_thai = 'active' 
       AND Ngay_bat_dau <= CURDATE() 
       AND Ngay_ket_thuc >= CURDATE() 
       AND So_luong_su_dung_con_lai > 0`,
      [Ma_voucher]
    );

    if (vouchers.length === 0) {
      return errorResponse(res, "Voucher không hợp lệ hoặc đã hết hạn", 404);
    }

    return successResponse(res, { voucher: vouchers[0] });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Check voucher error:", error);
    }
    return errorResponse(res, "Lỗi kiểm tra voucher", 500);
  }
});

export const clearVouchersCache = () => {
  _vouchersCache.data = null;
  _vouchersCache.expiresAt = 0;
};

export default router;
