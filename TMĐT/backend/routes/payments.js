// routes/payments.js
import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { createPaymentLink, verifyWebhook } from "../services/payosService.js";

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
      cancelUrl: `${clientUrl}/order-payment-status?orderId=${orderId}&status=cancelled`,
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
    console.error("PayOS payment creation error (full error object):", err);
    return errorResponse(res, err.message || "Internal server error", 500);
  }
});

// POST /api/payments/payos/webhook
router.post("/payos/webhook", async (req, res) => {
  const signature = req.headers["payos-signature"];
  // The webhook body is the data object from PayOS
  const webhookBody = req.body;

  if (!signature) {
    console.error("[PayOS Webhook] Error: Missing signature header");
    return res.status(400).json({ error: "Missing signature" });
  }

  try {
    const isValid = verifyWebhook(webhookBody, signature);

    if (!isValid) {
      console.error("[PayOS Webhook] Error: Invalid signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const { orderCode, status } = webhookBody;

    console.log(
      `[PayOS Webhook] Received for order ${orderCode} with status ${status}`
    );

    let newStatus;
    if (status === "PAID") {
      newStatus = "processing";
    } else if (status === "CANCELLED") {
      newStatus = "cancelled";
    } else {
      console.log(
        `[PayOS Webhook] Unhandled status "${status}" for order ${orderCode}`
      );
      // Still acknowledge the webhook
      return res
        .status(200)
        .json({ message: "Webhook received, status not handled" });
    }

    // Update the order status in the database
    const [result] = await pool.query(
      "UPDATE don_hang SET Trang_thai = ? WHERE ID_Don_hang = ?",
      [newStatus, orderCode]
    );

    if (result.affectedRows === 0) {
      console.error(
        `[PayOS Webhook] Error: Order with ID ${orderCode} not found.`
      );
      // Still return 200 so PayOS doesn't retry. The issue is on our side.
    } else {
      console.log(
        `[PayOS Webhook] Order ${orderCode} status updated to ${newStatus}`
      );
    }

    // Acknowledge receipt to PayOS
    return res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("[PayOS Webhook] Error processing webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
