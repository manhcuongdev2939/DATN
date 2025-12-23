import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  cartAPI,
  addressesAPI,
  vouchersAPI,
  ordersAPI,
  paymentsAPI,
} from "../utils/api";
import AddressManagement from "./AddressManagement";

export default function Checkout({ user }) {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [addresses, setAddresses] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cartData, addressesData, vouchersData] = await Promise.all([
        cartAPI.get(),
        addressesAPI.getAll(),
        vouchersAPI.getAll(),
      ]);

      setCart(cartData || { items: [], total: 0 });
      setAddresses(Array.isArray(addressesData) ? addressesData : []);
      setVouchers(Array.isArray(vouchersData) ? vouchersData : []);

      const defaultAddress =
        addressesData?.find((addr) => addr.Mac_dinh) || addressesData?.[0];
      if (defaultAddress?.ID_Dia_chi) {
        setSelectedAddress(Number(defaultAddress.ID_Dia_chi));
      }
    } catch (err) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      const voucher = await vouchersAPI.check(voucherCode);
      if (voucher?.ID_Voucher) {
        setSelectedVoucher(voucher.ID_Voucher);
        setVoucherCode("");
        toast.success("Áp dụng voucher thành công!");
      } else {
        toast.error("Voucher không hợp lệ");
      }
    } catch (err) {
      toast.error(err.error || "Voucher không hợp lệ");
    }
  };

  const calculateTotal = () => {
    let total = cart.total || 0;
    let discount = 0;
    let shipping = total >= 500000 ? 0 : 30000;

    if (selectedVoucher) {
      const voucher = vouchers.find((v) => v?.ID_Voucher === selectedVoucher);
      if (voucher) {
        if (voucher.Loai_giam_gia === "percent") {
          discount = (total * voucher.Gia_tri_giam) / 100;
          if (voucher.Gia_tri_toi_da && discount > voucher.Gia_tri_toi_da) {
            discount = voucher.Gia_tri_toi_da;
          }
        } else {
          discount = voucher.Gia_tri_giam;
        }
        if (discount > total) discount = total;
      }
    }

    return {
      subtotal: total,
      discount,
      shipping,
      total: total - discount + shipping,
    };
  };

  const handleSubmit = async () => {
    if (!selectedAddress) {
      toast.warning("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        ID_Dia_chi: selectedAddress,
        ID_Voucher: selectedVoucher || null,
        Phuong_thuc_thanh_toan: paymentMethod,
      };

      const result = await ordersAPI.create(orderData);

      if (result?.error) throw new Error(result.error);

      const createdOrderId = result.order?.ID_Don_hang || result.orderId;

      if (!createdOrderId) throw new Error("Không thể lấy ID đơn hàng");

      if (paymentMethod === "payos") {
        const payosResponse = await paymentsAPI.createPayOSPayment(
          createdOrderId
        );
        if (payosResponse?.payUrl) {
          // Optional: show loading or toast before redirect
          toast.info("Chuyển đến PayOS để thanh toán...");
          window.location.href = payosResponse.payUrl;
          return;
        } else {
          throw new Error("Không thể tạo yêu cầu thanh toán PayOS");
        }
      }

      navigate(`/order-success/${createdOrderId}`);
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra khi đặt hàng");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (!cart.items?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Giỏ hàng trống</p>
          <button
            onClick={() => navigate("/")}
            className="rounded bg-brand-600 text-white px-4 py-2"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const totals = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left section */}
          <div className="md:col-span-2 space-y-6">
            {/* Address */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Địa chỉ giao hàng</h2>
              {addresses.length === 0 ? (
                <div>
                  <p className="text-gray-600 mb-4">Chưa có địa chỉ</p>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="text-brand-600 hover:underline"
                  >
                    Thêm địa chỉ mới
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <label
                      key={addr.ID_Dia_chi}
                      className={`flex items-start gap-3 p-3 border rounded cursor-pointer ${
                        selectedAddress === Number(addr.ID_Dia_chi)
                          ? "border-brand-600 bg-brand-50"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.ID_Dia_chi}
                        checked={selectedAddress === Number(addr.ID_Dia_chi)}
                        onChange={(e) =>
                          setSelectedAddress(Number(e.target.value))
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{addr.Ten_nguoi_nhan}</div>
                        <div className="text-sm text-gray-600">
                          {addr.So_dien_thoai}
                        </div>
                        <div className="text-sm text-gray-600">
                          {addr.Dia_chi}, {addr.Phuong_Xa}, {addr.Quan_Huyen},{" "}
                          {addr.Tinh_Thanh}
                        </div>
                      </div>
                    </label>
                  ))}
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="text-brand-600 hover:underline text-sm"
                  >
                    + Thêm địa chỉ mới
                  </button>
                </div>
              )}
            </div>

            {/* Voucher */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Mã giảm giá</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã voucher"
                  className="flex-1 rounded border px-3 py-2"
                />
                <button
                  onClick={handleCheckVoucher}
                  className="rounded bg-gray-100 px-4 py-2 hover:bg-gray-200"
                >
                  Áp dụng
                </button>
              </div>
              {selectedVoucher && (
                <div className="mt-3 p-3 bg-green-50 text-green-700 rounded text-sm">
                  Đã áp dụng voucher
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">
                Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <div className="font-medium">
                      Thanh toán khi nhận hàng (COD)
                    </div>
                    <div className="text-sm text-gray-600">
                      Thanh toán bằng tiền mặt khi nhận hàng
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="payos"
                    checked={paymentMethod === "payos"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <div className="font-medium">Thanh toán PayOS</div>
                    <div className="text-sm text-gray-600">
                      Thanh toán bằng QR, thẻ ngân hàng, ví điện tử
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right section - Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
              <div className="space-y-2 mb-4">
                {cart.items.length > 0 ? (
                  cart.items.map((item) => (
                    <div
                      key={item.ID_Chi_tiet_GH || item.ID_San_pham}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.Ten_san_pham || "Sản phẩm"} x{item.So_luong || 0}
                      </span>
                      <span>
                        {Number(item.Thanh_tien || 0).toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Giỏ hàng trống</p>
                )}
              </div>
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{totals.subtotal.toLocaleString("vi-VN")}₫</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span>-{totals.discount.toLocaleString("vi-VN")}₫</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {totals.shipping === 0
                      ? "Miễn phí"
                      : `${totals.shipping.toLocaleString("vi-VN")}₫`}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Tổng cộng:</span>
                  <span className="text-brand-600">
                    {totals.total.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedAddress}
                className="w-full mt-6 rounded bg-brand-600 text-white py-3 font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {submitting ? "Đang xử lý..." : "Đặt ngay"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <AddressManagement
              user={user}
              onClose={() => {
                setShowAddressModal(false);
                loadData();
              }}
              onSelect={(addressId) => {
                setSelectedAddress(Number(addressId));
                setShowAddressModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
