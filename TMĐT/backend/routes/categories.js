import express from "express";
import pool from "../db.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = express.Router();

// Lấy tất cả danh mục (optimized + server-side cache)
let _categoriesCache = { data: null, expiresAt: 0 };
const CATEGORIES_TTL_MS = Number(process.env.CATEGORIES_TTL_MS) || 60 * 1000; // default 60s

router.get("/", async (req, res) => {
  try {
    const now = Date.now();
    if (_categoriesCache.data && _categoriesCache.expiresAt > now) {
      if (process.env.NODE_ENV === "development") {
        console.log("Returning categories from server cache");
      }
      return successResponse(res, _categoriesCache.data);
    }

    const start = Date.now();
    const [categories] = await pool.query(
      `SELECT dm.ID_Danh_muc, dm.Ten_danh_muc, dm.Hinh_anh,
        COALESCE(p.cnt, 0) AS So_luong_san_pham
      FROM danh_muc dm
      LEFT JOIN (
        SELECT ID_Danh_muc, COUNT(*) AS cnt
        FROM san_pham
        WHERE Trang_thai = 'active'
        GROUP BY ID_Danh_muc
      ) p ON p.ID_Danh_muc = dm.ID_Danh_muc
      WHERE dm.Trang_thai = 'active'
      ORDER BY dm.Ten_danh_muc ASC`
    );

    _categoriesCache.data = categories;
    _categoriesCache.expiresAt = Date.now() + CATEGORIES_TTL_MS;

    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development") {
      console.log(`Get categories query took ${duration}ms`);
    }

    return successResponse(res, categories);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Get categories error:", error);
    }
    return errorResponse(res, "Lỗi lấy danh sách danh mục", 500);
  }
});

// Lấy sản phẩm theo danh mục
router.get("/:id/products", async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [products] = await pool.query(
      `SELECT 
        sp.*,
        (SELECT AVG(Diem_so) FROM danh_gia_phan_hoi WHERE ID_San_pham = sp.ID_San_pham AND Trang_thai = 'approved') as Diem_trung_binh
      FROM san_pham sp
      WHERE sp.ID_Danh_muc = ? AND sp.Trang_thai = 'active'
      ORDER BY sp.Ngay_tao DESC
      LIMIT ? OFFSET ?`,
      [id, Number(limit), offset]
    );

    return successResponse(res, { products });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Get category products error:", error);
    }
    return errorResponse(res, "Lỗi lấy sản phẩm theo danh mục", 500);
  }
});

// Lấy thông tin một danh mục
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM danh_muc WHERE ID_Danh_muc = ? AND Trang_thai = 'active'`,
      [id]
    );
    const category = rows[0];

    if (!category) {
      return errorResponse(res, "Không tìm thấy danh mục", 404);
    }

    return successResponse(res, { category });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Get category by id error:", error);
    }
    return errorResponse(res, "Lỗi khi lấy thông tin danh mục", 500);
  }
});

export const clearCategoriesCache = () => {
  _categoriesCache.data = null;
  _categoriesCache.expiresAt = 0;
};

export default router;
