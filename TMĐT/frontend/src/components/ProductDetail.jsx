import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, cartAPI, wishlistAPI } from '../utils/api';

export default function ProductDetail({ user, onAddToCart, onBuyNow }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    loadProduct();
    if (user) {
      checkWishlist();
    }
  }, [id, user]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getById(id);
      setProduct(data.product);
      setImages(data.images || []);
      setReviews(data.reviews || []);
    } catch (err) {
      setError('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    try {
      const wishlist = await wishlistAPI.getAll();
      const found = wishlist.some(item => item.ID_San_pham === parseInt(id));
      setInWishlist(found);
    } catch (err) {
      // Ignore
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    if (quantity < 1 || quantity > product.So_luong_ton_kho) {
      alert('Số lượng không hợp lệ');
      return;
    }

    setAddingToCart(true);
    try {
      await cartAPI.add(product.ID_San_pham, quantity);
      onAddToCart && onAddToCart();
      alert('Đã thêm vào giỏ hàng');
    } catch (err) {
      alert(err.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để mua hàng');
      return;
    }

    if (quantity < 1 || quantity > product.So_luong_ton_kho) {
      alert('Số lượng không hợp lệ');
      return;
    }

    // Thêm vào giỏ hàng trước, sau đó chuyển đến checkout
    try {
      await cartAPI.add(product.ID_San_pham, quantity);
      navigate('/checkout');
    } catch (err) {
      alert(err.message || 'Không thể thêm vào giỏ hàng');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào yêu thích');
      return;
    }

    try {
      if (inWishlist) {
        const wishlist = await wishlistAPI.getAll();
        const item = wishlist.find(item => item.ID_San_pham === parseInt(id));
        if (item) {
          await wishlistAPI.remove(item.ID_Wishlist);
          setInWishlist(false);
        }
      } else {
        await wishlistAPI.add(product.ID_San_pham);
        setInWishlist(true);
      }
    } catch (err) {
      alert('Không thể cập nhật danh sách yêu thích');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Sản phẩm không tồn tại'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 bg-white rounded-lg p-6">
          {/* Hình ảnh */}
          <div>
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
              <img
                src={product.Thumbnail || images[0]?.URL_hinh_anh || "data:image/svg+xml;utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20300%20300'%3E%3Crect%20width='100%25'%20height='100%25'%20fill='%23e5e7eb'/%3E%3Ctext%20x='50%25'%20y='50%25'%20dominant-baseline='middle'%20text-anchor='middle'%20fill='%239ca3af'%20font-size='20'%3ENo%20image%3C/text%3E%3C/svg%3E"}
                alt={product.Ten_san_pham}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img, idx) => (
                  <img
                    key={idx}
                    src={img.URL_hinh_anh}
                    alt={`${product.Ten_san_pham} ${idx + 1}`}
                    className="aspect-square rounded border object-cover cursor-pointer hover:border-brand-600"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thông tin sản phẩm */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.Ten_san_pham}</h1>
            <div className="flex items-center gap-4 mb-4">
              {product.Diem_trung_binh && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{Number(product.Diem_trung_binh).toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">({product.So_luong_danh_gia} đánh giá)</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-brand-600">
                  {Number(product.Gia).toLocaleString('vi-VN')}₫
                </span>
                {product.Gia_goc && product.Gia_goc > product.Gia && (
                  <span className="text-xl text-gray-400 line-through">
                    {Number(product.Gia_goc).toLocaleString('vi-VN')}₫
                  </span>
                )}
              </div>
            </div>

            {product.Mo_ta && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
                <p className="text-gray-600 whitespace-pre-line">{product.Mo_ta}</p>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="font-medium">Số lượng:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded border text-sm hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.So_luong_ton_kho}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, Math.min(val, product.So_luong_ton_kho)));
                    }}
                    className="w-16 text-center border rounded py-1"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.So_luong_ton_kho, quantity + 1))}
                    className="w-8 h-8 rounded border text-sm hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  Còn {product.So_luong_ton_kho} sản phẩm
                </span>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.So_luong_ton_kho === 0}
                className="flex-1 rounded bg-brand-600 text-white py-3 font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.So_luong_ton_kho === 0}
                className="flex-1 rounded bg-orange-600 text-white py-3 font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                Mua ngay
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`px-4 py-3 rounded border ${
                  inWishlist ? 'bg-red-50 border-red-300 text-red-600' : 'hover:bg-gray-50'
                }`}
              >
                {inWishlist ? '❤️' : '🤍'}
              </button>
            </div>

            {product.So_luong_ton_kho === 0 && (
              <div className="text-red-600 text-sm">Sản phẩm đã hết hàng</div>
            )}
          </div>
        </div>

        {/* Đánh giá */}
        {reviews.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Đánh giá sản phẩm</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.ID_Danh_gia} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{review.Ten_khach_hang || 'Khách hàng'}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < review.Diem_so ? 'text-yellow-500' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.Ngay_danh_gia).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  {review.Noi_dung_binh_luan && (
                    <p className="text-gray-600">{review.Noi_dung_binh_luan}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

