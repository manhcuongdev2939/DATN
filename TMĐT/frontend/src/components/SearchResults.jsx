import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productsAPI } from '../utils/api';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query) {
      searchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [query]);

  const searchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const { products: foundProducts } = await productsAPI.getAll({ search: query });
      setProducts(Array.isArray(foundProducts) ? foundProducts : []);
    } catch (err) {
      setError(err.message || 'Không thể tìm kiếm sản phẩm');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">
          Kết quả tìm kiếm: "{query}"
        </h1>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Đang tìm kiếm...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Không tìm thấy sản phẩm nào</p>
            <Link
              to="/"
              className="inline-block rounded bg-brand-600 text-white px-4 py-2 hover:bg-brand-700"
            >
              Quay về trang chủ
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">Tìm thấy {products.length} sản phẩm</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((p) => {
                const product = {
                  id: p.ID_San_pham || p.id,
                  name: p.Ten_san_pham || p.name,
                  price: p.Gia || p.price,
                  image_url: p.Thumbnail || p.image_url,
                  brand: p.Ten_danh_muc || p.brand,
                };
                return (
                  <div key={product.id} className="rounded-xl bg-white border hover:shadow-lg transition">
                    <Link to={`/product/${product.id}`}>
                      <div className="aspect-square rounded-t-xl bg-gray-100 overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="p-4">
                        <div className="text-sm text-gray-500">{product.brand || 'Thương hiệu'}</div>
                        <div className="mt-1 font-medium line-clamp-2">{product.name}</div>
                        <div className="mt-2 font-semibold text-brand-700">
                          {Number(product.price).toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

