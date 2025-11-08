import React from 'react';

function NavBar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-brand-600" />
          <span className="font-semibold text-lg">Ecommerce</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-gray-900">Trang chủ</a>
          <a href="#categories" className="hover:text-gray-900">Danh mục</a>
          <a href="#featured?category=laptop" className="hover:text-gray-900">Laptop</a>
          <a href="#featured?category=phone" className="hover:text-gray-900">Điện thoại</a>
          <a href="#newsletter" className="hover:text-gray-900">Liên hệ</a>
        </nav>
        <div className="flex items-center gap-3">
          <input className="hidden md:block w-64 rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Tìm sản phẩm..." />
          <button className="rounded bg-brand-600 text-white px-3 py-1.5 text-sm hover:bg-brand-700">Đăng nhập</button>
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
  const [categories, setCategories] = React.useState([
    { category: 'laptop', title: 'Laptop', color: 'bg-blue-100', dot: 'bg-blue-500', icon: '💻' },
    { category: 'phone', title: 'Điện thoại', color: 'bg-purple-100', dot: 'bg-purple-500', icon: '📱' }
  ]);

  return (
    <section id="categories" className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Danh mục sản phẩm</h2>
          <a className="text-sm text-brand-700 hover:underline" href="#featured">Xem tất cả</a>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-3xl">
          {categories.map((c) => (
            <a
              key={c.category}
              href={`#featured?category=${c.category}`}
              className={`group relative overflow-hidden rounded-xl ${c.color} p-8 border hover:shadow-lg transition cursor-pointer`}
            >
              <div className={`absolute top-4 right-4 h-4 w-4 rounded-full ${c.dot}`} />
              <div className="text-6xl mb-4">{c.icon}</div>
              <div className="text-2xl font-bold mb-2">{c.title}</div>
              <div className="text-sm text-gray-600 mb-4">Khám phá các sản phẩm {c.title.toLowerCase()} mới nhất</div>
              <div className="text-sm font-medium text-brand-700 group-hover:underline">Xem ngay →</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Featured() {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState(null);

  React.useEffect(() => {
    // Get category from URL hash if present
    const hash = window.location.hash;
    const categoryMatch = hash.match(/category=(\w+)/);
    const category = categoryMatch ? categoryMatch[1] : null;
    setSelectedCategory(category);
  }, []);

  React.useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError('');
        const url = selectedCategory 
          ? `http://localhost:3001/api/products?category=${selectedCategory}`
          : 'http://localhost:3001/api/products';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        // Handle both array response and object with products property
        const productsArray = Array.isArray(data) ? data : (data.products || []);
        // Transform API field names to frontend expected format
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
          reviewCount: p.So_luong_danh_gia || p.reviewCount
        }));
        setProducts(transformedProducts);
      } catch (e) {
        setError('Không tải được sản phẩm.');
        setProducts([]); // Ensure products is always an array
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
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
            {products.map((p) => (
              <div key={p.id} className="rounded-xl bg-white border hover:shadow-lg transition">
                <div className="aspect-square rounded-t-xl bg-gray-100 overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="p-4">
                  <div className="text-sm text-gray-500">{p.brand || 'Thương hiệu'}</div>
                  <div className="mt-1 font-medium line-clamp-2">{p.name}</div>
                  <div className="mt-2 font-semibold text-brand-700">{Number(p.price).toLocaleString('vi-VN')}₫</div>
                  <button className="mt-3 w-full rounded bg-brand-600 text-white py-2 text-sm hover:bg-brand-700">Thêm vào giỏ</button>
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
  return (
    <section id="newsletter" className="py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-2xl font-semibold">Nhận ưu đãi mỗi tuần</h3>
        <p className="mt-2 text-gray-600">Đăng ký để không bỏ lỡ voucher và bộ sưu tập mới.</p>
        <div className="mt-6 mx-auto max-w-xl flex gap-2">
          <input className="flex-1 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Email của bạn" />
          <button className="rounded bg-brand-600 text-white px-4 py-2 text-sm hover:bg-brand-700">Đăng ký</button>
        </div>
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

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Hero />
        <Categories />
        <Featured />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}


