import React from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
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
import AdminDashboard from "./admin/AdminDashboard";
import Contact from "./components/Contact";
import AdminLogin from "./admin/AdminLogin";
import News from "./components/News";
import NewsDetail from "./components/NewsDetail";
import CategoryPage from "./components/CategoryPage";
import { authAPI, cartAPI, ordersAPI, productsAPI, categoriesAPI } from "./utils/api";
import ProtectedRoute from "./admin/components/ProtectedRoute";

function NavBar({ user, onLoginClick, onLogout, onCartClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = React.useState("");
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const [cartCount, setCartCount] = React.useState(0);

    // Fetch cart count when user is logged in
    React.useEffect(() => {
        const fetchCartCount = async () => {
            if (user) {
                try {
                    const result = await cartAPI.get();
                    if (result.items && Array.isArray(result.items)) {
                        const totalItems = result.items.reduce(
                            (sum, item) => sum + (item.So_luong || 0),
                            0
                        );
                        setCartCount(totalItems);
                    }
                } catch (error) {
                    console.error("Failed to fetch cart counts:", error);
                    setCartCount(0);
                }
            }
        };
        fetchCartCount();

        // Lắng nghe sự kiện cart-updated
        const handleCartUpdate = () => fetchCartCount();
        window.addEventListener('cart-updated', handleCartUpdate);

        return () => {
            window.removeEventListener('cart-updated', handleCartUpdate);
        };
    }, [user]); // Chỉ phụ thuộc vào user để biết khi nào cần bắt đầu fetch

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleScrollLink = (targetId) => {
        if (location.pathname !== "/") {
            navigate("/");
            setTimeout(() => {
                const element = document.querySelector(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                }
            }, 100); // Small delay to allow for re-render
        } else {
            const element = document.querySelector(targetId);
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    return (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="h-16 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
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
                        <span className="hidden sm:block font-bold text-xl bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">TechStore</span>
                    </Link>

                    {/* Navigation - Hidden on mobile */}
                    <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
                        <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 transition-colors">Trang chủ</Link>
                        <button onClick={() => handleScrollLink("#categories")} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 transition-colors">Danh mục</button>
                        <Link to="/news" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 transition-colors">Tin tức</Link>
                        <Link to="/contact" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 transition-colors">Liên hệ</Link>
                    </nav>

                    {/* Search & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {/* Search - Hidden on small screens */}
                        <form onSubmit={handleSearch} className="hidden md:flex">
                            <div className="relative w-48 lg:w-64">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                    placeholder="Tìm sản phẩm..."
                                />
                            </div>
                        </form>

                        {user ? (
                            <div className="flex items-center gap-1 sm:gap-2">
                                {/* Cart Button */}
                                <button
                                    onClick={onCartClick}
                                    className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                    aria-label="Giỏ hàng"
                                >
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                                            {cartCount > 99 ? "99+" : cartCount}
                                        </span>
                                    )}
                                </button>

                                {/* User Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
                                            {(user.Ten_khach_hang || user.Email || "U").charAt(0).toUpperCase()}
                                        </div>
                                        <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                                            {user.Ten_khach_hang || user.Email}
                                        </span>
                                        <svg
                                            className={`hidden sm:block w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showUserMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                                            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-gray-200 py-2 z-20 animate-scale-in">
                                                <Link
                                                    to="/dashboard"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                        />
                                                    </svg>
                                                    <span>Tài khoản của tôi</span>
                                                </Link>
                                                <Link
                                                    to="/orders"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                        />
                                                    </svg>
                                                    <span>Đơn hàng</span>
                                                </Link>
                                                <div className="border-t border-gray-100 my-1" />
                                                <button
                                                    onClick={() => {
                                                        setShowUserMenu(false);
                                                        onLogout();
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                        />
                                                    </svg>
                                                    <span>Đăng xuất</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="hidden sm:inline-flex px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 shadow-md hover:shadow-lg transition-all"
                                >
                                    <span className="hidden sm:inline">Đăng ký</span>
                                    <span className="sm:hidden">ĐK</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

function Hero({ user }) {
    const slides = [
        {
            id: 1,
            title: user ? `Xin chào, ${user.Ten_khach_hang || 'Bạn'}!` : 'Laptop & Điện thoại chính hãng',
            subtitle: user
                ? 'Ưu đãi cá nhân cho bạn - cập nhật hàng tuần'
                : 'Khám phá bộ sưu tập laptop và điện thoại mới nhất. Giá tốt, giao hàng nhanh.',
            cta: 'Mua ngay',
        },
        {
            id: 2,
            title: 'Giảm giá đến 30% cho máy tính xách tay',
            subtitle: 'Chọn máy tính phù hợp cho công việc và giải trí',
            cta: 'Xem ưu đãi',
        },
        {
            id: 3,
            title: 'Chuẩn bị cho mùa học mới',
            subtitle: 'Đồ dùng công nghệ cần thiết với giá tốt',
            cta: 'Khám phá',
        },
    ];

    const [index, setIndex] = React.useState(0);
    const [paused, setPaused] = React.useState(false);

    React.useEffect(() => {
        if (paused) return;
        const t = setInterval(() => {
            setIndex((i) => (i + 1) % slides.length);
        }, 4500);
        return () => clearInterval(t);
    }, [paused]);

    const go = (i) => setIndex(((i % slides.length) + slides.length) % slides.length);

    return (
        <section className="relative bg-gradient-to-br from-brand-50 via-white to-brand-50 overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
            </div>

            <div
                className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="text-center md:text-left">
                        <div className="mb-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium">
                                TECH STORE
                            </div>
                        </div>

                        <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-700"
                                style={{ transform: `translateX(-${index * 100}%)` }}
                            >
                                {slides.map((s) => (
                                    <div key={s.id} className="min-w-full pr-6">
                                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-4">
                                            {s.title}
                                        </h2>
                                        <p className="text-lg text-gray-600 mb-6">{s.subtitle}</p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                                            <a
                                                href="#featured"
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white px-6 py-3 text-base font-semibold hover:from-brand-700 hover:to-brand-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                            >
                                                <span>{s.cta}</span>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </a>
                                            <a
                                                href="#categories"
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 text-gray-700 px-6 py-3 text-base font-semibold hover:border-brand-500 hover:text-brand-600 bg-white transition-all"
                                            >
                                                <span>Khám phá</span>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Dots */}
                            <div className="mt-6 flex items-center gap-2 justify-center md:justify-start">
                                {slides.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => go(i)}
                                        className={`h-2 w-8 rounded-full transition-all ${i === index ? 'bg-brand-600 w-10' : 'bg-gray-300'}`}
                                        aria-label={`Go to slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative hidden md:block">
                        <div className="relative">
                            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                                <div
                                    className="h-full w-full bg-cover bg-center transform transition-transformduration-700"
                                    style={{
                                        backgroundImage: `linear-gradient(135deg, rgba(79,70,229,0.85), rgba(6,182,212,0.8)), linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02))`,
                                    }}
                                />
                            </div>
                            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                                <svg
                                    className="w-12 h-12 text-brand-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

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
                        color: ["bg-blue-50", "bg-purple-50", "bg-green-50"][idx % 3] || "bg-gray-50",
                        icon: c.Icon || (idx % 3 === 0 ? "💻" : idx % 3 === 1 ? "📱" : "🎧"),
                        count: Number(c.So_luong_san_pham || c.count || 0),
                    }));
                    setCategories(mapped);
                }
            } catch (err) {
                console.error('Load categories failed', err && err.message);
            }
        };
        fetchCategories();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <section id="categories" className="py-14">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold">Danh mục sản phẩm</h2>
                    <a className="text-sm text-brand-700 hover:underline" href="#featured">
                        Xem tất cả
                    </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {categories.map((c) => (
                        <div key={c.slug} className="rounded-xl p-6 border bg-white hover:shadow-md transition flex flex-col items-center text-center">
                            <div className={`flex items-center justify-center h-16 w-16 rounded-lg text-3xl mb-3 ${c.color}`}>{c.icon}</div>
                            <div className="font-semibold text-lg mb-1">{c.title}</div>
                            <div className="text-sm text-gray-500 mb-2">Số lượng sản phẩm: <span className="font-bold text-gray-700">{c.count}</span></div>
                            <Link
                                to={`/category/${c.slug}`}
                                className="inline-block mt-2 px-4 py-2 rounded-full bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
                            >
                                Xem sản phẩm
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Featured() {
    const [products, setProducts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState(null);

    React.useEffect(() => {
        const hash = window.location.hash;
        const categoryMatch = hash.match(/category=(\w+)/);
        const category = categoryMatch ? categoryMatch[1] : null;
        setSelectedCategory(category);
    }, []);

    React.useEffect(() => {
        let isMounted = true;
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError("");
                const params = selectedCategory ? { category: selectedCategory } : {};
                const { products: rawProducts } = await productsAPI.getAll(params);
                
                if (isMounted) {
                    const productsArray = Array.isArray(rawProducts) ? rawProducts : [];
                    const transformedProducts = productsArray.map((p) => ({
                        id: p.ID_San_pham || p.id,
                        name: p.Ten_san_pham || p.name,
                        price: p.Gia || p.price,
                        image_url: p.Thumbnail || p.image_url,
                        brand: p.Ten_danh_muc || p.brand,
                        description: p.Mo_ta || p.description,
                        originalPrice: p.Gia_goc || p.originalPrice,
                        stock: p.So_luong_ton_kho || p.stock,
                        category: p.Ten_danh_muc || p.category,
                        rating: p.Diem_trung_binh || p.rating,
                        reviewCount: p.So_luong_danh_gia || p.reviewCount,
                    }));
                    setProducts(transformedProducts);
                }
            } catch (e) {
                if (isMounted) {
                    setError(e.message || "Không tải được sản phẩm.");
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
    }, [selectedCategory]);

    return (
        <section id="featured" className="py-14 bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between">
                    <h2 className="text-2xl font-semibold">Sản phẩm nổi bật</h2>
                    <div className="text-sm text-gray-500">Cập nhật hàng tuần</div>
                </div>

                {loading && (
                    <div className="mt-8 text-gray-600">Đang tải sản phẩm...</div>
                )}

                {error && !loading && (
                    <div className="mt-8 text-red-600 text-sm">{error}</div>
                )}

                {!loading && !error && Array.isArray(products) && (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {products.map((p, idx) => (
                            <div key={p.id} className="rounded-xl bg-white border hover:shadow-lg transition animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
                                <div className="aspect-square rounded-t-xl bg-gray-100 overflow-hidden">
                                    {p.image_url ? (
                                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                    ) : null}
                                </div>
                                <div className="p-4">
                                    <div className="text-sm text-gray-500">{p.brand || "Thương hiệu"}</div>
                                    <Link to={`/product/${p.id}`} className="mt-1 font-medium line-clamp-2 hover:text-brand-600">
                                        {p.name}
                                    </Link>
                                    <div className="mt-2 font-semibold text-brand-700">{Number(p.price).toLocaleString("vi-VN")}₫</div>
                                    <Link to={`/product/${p.id}`} className="mt-3 w-full block text-center rounded bg-brand-600 text-white py-2 text-sm hover:bg-brand-700">
                                        Xem chi tiết
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
                setMessage("Đăng ký thành công! Voucher đã được gửi đến email của bạn.");
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
        <section id="newsletter" className="py-16 bg-gradient-to-br from-brand-600 to-brand-700">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 mb-4">
                            <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">Nhận ưu đãi đặc biệt</h3>
                        <p className="text-gray-600">{user ? "Đăng ký để nhận voucher và thông tin sản phẩm mới nhất qua email." : "Đăng ký để không bỏ lỡ voucher và bộ sưu tập mới mỗi tuần."}</p>
                    </div>
                    <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
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
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    "Đăng ký"
                                )}
                            </button>
                        </div>
                        {message && (
                            <div
                                className={`mt-4 text-sm text-center p-3 rounded-lg ${
                                    message.includes("thành công") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
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
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <span className="font-bold text-white text-lg">TechStore</span>
                        </div>
                        <p className="text-sm text-gray-400">Cửa hàng công nghệ uy tín, chất lượng hàng đầu Việt Nam</p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Liên kết nhanh</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="" className="hover:text-white transition-colors">Trang chủ</Link></li>
                            <li><a href="#categories" className="hover:text-white transition-colors">Danh mục</a></li>
                            <li><a href="#featured" className="hover:text-white transition-colors">Sản phẩm nổi bật</a></li>
                            <li><Link to="/search" className="hover:text-white transition-colors">Tìm kiếm</Link></li>
                            <li><Link to="/news" className="hover:text-white transition-colors">Tin tức</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">Liên hệ</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Hỗ trợ</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Chính sách đổi trả</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Vận chuyển</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Liên hệ</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Pháp lý</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Chính sách cookie</a></li>
                            <li><Link to="/login?type=admin" className="hover:text-white transition-colors">Trang quản trị</Link></li>
                            <li><Link to="/admin" className="hover:text-white transition-colors">Trang quản trị</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-400">© {new Date().getFullYear()} TechStore. All rights reserved.</div>
                    <div className="flex gap-4">
                        <a
                            href="#"
                            className="text-gray-400 hover:text-white transition-colors"
                            aria-label="Facebook"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </a>
                        <a
                            href="#"
                            className="text-gray-400 hover:text-white transition-colors"
                            aria-label="Twitter"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                        </a>
                        <a
                            href="#"
                            className="text-gray-400 hover:text-white transition-colors"
                            aria-label="Instagram"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
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
        <section className="py-12 bg-white border-b border-gray-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Truy cập nhanh</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={onCartClick}
                        className="group p-6 rounded-xl border-2 border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all text-left bg-white"
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
                        className="group p-6 rounded-xl border-2 border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all text-left bg-white"
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
                        className="group p-6 rounded-xl border-2 border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all text-left bg-white"
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
                        className="group p-6 rounded-xl border-2 border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all text-left bg-white"
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
                            <h3 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h3>
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
                                        <span className="text-sm font-medium text-gray-900">Đơn #{order.ID_Don_hang}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${order.Trang_thai === "completed" ? "bg-green-100 text-green-700" : order.Trang_thai === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                                            {order.Trang_thai || "Đang xử lý"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {new Date(order.Ngay_dat || Date.now()).toLocaleDateString("vi-VN")}
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
    return (
        <>
            <Hero user={user} />
            {user && <QuickActions user={user} onCartClick={onCartClick} />}
            <Categories />
            <Featured />
            <Newsletter onSubscribe={onLoginClick} user={user} />
        </>
    );
}

export default function App() {
    const location = useLocation();
    const [user, setUser] = React.useState(null);
    const [showAuthModal, setShowAuthModal] = React.useState(false);
    const [showCartModal, setShowCartModal] = React.useState(false);

    // Kiểm tra token khi component mount
    React.useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // Thử lấy thông tin user
            authAPI
                .getMe()
                .then((result) => {
                    if (result.user) {
                        setUser(result.user);
                    }
                })
                .catch(() => {
                    // Token không hợp lệ, xóa token
                    localStorage.removeItem("token");
                });
        }
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        setShowAuthModal(false);
    };

    const handleLogout = () => {
        authAPI.logout();
        setUser(null);
    };

    const handleUpdateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

    return (
        <div className="min-h-full flex flex-col">
            {!isAuthPage && (
                <NavBar
                    user={user}
                    onLoginClick={() => setShowAuthModal(true)}
                    onLogout={handleLogout}
                    onCartClick={() => {
                        if (!user) {
                            setShowAuthModal(true);
                        } else {
                            setShowCartModal(true);
                        }
                    }}
                />
            )}
            <main className="flex-1">
                <Routes>
                    {/* Authentication routes should be defined first */}
                    <Route
                        path="/login"
                        element={<LoginPage onSuccess={handleLoginSuccess} />}
                    />
                    <Route
                        path="/register"
                        element={<RegisterPage onSuccess={handleLoginSuccess} />}
                    />

                    {/* Main application routes */}
                    <Route
                        path="/"
                        element={
                            <HomePage
                                user={user}
                                onLoginClick={() => setShowAuthModal(true)}
                            />
                        }
                    />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/product/:id" element={<ProductDetail user={user} />} />
                    <Route path="/category/:id" element={<CategoryPage />} />
                    <Route path="/checkout" element={<Checkout user={user} />} />
                    <Route path="/orders" element={<Orders user={user} />} />
                    <Route path="/order-success/:id" element={<OrderSuccess />} />
                    <Route
                        path="/dashboard"
                        element={
                            <UserDashboard
                                user={user}
                                onLogout={handleLogout}
                                onUpdateUser={handleUpdateUser}
                            />
                        }
                    />
                    <Route path="/news" element={<News />} />
                    <Route path="/news/:id" element={<NewsDetail />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* Admin routes */}
                    <Route path="/admin/*" element={<AdminDashboard />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route element={<ProtectedRoute />}>
                        {/* Tất cả các route bên trong đây sẽ được bảo vệ */}
                        <Route path="/admin/*" element={<AdminDashboard />} />
                    </Route>
                </Routes>
            </main>
            {!isAuthPage && <Footer />}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={handleLoginSuccess}
            />
            {user && (
                <CartModal
                    isOpen={showCartModal}
                    onClose={() => setShowCartModal(false)}
                    onCartUpdate={() => {
                        // Gửi sự kiện để NavBar có thể cập nhật số lượng
                        window.dispatchEvent(new CustomEvent('cart-updated'));
                    }}
                />
            )}
        </div>
    );
}