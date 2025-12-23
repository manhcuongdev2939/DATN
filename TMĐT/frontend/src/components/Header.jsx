import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartAPI } from "../utils/api";
import { getCart as getGuestCart } from "../utils/guestCart";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Header({ user, onCartClick, onLogout }) {
  const navigate = useNavigate();
  const { admin, adminLogout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [cartCount, setCartCount] = React.useState(0);

  const loadCartCount = React.useCallback(async () => {
    try {
      if (user) {
        const data = await cartAPI.get();
        const count =
          data.items?.reduce((sum, item) => sum + (item.So_luong || 0), 0) || 0;
        setCartCount(count);
      } else {
        const guestCart = getGuestCart();
        const count =
          guestCart.items?.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0
          ) || 0;
        setCartCount(count);
      }
    } catch (err) {
      // Fallback to guest cart
      const guestCart = getGuestCart();
      const count =
        guestCart.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ||
        0;
      setCartCount(count);
    }
  }, [user]);

  React.useEffect(() => {
    loadCartCount();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCartCount();
    };
    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, [loadCartCount]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="bg-gradient-to-r from-brand-600 to-brand-500 dark:from-gray-800 dark:to-gray-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="text-3xl font-bold text-white flex-shrink-0 mr-8"
          >
            TechStore
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 rounded-sm px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Tìm kiếm sản phẩm, danh mục, thương hiệu..."
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full w-16 flex items-center justify-center bg-brand-500 hover:bg-brand-600 rounded-sm"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>
            <div className="text-xs mt-1.5 flex gap-3 text-white/90"></div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6 ml-8">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            <button onClick={onCartClick} className="relative">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {admin ? (
              <div className="text-sm">
                <span>
                  Admin:{" "}
                  {admin.Ten_dang_nhap || admin.Ten_khach_hang || admin.Email}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await adminLogout();
                      // redirect to login page with admin type after logout
                      navigate("/login?type=admin");
                    } catch (e) {
                      // ignore
                    }
                  }}
                  className="ml-2 underline"
                >
                  (Đăng xuất Admin)
                </button>
                <Link to="/admin" className="ml-3 font-semibold underline">
                  Dashboard
                </Link>
              </div>
            ) : user ? (
              <div className="text-sm">
                <span>Xin chào, {user.Ten_khach_hang || user.Email}</span>
                <button onClick={onLogout} className="ml-2 underline">
                  (Đăng xuất)
                </button>
              </div>
            ) : (
              <div className="flex gap-2 text-sm">
                <Link
                  to="/register"
                  className="font-semibold hover:text-gray-200"
                >
                  Đăng Ký
                </Link>
                <div className="border-l border-white/50 h-4 self-center"></div>
                <Link to="/login" className="font-semibold hover:text-gray-200">
                  Đăng Nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
