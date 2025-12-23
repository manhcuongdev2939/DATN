import React from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import AuthModal from "./components/AuthModal";
import CartModal from "./components/CartModal";
import ProductDetail from "./components/ProductDetail";
import Checkout from "./components/Checkout";
import Orders from "./components/Orders";
import OrderSuccess from "./components/OrderSuccess";
import UserDashboard from "./components/UserDashboard";
import SearchResults from "./components/SearchResults";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import Contact from "./components/Contact";
import News from "./components/News";
import NewsDetail from "./components/NewsDetail";
import CategoryPage from "./components/CategoryPage";
import CartPage from "./components/CartPage";
import AdminLoginPage from "./components/AdminLoginPage";
import AdminDashboard from "./components/AdminDashboard";

import Header from "./components/Header";
import HeroCarousel from "./components/HeroCarousel";
import { productsAPI, categoriesAPI, ordersAPI } from "./utils/api";
import { toast } from "react-toastify";

function Categories() {
  const [categories, setCategories] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      try {
        const data = await categoriesAPI.getAll();
        if (mounted && data) {
          const mapped = (Array.isArray(data) ? data : []).map((c, idx) => ({
            slug: String(c.ID_Danh_muc || c.id || c.ID || idx),
            title: c.Ten_danh_muc || c.title || `Danh mục ${idx + 1}`,
            icon:
              c.Hinh_anh ||
              "https://via.placeholder.com/80/cccccc/ffffff?text=No+Image", // Use Hinh_anh from backend
          }));
          setCategories(mapped);
        }
      } catch (err) {
        console.error("Load categories failed", err && err.message);
      }
    };
    fetchCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const skeletons = Array.from({ length: 10 }).map((_, i) => i);

  return (
    <section id="categories" className="py-8 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 uppercase">
            Danh Mục
          </h2>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-y-4 gap-x-2">
          {(categories.length ? categories : skeletons).map((c, idx) => {
            const isSkeleton = typeof c === "number";
            return (
              <Link
                key={isSkeleton ? idx : c.slug}
                to={isSkeleton ? "#" : `/category/${c.slug}`}
                className="group flex flex-col items-center text-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 group-hover:border-brand-500 transition-colors">
                  {isSkeleton ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse" />
                  ) : (
                    <img
                      src={c.icon}
                      alt={c.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-700 group-hover:text-brand-600 transition-colors leading-tight">
                  {isSkeleton ? (
                    <span className="inline-block h-3 w-16 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    c.title
                  )}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Featured() {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const location = useLocation();

  React.useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch all products for "Gợi ý hôm nay"
        const { products: rawProducts } = await productsAPI.getAll({
          limit: 12,
        });

        if (isMounted) {
          const productsArray = Array.isArray(rawProducts) ? rawProducts : [];
          const transformedProducts = productsArray.map((p) => ({
            id: p.ID_San_pham || p.id,
            name: p.Ten_san_pham || p.name,
            price: p.Gia || p.price,
            image_url: p.Thumbnail || p.image_url,
            originalPrice: p.Gia_goc || p.originalPrice,
            soldCount: Math.floor(Math.random() * 5000) + 50, // Placeholder for sold count
          }));
          setProducts(transformedProducts);
        }
      } catch (e) {
        if (isMounted) {
          toast.error(e.message || "Không tải được sản phẩm.");
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const skeletons = Array.from({ length: 12 }).map((_, i) => i);

  return (
    <section id="featured" className="py-8 bg-gray-50 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 uppercase">
              GỢI Ý HÔM NAY
            </h2>
          </div>
          <div className="p-4">
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {skeletons.map((i) => (
                  <div key={i} className="bg-white rounded-sm shadow-sm">
                    <div className="aspect-square bg-gray-200 animate-pulse" />
                    <div className="p-2 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && Array.isArray(products) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="group bg-white rounded-sm border border-transparent hover:border-brand-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 flex flex-col"
                  >
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                          No image
                        </div>
                      )}
                      {p.originalPrice &&
                        Number(p.originalPrice) > Number(p.price) && (
                          <div className="absolute top-0 right-0 px-1.5 py-1 bg-brand-500/90 text-white text-xs font-bold">
                            <p>{`-${Math.min(
                              99,
                              Math.round(
                                (1 -
                                  Number(p.price) / Number(p.originalPrice)) *
                                  100
                              )
                            )}%`}</p>
                            <p className="uppercase">Giảm</p>
                          </div>
                        )}
                    </div>
                    <div className="p-2 flex-grow flex flex-col">
                      <p className="text-sm text-gray-800 line-clamp-2 flex-grow">
                        {p.name}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-base font-semibold text-brand-600">
                          {Number(p.price).toLocaleString("vi-VN")}₫
                        </div>
                        <div className="text-xs text-gray-500">
                          Đã bán{" "}
                          {p.soldCount > 1000
                            ? (p.soldCount / 1000).toFixed(1) + "k"
                            : p.soldCount}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Newsletter({ onSubscribe, user }) {
  const [email, setEmail] = React.useState(user?.Email || "");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (user?.Email) {
      setEmail(user.Email);
    }
  }, [user]);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Vui lòng nhập email");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const { newsletterAPI } = await import("./utils/api");
      const result = await newsletterAPI.subscribe(email);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(
          "Đăng ký thành công! Voucher đã được gửi đến email của bạn."
        );
        if (!user) {
          setEmail("");
        }
      }
    } catch (err) {
      setMessage("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="newsletter"
      className="py-16 bg-gradient-to-br from-brand-600 to-brand-700 dark:from-gray-800 dark:to-gray-900"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900 mb-4">
              <svg
                className="w-8 h-8 text-brand-600 dark:text-brand-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Nhận ưu đãi đặc biệt
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {user
                ? "Đăng ký để nhận voucher và thông tin sản phẩm mới nhất qua email."
                : "Đăng ký để không bỏ lỡ voucher và bộ sưu tập mới mỗi tuần."}
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Email của bạn"
                  disabled={!!user}
                />
              </div>
              <button
                type="submit"
                disabled={loading || (user && !email)}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold hover:from-brand-700 hover:to-brand-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Đăng ký"
                )}
              </button>
            </div>
            {message && (
              <div
                className={`mt-4 text-sm text-center p-3 rounded-lg ${
                  message.includes("thành công")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
            {user && (
              <p className="mt-3 text-xs text-gray-500 text-center">
                Sử dụng email đã đăng ký: {user.Email}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
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
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <span className="font-bold text-white text-lg">TechStore</span>
            </div>
            <p className="text-sm text-gray-400">
              Cửa hàng công nghệ uy tín, chất lượng hàng đầu Việt Nam
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="" className="hover:text-white transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <a
                  href="#categories"
                  className="hover:text-white transition-colors"
                >
                  Danh mục
                </a>
              </li>
              <li>
                <a
                  href="#featured"
                  className="hover:text-white transition-colors"
                >
                  Sản phẩm nổi bật
                </a>
              </li>
              <li>
                <Link
                  to="/search"
                  className="hover:text-white transition-colors"
                >
                  Tìm kiếm
                </Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-white transition-colors">
                  Tin tức
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-white transition-colors"
                >
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-white mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Câu hỏi thường gặp
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách đổi trả
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Vận chuyển
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Pháp lý</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách cookie
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} TechStore. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl font-bold text-gray-800 mb-4">404</div>
      <p className="text-gray-600 mb-6">
        Trang bạn tìm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        to="/"
        className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition"
      >
        Về trang chủ
      </Link>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải...
      </div>
    );
  }

  if (!user) {
    // Redirect to login, preserving intended destination for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const { admin, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải...
      </div>
    );
  }

  if (!admin) {
    // Redirect to login page with admin type, preserving intended destination
    return (
      <Navigate to="/login?type=admin" state={{ from: location }} replace />
    );
  }
  return children;
}

// Component để redirect admin khỏi trang user
function RedirectAdminFromUser({ children }) {
  const { admin, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải...
      </div>
    );
  }

  if (admin) {
    // Nếu admin đang truy cập trang user, redirect về admin dashboard
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function QuickActions({ user, onCartClick }) {
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = React.useState([]);

  React.useEffect(() => {
    let isMounted = true;
    if (user) {
      ordersAPI
        .getAll({ limit: 3 })
        .then((result) => {
          if (isMounted && result.orders) {
            setRecentOrders(result.orders.slice(0, 3));
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user) return null;

  return (
    <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Truy cập nhanh
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={onCartClick}
            className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-brand-500 hover:shadow-lg transition-all text-left bg-white dark:bg-gray-800"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-brand-100 flex items-center justify-center group-hover:bg-brand-500 transition-colors">
                <svg
                  className="w-6 h-6 text-brand-600 group-hover:text-white transition-colors"
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
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Giỏ hàng</h3>
                <p className="text-sm text-gray-500">Xem sản phẩm đã chọn</p>
              </div>
            </div>
          </button>

          <Link
            to="/orders"
            className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-brand-500 hover:shadow-lg transition-all text-left bg-white dark:bg-gray-800"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <svg
                  className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Đơn hàng</h3>
                <p className="text-sm text-gray-500">Theo dõi đơn hàng</p>
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard"
            className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-brand-500 hover:shadow-lg transition-all text-left bg-white dark:bg-gray-800"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <svg
                  className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Tài khoản</h3>
                <p className="text-sm text-gray-500">Quản lý thông tin</p>
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard?tab=wishlist"
            className="group p-6 rounded-xl border-2 border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all text-left bg-white dark:bg-gray-800"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-500 transition-colors">
                <svg
                  className="w-6 h-6 text-red-600 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Yêu thích</h3>
                <p className="text-sm text-gray-500">Sản phẩm đã lưu</p>
              </div>
            </div>
          </Link>
        </div>

        {recentOrders.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Đơn hàng gần đây
              </h3>
              <Link
                to="/orders"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.ID_Don_hang}
                  to={`/orders`}
                  className="p-4 rounded-lg border border-gray-200 hover:border-brand-500 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Đơn #{order.ID_Don_hang}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.Trang_thai === "completed"
                          ? "bg-green-100 text-green-700"
                          : order.Trang_thai === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.Trang_thai || "Đang xử lý"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(order.Ngay_dat || Date.now()).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                  <p className="text-sm font-semibold text-brand-600 mt-1">
                    {Number(order.Tong_tien || 0).toLocaleString("vi-VN")}₫
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function HomePage({ user, onLoginClick, onCartClick }) {
  const navigate = useNavigate();
  return (
    <>
      <HeroCarousel />
      {user && (
        <QuickActions user={user} onCartClick={() => navigate("/cart")} />
      )}
      <Categories />
      <Featured />
      <Newsletter onSubscribe={onLoginClick} user={user} />
    </>
  );
}

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, admin, logout, updateUser, isAuthLoading } = useAuth();
  const { isDark } = useTheme();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showCartModal, setShowCartModal] = React.useState(false);

  const handleLoginSuccess = (userData) => {
    // The user state is already updated in AuthContext
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    logout();
  };

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/admin/login";

  // Không hiển thị Header và Footer trên trang admin
  const isAdminPage = location.pathname.startsWith("/admin");

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải ứng dụng...
      </div>
    );
  }

  return (
    <div className={`min-h-full flex flex-col ${isDark ? "dark" : ""}`}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {!isAuthPage && !isAdminPage && (
        <Header
          user={user}
          onLogout={handleLogout}
          onCartClick={() => setShowCartModal(true)}
        />
      )}
      <main className="flex-1">
        <Routes>
          {/* --- Authentication --- */}
          <Route
            path="/login"
            element={<LoginPage onSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/register"
            element={<RegisterPage onSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/admin/login"
            element={<Navigate to="/login?type=admin" replace />}
          />

          {/* --- Admin --- */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />

          {/* --- Main application routes --- */}
          <Route
            path="/"
            element={
              <RedirectAdminFromUser>
                <HomePage
                  user={user}
                  onLoginClick={() => setShowAuthModal(true)}
                  onCartClick={() => navigate("/cart")}
                />
              </RedirectAdminFromUser>
            }
          />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/product/:id" element={<ProductDetail user={user} />} />
          <Route
            path="/category/:id"
            element={
              <CategoryPage
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
              />
            }
          />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <Checkout user={user} />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <Orders user={user} />
              </RequireAuth>
            }
          />
          <Route path="/order-success/:id" element={<OrderSuccess />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <UserDashboard
                  user={user}
                  onLogout={logout}
                  onUpdateUser={updateUser}
                />
              </RequireAuth>
            }
          />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAuthPage && !isAdminPage && <Footer />}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
      />
      <CartModal
        isOpen={showCartModal}
        onClose={() => setShowCartModal(false)}
        onUpdate={() => {
          // Gửi sự kiện để NavBar có thể cập nhật số lượng
          window.dispatchEvent(new CustomEvent("cart-updated"));
        }}
      />
    </div>
  );
}
