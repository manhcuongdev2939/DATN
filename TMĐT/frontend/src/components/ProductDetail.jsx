import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { productsAPI, cartAPI, wishlistAPI, reviewsAPI } from "../utils/api";
import { addToCart as addGuestCart } from "../utils/guestCart";

export default function ProductDetail({ user, onAddToCart, onBuyNow }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    loadProduct();
    if (user) {
      checkWishlist();
    }
  }, [id, user]);

  // Check can review after reviews are loaded
  useEffect(() => {
    if (user && reviews && reviews.length >= 0) {
      checkCanReview();
    }
  }, [user, reviews, id]);

  const checkCanReview = async () => {
    if (!user || !reviews) return;
    try {
      // Check if already reviewed
      const hasReviewed = Array.isArray(reviews) && reviews.some(r => r.ID_Khach_hang === user.ID_Khach_hang);
      if (hasReviewed) {
        setCanReview(false);
        return;
      }
      // Check if user has purchased this product
      const { ordersAPI } = await import("../utils/api");
      const ordersData = await ordersAPI.getAll();
      const orders = Array.isArray(ordersData?.orders) ? ordersData.orders : [];
      // Check if any delivered/completed order contains this product
      let hasPurchased = false;
      for (const order of orders) {
        if (order.Trang_thai === 'delivered' || order.Trang_thai === 'completed') {
          try {
            const orderDetail = await ordersAPI.getById(order.ID_Don_hang);
            if (orderDetail?.items && Array.isArray(orderDetail.items) && orderDetail.items.some(item => item.ID_San_pham === parseInt(id))) {
              hasPurchased = true;
              break;
            }
          } catch (err) {
            // Continue checking other orders
          }
        }
      }
      setCanReview(hasPurchased);
    } catch (err) {
      // If check fails, allow user to try (backend will validate)
      setCanReview(true);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getById(id);
      setProduct(data.product);
      setImages(Array.isArray(data.images) ? data.images : []);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (err) {
      toast.error("Không thể tải thông tin sản phẩm");
      setProduct(null);
      setImages([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    try {
      const wishlist = await wishlistAPI.getAll();
      const found = wishlist.some((item) => item.ID_San_pham === parseInt(id));
      setInWishlist(found);
    } catch (err) {
      // Ignore
    }
  };

  const handleAddToCart = async () => {
    if (quantity < 1 || quantity > product.So_luong_ton_kho) {
      toast.warning("Số lượng không hợp lệ");
      return;
    }

    setAddingToCart(true);
    try {
      if (user) {
        await cartAPI.add(product.ID_San_pham, quantity);
        // Dispatch cart-updated event to update header cart count
        window.dispatchEvent(new CustomEvent('cart-updated'));
      } else {
        addGuestCart({
          id: product.ID_San_pham,
          name: product.Ten_san_pham,
          price: product.Gia,
          thumbnail: product.Thumbnail,
          quantity,
        });
        // Dispatch cart-updated event for guest cart too
        window.dispatchEvent(new CustomEvent('cart-updated'));
      }
      onAddToCart && onAddToCart();
      toast.success("Đã thêm vào giỏ hàng");
    } catch (err) {
      toast.error(err.message || "Không thể thêm vào giỏ hàng");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (quantity < 1 || quantity > product.So_luong_ton_kho) {
      toast.warning("Số lượng không hợp lệ");
      return;
    }

    // Thêm vào giỏ hàng trước, sau đó chuyển đến checkout
    try {
      if (user) {
        await cartAPI.add(product.ID_San_pham, quantity);
        // Dispatch cart-updated event
        window.dispatchEvent(new CustomEvent('cart-updated'));
        navigate("/checkout");
      } else {
        addGuestCart({
          id: product.ID_San_pham,
          name: product.Ten_san_pham,
          price: product.Gia,
          thumbnail: product.Thumbnail,
          quantity,
        });
        // Dispatch cart-updated event for guest cart
        window.dispatchEvent(new CustomEvent('cart-updated'));
        toast.info("Đã lưu vào giỏ hàng. Vui lòng đăng nhập để thanh toán.");
      }
    } catch (err) {
      toast.error(err.message || "Không thể thêm vào giỏ hàng");
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.warning("Vui lòng đăng nhập để thêm vào yêu thích");
      return;
    }

    try {
      if (inWishlist) {
        const wishlist = await wishlistAPI.getAll();
        const item = wishlist.find((item) => item.ID_San_pham === parseInt(id));
        if (item) {
          await wishlistAPI.remove(item.ID_Wishlist);
          setInWishlist(false);
          toast.success("Đã xóa khỏi danh sách yêu thích");
        }
      } else {
        await wishlistAPI.add(product.ID_San_pham);
        setInWishlist(true);
        toast.success("Đã thêm vào danh sách yêu thích");
      }
    } catch (err) {
      toast.error("Không thể cập nhật danh sách yêu thích");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.warning("Vui lòng đăng nhập để đánh giá");
      return;
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      toast.warning("Vui lòng chọn điểm đánh giá");
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewsAPI.create({
        ID_San_pham: parseInt(id),
        Diem_so: reviewRating,
        Noi_dung_binh_luan: reviewComment.trim() || null,
      });
      toast.success("Đánh giá thành công!");
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewComment("");
      setCanReview(false);
      // Reload product to get updated reviews
      await loadProduct();
    } catch (err) {
      toast.error(err.message || "Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{"Sản phẩm không tồn tại"}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Product Section */}
        <div className="bg-white p-4 sm:p-6 rounded-sm shadow-sm grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* ==== IMAGE GALLERY (LEFT) ==== */}
          <section aria-labelledby="product-gallery">
            <h2 id="product-gallery" className="sr-only">
              Hình ảnh sản phẩm
            </h2>

            <div className="aspect-square overflow-hidden rounded-sm border border-gray-200 bg-gray-100 mb-3">
              <img
                src={product.Thumbnail || images[0]?.URL_hinh_anh}
                alt={product.Ten_san_pham}
                className="w-full h-full object-contain"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.slice(0, 5).map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() =>
                      setImages([img, ...images.filter((i) => i !== img)])
                    }
                    className="aspect-square overflow-hidden rounded-sm border-2 border-transparent hover:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    aria-label={`Xem ảnh ${idx + 1}`}
                  >
                    <img
                      src={img.URL_hinh_anh}
                      alt={`${product.Ten_san_pham} hình ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ==== PRODUCT INFO (RIGHT) ==== */}
          <section aria-labelledby="product-info" className="flex flex-col">
            <h1
              id="product-info"
              className="text-2xl font-normal text-gray-800 mb-2 leading-tight"
            >
              {product.Ten_san_pham}
            </h1>

            {/* RATING / SOLD */}
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 border-b border-gray-100 pb-4">
              {product.Diem_trung_binh && (
                <div className="flex items-center gap-1">
                  <span className="text-brand-500 font-bold underline">
                    {Number(product.Diem_trung_binh).toFixed(1)}
                  </span>
                  <div className="flex text-brand-500">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-4 h-4 fill-current ${i < Math.round(product.Diem_trung_binh) ? 'text-brand-500' : 'text-gray-300'}`} viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                    ))}
                  </div>
                </div>
              )}
               <div className="border-l border-gray-200 h-4"/>
              <div className="flex items-center gap-1">
                <span className="font-bold underline">{product.So_luong_danh_gia || 0}</span>
                <span>Đánh giá</span>
              </div>
               <div className="border-l border-gray-200 h-4"/>
              <div className="flex items-center gap-1">
                <span className="font-bold">{Math.floor(Math.random() * 5000) + 50}</span>
                <span>Đã bán</span>
              </div>
            </div>

            {/* PRICE */}
            <div className="mb-5 bg-gray-50 p-4 rounded-sm">
              <div className="flex items-center gap-3">
                {product.Gia_goc > product.Gia && (
                  <span className="text-gray-500 line-through text-base">
                    {Number(product.Gia_goc).toLocaleString("vi-VN")}₫
                  </span>
                )}
                <span className="text-3xl font-bold text-brand-600">
                  {Number(product.Gia).toLocaleString("vi-VN")}₫
                </span>
                {product.Gia_goc > product.Gia && (
                   <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-sm">
                    {Math.round((1 - product.Gia / product.Gia_goc) * 100)}% GIẢM
                  </span>
                )}
              </div>
            </div>
            
            {/* SPACER */}
            <div className="flex-grow"/>

            {/* QUANTITY */}
            <div className="mb-6 flex items-center gap-8">
              <label className="font-medium text-gray-700" htmlFor="quantity">
                Số lượng
              </label>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 border-y border-l border-gray-300 rounded-l-sm text-gray-600 hover:bg-gray-100 focus:outline-none"
                  aria-label="Giảm số lượng"
                >
                  -
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={product.So_luong_ton_kho}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(
                      Math.max(1, Math.min(val, product.So_luong_ton_kho))
                    );
                  }}
                  className="w-12 h-8 text-center border border-gray-300 focus:outline-none"
                  aria-describedby="stock-info"
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      Math.min(product.So_luong_ton_kho, quantity + 1)
                    )
                  }
                  className="w-8 h-8 border-y border-r border-gray-300 rounded-r-sm text-gray-600 hover:bg-gray-100 focus:outline-none"
                  aria-label="Tăng số lượng"
                >
                  +
                </button>
                 <p id="stock-info" className="text-sm text-gray-500 ml-4">
                  {product.So_luong_ton_kho} sản phẩm có sẵn
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.So_luong_ton_kho === 0}
                className="flex-1 sm:flex-initial sm:px-6 bg-brand-50 border-2 border-brand-500 text-brand-600 py-3 rounded-sm font-semibold hover:bg-brand-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                aria-live="polite"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.So_luong_ton_kho === 0}
                className="flex-1 sm:flex-initial sm:px-12 bg-brand-600 text-white py-3 rounded-sm font-semibold hover:bg-brand-700 focus:outline-none disabled:opacity-50"
              >
                Mua ngay
              </button>
               <button
                onClick={handleToggleWishlist}
                className={`w-14 h-12 flex items-center justify-center border rounded-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  inWishlist
                    ? "text-red-500"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
                aria-label={inWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
              </button>
            </div>
          </section>
        </div>

        {/* Shop Info */}
        <div className="mt-4 bg-white p-4 rounded-sm shadow-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 border border-gray-300 flex-shrink-0">
              {/* Placeholder for shop avatar */}
            </div>
            <div className="flex-grow">
              <p className="font-bold text-gray-800">Shop Placeholder Name</p>
              <p className="text-xs text-gray-500">Online 15 phút trước</p>
            </div>
            <Link to="#" className="px-4 py-2 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Xem Shop</Link>
        </div>

        {/* Product Details & Reviews */}
        <div className="mt-4 bg-white p-4 sm:p-6 rounded-sm shadow-sm">
            {/* DESCRIPTION */}
            {product.Mo_ta && (
              <section className="mb-6" aria-labelledby="product-description">
                <div className="bg-gray-50 p-3 rounded-t-sm border-b border-gray-200">
                    <h2 id="product-description" className="font-semibold uppercase text-gray-700">
                      Mô tả sản phẩm
                    </h2>
                </div>
                <div className="p-3">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {product.Mo_ta}
                    </p>
                </div>
              </section>
            )}

            {/* REVIEWS */}
            <section aria-labelledby="reviews">
              <div className="bg-gray-50 p-3 rounded-t-sm border-b border-gray-200 flex items-center justify-between">
                <h2 id="reviews" className="font-semibold uppercase text-gray-700">
                  Đánh giá sản phẩm ({reviews.length})
                </h2>
                {user && canReview && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    + Viết đánh giá
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && user && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đánh giá của bạn *
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className={`focus:outline-none transition-transform hover:scale-110 ${
                              star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            aria-label={`Đánh giá ${star} sao`}
                          >
                            <svg className="w-8 h-8 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                            </svg>
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {reviewRating === 5 && 'Tuyệt vời'}
                          {reviewRating === 4 && 'Tốt'}
                          {reviewRating === 3 && 'Bình thường'}
                          {reviewRating === 2 && 'Không tốt'}
                          {reviewRating === 1 && 'Rất tệ'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
                        Nhận xét (tùy chọn)
                      </label>
                      <textarea
                        id="review-comment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {reviewComment.length}/1000 ký tự
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewRating(5);
                          setReviewComment("");
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="p-3 divide-y divide-gray-100">
                  {reviews.map((review) => (
                    <div
                      key={review.ID_Danh_gia}
                      className="py-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 font-semibold">
                          {(review.Ten_khach_hang || "K")[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{review.Ten_khach_hang || "Khách hàng"}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex text-yellow-400">
                                  {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`w-4 h-4 fill-current ${i < review.Diem_so ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                                  ))}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(review.Ngay_danh_gia).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                        </div>
                      </div>

                      {review.Noi_dung_binh_luan && (
                        <p className="text-gray-800 leading-relaxed bg-gray-50 p-3 rounded-md mt-2">
                          {review.Noi_dung_binh_luan}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                </div>
              )}
            </section>
        </div>
      </div>
    </div>
  );
}
