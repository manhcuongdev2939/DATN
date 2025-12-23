// routes/payments.js
import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { createPaymentLink } from "../services/payosService.js";

const router = express.Router();

// POST /api/payments/payos/create
router.post("/payos/create", authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return errorResponse(res, "orderId is required", 400);
    }

    const userId = req.user?.id || req.user?.userId;
    const [orders] = await pool.query(
      "SELECT Tong_tien FROM don_hang WHERE ID_Don_hang = ? AND ID_Khach_hang = ?",
      [orderId, userId]
    );

    if (orders.length === 0) {
      return errorResponse(
        res,
        "Order not found or does not belong to user",
        404
      );
    }

    const amount = orders[0].Tong_tien;
    if (!amount || isNaN(amount) || amount <= 0) {
      return errorResponse(res, "Invalid order amount", 400);
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const orderData = {
      orderCode: Number(orderId),
      amount: Math.round(Number(amount)),
      description: `Thanh toan don hang ${orderId}`,
      cancelUrl: `${clientUrl}/order-cancel/${orderId}`,
      returnUrl: `${clientUrl}/order-success/${orderId}`,
    };

    console.log("Creating PayOS payment with:", orderData);

    const paymentLink = await createPaymentLink(orderData);

    console.log("PayOS response:", paymentLink);

    if (paymentLink && paymentLink.checkoutUrl) {
      return successResponse(res, { payUrl: paymentLink.checkoutUrl });
    } else {
      console.error("PayOS SDK did not return checkoutUrl:", paymentLink);
      return errorResponse(res, "Failed to create PayOS payment request", 500);
    }
  } catch (err) {
    console.error("PayOS payment creation error:", err);
    return errorResponse(res, err.message || "Internal server error", 500);
  }
});

export default router;
