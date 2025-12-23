import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { adminAPI } from "../utils/api";
import LoadingSpinner from "./LoadingSpinner";

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Không thể tải danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleUpdateStatus = async (reviewId, newStatus) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn ${
          newStatus === "approved" ? "duyệt" : "từ chối"
        } đánh giá này không?`
      )
    )
      return;

    try {
      await adminAPI.updateReviewStatus(reviewId, newStatus);
      toast.success("Cập nhật trạng thái đánh giá thành công!");
      await loadReviews();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-600",
      approved: "text-green-600",
      rejected: "text-red-600",
    };
    return colors[status] || "text-gray-500";
  };
  
  const getStatusText = (status) => {
    const texts = {
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Đã từ chối",
    };
    return texts[status] || status;
  };


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Quản lý Đánh giá
        </h2>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người đánh giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Chưa có đánh giá nào.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.ID_Danh_gia} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{review.Ten_san_pham}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{review.Ten_khach_hang}</td>
                    <td className="px-6 py-4 font-bold text-lg text-yellow-500">{review.Diem_so} ★</td>
                    <td className="px-6 py-4 text-sm max-w-sm whitespace-pre-wrap">{review.Noi_dung}</td>
                    <td className={`px-6 py-4 font-semibold ${getStatusColor(review.Trang_thai)}`}>
                      {getStatusText(review.Trang_thai)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {review.Trang_thai === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(review.ID_Danh_gia, 'approved')}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(review.ID_Danh_gia, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                        {review.Trang_thai === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(review.ID_Danh_gia, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Từ chối
                          </button>
                        )}
                        {review.Trang_thai === 'rejected' && (
                           <button
                            onClick={() => handleUpdateStatus(review.ID_Danh_gia, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Duyệt lại
                          </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
