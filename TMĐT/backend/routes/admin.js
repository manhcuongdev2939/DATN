import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken, isAdmin } from "../middleware/auth.js";
import pool from "../db.js";
import { clearCategoriesCache } from "./categories.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = express.Router();

// All routes in this file are protected and only accessible by admins
router.use(authenticateToken);
router.use(isAdmin);

// Get current admin info
router.get("/me", async (req, res, next) => {
  try {
    const adminId = req.user.id;

    // First, try to find a matching row in nguoi_dung_admin
    const [admins] = await pool.query(
      "SELECT ID_Admin, Ten_dang_nhap, Email, Vai_tro, Trang_thai FROM nguoi_dung_admin WHERE ID_Admin = ? AND Trang_thai = ?",
      [adminId, "active"]
    );

    if (admins.length > 0) {
      return successResponse(res, { admin: admins[0] });
    }

    // Fallback: allow khach_hang records with Vai_tro 'admin'/'super_admin' to act as admin
    const [khach] = await pool.query(
      "SELECT ID_Khach_hang, Ten_khach_hang, Email, Vai_tro, Trang_thai FROM khach_hang WHERE ID_Khach_hang = ? AND Trang_thai = 'active' AND Vai_tro IN ('admin','super_admin')",
      [adminId]
    );

    if (khach.length > 0) {
      const k = khach[0];
      const adminObj = {
        id: k.ID_Khach_hang,
        Ten_dang_nhap: k.Ten_khach_hang,
        Email: k.Email,
        Vai_tro: k.Vai_tro,
        source: "khach_hang",
      };
      return successResponse(res, { admin: adminObj });
    }

    return errorResponse(res, "Admin not found or inactive", 404);
  } catch (error) {
    next(error);
  }
});

// Middleware to handle validation results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, "Dữ liệu không hợp lệ", 400, {
      errors: errors.array(),
    });
  }
  next();
};

// Validation rules for a product
const productValidationRules = [
  body("Ten_san_pham")
    .trim()
    .notEmpty()
    .withMessage("Tên sản phẩm không được để trống."),
  body("Mo_ta").optional({ checkFalsy: true }).trim(),
  body("Gia")
    .isFloat({ gt: 0 })
    .withMessage("Giá sản phẩm phải là một số lớn hơn 0."),
  body("Gia_goc")
    .optional({ checkFalsy: true })
    .isFloat({ gt: 0 })
    .withMessage("Giá gốc phải là một số lớn hơn 0."),
  body("So_luong_ton_kho")
    .isInt({ min: 0 })
    .withMessage("Số lượng tồn kho phải là một số nguyên không âm."),
  body("ID_Danh_muc")
    .isInt({ min: 1 })
    .withMessage("ID danh mục phải là một số nguyên hợp lệ."),
  body("Thumbnail")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Thumbnail phải là một đường dẫn URL hợp lệ."),
];

// Get dashboard summary with analytics
router.get("/summary", async (req, res, next) => {
  try {
    const [userCount] = await pool.query(
      "SELECT COUNT(*) as count FROM khach_hang"
    );
    const [orderCount] = await pool.query(
      "SELECT COUNT(*) as count FROM don_hang"
    );
    const [productCount] = await pool.query(
      "SELECT COUNT(*) as count FROM san_pham"
    );

    // Revenue analytics
    const [revenueResult] = await pool.query(`
      SELECT 
        COALESCE(SUM(Thanh_tien), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN Trang_thai IN ('delivered') THEN Thanh_tien ELSE 0 END), 0) as completed_revenue,
        COALESCE(SUM(CASE WHEN Trang_thai = 'pending' THEN Thanh_tien ELSE 0 END), 0) as pending_revenue,
        COUNT(CASE WHEN Trang_thai = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN Trang_thai = 'shipping' THEN 1 END) as shipping_orders,
        COUNT(CASE WHEN Trang_thai = 'delivered' THEN 1 END) as delivered_orders
      FROM don_hang
    `);

    // Recent orders count (last 7 days)
    const [recentOrders] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM don_hang 
      WHERE Ngay_dat >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // Low stock products
    const [lowStock] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM san_pham 
      WHERE So_luong_ton_kho < 10 AND Trang_thai = 'active'
    `);

    return successResponse(res, {
      users: userCount[0].count,
      orders: orderCount[0].count,
      products: productCount[0].count,
      revenue: {
        total: parseFloat(revenueResult[0].total_revenue || 0),
        completed: parseFloat(revenueResult[0].completed_revenue || 0),
        pending: parseFloat(revenueResult[0].pending_revenue || 0),
      },
      orderStats: {
        pending: revenueResult[0].pending_orders || 0,
        shipping: revenueResult[0].shipping_orders || 0,
        delivered: revenueResult[0].delivered_orders || 0,
        recent: recentOrders[0].count || 0,
      },
      lowStock: lowStock[0].count || 0,
    });
  } catch (error) {
    next(error);
  }
});

// Get monthly revenue for chart
router.get("/analytics/monthly-revenue", async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(Ngay_dat, '%Y-%m') as month,
        SUM(Thanh_tien) as revenue
      FROM don_hang
      WHERE Trang_thai = 'delivered'
      GROUP BY DATE_FORMAT(Ngay_dat, '%Y-%m')
      ORDER BY month ASC
      LIMIT 12
    `);

    return successResponse(res, { monthlyRevenue: rows });
  } catch (error) {
    next(error);
  }
});

// Get revenue analytics by period
router.get("/analytics/revenue", async (req, res, next) => {
  try {
    const { period = "30d" } = req.query; // e.g., 7d, 30d, 90d
    const interval = parseInt(period.replace("d", ""), 10) || 30;

    const [rows] = await pool.query(
      `
      SELECT
        DATE(d.Ngay_dat) as date,
        SUM(d.Thanh_tien) as revenue
      FROM don_hang d
      WHERE d.Ngay_dat >= CURDATE() - INTERVAL ? DAY
        AND d.Trang_thai NOT IN ('cancelled', 'returned')
      GROUP BY DATE(d.Ngay_dat)
      ORDER BY date ASC
    `,
      [interval]
    );
    return successResponse(res, { period, data: rows });
  } catch (error) {
    next(error);
  }
});

// Get order stats by period
router.get("/analytics/order-stats", async (req, res, next) => {
  try {
    const { period = "30d" } = req.query;
    const interval = parseInt(period.replace("d", ""), 10) || 30;

    const [rows] = await pool.query(
      `
      SELECT
        Trang_thai,
        COUNT(*) as count
      FROM don_hang
      WHERE Ngay_dat >= CURDATE() - INTERVAL ? DAY
      GROUP BY Trang_thai
      ORDER BY count DESC
    `,
      [interval]
    );

    return successResponse(res, { period, stats: rows });
  } catch (error) {
    next(error);
  }
});

// Get top selling products by period
router.get("/analytics/top-products", async (req, res, next) => {
  try {
    const { limit = 5, period = "30d" } = req.query;
    const safeLimit = parseInt(limit, 10) || 5;
    const interval = parseInt(period.replace("d", ""), 10) || 30;

    const [rows] = await pool.query(
      `
      SELECT
        p.ID_San_pham,
        p.Ten_san_pham,
        p.Thumbnail,
        dm.Ten_danh_muc,
        SUM(ctdh.So_luong) as total_sold
      FROM chi_tiet_don_hang ctdh
      JOIN san_pham p ON ctdh.ID_San_pham = p.ID_San_pham
      JOIN don_hang dh ON ctdh.ID_Don_hang = dh.ID_Don_hang
      LEFT JOIN danh_muc dm ON p.ID_Danh_muc = dm.ID_Danh_muc
      WHERE dh.Ngay_dat >= CURDATE() - INTERVAL ? DAY
        AND dh.Trang_thai NOT IN ('cancelled', 'returned')
      GROUP BY p.ID_San_pham, p.Ten_san_pham, p.Thumbnail, dm.Ten_danh_muc
      ORDER BY total_sold DESC
      LIMIT ?
    `,
      [interval, safeLimit]
    );

    return successResponse(res, { period, products: rows });
  } catch (error) {
    next(error);
  }
});


// Update user (admin)
router.put(
  "/users/:id",
  [
    body("Ten_khach_hang").optional().trim().notEmpty(),
    body("Email").optional().isEmail().withMessage("Email không hợp lệ"),
    body("So_dien_thoai").optional().trim(),
    body("Trang_thai")
      .optional()
      .isIn(["active", "inactive"])
      .withMessage("Trạng thái không hợp lệ"),
    body("Vai_tro")
      .optional()
      .isIn(["customer", "admin", "super_admin"])
      .withMessage("Vai trò không hợp lệ"),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { Ten_khach_hang, Email, So_dien_thoai, Trang_thai, Vai_tro } =
        req.body;

      const [existing] = await pool.query(
        "SELECT * FROM khach_hang WHERE ID_Khach_hang = ?",
        [id]
      );
      if (existing.length === 0) {
        return errorResponse(res, "Không tìm thấy người dùng", 404);
      }

      const fields = [];
      const values = [];
      if (Ten_khach_hang !== undefined) {
        fields.push("Ten_khach_hang = ?");
        values.push(Ten_khach_hang);
      }
      if (Email !== undefined) {
        fields.push("Email = ?");
        values.push(Email);
      }
      if (So_dien_thoai !== undefined) {
        fields.push("So_dien_thoai = ?");
        values.push(So_dien_thoai);
      }
      if (Trang_thai !== undefined) {
        fields.push("Trang_thai = ?");
        values.push(Trang_thai);
      }
      if (Vai_tro !== undefined) {
        fields.push("Vai_tro = ?");
        values.push(Vai_tro);
      }

      if (fields.length === 0) {
        return errorResponse(res, "Không có trường hợp lệ để cập nhật", 400);
      }

      values.push(id);

      await pool.query(
        `UPDATE khach_hang SET ${fields.join(", ")} WHERE ID_Khach_hang = ?`,
        values
      );

      const [updated] = await pool.query(
        "SELECT ID_Khach_hang, Ten_khach_hang, Email, So_dien_thoai, Trang_thai, Vai_tro, Ngay_tao FROM khach_hang WHERE ID_Khach_hang = ?",
        [id]
      );

      return successResponse(res, { user: updated[0] });
    } catch (error) {
      next(error);
    }
  }
);

// Get users (paginated)
router.get("/users", async (req, res, next) => {
  try {
    const { page = 1, limit = 50, q } = req.query;
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (safePage - 1) * safeLimit;

    const params = [];
    let where = "WHERE 1=1";
    if (q) {
      where +=
        " AND (Ten_khach_hang LIKE ? OR Email LIKE ? OR So_dien_thoai LIKE ? )";
      const s = `%${q}%`;
      params.push(s, s, s);
    }

    const [rows] = await pool.query(
      `SELECT ID_Khach_hang, Ten_khach_hang, Email, So_dien_thoai, Trang_thai, Ngay_tao FROM khach_hang ${where} ORDER BY Ngay_tao DESC LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM khach_hang ${where}`,
      params
    );

    return successResponse(
      res,
      { users: rows },
      {
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit),
        },
      }
    );
  } catch (error) {
    next(error);
  }
});

// Get all orders with filters, pagination, and customer info
router.get("/orders", async (req, res, next) => {
  try {
    const start = Date.now();
    const {
      page = 1,
      limit = 20,
      status,
      search,
      dateFrom,
      dateTo,
      sortBy = "Ngay_dat",
      sortOrder = "DESC",
    } = req.query;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    let sql = `
      SELECT 
        dh.*,
        kh.Ten_khach_hang,
        kh.Email as CustomerEmail,
        MAX(dc.Dia_chi) as Dia_chi,
        MAX(dc.So_dien_thoai) as So_dien_thoai,
        COUNT(DISTINCT ctdh.ID_San_pham) as So_luong_san_pham,
        MAX(tt.Trang_thai) as PaymentStatus
      FROM don_hang dh
      LEFT JOIN khach_hang kh ON dh.ID_Khach_hang = kh.ID_Khach_hang
      LEFT JOIN dia_chi_giao_hang dc ON dh.ID_Dia_chi = dc.ID_Dia_chi
      LEFT JOIN chi_tiet_don_hang ctdh ON dh.ID_Don_hang = ctdh.ID_Don_hang
      LEFT JOIN thanh_toan tt ON dh.ID_Don_hang = tt.ID_Don_hang
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += " AND dh.Trang_thai = ?";
      params.push(status);
    }

    if (search) {
      sql +=
        " AND (dh.Ma_don_hang LIKE ? OR kh.Ten_khach_hang LIKE ? OR kh.Email LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (dateFrom) {
      sql += " AND DATE(dh.Ngay_dat) >= ?";
      params.push(dateFrom);
    }

    if (dateTo) {
      sql += " AND DATE(dh.Ngay_dat) <= ?";
      params.push(dateTo);
    }

    // Validate sortBy
    const allowedSorts = [
      "Ngay_dat",
      "Thanh_tien",
      "Ma_don_hang",
      "Trang_thai",
    ];
    const sortField = allowedSorts.includes(sortBy)
      ? `dh.${sortBy}`
      : "dh.Ngay_dat";
    const sortDir = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    sql += ` GROUP BY dh.ID_Don_hang ORDER BY ${sortField} ${sortDir} LIMIT ? OFFSET ?`;
    params.push(safeLimit, offset);

    const [orders] = await pool.query(sql, params);

    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development" && duration > 200) {
      console.warn(`Admin orders query took ${duration}ms`);
    }

    // Get total count
    let countSql = `
      SELECT COUNT(DISTINCT dh.ID_Don_hang) as total
      FROM don_hang dh
      LEFT JOIN khach_hang kh ON dh.ID_Khach_hang = kh.ID_Khach_hang
      WHERE 1=1
    `;
    const countParams = [];

    if (status) {
      countSql += " AND dh.Trang_thai = ?";
      countParams.push(status);
    }

    if (search) {
      countSql +=
        " AND (dh.Ma_don_hang LIKE ? OR kh.Ten_khach_hang LIKE ? OR kh.Email LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (dateFrom) {
      countSql += " AND DATE(dh.Ngay_dat) >= ?";
      countParams.push(dateFrom);
    }

    if (dateTo) {
      countSql += " AND DATE(dh.Ngay_dat) <= ?";
      countParams.push(dateTo);
    }

    const [[{ total }]] = await pool.query(countSql, countParams);

    return successResponse(
      res,
      { orders },
      {
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit),
        },
      }
    );
  } catch (error) {
    next(error);
  }
});

// Get all products with filters and pagination
router.get("/products", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      search,
      lowStock,
      sortBy = "Ngay_tao",
      sortOrder = "DESC",
    } = req.query;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    let sql = `
      SELECT 
        sp.*,
        dm.Ten_danh_muc,
        (SELECT AVG(Diem_so) FROM danh_gia_phan_hoi WHERE ID_San_pham = sp.ID_San_pham AND Trang_thai = 'approved') as Diem_trung_binh,
        (SELECT COUNT(*) FROM danh_gia_phan_hoi WHERE ID_San_pham = sp.ID_San_pham AND Trang_thai = 'approved') as So_luong_danh_gia
      FROM san_pham sp
      LEFT JOIN danh_muc dm ON sp.ID_Danh_muc = dm.ID_Danh_muc
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      sql += " AND sp.ID_Danh_muc = ?";
      params.push(category);
    }

    if (status) {
      sql += " AND sp.Trang_thai = ?";
      params.push(status);
    }

    if (search) {
      sql += " AND (sp.Ten_san_pham LIKE ? OR sp.Mo_ta LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (lowStock === "true") {
      sql += " AND sp.So_luong_ton_kho < 10";
    }

    // Validate sortBy
    const allowedSorts = [
      "Ngay_tao",
      "Gia",
      "Ten_san_pham",
      "So_luong_ton_kho",
    ];
    const sortField = allowedSorts.includes(sortBy)
      ? `sp.${sortBy}`
      : "sp.Ngay_tao";
    const sortDir = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    sql += ` ORDER BY ${sortField} ${sortDir} LIMIT ? OFFSET ?`;
    params.push(safeLimit, offset);

    const [products] = await pool.query(sql, params);

    // Get total count
    let countSql = "SELECT COUNT(*) as total FROM san_pham sp WHERE 1=1";
    const countParams = [];

    if (category) {
      countSql += " AND sp.ID_Danh_muc = ?";
      countParams.push(category);
    }

    if (status) {
      countSql += " AND sp.Trang_thai = ?";
      countParams.push(status);
    }

    if (search) {
      countSql += " AND (sp.Ten_san_pham LIKE ? OR sp.Mo_ta LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (lowStock === "true") {
      countSql += " AND sp.So_luong_ton_kho < 10";
    }

    const [[{ total }]] = await pool.query(countSql, countParams);

    return successResponse(
      res,
      { products },
      {
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit),
        },
      }
    );
  } catch (error) {
    next(error);
  }
});

// create product
router.post(
  "/products",
  productValidationRules,
  validateRequest,
  async (req, res, next) => {
    try {
      const {
        Ten_san_pham,
        Mo_ta,
        Gia,
        Gia_goc,
        So_luong_ton_kho,
        ID_Danh_muc,
        Thumbnail,
      } = req.body;
      const [result] = await pool.query(
        "INSERT INTO san_pham (Ten_san_pham, Mo_ta, Gia, Gia_goc, So_luong_ton_kho, ID_Danh_muc, Thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          Ten_san_pham,
          Mo_ta,
          Gia,
          Gia_goc,
          So_luong_ton_kho,
          ID_Danh_muc,
          Thumbnail,
        ]
      );
      const [product] = await pool.query(
        "SELECT * FROM san_pham WHERE ID_San_pham = ?",
        [result.insertId]
      );
      // Clear categories cache because product counts may have changed
      try {
        clearCategoriesCache();
      } catch (_) {}
      return successResponse(res, { product: product[0] }, 201);
    } catch (error) {
      next(error);
    }
  }
);

// update product
router.put(
  "/products/:id",
  productValidationRules,
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;

      const [existing] = await pool.query(
        "SELECT * FROM san_pham WHERE ID_San_pham = ?",
        [id]
      );
      if (existing.length === 0) {
        return errorResponse(res, "Không tìm thấy sản phẩm", 404);
      }

      const fields = [];
      const values = [];

      // List of allowed fields to update
      const allowedFields = [
        "Ten_san_pham",
        "Mo_ta",
        "Gia",
        "Gia_goc",
        "So_luong_ton_kho",
        "ID_Danh_muc",
        "Thumbnail",
        "Trang_thai",
      ];

      allowedFields.forEach((field) => {
        if (body[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(body[field]);
        }
      });

      if (fields.length === 0) {
        return errorResponse(res, "Không có trường hợp lệ để cập nhật", 400);
      }

      values.push(id);

      await pool.query(
        `UPDATE san_pham SET ${fields.join(", ")} WHERE ID_San_pham = ?`,
        values
      );

      const [product] = await pool.query(
        "SELECT * FROM san_pham WHERE ID_San_pham = ?",
        [id]
      );
      try {
        clearCategoriesCache();
      } catch (_) {}
      return successResponse(res, { product: product[0] });
    } catch (error) {
      next(error);
    }
  }
);

// delete product
router.delete("/products/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product has orders
    const [orders] = await pool.query(
      "SELECT COUNT(*) as count FROM chi_tiet_don_hang WHERE ID_San_pham = ?",
      [id]
    );

    if (orders[0].count > 0) {
      // Soft delete - set status to inactive instead
      await pool.query(
        "UPDATE san_pham SET Trang_thai = ? WHERE ID_San_pham = ?",
        ["inactive", id]
      );
      return successResponse(res, {
        message: "Product deactivated (has existing orders)",
      });
    }

    await pool.query("DELETE FROM san_pham WHERE ID_San_pham = ?", [id]);
    return successResponse(res, { message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Get order details
router.get("/orders/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      `SELECT 
                dh.*,
                kh.Ten_khach_hang,
                kh.Email as CustomerEmail,
                kh.So_dien_thoai as CustomerPhone,
                dc.*,
                v.Ma_voucher,
                v.Gia_tri_giam,
                v.Loai_giam_gia
            FROM don_hang dh
            LEFT JOIN khach_hang kh ON dh.ID_Khach_hang = kh.ID_Khach_hang
            LEFT JOIN dia_chi_giao_hang dc ON dh.ID_Dia_chi = dc.ID_Dia_chi
            LEFT JOIN voucher v ON dh.ID_Voucher = v.ID_Voucher
            WHERE dh.ID_Don_hang = ?`,
      [id]
    );

    if (orders.length === 0) {
      return errorResponse(res, "Order not found", 404);
    }

    const [items] = await pool.query(
      `SELECT 
                ctdh.*,
                sp.Ten_san_pham,
                sp.Thumbnail,
                sp.Trang_thai as ProductStatus
            FROM chi_tiet_don_hang ctdh
            JOIN san_pham sp ON ctdh.ID_San_pham = sp.ID_San_pham
            WHERE ctdh.ID_Don_hang = ?`,
      [id]
    );

    const [payments] = await pool.query(
      "SELECT * FROM thanh_toan WHERE ID_Don_hang = ? ORDER BY Ngay_tao DESC",
      [id]
    );

    return successResponse(res, {
      order: orders[0],
      items,
      payments: payments || [],
    });
  } catch (error) {
    next(error);
  }
});

// Update order status with business logic validation
router.put(
  "/orders/:id/status",
  [
    body("Trang_thai")
      .isIn([
        "pending",
        "confirmed",
        "processing",
        "shipping",
        "delivered",
        "cancelled",
        "returned",
      ])
      .withMessage("Trạng thái đơn hàng không hợp lệ"),
    body("Ghi_chu").optional().trim(),
  ],
  validateRequest,
  async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const { Trang_thai, Ghi_chu } = req.body;

      // Get current order
      const [orders] = await connection.query(
        "SELECT * FROM don_hang WHERE ID_Don_hang = ? FOR UPDATE",
        [id]
      );

      if (orders.length === 0) {
        await connection.rollback();
        return errorResponse(res, "Order not found", 404);
      }

      const currentOrder = orders[0];
      const currentStatus = currentOrder.Trang_thai;

      // Validate status transitions
      const validTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["processing", "cancelled"],
        processing: ["shipping", "cancelled"],
        shipping: ["delivered", "returned"],
        delivered: ["returned"],
        cancelled: [], // Cannot transition from cancelled
        returned: [], // Cannot transition from returned
      };

      if (!validTransitions[currentStatus]?.includes(Trang_thai)) {
        await connection.rollback();
        return errorResponse(
          res,
          `Cannot transition from ${currentStatus} to ${Trang_thai}. Valid transitions: ${
            validTransitions[currentStatus]?.join(", ") || "none"
          }`,
          400
        );
      }

      // Handle cancellation - restore stock
      if (Trang_thai === "cancelled" && currentStatus !== "cancelled") {
        const [items] = await connection.query(
          "SELECT ID_San_pham, So_luong FROM chi_tiet_don_hang WHERE ID_Don_hang = ?",
          [id]
        );

        for (const item of items) {
          await connection.query(
            "UPDATE san_pham SET So_luong_ton_kho = So_luong_ton_kho + ? WHERE ID_San_pham = ?",
            [item.So_luong, item.ID_San_pham]
          );
        }

        // Update payment status to refunded if payment exists
        await connection.query(
          "UPDATE thanh_toan SET Trang_thai = ? WHERE ID_Don_hang = ?",
          ["refunded", id]
        );
      }

      // Handle delivery - update payment status
      if (Trang_thai === "delivered") {
        await connection.query(
          "UPDATE thanh_toan SET Trang_thai = ?, Ngay_thanh_toan = NOW() WHERE ID_Don_hang = ? AND Trang_thai != ?",
          ["completed", id, "refunded"]
        );
      }

      // Update order status
      const updateFields = ["Trang_thai = ?"];
      const updateValues = [Trang_thai];

      if (Ghi_chu) {
        updateFields.push("Ghi_chu = ?");
        updateValues.push(Ghi_chu);
      }

      updateValues.push(id);

      await connection.query(
        `UPDATE don_hang SET ${updateFields.join(", ")} WHERE ID_Don_hang = ?`,
        updateValues
      );

      await connection.commit();

      // Fetch updated order using the same connection
      const [updatedOrders] = await connection.query(
        "SELECT * FROM don_hang WHERE ID_Don_hang = ?",
        [id]
      );

      return successResponse(res, {
        message: "Order status updated successfully",
        order: updatedOrders[0],
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  }
);

// Get categories for product management
router.get("/categories", async (req, res, next) => {
  try {
    const [categories] = await pool.query(
      "SELECT * FROM danh_muc ORDER BY Ten_danh_muc ASC"
    );
    return successResponse(res, { categories });
  } catch (error) {
    next(error);
  }
});

// Bulk update product status
router.put(
  "/products/bulk-status",
  [
    body("productIds").isArray().withMessage("productIds phải là mảng"),
    body("productIds.*").isInt().withMessage("Mỗi ID phải là số nguyên"),
    body("Trang_thai")
      .isIn(["active", "inactive", "out_of_stock"])
      .withMessage("Trạng thái không hợp lệ"),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { productIds, Trang_thai } = req.body;

      if (productIds.length === 0) {
        return errorResponse(res, "Vui lòng chọn ít nhất một sản phẩm", 400);
      }

      const placeholders = productIds.map(() => "?").join(",");
      await pool.query(
        `UPDATE san_pham SET Trang_thai = ? WHERE ID_San_pham IN (${placeholders})`,
        [Trang_thai, ...productIds]
      );

      return successResponse(res, {
        message: `Đã cập nhật trạng thái ${productIds.length} sản phẩm`,
        updated: productIds.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk delete products
router.delete(
  "/products/bulk",
  [
    body("productIds").isArray().withMessage("productIds phải là mảng"),
    body("productIds.*").isInt().withMessage("Mỗi ID phải là số nguyên"),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { productIds } = req.body;

      if (productIds.length === 0) {
        return errorResponse(res, "Vui lòng chọn ít nhất một sản phẩm", 400);
      }

      // Check for products with orders
      const placeholders = productIds.map(() => "?").join(",");
      const [orders] = await pool.query(
        `SELECT DISTINCT ctdh.ID_San_pham 
             FROM chi_tiet_don_hang ctdh 
             WHERE ctdh.ID_San_pham IN (${placeholders})`,
        productIds
      );

      const productsWithOrders = orders.map((o) => o.ID_San_pham);
      const productsToDelete = productIds.filter(
        (id) => !productsWithOrders.includes(id)
      );
      const productsToDeactivate = productIds.filter((id) =>
        productsWithOrders.includes(id)
      );

      if (productsToDelete.length > 0) {
        const deletePlaceholders = productsToDelete.map(() => "?").join(",");
        await pool.query(
          `DELETE FROM san_pham WHERE ID_San_pham IN (${deletePlaceholders})`,
          productsToDelete
        );
      }

      if (productsToDeactivate.length > 0) {
        const deactivatePlaceholders = productsToDeactivate
          .map(() => "?")
          .join(",");
        await pool.query(
          `UPDATE san_pham SET Trang_thai = 'inactive' WHERE ID_San_pham IN (${deactivatePlaceholders})`,
          productsToDeactivate
        );
      }

      // Clear categories cache because product counts might have changed
      try {
        clearCategoriesCache();
      } catch (_) {}

      return successResponse(res, {
        message: `Đã xóa ${productsToDelete.length} sản phẩm và vô hiệu hóa ${productsToDeactivate.length} sản phẩm có đơn hàng`,
        deleted: productsToDelete.length,
        deactivated: productsToDeactivate.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Export orders to CSV
router.get("/orders/export", async (req, res, next) => {
  try {
    const { status, dateFrom, dateTo } = req.query;

    let sql = `
            SELECT 
                dh.Ma_don_hang,
                kh.Ten_khach_hang,
                kh.Email,
                dh.Ngay_dat,
                dh.Thanh_tien,
                dh.Trang_thai,
                dh.Phuong_thuc_thanh_toan,
                COUNT(DISTINCT ctdh.ID_San_pham) as So_luong_san_pham
            FROM don_hang dh
            LEFT JOIN khach_hang kh ON dh.ID_Khach_hang = kh.ID_Khach_hang
            LEFT JOIN chi_tiet_don_hang ctdh ON dh.ID_Don_hang = ctdh.ID_Don_hang
            WHERE 1=1
        `;
    const params = [];

    if (status) {
      sql += " AND dh.Trang_thai = ?";
      params.push(status);
    }

    if (dateFrom) {
      sql += " AND DATE(dh.Ngay_dat) >= ?";
      params.push(dateFrom);
    }

    if (dateTo) {
      sql += " AND DATE(dh.Ngay_dat) <= ?";
      params.push(dateTo);
    }

    sql += " GROUP BY dh.ID_Don_hang ORDER BY dh.Ngay_dat DESC";

    const [orders] = await pool.query(sql, params);

    // Convert to CSV
    const headers = [
      "Mã đơn",
      "Khách hàng",
      "Email",
      "Ngày đặt",
      "Tổng tiền",
      "Trạng thái",
      "Phương thức thanh toán",
      "Số lượng sản phẩm",
    ];
    const csvRows = [
      headers.join(","),
      ...orders.map((order) =>
        [
          order.Ma_don_hang,
          `"${order.Ten_khach_hang || ""}"`,
          order.Email || "",
          order.Ngay_dat
            ? new Date(order.Ngay_dat).toLocaleDateString("vi-VN")
            : "",
          order.Thanh_tien || 0,
          order.Trang_thai || "",
          order.Phuong_thuc_thanh_toan || "",
          order.So_luong_san_pham || 0,
        ].join(",")
      ),
    ];

    const csv = csvRows.join("\n");
    const filename = `orders_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\ufeff" + csv); // BOM for Excel UTF-8 support
  } catch (error) {
    next(error);
  }
});

// Export products to CSV
router.get("/products/export", async (req, res, next) => {
  try {
    const { status, category } = req.query;

    let sql = `
            SELECT 
                sp.ID_San_pham,
                sp.Ten_san_pham,
                dm.Ten_danh_muc,
                sp.Gia,
                sp.Gia_goc,
                sp.So_luong_ton_kho,
                sp.Trang_thai,
                sp.Ngay_tao
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.ID_Danh_muc = dm.ID_Danh_muc
            WHERE 1=1
        `;
    const params = [];

    if (status) {
      sql += " AND sp.Trang_thai = ?";
      params.push(status);
    }

    if (category) {
      sql += " AND sp.ID_Danh_muc = ?";
      params.push(category);
    }

    sql += " ORDER BY sp.Ngay_tao DESC";

    const [products] = await pool.query(sql, params);

    // Convert to CSV
    const headers = [
      "ID",
      "Tên sản phẩm",
      "Danh mục",
      "Giá",
      "Giá gốc",
      "Tồn kho",
      "Trạng thái",
      "Ngày tạo",
    ];
    const csvRows = [
      headers.join(","),
      ...products.map((product) =>
        [
          product.ID_San_pham,
          `"${product.Ten_san_pham || ""}"`,
          `"${product.Ten_danh_muc || ""}"`,
          product.Gia || 0,
          product.Gia_goc || "",
          product.So_luong_ton_kho || 0,
          product.Trang_thai || "",
          product.Ngay_tao
            ? new Date(product.Ngay_tao).toLocaleDateString("vi-VN")
            : "",
        ].join(",")
      ),
    ];

    const csv = csvRows.join("\n");
    const filename = `products_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\ufeff" + csv); // BOM for Excel UTF-8 support
  } catch (error) {
    next(error);
  }
});

export default router;
