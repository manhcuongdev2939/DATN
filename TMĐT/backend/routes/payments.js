import express from 'express';
import pool from '../db.js';
import payos from '../services/payos.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tạo yêu cầu chuyển khoản PayOS cho đơn hàng (trả về thông tin tài khoản + mã tham chiếu)
router.post('/payos/transfer', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    // Kiểm tra đơn hàng
    const [orders] = await pool.query('SELECT * FROM don_hang WHERE ID_Don_hang = ? AND ID_Khach_hang = ?', [orderId, userId]);
    if (orders.length === 0) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    const order = orders[0];

    // Lấy thông tin thanh toán hiện tại
    const [payments] = await pool.query('SELECT * FROM thanh_toan WHERE ID_Don_hang = ?', [orderId]);
    const payment = payments[0];

    // Gọi PayOS để tạo yêu cầu chuyển khoản
    const callbackUrl = `${process.env.PAYOS_CALLBACK_URL || (process.env.APP_URL || '')}/api/payments/payos/webhook`;
    const result = await payos.createTransfer({
      orderId: orderId,
      amount: Number(order.Thanh_tien),
      description: `Thanh toán đơn ${order.Ma_don_hang}`,
      callbackUrl,
    });

    if (!result.success) {
      return res.status(502).json({ error: result.error || 'Tạo thanh toán PayOS thất bại' });
    }

    // Lưu thông tin giao dịch vào thanh_toan
    const info = {
      payment_ref: result.payment_ref,
      bank_name: result.bank_name,
      account_number: result.account_number,
      account_holder: result.account_holder,
      instructions: result.instructions,
    };

    await pool.query(
      'UPDATE thanh_toan SET Ma_giao_dich = ?, Thong_tin_them = ?, Trang_thai = ? WHERE ID_Don_hang = ?',
      [result.payment_ref, JSON.stringify(info), 'pending', orderId]
    );

    res.json({ success: true, payment: info });
  } catch (err) {
    console.error('PayOS transfer create error', err);
    res.status(500).json({ error: 'Lỗi tạo yêu cầu chuyển khoản' });
  }
});

// Webhook: PayOS sẽ gọi endpoint này để thông báo trạng thái giao dịch
// We need raw body to verify signature. In index.js we will mount this route with express.raw for this path.
async function payosWebhook(req, res) {
  try {
    const signature = req.headers['x-payos-signature'] || req.headers['x-signature'];
    const raw = req.rawBody || Buffer.from('');
    if (!payos.verifySignature(raw, signature)) {
      console.warn('Invalid PayOS webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    // event should contain payment_ref and status
    const paymentRef = event.payment_ref || event.data?.payment_ref;
    const status = event.status || event.data?.status;

    if (!paymentRef) return res.status(400).json({ error: 'Missing payment_ref' });

    // Tìm thanh_toan theo Ma_giao_dich
    const [payments] = await pool.query('SELECT * FROM thanh_toan WHERE Ma_giao_dich = ?', [paymentRef]);
    if (payments.length === 0) {
      console.warn('Payment record not found for', paymentRef);
      return res.status(404).json({ error: 'Payment not found' });
    }
    const p = payments[0];

    if (status === 'completed' || status === 'success') {
      await pool.query('UPDATE thanh_toan SET Trang_thai = ?, Ngay_thanh_toan = NOW() WHERE ID_Thanh_toan = ?', ['completed', p.ID_Thanh_toan]);
      await pool.query('UPDATE don_hang SET Trang_thai = ? WHERE ID_Don_hang = ?', ['confirmed', p.ID_Don_hang]);
    } else if (status === 'failed' || status === 'cancelled') {
      await pool.query('UPDATE thanh_toan SET Trang_thai = ? WHERE ID_Thanh_toan = ?', ['failed', p.ID_Thanh_toan]);
      await pool.query('UPDATE don_hang SET Trang_thai = ? WHERE ID_Don_hang = ?', ['pending', p.ID_Don_hang]);
    } else {
      // other statuses: processing, pending
      await pool.query('UPDATE thanh_toan SET Trang_thai = ? WHERE ID_Thanh_toan = ?', [status || 'processing', p.ID_Thanh_toan]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('PayOS webhook handling error', err);
    res.status(500).json({ error: 'Webhook handling error' });
  }
}

router.post('/payos/webhook', payosWebhook);

export { payosWebhook };

export default router;
