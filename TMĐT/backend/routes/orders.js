import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tạo đơn hàng mới
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { ID_Dia_chi, ID_Voucher, Phuong_thuc_thanh_toan = 'cash', Ghi_chu } = req.body;

    // Lấy giỏ hàng
    const [carts] = await connection.query(
      'SELECT ID_Gio_hang FROM gio_hang WHERE ID_Khach_hang = ?',
      [userId]
    );

    if (carts.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }

    const cartId = carts[0].ID_Gio_hang;

    // Lấy chi tiết giỏ hàng
    const [cartItems] = await connection.query(
      `SELECT ct.*, sp.Ten_san_pham, sp.So_luong_ton_kho, sp.Trang_thai
       FROM chi_tiet_gio_hang ct
       JOIN san_pham sp ON ct.ID_San_pham = sp.ID_San_pham
       WHERE ct.ID_Gio_hang = ?`,
      [cartId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }

    // Kiểm tra tồn kho và tính tổng tiền
    let Tong_tien = 0;
    for (const item of cartItems) {
      if (item.Trang_thai !== 'active') {
        await connection.rollback();
        return res.status(400).json({ error: `Sản phẩm ${item.Ten_san_pham} không còn bán` });
      }
      if (item.So_luong > item.So_luong_ton_kho) {
        await connection.rollback();
        return res.status(400).json({ error: `Sản phẩm ${item.Ten_san_pham} không đủ số lượng` });
      }
      Tong_tien += parseFloat(item.Gia_tai_thoi_diem_them) * item.So_luong;
    }

    // Xử lý voucher
    let Tien_giam_gia = 0;
    let voucherData = null;
    if (ID_Voucher) {
      const [vouchers] = await connection.query(
        'SELECT * FROM voucher WHERE ID_Voucher = ? AND Trang_thai = "active" AND Ngay_bat_dau <= CURDATE() AND Ngay_ket_thuc >= CURDATE() AND So_luong_su_dung_con_lai > 0',
        [ID_Voucher]
      );

      if (vouchers.length > 0) {
        voucherData = vouchers[0];
        if (voucherData.Loai_giam_gia === 'percent') {
          Tien_giam_gia = (Tong_tien * voucherData.Gia_tri_giam) / 100;
          if (voucherData.Gia_tri_toi_da && Tien_giam_gia > voucherData.Gia_tri_toi_da) {
            Tien_giam_gia = voucherData.Gia_tri_toi_da;
          }
        } else {
          Tien_giam_gia = voucherData.Gia_tri_giam;
        }
        if (Tien_giam_gia > Tong_tien) {
          Tien_giam_gia = Tong_tien;
        }
      }
    }

    const Phi_van_chuyen = Tong_tien >= 500000 ? 0 : 30000; // Miễn phí ship trên 500k
    const Thanh_tien = Tong_tien - Tien_giam_gia + Phi_van_chuyen;

    // Tạo mã đơn hàng
    const Ma_don_hang = `DH${Date.now()}${userId}`;

    // Tạo đơn hàng
    const [orderResult] = await connection.query(
      `INSERT INTO don_hang 
       (ID_Khach_hang, Ma_don_hang, Tong_tien, Tien_giam_gia, Phi_van_chuyen, Thanh_tien, 
        Trang_thai, Phuong_thuc_thanh_toan, ID_Dia_chi, ID_Voucher, Ghi_chu)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [userId, Ma_don_hang, Tong_tien, Tien_giam_gia, Phi_van_chuyen, Thanh_tien, 
       Phuong_thuc_thanh_toan, ID_Dia_chi || null, ID_Voucher || null, Ghi_chu || null]
    );

    const orderId = orderResult.insertId;

    // Tạo chi tiết đơn hàng và cập nhật tồn kho
    for (const item of cartItems) {
      const thanhTien = parseFloat(item.Gia_tai_thoi_diem_them) * item.So_luong;
      await connection.query(
        `INSERT INTO chi_tiet_don_hang (ID_Don_hang, ID_San_pham, So_luong, Don_gia_luc_dat, Thanh_tien)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.ID_San_pham, item.So_luong, item.Gia_tai_thoi_diem_them, thanhTien]
      );

      // Giảm tồn kho
      await connection.query(
        'UPDATE san_pham SET So_luong_ton_kho = So_luong_ton_kho - ? WHERE ID_San_pham = ?',
        [item.So_luong, item.ID_San_pham]
      );
    }

    // Cập nhật số lượng voucher nếu có
    if (voucherData) {
      await connection.query(
        'UPDATE voucher SET So_luong_su_dung_con_lai = So_luong_su_dung_con_lai - 1 WHERE ID_Voucher = ?',
        [ID_Voucher]
      );
    }

    // Tạo bản ghi thanh toán
    await connection.query(
      `INSERT INTO thanh_toan (ID_Don_hang, So_tien, Phuong_thuc, Trang_thai)
       VALUES (?, ?, ?, 'pending')`,
      [orderId, Thanh_tien, Phuong_thuc_thanh_toan]
    );

    // Xóa giỏ hàng
    await connection.query('DELETE FROM chi_tiet_gio_hang WHERE ID_Gio_hang = ?', [cartId]);

    await connection.commit();

    res.status(201).json({
      message: 'Đặt hàng thành công',
      order: {
        ID_Don_hang: orderId,
        Ma_don_hang: Ma_don_hang,
        Thanh_tien
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Lỗi tạo đơn hàng' });
  } finally {
    connection.release();
  }
});

// Lấy danh sách đơn hàng của khách hàng
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        dh.*,
        COUNT(ct.ID_San_pham) as So_luong_san_pham
      FROM don_hang dh
      LEFT JOIN chi_tiet_don_hang ct ON dh.ID_Don_hang = ct.ID_Don_hang
      WHERE dh.ID_Khach_hang = ?
    `;
    const params = [userId];

    if (status) {
      sql += ' AND dh.Trang_thai = ?';
      params.push(status);
    }

    sql += ' GROUP BY dh.ID_Don_hang ORDER BY dh.Ngay_dat DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [orders] = await pool.query(sql, params);

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Lỗi lấy danh sách đơn hàng' });
  }
});

// Lấy chi tiết đơn hàng
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [orders] = await pool.query(
      `SELECT dh.*, dc.*
       FROM don_hang dh
       LEFT JOIN dia_chi_giao_hang dc ON dh.ID_Dia_chi = dc.ID_Dia_chi
       WHERE dh.ID_Don_hang = ? AND dh.ID_Khach_hang = ?`,
      [id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    const [items] = await pool.query(
      `SELECT 
        ct.*,
        sp.Ten_san_pham,
        sp.Thumbnail
      FROM chi_tiet_don_hang ct
      JOIN san_pham sp ON ct.ID_San_pham = sp.ID_San_pham
      WHERE ct.ID_Don_hang = ?`,
      [id]
    );

    const [payment] = await pool.query(
      'SELECT * FROM thanh_toan WHERE ID_Don_hang = ?',
      [id]
    );

    res.json({
      order: orders[0],
      items,
      payment: payment[0] || null
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ error: 'Lỗi lấy chi tiết đơn hàng' });
  }
});

export default router;

