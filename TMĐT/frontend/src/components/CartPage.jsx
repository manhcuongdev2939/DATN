import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { cartAPI } from "../utils/api";
import {
  getCart as getGuestCart,
  updateQuantity as updateGuestQty,
  removeItem as removeGuestItem,
  clearCart as clearGuestCart,
} from "../utils/guestCart";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await cartAPI.get();
      // Handle standardized response format: { success: true, data: { items, total } }
      const items = data?.items || data?.data?.items || [];
      // Map API data to the component's expected structure
      const mappedItems = items.map((item) => ({
        id: item.ID_Chi_tiet_GH,
        product_id: item.ID_San_pham,
        name: item.Ten_san_pham,
        image_url: item.Thumbnail,
        price: item.Gia_tai_thoi_diem_them,
        quantity: item.So_luong,
      }));
      setCartItems(mappedItems);
    } catch (err) {
      // Fallback to guest cart
      try {
        const guest = getGuestCart();
        const guestItems = Array.isArray(guest?.items) ? guest.items : [];
        const mappedGuestItems = guestItems.map((item) => ({
          id: item.id, // Guest cart uses 'id' directly
          product_id: item.id,
          name: item.name || "Unknown",
          image_url: item.thumbnail || "",
          price: item.price || 0,
          quantity: item.quantity || 0,
        }));
        setCartItems(mappedGuestItems);
      } catch (guestErr) {
        // If guest cart also fails, set empty array
        console.error("Guest cart fallback failed:", guestErr);
        setCartItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    const handleCartUpdated = () => loadCart();
    window.addEventListener("cart-updated", handleCartUpdated);
    return () => window.removeEventListener("cart-updated", handleCartUpdated);
  }, []);

  // When cart items are loaded, select all by default
  useEffect(() => {
    if (cartItems.length > 0) {
      setSelectedItems(cartItems.map((item) => item.id));
    }
  }, [cartItems]);

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item.id));
    }
  };

  const handleQuantityChange = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      // Find the product_id for the cart item id
      const item = cartItems.find((i) => i.id === id);
      if (!item) return;

      await cartAPI.update(id, newQuantity);
      toast.info("Đã cập nhật số lượng");
    } catch (err) {
      // Guest cart uses product_id as its item id
      updateGuestQty(id, newQuantity);
    } finally {
      loadCart();
      // Fire an event that the cart has been updated
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      await cartAPI.remove(id);
      toast.success("Đã xóa sản phẩm");
    } catch (err) {
      removeGuestItem(id);
      toast.success("Đã xóa sản phẩm");
    } finally {
      loadCart();
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
      // Fire an event that the cart has been updated
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }
  };

  const handleRemoveSelectedItems = async () => {
    setLoading(true);
    // Create a new array of promises
    const removalPromises = selectedItems.map((id) => {
      return cartAPI.remove(id).catch((err) => removeGuestItem(id));
    });

    try {
      await Promise.all(removalPromises);
      toast.success(`Đã xóa ${selectedItems.length} sản phẩm.`);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa sản phẩm.");
    } finally {
      loadCart();
      setSelectedItems([]);
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }
  };

  const totalPrice = cartItems
    .filter((item) => selectedItems.includes(item.id))
    .reduce((total, item) => total + item.price * item.quantity, 0);

  const totalSelectedCount = selectedItems.length;

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">Giỏ Hàng</h1>

        {/* Cart Header */}
        <div className="hidden md:flex bg-white py-3 px-6 rounded shadow-sm text-gray-600 font-medium text-sm">
          <div className="w-2/5 flex items-center">
            <input
              type="checkbox"
              className="mr-4 form-checkbox h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              onChange={handleSelectAll}
              checked={
                !loading &&
                cartItems.length > 0 &&
                selectedItems.length === cartItems.length
              }
              disabled={loading || cartItems.length === 0}
            />
            Sản phẩm
          </div>
          <div className="w-1/5 text-center">Đơn Giá</div>
          <div className="w-1/5 text-center">Số Lượng</div>
          <div className="w-1/5 text-center">Số Tiền</div>
          <div className="w-1/5 text-center">Thao Tác</div>
        </div>

        {/* Cart Items */}
        {loading ? (
          <div className="text-center py-20 bg-white mt-4 rounded shadow-sm">
            <p className="text-gray-600">Đang tải giỏ hàng...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white mt-4 rounded shadow-sm">
            <img
              src="https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/9bdd8040b334d31946f49e36beaf32db.png"
              alt="Empty cart"
              className="mx-auto h-28 w-28"
            />
            <p className="mt-4 text-gray-600">Giỏ hàng của bạn còn trống</p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 px-8 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              Mua Ngay
            </button>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.id}
              className="md:flex bg-white mt-4 py-4 px-6 rounded shadow-sm items-center"
            >
              {/* Product */}
              <div className="w-full md:w-2/5 flex items-center mb-4 md:mb-0">
                <input
                  type="checkbox"
                  className="mr-4 form-checkbox h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                />
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded border mr-4"
                />
                <span className="text-gray-800 text-sm md:text-base line-clamp-2">
                  {item.name}
                </span>
              </div>
              {/* Price */}
              <div className="w-full md:w-1/5 text-left md:text-center mb-2 md:mb-0">
                <span className="md:hidden font-medium mr-2">Đơn giá:</span>
                <span className="text-gray-700">
                  {item.price.toLocaleString("vi-VN")}₫
                </span>
              </div>
              {/* Quantity */}
              <div className="w-full md:w-1/5 flex items-center justify-start md:justify-center mb-4 md:mb-0">
                <span className="md:hidden font-medium mr-2">Số lượng:</span>
                <div className="flex items-center border rounded">
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity - 1)
                    }
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={item.quantity}
                    readOnly
                    className="w-12 text-center border-l border-r focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity + 1)
                    }
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
              {/* Total */}
              <div className="w-full md:w-1/5 text-left md:text-center text-orange-500 font-semibold mb-4 md:mb-0">
                <span className="md:hidden font-medium mr-2 text-gray-800">
                  Thành tiền:
                </span>
                {(item.price * item.quantity).toLocaleString("vi-VN")}₫
              </div>
              {/* Actions */}
              <div className="w-full md:w-1/5 text-left md:text-center">
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      {!loading && cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] py-4 px-4">
          <div className="container mx-auto flex flex-wrap justify-between items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="mr-4 form-checkbox h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                onChange={handleSelectAll}
                checked={
                  cartItems.length > 0 &&
                  selectedItems.length === cartItems.length
                }
              />
              <label
                onClick={handleSelectAll}
                className="cursor-pointer select-none"
              >
                Chọn tất cả ({cartItems.length})
              </label>
              <button
                onClick={handleRemoveSelectedItems}
                disabled={totalSelectedCount === 0}
                className="ml-6 text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed hidden md:block"
              >
                Xóa
              </button>
            </div>
            <div className="flex items-center mt-4 md:mt-0">
              <div className="text-right mr-6">
                <p className="text-gray-600">
                  Tổng thanh toán ({totalSelectedCount} sản phẩm):
                  <span className="text-2xl text-orange-500 font-bold ml-2">
                    {totalPrice.toLocaleString("vi-VN")}₫
                  </span>
                </p>
              </div>
              <button
                onClick={() => navigate("/checkout")}
                disabled={totalSelectedCount === 0}
                className={`px-10 py-3 text-white rounded transition-colors ${
                  totalSelectedCount > 0
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Mua Hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
