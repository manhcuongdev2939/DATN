import express from "express";
import pool from "../db.js";
import {
  successResponse,
  errorResponse,
  buildPagination,
} from "../utils/response.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      search,
      sort = "Ngay_tao",
      order = "DESC",
    } = req.query;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;
    const params = [];

    // Validate sort and order whitelist
    const allowedSorts = {
      Ngay_tao: "sp.Ngay_tao",
      Gia: "sp.Gia",
      Ten_san_pham: "sp.Ten_san_pham",
      Diem_trung_binh: "Diem_trung_binh", // Alias for the calculated column
    };
    const sortField = allowedSorts[sort] || "sp.Ngay_tao";
    const sortOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Use aggregated subquery to get review stats per product and avoid per-row subqueries
    const start = Date.now();

    // base FROM/WHERE with aggregated ratings joined by product
    let baseSql = `
      FROM san_pham sp
      LEFT JOIN danh_muc dm ON sp.ID_Danh_muc = dm.ID_Danh_muc
      LEFT JOIN (
        SELECT ID_San_pham, AVG(Diem_so) AS Diem_trung_binh, COUNT(*) AS So_luong_danh_gia
        FROM danh_gia_phan_hoi
        WHERE Trang_thai = 'approved'
        GROUP BY ID_San_pham
      ) pstats ON pstats.ID_San_pham = sp.ID_San_pham
      WHERE sp.Trang_thai = 'active'
    `;

    if (category) {
      baseSql += " AND sp.ID_Danh_muc = ?";
      params.push(category);
    }

    if (minPrice) {
      baseSql += " AND sp.Gia >= ?";
      params.push(minPrice);
    }

    if (maxPrice) {
      baseSql += " AND sp.Gia <= ?";
      params.push(maxPrice);
    }

    if (search) {
      baseSql += " AND (sp.Ten_san_pham LIKE ? OR sp.Mo_ta LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Rating filter - only show products with average rating >= rating
    if (req.query.rating) {
      const minRating = parseFloat(req.query.rating);
      if (!isNaN(minRating) && minRating >= 1 && minRating <= 5) {
        baseSql += " AND COALESCE(pstats.Diem_trung_binh, 0) >= ?";
        params.push(minRating);
      }
    }

    const sql = `
      SELECT
        sp.ID_San_pham,
        sp.Ten_san_pham,
        sp.Mo_ta,
        sp.Gia,
        sp.Gia_goc,
        sp.So_luong_ton_kho,
        sp.Thumbnail,
        sp.Trang_thai,
        dm.ID_Danh_muc,
        dm.Ten_danh_muc,
        COALESCE(pstats.Diem_trung_binh, 0) as Diem_trung_binh,
        COALESCE(pstats.So_luong_danh_gia, 0) as So_luong_danh_gia
      ${baseSql}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?`;

    const paramsForData = params.concat([safeLimit, offset]);

    // Count with same filters (no LIMIT/OFFSET)
    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const countParams = params.slice();

    const [products] = await pool.query(sql, paramsForData);
    const [[{ total }]] = await pool.query(countSql, countParams);

    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development") {
      console.log(`Products list query took ${duration}ms`);
    }

    return successResponse(
      res,
      { products },
      {
        pagination: buildPagination({
          page: safePage,
          limit: safeLimit,
          total,
        }),
      }
    );
  } catch (error) {
    console.error("Get products error:", error);
    return errorResponse(res, "Lỗi lấy danh sách sản phẩm");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      `SELECT 
        sp.*,
        dm.Ten_danh_muc
      FROM san_pham sp
      LEFT JOIN danh_muc dm ON sp.ID_Danh_muc = dm.ID_Danh_muc
      WHERE sp.ID_San_pham = ?`,
      [id]
    );

    // Get aggregated review stats separately (fast when indexed)
    const [statsRows] = await pool.query(
      `SELECT AVG(Diem_so) as Diem_trung_binh, COUNT(*) as So_luong_danh_gia
       FROM danh_gia_phan_hoi
       WHERE ID_San_pham = ? AND Trang_thai = 'approved'`,
      [id]
    );
    const stats = statsRows[0] || {
      Diem_trung_binh: null,
      So_luong_danh_gia: 0,
    };
    if (products[0]) {
      products[0].Diem_trung_binh = stats.Diem_trung_binh;
      products[0].So_luong_danh_gia = stats.So_luong_danh_gia;
    }

    if (products.length === 0) {
      return errorResponse(res, "Sản phẩm không tồn tại", 404);
    }

    const [images] = await pool.query(
      "SELECT * FROM hinh_anh_san_pham WHERE ID_San_pham = ? ORDER BY Thu_tu ASC",
      [id]
    );

    const [reviews] = await pool.query(
      `SELECT 
        dg.*,
        kh.Ten_khach_hang
      FROM danh_gia_phan_hoi dg
      LEFT JOIN khach_hang kh ON dg.ID_Khach_hang = kh.ID_Khach_hang
      WHERE dg.ID_San_pham = ? AND dg.Trang_thai = 'approved'
      ORDER BY dg.Ngay_danh_gia DESC
      LIMIT 10`,
      [id]
    );

    return successResponse(res, {
      product: products[0],
      images,
      reviews,
    });
  } catch (error) {
    console.error("Get product detail error:", error);
    return errorResponse(res, "Lỗi lấy chi tiết sản phẩm");
  }
});

export default router;
