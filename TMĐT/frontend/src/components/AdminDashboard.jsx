import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { adminAPI, getAdminToken, removeAdminToken } from "../utils/api";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import { useAuth } from "../context/AuthContext";
import DashboardCharts from "./DashboardCharts";

// Debounce utility function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminLogout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsPage, setProductsPage] = useState(1);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productFilters, setProductFilters] = useState({
    search: "",
    status: "",
    category: "",
  });
  const debouncedProductSearch = useDebounce(productFilters.search, 500);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [orderFilters, setOrderFilters] = useState({
    status: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Analytics state
  const [revenueData, setRevenueData] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    const adminToken = getAdminToken();
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }

    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const data = await adminAPI.getSummary();
        if (isMounted) {
          setSummary(data);
        }
      } catch (err) {
        if (!isMounted) return;
        if (
          err.message?.includes("quyền") ||
          err.message?.includes("đăng nhập") ||
          err.message?.includes("403")
        ) {
          removeAdminToken();
          adminLogout();
          navigate("/admin/login");
          return;
        }
        setError(err.message || "Không thể tải dữ liệu");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchSummary();

    const handleAdminLogout = () => {
      if (isMounted) {
        navigate("/admin/login");
      }
    };
    window.addEventListener("admin-logout", handleAdminLogout);

    return () => {
      isMounted = false;
      window.removeEventListener("admin-logout", handleAdminLogout);
    };
  }, [navigate, adminLogout]);

  const loadProducts = React.useCallback(
    async (abortSignal) => {
      try {
        setProductsLoading(true);
        const params = {
          page: productsPage,
          limit: 20,
          ...productFilters,
          search: debouncedProductSearch,
        };
        const { products: prods, meta } = await adminAPI.getProducts(params);
        if (!abortSignal?.aborted) {
          setProducts(Array.isArray(prods) ? prods : []);
          setProductsTotal(meta?.pagination?.total || 0);
        }
      } catch (err) {
        if (!abortSignal?.aborted) {
          toast.error("Không thể tải danh sách sản phẩm");
          setProducts([]);
          setProductsTotal(0);
        }
      } finally {
        if (!abortSignal?.aborted) {
          setProductsLoading(false);
        }
      }
    },
    [
      productsPage,
      debouncedProductSearch,
      productFilters.status,
      productFilters.category,
    ]
  );

  // Improved error handling for loads: redirect to admin login on 403/permission errors
  const handleAuthError = (err) => {
    if (!err) return false;
    const msg = err.message || String(err);
    if (
      msg.includes("quyền") ||
      msg.includes("403") ||
      msg.includes("không có quyền")
    ) {
      // Force admin logout and navigate to admin login
      try {
        removeAdminToken();
      } catch (_) {}
      adminLogout();
      navigate("/admin/login");
      return true;
    }
    return false;
  };

  const loadCategories = React.useCallback(async (abortSignal) => {
    try {
      const cats = await adminAPI.getCategories();
      if (!abortSignal?.aborted) {
        setCategories(Array.isArray(cats) ? cats : []);
      }
    } catch (err) {
      if (!abortSignal?.aborted) {
        setCategories([]);
      }
    }
  }, []);

  const loadOrders = React.useCallback(
    async (abortSignal) => {
      try {
        setOrdersLoading(true);
        const params = {
          page: ordersPage,
          limit: 20,
          ...orderFilters,
        };
        const { orders: ords, meta } = await adminAPI.getOrders(params);
        if (!abortSignal?.aborted) {
          setOrders(Array.isArray(ords) ? ords : []);
          setOrdersTotal(meta?.pagination?.total || 0);
        }
      } catch (err) {
        if (!abortSignal?.aborted) {
          if (handleAuthError(err)) return;
          toast.error(err.message || "Không thể tải danh sách đơn hàng");
          setOrders([]);
          setOrdersTotal(0);
        }
      } finally {
        if (!abortSignal?.aborted) {
          setOrdersLoading(false);
        }
      }
    },
    [
      ordersPage,
      orderFilters.status,
      orderFilters.search,
      orderFilters.dateFrom,
      orderFilters.dateTo,
    ]
  );

  const loadUsers = React.useCallback(async (abortSignal) => {
    try {
      setUsersLoading(true);
      const { users: usrs } = await adminAPI.getUsers();
      if (!abortSignal?.aborted) {
        setUsers(Array.isArray(usrs) ? usrs : []);
      }
    } catch (err) {
      if (!abortSignal?.aborted) {
        toast.error("Không thể tải danh sách người dùng");
        setUsers([]);
      }
    } finally {
      if (!abortSignal?.aborted) {
        setUsersLoading(false);
      }
    }
  }, []);

  // Load products
  useEffect(() => {
    if (activeTab === "products") {
      const abortController = new AbortController();
      loadProducts(abortController.signal);
      loadCategories(abortController.signal);
      return () => {
        abortController.abort();
      };
    }
  }, [activeTab, loadProducts, loadCategories]);

  // Load orders
  useEffect(() => {
    if (activeTab === "orders") {
      const abortController = new AbortController();
      loadOrders(abortController.signal);
      return () => {
        abortController.abort();
      };
    }
  }, [activeTab, loadOrders]);

  // Load users
  useEffect(() => {
    if (activeTab === "users") {
      const abortController = new AbortController();
      loadUsers(abortController.signal);
      return () => {
        abortController.abort();
      };
    }
  }, [activeTab, loadUsers]);

  // Load analytics data for dashboard
  useEffect(() => {
    if (activeTab === "dashboard") {
      const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
          const [revenue, stats, products] = await Promise.all([
            adminAPI.getRevenueAnalytics("30d"),
            adminAPI.getOrderStats("30d"),
            adminAPI.getTopProducts(5, "30d"),
          ]);
          setRevenueData(revenue);
          setOrderStats(stats);
          setTopProducts(products);
        } catch (err) {
          toast.error("Không thể tải dữ liệu phân tích.");
          console.error("Analytics fetch error:", err);
        } finally {
          setAnalyticsLoading(false);
        }
      };
      fetchAnalytics();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await adminAPI.logout();
    navigate("/admin/login"); // Fallback navigation
  };

  const handleProductSave = async (productData) => {
    try {
      // Ensure numeric fields are properly typed
      const processedData = {
        ...productData,
        Gia: parseFloat(productData.Gia) || 0,
        Gia_goc: productData.Gia_goc ? parseFloat(productData.Gia_goc) : null,
        So_luong_ton_kho: parseInt(productData.So_luong_ton_kho) || 0,
        ID_Danh_muc: parseInt(productData.ID_Danh_muc),
      };

      if (editingProduct?.ID_San_pham) {
        await adminAPI.updateProduct(editingProduct.ID_San_pham, processedData);
        toast.success("Cập nhật sản phẩm thành công");
      } else {
        await adminAPI.createProduct(processedData);
        toast.success("Thêm sản phẩm thành công");
      }
      setShowProductModal(false);
      setEditingProduct(null);

      // Reload products with proper abort signal
      if (activeTab === "products") {
        const abortController = new AbortController();
        loadProducts(abortController.signal);
        loadCategories(abortController.signal);
      }

      // Refresh summary
      try {
        const data = await adminAPI.getSummary();
        setSummary(data);
      } catch (summaryErr) {
        // Silent fail for summary refresh
        console.error("Failed to refresh summary:", summaryErr);
      }
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  const handleProductDelete = async (id) => {
    if (!id || !window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?"))
      return;
    try {
      await adminAPI.deleteProduct(id);
      toast.success("Xóa sản phẩm thành công");
      loadProducts(null);
      setSelectedProducts([]);
      try {
        const data = await adminAPI.getSummary();
        setSummary(data);
      } catch (summaryErr) {
        console.error("Failed to refresh summary:", summaryErr);
      }
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (!selectedProducts || selectedProducts.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    if (!status) {
      toast.error("Trạng thái không hợp lệ");
      return;
    }

    // Ensure admin session exists
    if (!getAdminToken()) {
      toast.error("Vui lòng đăng nhập admin để thực hiện thao tác này");
      navigate("/admin/login");
      return;
    }

    setBulkUpdating(true);
    try {
      await adminAPI.bulkUpdateProductStatus(selectedProducts, status);
      toast.success(
        `Đã cập nhật trạng thái ${selectedProducts.length} sản phẩm`
      );
      setSelectedProducts([]);
      loadProducts(null);
      try {
        const data = await adminAPI.getSummary();
        setSummary(data);
      } catch (summaryErr) {
        console.error("Failed to refresh summary:", summaryErr);
      }
    } catch (err) {
      if (handleAuthError(err)) return;
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProducts || selectedProducts.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`
      )
    )
      return;
    try {
      await adminAPI.bulkDeleteProducts(selectedProducts);
      toast.success("Đã xóa sản phẩm thành công");
      setSelectedProducts([]);
      loadProducts(null);
      try {
        const data = await adminAPI.getSummary();
        setSummary(data);
      } catch (summaryErr) {
        console.error("Failed to refresh summary:", summaryErr);
      }
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  const handleExportOrders = async () => {
    try {
      await adminAPI.exportOrders(orderFilters);
      toast.success("Đã xuất danh sách đơn hàng");
    } catch (err) {
      toast.error(err.message || "Không thể xuất dữ liệu");
    }
  };

  const handleExportProducts = async () => {
    try {
      await adminAPI.exportProducts(productFilters);
      toast.success("Đã xuất danh sách sản phẩm");
    } catch (err) {
      toast.error(err.message || "Không thể xuất dữ liệu");
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus, note) => {
    if (!orderId || !newStatus) {
      toast.error("Thông tin không hợp lệ");
      return;
    }
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus, note || "");
      toast.success("Cập nhật trạng thái đơn hàng thành công");
      setShowOrderModal(false);
      setSelectedOrder(null);
      loadOrders(null);
      try {
        const data = await adminAPI.getSummary();
        setSummary(data);
      } catch (summaryErr) {
        console.error("Failed to refresh summary:", summaryErr);
      }
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  const handleViewOrder = async (orderId) => {
    if (!orderId) {
      toast.error("ID đơn hàng không hợp lệ");
      return;
    }
    try {
      const orderData = await adminAPI.getOrderById(orderId);
      if (orderData && orderData.order) {
        setSelectedOrder(orderData);
        setShowOrderModal(true);
      } else {
        toast.error("Không tìm thấy đơn hàng");
      }
    } catch (err) {
      toast.error(err.message || "Không thể tải chi tiết đơn hàng");
    }
  };

  const handleUserSave = async (userData) => {
    if (!editingUser || !editingUser.ID_Khach_hang) {
      toast.error("Không tìm thấy thông tin người dùng để cập nhật.");
      return;
    }

    try {
      const payload = { ...userData };
      await adminAPI.updateUser(editingUser.ID_Khach_hang, payload);
      toast.success("Cập nhật người dùng thành công");
      setShowUserModal(false);
      setEditingUser(null);
      loadUsers(null);
    } catch (err) {
      if (handleAuthError(err)) return;
      toast.error(err.message || "Không thể cập nhật người dùng");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipping: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      returned: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      out_of_stock: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "Chờ xử lý",
      confirmed: "Đã xác nhận",
      processing: "Đang xử lý",
      shipping: "Đang giao hàng",
      delivered: "Đã giao hàng",
      cancelled: "Đã hủy",
      returned: "Đã trả hàng",
      active: "Hoạt động",
      inactive: "Ngừng kinh doanh",
      out_of_stock: "Hết hàng",
    };
    return texts[status] || status;
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Đang tải trang quản trị..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Không thể tải dữ liệu"
        onRetry={() => window.location.reload()}
        showHomeButton
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Trang quản trị</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                {["dashboard", "products", "orders", "users"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-brand-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tab === "dashboard" && "Tổng quan"}
                    {tab === "products" && "Sản phẩm"}
                    {tab === "orders" && "Đơn hàng"}
                    {tab === "users" && "Người dùng"}
                  </button>
                ))}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-500 transition-colors"
                title="Đăng xuất"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && summary && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              Tổng quan hệ thống
            </h2>

            {/* Revenue KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">
                    Tổng doanh thu
                  </h3>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
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
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.revenue?.total ?? 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Tất cả đơn hàng</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">
                    Doanh thu đã hoàn thành
                  </h3>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.revenue?.completed ?? 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Đơn hàng đã giao</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">
                    Đơn hàng chờ xử lý
                  </h3>
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.orderStats?.pending ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Cần xử lý ngay</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">
                    Sản phẩm sắp hết
                  </h3>
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.lowStock ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Cần nhập hàng</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Người dùng
                  </h3>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {summary?.users ?? 0}
                </p>
                <p className="text-sm text-gray-500 mt-2">Tổng số người dùng</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Đơn hàng
                  </h3>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
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
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {summary?.orders ?? 0}
                </p>
                <p className="text-sm text-gray-500 mt-2">Tổng số đơn hàng</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Sản phẩm
                  </h3>
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {summary?.products ?? 0}
                </p>
                <p className="text-sm text-gray-500 mt-2">Tổng số sản phẩm</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Đơn hàng gần đây
                  </h3>
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {summary?.orderStats?.recent ?? 0}
                </p>
                <p className="text-sm text-gray-500 mt-2">7 ngày qua</p>
              </div>
            </div>

            {/* Charts Section */}
            <DashboardCharts
              loading={analyticsLoading}
              revenueData={revenueData}
              orderStats={orderStats}
              topProducts={topProducts}
            />
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Quản lý sản phẩm
              </h2>
              <div className="flex gap-2">
                {selectedProducts.length > 0 && (
                  <>
                    <button
                      onClick={() => handleBulkStatusUpdate("active")}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      disabled={bulkUpdating}
                    >
                      {bulkUpdating
                        ? `Đang cập nhật (${selectedProducts.length})`
                        : `Kích hoạt (${selectedProducts.length})`}
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate("inactive")}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                      disabled={bulkUpdating}
                    >
                      {bulkUpdating
                        ? `Đang cập nhật (${selectedProducts.length})`
                        : `Vô hiệu hóa (${selectedProducts.length})`}
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Xóa ({selectedProducts.length})
                    </button>
                  </>
                )}
                <button
                  onClick={handleExportProducts}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Xuất CSV
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductModal(true);
                  }}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                >
                  + Thêm sản phẩm mới
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={productFilters.search}
                  onChange={(e) => {
                    setProductFilters({
                      ...productFilters,
                      search: e.target.value,
                    });
                    setProductsPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <select
                  value={productFilters.status}
                  onChange={(e) => {
                    setProductFilters({
                      ...productFilters,
                      status: e.target.value,
                    });
                    setProductsPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng kinh doanh</option>
                  <option value="out_of_stock">Hết hàng</option>
                </select>
                <button
                  onClick={() => {
                    setProductFilters({ search: "", status: "", category: "" });
                    setProductsPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>

            {/* Products Table */}
            {productsLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedProducts.length === products.length &&
                            products.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(
                                products.map((p) => p.ID_San_pham)
                              );
                            } else {
                              setSelectedProducts([]);
                            }
                          }}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tồn kho
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          Không có sản phẩm nào
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr
                          key={product.ID_San_pham}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(
                                product.ID_San_pham
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProducts([
                                    ...selectedProducts,
                                    product.ID_San_pham,
                                  ]);
                                } else {
                                  setSelectedProducts(
                                    selectedProducts.filter(
                                      (id) => id !== product.ID_San_pham
                                    )
                                  );
                                }
                              }}
                              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {product.Thumbnail && (
                                <img
                                  src={product.Thumbnail}
                                  alt={product.Ten_san_pham}
                                  className="h-10 w-10 rounded object-cover mr-3"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.Ten_san_pham}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.Ten_danh_muc}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(product.Gia)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`text-sm font-medium ${
                                product.So_luong_ton_kho < 10
                                  ? "text-red-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {product.So_luong_ton_kho}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                product.Trang_thai
                              )}`}
                            >
                              {getStatusText(product.Trang_thai)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setShowProductModal(true);
                              }}
                              className="text-brand-600 hover:text-brand-900 mr-4"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() =>
                                handleProductDelete(product.ID_San_pham)
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {productsTotal > 20 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Hiển thị {(productsPage - 1) * 20 + 1} -{" "}
                      {Math.min(productsPage * 20, productsTotal)} của{" "}
                      {productsTotal} sản phẩm
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setProductsPage((p) => Math.max(1, p - 1))
                        }
                        disabled={productsPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setProductsPage((p) => p + 1)}
                        disabled={productsPage * 20 >= productsTotal}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Quản lý đơn hàng
              </h2>
              <button
                onClick={handleExportOrders}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Xuất CSV
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Tìm kiếm đơn hàng..."
                  value={orderFilters.search}
                  onChange={(e) => {
                    setOrderFilters({
                      ...orderFilters,
                      search: e.target.value,
                    });
                    setOrdersPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <select
                  value={orderFilters.status}
                  onChange={(e) => {
                    setOrderFilters({
                      ...orderFilters,
                      status: e.target.value,
                    });
                    setOrdersPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="shipping">Đang giao hàng</option>
                  <option value="delivered">Đã giao hàng</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
                <input
                  type="date"
                  placeholder="Từ ngày"
                  value={orderFilters.dateFrom}
                  onChange={(e) => {
                    setOrderFilters({
                      ...orderFilters,
                      dateFrom: e.target.value,
                    });
                    setOrdersPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <input
                  type="date"
                  placeholder="Đến ngày"
                  value={orderFilters.dateTo}
                  onChange={(e) => {
                    setOrderFilters({
                      ...orderFilters,
                      dateTo: e.target.value,
                    });
                    setOrdersPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Orders Table */}
            {ordersLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã đơn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày đặt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          Không có đơn hàng nào
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr
                          key={order.ID_Don_hang}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.Ma_don_hang}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.Ten_khach_hang}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.CustomerEmail}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.Ngay_dat).toLocaleDateString(
                              "vi-VN"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(order.Thanh_tien)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                order.Trang_thai
                              )}`}
                            >
                              {getStatusText(order.Trang_thai)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewOrder(order.ID_Don_hang)}
                              className="text-brand-600 hover:text-brand-900"
                            >
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {ordersTotal > 20 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Hiển thị {(ordersPage - 1) * 20 + 1} -{" "}
                      {Math.min(ordersPage * 20, ordersTotal)} của {ordersTotal}{" "}
                      đơn hàng
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                        disabled={ordersPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setOrdersPage((p) => p + 1)}
                        disabled={ordersPage * 20 >= ordersTotal}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              Quản lý người dùng
            </h2>
            {usersLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số điện thoại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          Không có người dùng nào
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user.ID_Khach_hang}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.Ten_khach_hang}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.Email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.So_dien_thoai || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                user.Trang_thai
                              )}`}
                            >
                              {getStatusText(user.Trang_thai)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowUserModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Sửa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={handleProductSave}
        />
      )}

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrder(null);
          }}
          onStatusUpdate={handleOrderStatusUpdate}
        />
      )}

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={handleUserSave}
        />
      )}
    </div>
  );
}

// Product Modal Component
function ProductModal({ product, categories, onClose, onSave }) {
  const [formData, setFormData] = useState({
    Ten_san_pham: product?.Ten_san_pham || "",
    Mo_ta: product?.Mo_ta || "",
    Gia: product?.Gia || "",
    Gia_goc: product?.Gia_goc || "",
    So_luong_ton_kho: product?.So_luong_ton_kho || 0,
    ID_Danh_muc: product?.ID_Danh_muc || "",
    Thumbnail: product?.Thumbnail || "",
    Trang_thai: product?.Trang_thai || "active",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {product ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên sản phẩm *
            </label>
            <input
              type="text"
              required
              value={formData.Ten_san_pham}
              onChange={(e) =>
                setFormData({ ...formData, Ten_san_pham: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.Mo_ta}
              onChange={(e) =>
                setFormData({ ...formData, Mo_ta: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá bán *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.Gia}
                onChange={(e) =>
                  setFormData({ ...formData, Gia: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá gốc
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.Gia_goc}
                onChange={(e) =>
                  setFormData({ ...formData, Gia_goc: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số lượng tồn kho *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.So_luong_ton_kho}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    So_luong_ton_kho: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục *
              </label>
              <select
                required
                value={formData.ID_Danh_muc}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ID_Danh_muc: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.ID_Danh_muc} value={cat.ID_Danh_muc}>
                    {cat.Ten_danh_muc}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hình ảnh (URL)
            </label>
            <input
              type="url"
              value={formData.Thumbnail}
              onChange={(e) =>
                setFormData({ ...formData, Thumbnail: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={formData.Trang_thai}
              onChange={(e) =>
                setFormData({ ...formData, Trang_thai: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng kinh doanh</option>
              <option value="out_of_stock">Hết hàng</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Order Detail Modal Component
function OrderDetailModal({ order, onClose, onStatusUpdate }) {
  if (!order || !order.order) {
    return null;
  }

  const [newStatus, setNewStatus] = useState(
    order.order.Trang_thai || "pending"
  );
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const validTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipping", "cancelled"],
    shipping: ["delivered", "returned"],
    delivered: ["returned"],
    cancelled: [],
    returned: [],
  };

  const currentStatus = order.order.Trang_thai || "pending";
  const availableStatuses = validTransitions[currentStatus] || [];

  const handleStatusUpdate = async () => {
    if (!order?.order?.ID_Don_hang) {
      return;
    }
    if (newStatus === currentStatus) {
      onClose();
      return;
    }
    setUpdating(true);
    try {
      await onStatusUpdate(order.order.ID_Don_hang, newStatus, note || "");
    } catch (err) {
      // Error handled by parent component
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Chi tiết đơn hàng: {order.order?.Ma_don_hang || "N/A"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Thông tin khách hàng
              </h4>
              <p className="text-sm text-gray-900">
                {order.order?.Ten_khach_hang}
              </p>
              <p className="text-sm text-gray-500">
                {order.order?.CustomerEmail}
              </p>
              <p className="text-sm text-gray-500">
                {order.order?.So_dien_thoai}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Địa chỉ giao hàng
              </h4>
              <p className="text-sm text-gray-900">{order.order?.Dia_chi}</p>
              <p className="text-sm text-gray-500">
                {order.order?.Phuong_Xa}, {order.order?.Quan_Huyen},{" "}
                {order.order?.Tinh_Thanh}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Sản phẩm</h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sản phẩm
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Số lượng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Đơn giá
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items &&
                  Array.isArray(order.items) &&
                  order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.Ten_san_pham || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {item.So_luong || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatCurrency(item.Don_gia_luc_dat || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(item.Thanh_tien || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-3 text-sm text-gray-500 text-center"
                      >
                        Không có sản phẩm
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="text-gray-900">
                    {formatCurrency(order.order?.Tong_tien || 0)}
                  </span>
                </div>
                {(order.order?.Tien_giam_gia || 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá:</span>
                    <span>
                      -{formatCurrency(order.order?.Tien_giam_gia || 0)}
                    </span>
                  </div>
                )}
                {(order.order?.Phi_van_chuyen || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="text-gray-900">
                      {formatCurrency(order.order?.Phi_van_chuyen || 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(order.order?.Thanh_tien || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Cập nhật trạng thái
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái hiện tại
                </label>
                <div className="text-sm text-gray-900 font-medium">
                  {order.order?.Trang_thai}
                </div>
              </div>
              {availableStatuses.length > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chuyển sang trạng thái
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      <option value={currentStatus}>
                        Giữ nguyên ({currentStatus})
                      </option>
                      {availableStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status === "confirmed" && "Đã xác nhận"}
                          {status === "processing" && "Đang xử lý"}
                          {status === "shipping" && "Đang giao hàng"}
                          {status === "delivered" && "Đã giao hàng"}
                          {status === "cancelled" && "Đã hủy"}
                          {status === "returned" && "Đã trả hàng"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Thêm ghi chú về thay đổi trạng thái..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleStatusUpdate}
                      disabled={updating || newStatus === currentStatus}
                      className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? "Đang cập nhật..." : "Cập nhật trạng thái"}
                    </button>
                  </div>
                </>
              )}
              {availableStatuses.length === 0 && (
                <p className="text-sm text-gray-500">
                  Không thể thay đổi trạng thái từ trạng thái hiện tại.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// User Modal Component
function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    Ten_khach_hang: user?.Ten_khach_hang || "",
    Email: user?.Email || "",
    So_dien_thoai: user?.So_dien_thoai || "",
    Vai_tro: user?.Vai_tro || "customer",
    Trang_thai: user?.Trang_thai || "active",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Chỉnh sửa người dùng
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên người dùng *
            </label>
            <input
              type="text"
              required
              value={formData.Ten_khach_hang}
              onChange={(e) =>
                setFormData({ ...formData, Ten_khach_hang: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.Email}
              onChange={(e) =>
                setFormData({ ...formData, Email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.So_dien_thoai}
              onChange={(e) =>
                setFormData({ ...formData, So_dien_thoai: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <select
                value={formData.Vai_tro}
                onChange={(e) =>
                  setFormData({ ...formData, Vai_tro: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={formData.Trang_thai}
                onChange={(e) =>
                  setFormData({ ...formData, Trang_thai: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
