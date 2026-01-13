import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ordersAPI } from "../utils/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function OrderSuccess() {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const query = useQuery();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Initialize with undefined to differentiate from null (no params)
  const [payosResult, setPayosResult] = useState(undefined);

  // Effect 1: Parse PayOS result from URL query parameters.
  useEffect(() => {
    // query is created inside because it's a new object on every render.
    // We only want this effect to re-run when the search string itself changes.
    const query = new URLSearchParams(location.search);
    const code = query.get("code");
    const status = query.get("status");

    // Only set a result object if params exist.
    if (code || status) {
      const success = code === "00" && (status === "PAID" || status === "COMPLETED");
      const result = {
        success,
        status: status || "UNKNOWN",
        code: code || "UNKNOWN",
      };
      console.log("PayOS result parsed:", result);
      setPayosResult(result);
    } else {
      // If no params, set to null to indicate processing is done.
      setPayosResult(null);
    }
  }, [location.search]);

  // Effect 2: Load order data, re-evaluate on ID or PayOS result change.
  useEffect(() => {
    // Don't do anything if ID is missing or PayOS result is still being parsed.
    if (!id || payosResult === undefined) {
      return;
    }

    let isMounted = true;
    setLoading(true);

    const loadOrder = async (retryCount = 0) => {
      try {
        const data = await ordersAPI.getById(id);
        console.log("Raw order response:", data);

        if (isMounted) {
          // If the payment was successful via PayOS redirect but the backend
          // hasn't updated yet (webhook delay), retry a few times.
          if (
            retryCount < 3 &&
            payosResult?.success &&
            data?.Trang_thai_thanh_toan === "pending"
          ) {
            console.log(
              `Payment status is pending, retrying... (${retryCount + 1}/3)`
            );
            setTimeout(() => loadOrder(retryCount + 1), 2000);
            return; // Exit here and let the retry handle state updates
          }

          setOrder(data || null);
        }
      } catch (err) {
        console.error("Load order error:", err);
        if (isMounted) {
          setError("Không thể tải thông tin đơn hàng. Vui lòng thử lại.");
          setOrder(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, payosResult]); // Reruns if PayOS result is processed.

  // Memoize success status calculation
  const isSuccess = useMemo(() => {
    // If we are still loading, or haven't processed PayOS params, don't decide yet.
    if (loading || payosResult === undefined) {
      return null;
    }

    // After loading, if there's no order object, it's a failure.
    if (!order || !order.Ma_don_hang) {
      return false;
    }

    console.log("Order data for success check:", {
      orderStatus: order.Trang_thai,
      paymentMethod: order.Phuong_thuc_thanh_toan,
      paymentStatus: order.Trang_thai_thanh_toan,
      payosResult: payosResult,
    });

    // 1. COD orders are always successful on this page.
    if (
      order.Phuong_thuc_thanh_toan === "cash" ||
      order.Phuong_thuc_thanh_toan === "cod"
    ) {
      console.log("✅ COD Order - Success!");
      return true;
    }

    // 2. For online payments, the most reliable source is the backend status.
    if (
      order.Trang_thai_thanh_toan === "completed" ||
      order.Trang_thai_thanh_toan === "paid"
    ) {
      console.log("✅ Backend Payment Status is Completed/Paid - Success!");
      return true;
    }

    // 3. As a fallback (if webhook is slow), trust the redirect from PayOS.
    if (payosResult?.success) {
      console.log("✅ PayOS URL params indicate success - Success!");
      return true;
    }

    console.log("❌ No definitive success condition met - Failure!");
    return false;
  }, [order, payosResult, loading]);

  // Loading state
  if (isSuccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Đang xác thực thanh toán...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Có lỗi xảy ra
              </h1>
              <p className="text-red-600 mb-4">{error}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="rounded bg-brand-600 text-white px-6 py-2 hover:bg-brand-700"
              >
                Thử lại
              </button>
              <button
                onClick={() => navigate("/")}
                className="rounded border border-gray-300 px-6 py-2 hover:bg-gray-50"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success/Failure state
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="mb-6">
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isSuccess ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isSuccess ? (
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSuccess ? "Đặt hàng thành công!" : "Thanh toán thất bại"}
            </h1>
            <p className="text-gray-600">
              {isSuccess
                ? "Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn ngay."
                : "Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc chọn phương thức thanh toán khác."}
            </p>
          </div>

          {order && order.Ma_don_hang && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-semibold">
                    {order.Ma_don_hang || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="font-semibold text-brand-600">
                    {Number(order.Thanh_tien || 0).toLocaleString(
                      "vi-VN"
                    )}
                    ₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức thanh toán:</span>
                  <span className="font-semibold">
                    {order.Phuong_thuc_thanh_toan === "cash" ||
                    order.Phuong_thuc_thanh_toan === "cod"
                      ? "Thanh toán khi nhận hàng"
                      : "Thanh toán online"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span
                    className={`font-semibold ${
                      isSuccess ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {!isSuccess
                      ? "Thanh toán thất bại"
                      : order.Phuong_thuc_thanh_toan === "cash" ||
                        order.Phuong_thuc_thanh_toan === "cod"
                      ? "Chờ xác nhận"
                      : "Đã thanh toán"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate("/orders")}
              className="rounded bg-brand-600 text-white px-6 py-2 hover:bg-brand-700 transition-colors"
            >
              Xem đơn hàng
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded border border-gray-300 px-6 py-2 hover:bg-gray-50 transition-colors"
            >
              Tiếp tục mua sắm
            </button>
            {!isSuccess &&
              order?.Phuong_thuc_thanh_toan !== "cash" &&
              order?.Phuong_thuc_thanh_toan !== "cod" && (
                <button
                  onClick={() => navigate("/checkout")} // Hoặc link retry thanh toán nếu có
                  className="rounded border border-brand-600 text-brand-600 px-6 py-2 hover:bg-brand-50 transition-colors"
                >
                  Thử thanh toán lại
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
