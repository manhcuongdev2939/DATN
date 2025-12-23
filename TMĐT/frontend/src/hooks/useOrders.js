import { useState, useEffect, useCallback, useRef } from "react";
import { adminAPI } from "../utils/api";
import { toast } from "react-toastify";

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const abortControllerRef = useRef(null);

  const loadOrders = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: 20,
          ...filters,
        };
        const { orders: ords, meta } = await adminAPI.getOrders(params);
        if (!signal?.aborted) {
          setOrders(Array.isArray(ords) ? ords : []);
          setTotal(meta?.pagination?.total || 0);
        }
      } catch (err) {
        if (!signal?.aborted) {
          toast.error(err.message || "Không thể tải danh sách đơn hàng");
          setOrders([]);
          setTotal(0);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [page, filters]
  );

  const refreshOrders = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    await loadOrders(controller.signal);
  }, [loadOrders]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  }, []);

  const handleOrderStatusUpdate = useCallback(
    async (orderId, newStatus, note) => {
      if (!orderId || !newStatus) {
        toast.error("Thông tin không hợp lệ");
        return false;
      }
      try {
        await adminAPI.updateOrderStatus(orderId, newStatus, note || "");
        toast.success("Cập nhật trạng thái đơn hàng thành công");
        setShowOrderModal(false);
        setSelectedOrder(null);
        await refreshOrders();
        return true;
      } catch (err) {
        toast.error(err.message || "Có lỗi xảy ra");
        return false;
      }
    },
    [refreshOrders]
  );

  const handleViewOrder = useCallback(async (orderId) => {
    if (!orderId) {
      toast.error("ID đơn hàng không hợp lệ");
      return false;
    }
    try {
      const orderData = await adminAPI.getOrderById(orderId);
      if (orderData && orderData.order) {
        setSelectedOrder(orderData);
        setShowOrderModal(true);
        return true;
      } else {
        toast.error("Không tìm thấy đơn hàng");
        return false;
      }
    } catch (err) {
      toast.error(err.message || "Không thể tải chi tiết đơn hàng");
      return false;
    }
  }, []);

  const handleExportOrders = useCallback(async () => {
    try {
      await adminAPI.exportOrders(filters);
      toast.success("Đã xuất danh sách đơn hàng");
    } catch (err) {
      toast.error(err.message || "Không thể xuất dữ liệu");
    }
  }, [filters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    orders,
    loading,
    page,
    total,
    filters,
    selectedOrder,
    showOrderModal,

    // Actions
    setPage,
    updateFilters,
    setSelectedOrder,
    setShowOrderModal,
    refreshOrders,
    handleOrderStatusUpdate,
    handleViewOrder,
    handleExportOrders,
  };
};
