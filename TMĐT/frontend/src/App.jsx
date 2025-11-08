import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import AuthModal from './components/AuthModal';
import CartModal from './components/CartModal';
import ProductDetail from './components/ProductDetail';
import Checkout from './components/Checkout';
import OrderSuccess from './components/OrderSuccess';
import AddressManagement from './components/AddressManagement';
import UserDashboard from './components/UserDashboard';
import { getToken, authAPI, cartAPI, productsAPI } from './utils/api';

function NavBar({ user, onLogin, onLogout, onCartClick, onSearch }) {
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadCartCount();
    }
  }, [user]);

  useEffect(() => {
    const handleCartUpdate = () => {
      if (user) {
        loadCartCount();
      }
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [user]);

  const loadCartCount = async () => {
    try {
      const cart = await cartAPI.get();
      const count = cart.items?.reduce((sum, item) => sum + item.So_luong, 0) || 0;
      setCartCount(count);
    } catch (err) {
      // Ignore errors
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch && onSearch(searchTerm);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-brand-600" />
          <span className="font-semibold text-lg">Ecommerce</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900">Trang chủ</Link>
          <a href="#categories" className="hover:text-gray-900">Danh mục</a>
          <a href="#featured" className="hover:text-gray-900">Sản phẩm</a>
        </nav>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="hidden md:block">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="w-64 rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </form>
          {user ? (
            <>
              <button
                onClick={onCartClick}
                className="relative rounded bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
              >
                Giỏ hàng
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                <Link
                  to="/account"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Xin chào, {user.Ten_khach_hang}
                </Link>
                <button
                  onClick={onLogout}
                  className="rounded bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
                >
                  Đăng xuất
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="rounded bg-brand-600 text-white px-3 py-1.5 text-sm hover:bg-brand-700"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-block text-xs font-semibold tracking-widest text-brand-700 bg-brand-100 rounded px-2 py-1">TECH STORE</span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold leading-tight">
            Laptop & Điện thoại chính hãng
          </h1>
          <p className="mt-4 text-gray-600">
            Khám phá bộ sưu tập laptop và điện thoại mới nhất. Giá tốt, giao hàng nhanh, đổi trả dễ dàng.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="#featured" className="inline-flex items-center justify-center rounded bg-brand-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-brand-700">Mua ngay</a>
            <a href="#categories" className="inline-flex items-center justify-center rounded border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50">Khám phá</a>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-2xl" />
          <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white shadow-lg" />
          <div className="absolute -top-6 -right-6 h-28 w-28 rounded-2xl bg-white shadow-lg" />
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const [categories, setCategories] = React.useState([]);

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { categoriesAPI } = await import('./utils/api');
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (err) {
      // Fallback to default
      setCategories([
        { ID_Danh_muc: 1, Ten_danh_muc: 'Điện thoại', icon: '📱' },
        { ID_Danh_muc: 2, Ten_danh_muc: 'Laptop', icon: '💻' }
      ]);
    }
  };

  return (
    <section id="categories" className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Danh mục sản phẩm</h2>
          <a className="text-sm text-brand-700 hover:underline" href="#featured">Xem tất cả</a>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((c) => (
            <a
              key={c.ID_Danh_muc}
              href={`#featured?category=${c.ID_Danh_muc}`}
              className="group relative overflow-hidden rounded-xl bg-blue-100 p-8 border hover:shadow-lg transition cursor-pointer"
            >
              <div className="text-6xl mb-4">{c.icon || '📦'}</div>
              <div className="text-2xl font-bold mb-2">{c.Ten_danh_muc}</div>
              <div className="text-sm text-gray-600 mb-4">Khám phá các sản phẩm {c.Ten_danh_muc.toLowerCase()} mới nhất</div>
              <div className="text-sm font-medium text-brand-700 group-hover:underline">Xem ngay →</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Featured({ user, onAddToCart, searchTerm }) {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [addingToCart, setAddingToCart] = React.useState({});
  const navigate = useNavigate();

  React.useEffect(() => {
    const hash = window.location.hash;
    const categoryMatch = hash.match(/category=(\w+)/);
    const category = categoryMatch ? categoryMatch[1] : null;
    setSelectedCategory(category);
  }, []);

  React.useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const data = await productsAPI.getAll(params);
      setProducts(data.products || data || []);
    } catch (e) {
      setError('Không tải được sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    setAddingToCart({ ...addingToCart, [product.ID_San_pham]: true });
    try {
      await cartAPI.add(product.ID_San_pham, 1);
      onAddToCart && onAddToCart();
      window.dispatchEvent(new Event('cartUpdated'));
      alert('Đã thêm vào giỏ hàng');
    } catch (err) {
      alert(err.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingToCart({ ...addingToCart, [product.ID_San_pham]: false });
    }
  };

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

        {!loading && !error && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <div key={p.ID_San_pham || p.id} className="rounded-xl bg-white border hover:shadow-lg transition cursor-pointer">
                <div
                  onClick={() => navigate(`/product/${p.ID_San_pham || p.id}`)}
                  className="aspect-square rounded-t-xl bg-gray-100 overflow-hidden"
                >
                  <img
                    src={p.Thumbnail || p.image_url || 'https://via.placeholder.com/300'}
                    alt={p.Ten_san_pham || p.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div
                    onClick={() => navigate(`/product/${p.ID_San_pham || p.id}`)}
                    className="text-sm text-gray-500 cursor-pointer"
                  >
                    {p.brand || 'Thương hiệu'}
                  </div>
                  <div
                    onClick={() => navigate(`/product/${p.ID_San_pham || p.id}`)}
                    className="mt-1 font-medium line-clamp-2 cursor-pointer hover:text-brand-600"
                  >
                    {p.Ten_san_pham || p.name}
                  </div>
                  <div className="mt-2 font-semibold text-brand-700">
                    {Number(p.Gia || p.price).toLocaleString('vi-VN')}₫
                    {p.Gia_goc && p.Gia_goc > p.Gia && (
                      <span className="ml-2 text-sm text-gray-400 line-through">
                        {Number(p.Gia_goc).toLocaleString('vi-VN')}₫
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(p)}
                    disabled={addingToCart[p.ID_San_pham || p.id]}
                    className="mt-3 w-full rounded bg-brand-600 text-white py-2 text-sm hover:bg-brand-700 disabled:opacity-50"
                  >
                    {addingToCart[p.ID_San_pham || p.id] ? 'Đang thêm...' : 'Thêm vào giỏ'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');

    try {
      const { newsletterAPI } = await import('./utils/api');
      const result = await newsletterAPI.subscribe(email);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage('Đăng ký thành công! Voucher đã được gửi đến email của bạn.');
        setEmail('');
      }
    } catch (err) {
      setMessage('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="newsletter" className="py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-2xl font-semibold">Nhận ưu đãi mỗi tuần</h3>
        <p className="mt-2 text-gray-600">Đăng ký để không bỏ lỡ voucher và bộ sưu tập mới.</p>
        <form onSubmit={handleSubscribe} className="mt-6 mx-auto max-w-xl flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Email của bạn"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-brand-600 text-white px-4 py-2 text-sm hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Đang gửi...' : 'Đăng ký'}
          </button>
        </form>
        {message && (
          <div className={`mt-4 mx-auto max-w-xl p-3 rounded ${
            message.includes('thành công') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {message}
          </div>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-sm text-gray-500 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>© {new Date().getFullYear()} Ecommerce. All rights reserved.</div>
        <div className="flex gap-4">
          <a href="#">Điều khoản</a>
          <a href="#">Bảo mật</a>
          <a href="#">Hỗ trợ</a>
        </div>
      </div>
    </footer>
  );
}

function HomePage({ user, onAddToCart, searchTerm }) {
  return (
    <>
      <Hero />
      <Categories />
      <Featured user={user} onAddToCart={onAddToCart} searchTerm={searchTerm} />
      <Newsletter />
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  useEffect(() => {
    const token = getToken();
    if (token) {
      loadUser();
    } else {
      setUser(null);
    }
  }, []);

  // Reload user on mount and when token changes
  useEffect(() => {
    const handleStorageChange = () => {
      const token = getToken();
      if (token) {
        loadUser();
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    // Reset search when navigating away
    if (location.pathname !== '/') {
      setSearchTerm('');
    }
  }, [location]);

  const loadUser = async () => {
    try {
      const token = getToken();
      if (!token) {
        setUser(null);
        return;
      }
      const result = await authAPI.getMe();
      if (result.user) {
        setUser(result.user);
      } else if (result.error) {
        // Only logout if there's an actual error, not just missing user
        if (result.error.includes('Invalid') || result.error.includes('Token')) {
          authAPI.logout();
          setUser(null);
        }
      }
    } catch (err) {
      // Only logout on actual errors, not network issues
      if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
        authAPI.logout();
        setUser(null);
      }
    }
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
  };

  const handleCartUpdate = () => {
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (location.pathname !== '/') {
      window.location.href = '/#featured';
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <NavBar
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onCartClick={() => {
          if (!user) {
            setShowAuthModal(true);
          } else {
            setShowCartModal(true);
          }
        }}
        onSearch={handleSearch}
      />
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={<HomePage user={user} onAddToCart={handleCartUpdate} searchTerm={searchTerm} />}
          />
          <Route
            path="/product/:id"
            element={<ProductDetail user={user} onAddToCart={handleCartUpdate} onBuyNow={() => {}} />}
          />
          <Route
            path="/checkout"
            element={<Checkout user={user} />}
          />
          <Route
            path="/addresses"
            element={<AddressManagement user={user} />}
          />
          <Route
            path="/account"
            element={<UserDashboard user={user} onLogout={handleLogout} onUpdateUser={setUser} />}
          />
          <Route
            path="/order-success/:id"
            element={<OrderSuccess />}
          />
        </Routes>
      </main>
      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {user && (
        <CartModal
          isOpen={showCartModal}
          onClose={() => setShowCartModal(false)}
          onUpdate={handleCartUpdate}
        />
      )}
    </div>
  );
}
