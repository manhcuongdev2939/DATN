// --- Core API Utilities ---

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL &&
    import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")) ||
  `${window.location.origin.replace(/\/$/, "")}/api`;

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Parses a JSON response, throwing a detailed error on failure.
 * @param {Response} res The fetch Response object.
 * @returns {Promise<{data: any, meta: any}>} The parsed data and metadata.
 */
const parseJsonResponse = async (res) => {
  if (res.ok) {
    // Handle successful responses (200-299)
    const payload = await res.json().catch(() => ({})); // Gracefully handle empty body
    const data =
      payload && Object.prototype.hasOwnProperty.call(payload, "data")
        ? payload.data
        : payload;
    return {
      data,
      meta: payload?.meta,
    };
  }

  // Handle error responses (4xx, 5xx)
  let errorPayload = null;
  try {
    errorPayload = await res.json();
  } catch (e) {
    // The response body was not valid JSON.
    throw new Error(
      res.statusText || "Yêu cầu thất bại với một lỗi không xác định."
    );
  }

  // Extract the most specific error message from the payload.
  const message =
    errorPayload?.data?.error || // Backend standard error format
    errorPayload?.error?.message ||
    errorPayload?.error ||
    errorPayload?.message ||
    "Đã có lỗi xảy ra từ máy chủ.";

  throw new Error(message);
};

// --- Token Management ---

const TOKEN_KEY = "token";
const ADMIN_TOKEN_KEY = "admin_token";

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const removeToken = () => localStorage.removeItem(TOKEN_KEY);

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
const setAdminToken = (token) => localStorage.setItem(ADMIN_TOKEN_KEY, token);
const removeAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);

// Notify app to reset auth state when token becomes invalid (e.g. 401)
const notifyAuthLogout = () => {
  try {
    window.dispatchEvent(new Event("auth-logout"));
  } catch (_) {
    /* no-op if window not available */
  }
};

// --- Authenticated Fetch Wrappers ---

const createAuthFetch =
  (tokenGetter, tokenRemover) =>
  async (url, options = {}) => {
    const token = tokenGetter();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn(`No token found for request to ${url}`);
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Unauthorized, automatically remove the invalid token.
      tokenRemover();
      notifyAuthLogout();
    }

    if (response.status === 403) {
      // Forbidden - token invalid or expired
      const errorText = await response
        .clone()
        .text()
        .catch(() => "");
      let errorMessage = "Không có quyền truy cập";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData?.error || errorData?.message || errorMessage;
      } catch (_) {
        // Use default error message
      }

      // If it's an admin route and token is invalid, remove it
      if (url.includes("/admin")) {
        tokenRemover();
        // Dispatch event to notify admin logout
        try {
          window.dispatchEvent(new Event("admin-logout"));
        } catch (_) {
          /* no-op if window not available */
        }
      }

      // Throw error so calling code can handle it
      const error = new Error(errorMessage);
      error.status = 403;
      throw error;
    }

    return response;
  };

const authFetch = createAuthFetch(getToken, removeToken);
const adminAuthFetch = createAuthFetch(getAdminToken, removeAdminToken);

// --- API Modules ---

// Auth API
export const authAPI = {
  register: async (data) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const { data: result } = await parseJsonResponse(res);
    if (result?.token) {
      setToken(result.token);
    }
    return result;
  },

  /** Đã sửa đổi để đồng nhất với adminAPI.login và các API OTP. */
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Đã đổi lại thành tên trường viết hoa để đồng nhất,
      // vì Backend của bạn có thể đang mong đợi cấu trúc này.
      body: JSON.stringify({ Email: email, Mat_khau: password }),
      // Nếu lỗi 400 vẫn xảy ra và bạn chắc chắn Backend dùng chữ thường,
      // hãy chuyển lại thành: body: JSON.stringify({ email: email, password: password }),
    });
    const { data } = await parseJsonResponse(res);
    if (data?.token) {
      setToken(data.token);
    }
    return data;
  },

  verifyOtp: async (email, otp) => {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Email: email, otp }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  requestOTP: async (email) => {
    const res = await fetch(`${API_BASE}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Email: email }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  requestRegisterOTP: async (email) => {
    const res = await fetch(`${API_BASE}/auth/register-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Email: email }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  loginOTP: async (email, otp) => {
    const res = await fetch(`${API_BASE}/auth/login-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Email: email, otp }),
    });
    const { data } = await parseJsonResponse(res);
    if (data?.token) {
      setToken(data.token);
    }
    return data;
  },

  logout: async () => {
    try {
      // Best-effort: call backend to revoke token
      await authFetch("/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Failed to revoke token on server during logout", e);
    } finally {
      removeToken();
      notifyAuthLogout();
    }
  },

  getMe: async () => {
    const res = await authFetch("/auth/me");
    const { data } = await parseJsonResponse(res);
    return data;
  },

  updateProfile: async (profileData) => {
    const res = await authFetch("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },
};

// Products API
export const productsAPI = {
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const res = await fetch(`${API_BASE}/products${queryString}`);
    const { data, meta } = await parseJsonResponse(res);
    const products = Array.isArray(data) ? data : data?.products || [];
    return {
      products,
      pagination: meta?.pagination || data?.pagination,
    };
  },

  getById: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`);
    const { data } = await parseJsonResponse(res);
    return data || {};
  },
};

// Categories API (with simple in-memory cache)
let __cachedCategories = null;
export const categoriesAPI = {
  getAll: async (force = false) => {
    if (!force && __cachedCategories) {
      return __cachedCategories;
    }

    const res = await fetch(`${API_BASE}/categories`);
    const { data } = await parseJsonResponse(res);
    __cachedCategories = data;
    return data;
  },

  clearCache: () => {
    __cachedCategories = null;
  },

  getById: async (id) => {
    const res = await fetch(`${API_BASE}/categories/${id}`);
    const { data } = await parseJsonResponse(res);
    return data;
  },

  getProducts: async (id, page = 1) => {
    const res = await fetch(
      `${API_BASE}/categories/${id}/products?page=${page}`
    );
    const { data } = await parseJsonResponse(res);
    return data;
  },
};

// Cart API
export const cartAPI = {
  get: async () => {
    const res = await authFetch("/cart");
    const { data } = await parseJsonResponse(res);
    return data;
  },

  add: async (productId, quantity = 1) => {
    const res = await authFetch("/cart/add", {
      method: "POST",
      body: JSON.stringify({ ID_San_pham: productId, So_luong: quantity }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  update: async (itemId, quantity) => {
    const res = await authFetch(`/cart/update/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ So_luong: quantity }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  remove: async (itemId) => {
    const res = await authFetch(`/cart/remove/${itemId}`, {
      method: "DELETE",
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },
};

// Orders API
export const ordersAPI = {
  create: async (orderData) => {
    const res = await authFetch("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await authFetch(`/orders?${query}`);
    const { data } = await parseJsonResponse(res);
    return data;
  },

  getById: async (id) => {
    const res = await authFetch(`/orders/${id}`);
    const { data } = await parseJsonResponse(res);
    return data;
  },
};

// Payments API
export const paymentsAPI = {
  createPayOSPayment: async (orderId) => {
    const res = await authFetch("/payments/payos/create", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },
};

// Reviews API
export const reviewsAPI = {
  create: async (reviewData) => {
    const res = await authFetch("/reviews", {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  getByProduct: async (productId, page = 1) => {
    const res = await fetch(
      `${API_BASE}/reviews/product/${productId}?page=${page}`
    );
    const { data } = await parseJsonResponse(res);
    return data;
  },
};

// Wishlist API
export const wishlistAPI = {
  getAll: async () => {
    const res = await authFetch("/wishlist");
    const { data } = await parseJsonResponse(res);
    // Backend returns { items: [...] } — normalize to array for callers
    return data?.items || data?.wishlist || data || [];
  },

  add: async (productId) => {
    const res = await authFetch("/wishlist/add", {
      method: "POST",
      body: JSON.stringify({ ID_San_pham: productId }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  remove: async (itemId) => {
    const res = await authFetch(`/wishlist/remove/${itemId}`, {
      method: "DELETE",
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },
};

// Addresses API
export const addressesAPI = {
  getAll: async () => {
    const res = await authFetch("/addresses");
    const { data } = await parseJsonResponse(res);
    // Backend returns { addresses: [...] } — normalize to array
    return data?.addresses || data || [];
  },

  create: async (addressData) => {
    const res = await authFetch("/addresses", {
      method: "POST",
      body: JSON.stringify(addressData),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  update: async (id, addressData) => {
    const res = await authFetch(`/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(addressData),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  delete: async (id) => {
    const res = await authFetch(`/addresses/${id}`, {
      method: "DELETE",
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },
};

// Vouchers API
export const vouchersAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/vouchers`);
    const { data } = await parseJsonResponse(res);
    return data;
  },

  check: async (code) => {
    const res = await fetch(`${API_BASE}/vouchers/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Ma_voucher: code }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },
};

// Newsletter API
export const newsletterAPI = {
  subscribe: async (email) => {
    const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },
};

// Admin API
export const adminAPI = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Email: email, Mat_khau: password }),
    });
    const { data } = await parseJsonResponse(res);
    if (data?.token) {
      setAdminToken(data.token);
      console.log(
        "Admin token saved:",
        data.token ? "Token saved successfully" : "No token"
      );
    } else {
      console.warn("Admin login response missing token:", data);
    }
    return data;
  },

  logout: async () => {
    try {
      await adminAuthFetch("/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Failed to revoke admin token on server during logout", e);
    } finally {
      removeAdminToken();
      try {
        window.dispatchEvent(new Event("admin-logout"));
      } catch (_) {}
    }
  },

  getSummary: async () => {
    const res = await adminAuthFetch(`/admin/summary`);
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw new Error("Không thể tải dữ liệu");
    }
    const { data } = await parseJsonResponse(res);
    // Backend returns { success: true, data: { users, orders, products } }
    return data || {};
  },

  getMonthlyRevenue: async () => {
    const res = await adminAuthFetch(`/admin/analytics/monthly-revenue`);
    const { data } = await parseJsonResponse(res);
    return data?.monthlyRevenue || [];
  },

  getRevenueAnalytics: async (period = "7d") => {
    const res = await adminAuthFetch(`/admin/analytics/revenue?period=${period}`);
    if (!res.ok) {
      throw new Error("Không thể tải dữ liệu doanh thu");
    }
    const { data } = await parseJsonResponse(res);
    return data || { period, data: [] };
  },

  getTopProducts: async (limit = 10, period = "30d") => {
    const res = await adminAuthFetch(`/admin/analytics/top-products?limit=${limit}&period=${period}`);
    if (!res.ok) {
      throw new Error("Không thể tải dữ liệu sản phẩm");
    }
    const { data } = await parseJsonResponse(res);
    return data || { period, products: [] };
  },

  getOrderStats: async (period = "30d") => {
    const res = await adminAuthFetch(`/admin/analytics/order-stats?period=${period}`);
    if (!res.ok) {
      throw new Error("Không thể tải thống kê đơn hàng");
    }
    const { data } = await parseJsonResponse(res);
    return data || { period, stats: [] };
  },

  getUsers: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await adminAuthFetch(`/admin/users${qs}`);
    const { data, meta } = await parseJsonResponse(res);
    return { users: data?.users || [], meta };
  },

  updateUser: async (id, userData) => {
    const res = await adminAuthFetch(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  getOrders: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await adminAuthFetch(`/admin/orders${qs}`);
    const { data, meta } = await parseJsonResponse(res);
    return { orders: data?.orders || [], meta };
  },

  getProducts: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await adminAuthFetch(`/admin/products${qs}`);
    const { data, meta } = await parseJsonResponse(res);
    return { products: data?.products || [], meta };
  },

  createProduct: async (productData) => {
    const res = await adminAuthFetch("/admin/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  updateProduct: async (id, productData) => {
    const res = await adminAuthFetch(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  deleteProduct: async (id) => {
    const res = await adminAuthFetch(`/admin/products/${id}`, {
      method: "DELETE",
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  getOrderById: async (id) => {
    const res = await adminAuthFetch(`/admin/orders/${id}`);
    const { data } = await parseJsonResponse(res);
    return data;
  },

  updateOrderStatus: async (id, status, note) => {
    const res = await adminAuthFetch(`/admin/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ Trang_thai: status, Ghi_chu: note }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  getCategories: async () => {
    const res = await adminAuthFetch("/admin/categories");
    const { data } = await parseJsonResponse(res);
    return data?.categories || [];
  },

  getMe: async () => {
    const res = await adminAuthFetch("/admin/me");
    const { data } = await parseJsonResponse(res);
    return data;
  },

  bulkUpdateProductStatus: async (productIds, status) => {
    const res = await adminAuthFetch("/admin/products/bulk-status", {
      method: "PUT",
      body: JSON.stringify({ productIds, Trang_thai: status }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  bulkDeleteProducts: async (productIds) => {
    const res = await adminAuthFetch("/admin/products/bulk", {
      method: "DELETE",
      body: JSON.stringify({ productIds }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  // Voucher Admin API
  getVouchers: async () => {
    const res = await adminAuthFetch(`/admin/vouchers`);
    const { data } = await parseJsonResponse(res);
    return data;
  },
  createVoucher: async (voucherData) => {
    const res = await adminAuthFetch(`/admin/vouchers`, {
      method: 'POST',
      body: JSON.stringify(voucherData),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },
  updateVoucher: async (id, voucherData) => {
     const res = await adminAuthFetch(`/admin/vouchers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(voucherData),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },
  deleteVoucher: async (id) => {
    const res = await adminAuthFetch(`/admin/vouchers/${id}`, {
      method: 'DELETE',
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  // Review Admin API
  getReviews: async () => {
    const res = await adminAuthFetch(`/admin/reviews`);
    const { data } = await parseJsonResponse(res);
    return data;
  },
  updateReviewStatus: async (id, status) => {
    const res = await adminAuthFetch(`/admin/reviews/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    const { data } = await parseJsonResponse(res);
    return data;
  },

  exportOrders: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await adminAuthFetch(`/admin/orders/export${qs}`);
    if (!res.ok) {
      throw new Error("Không thể xuất dữ liệu");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const contentDisposition = res.headers.get("Content-Disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
      : `orders_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  exportProducts: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await adminAuthFetch(`/admin/products/export${qs}`);
    if (!res.ok) {
      throw new Error("Không thể xuất dữ liệu");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const contentDisposition = res.headers.get("Content-Disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
      : `products_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// News API
export const newsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/news`);
    const { data } = await parseJsonResponse(res);
    // backend may return array directly or wrapped payload
    return Array.isArray(data) ? data : data?.articles || [];
  },
};

export {
  getToken,
  setToken,
  removeToken,
  getAdminToken,
  setAdminToken,
  removeAdminToken,
  authFetch,
  adminAuthFetch,
};
