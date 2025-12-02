const API_BASE =
  (import.meta.env.VITE_API_BASE_URL &&
    import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')) ||
  `${window.location.origin.replace(/\/$/, '')}/api`;

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const parseJsonResponse = async (res) => {
  let payload = null;
  try {
    payload = await res.json();
  } catch (error) {
    payload = null;
  }

  const success = res.ok && payload?.success !== false;
  if (!success) {
    const message =
      payload?.error?.message ||
      payload?.error ||
      payload?.message ||
      res.statusText ||
      'Yêu cầu thất bại';
    throw new Error(message);
  }

  const data = payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
  return {
    data,
    meta: payload?.meta,
  };
};

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to set auth token
const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Helper function to remove auth token
const removeToken = () => {
  localStorage.removeItem('token');
};

// Helper function to make authenticated requests
const authFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    // Token expired or invalid
    removeToken();
    // Don't redirect automatically, let components handle it
  }
  
  return response;
};

// Auth API
export const authAPI = {
  register: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const { data: result } = await parseJsonResponse(res);
      if (result?.token) {
        setToken(result.token);
      }
      return result;
    } catch (error) {
      return { error: error.message || 'Không thể đăng ký' };
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Mat_khau: password }),
      });
      const { data } = await parseJsonResponse(res);
      if (data?.token) {
        setToken(data.token);
      }
      return data;
    } catch (error) {
      return { error: error.message || 'Không thể đăng nhập' };
    }
  },

  requestOTP: async (email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email }),
      });
      const { data } = await parseJsonResponse(res);
      return data;
    } catch (error) {
      return { error: error.message || 'Không thể gửi OTP' };
    }
  },

  requestRegisterOTP: async (email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email }),
      });
      const { data } = await parseJsonResponse(res);
      return data;
    } catch (error) {
      return { error: error.message || 'Không thể gửi OTP đăng ký' };
    }
  },

  loginOTP: async (email, otp) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, otp }),
      });
      const { data } = await parseJsonResponse(res);
      if (data?.token) {
        setToken(data.token);
      }
      return data;
    } catch (error) {
      return { error: error.message || 'Không thể đăng nhập bằng OTP' };
    }
  },

  logout: () => {
    removeToken();
  },

  getMe: async () => {
    const res = await authFetch('/auth/me');
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

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/categories`);
    return res.json();
  },
  
  getProducts: async (id, page = 1) => {
    const res = await fetch(`${API_BASE}/categories/${id}/products?page=${page}`);
    return res.json();
  },
};

// Cart API
export const cartAPI = {
  get: async () => {
    const res = await authFetch('/cart');
    return res.json();
  },
  
  add: async (productId, quantity = 1) => {
    const res = await authFetch('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ ID_San_pham: productId, So_luong: quantity }),
    });
    return res.json();
  },
  
  update: async (itemId, quantity) => {
    const res = await authFetch(`/cart/update/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ So_luong: quantity }),
    });
    return res.json();
  },
  
  remove: async (itemId) => {
    const res = await authFetch(`/cart/remove/${itemId}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};

// Orders API
export const ordersAPI = {
  create: async (data) => {
    const res = await authFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },
  
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await authFetch(`/orders?${query}`);
    return res.json();
  },
  
  getById: async (id) => {
    const res = await authFetch(`/orders/${id}`);
    return res.json();
  },
};

// Payments API
export const paymentsAPI = {
  createPayosTransfer: async (orderId) => {
    const res = await authFetch('/payments/payos/transfer', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
    return res.json();
  },
};

// Reviews API
export const reviewsAPI = {
  create: async (data) => {
    const res = await authFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },
  
  getByProduct: async (productId, page = 1) => {
    const res = await fetch(`${API_BASE}/reviews/product/${productId}?page=${page}`);
    return res.json();
  },
};

// Wishlist API
export const wishlistAPI = {
  getAll: async () => {
    const res = await authFetch('/wishlist');
    return res.json();
  },
  
  add: async (productId) => {
    const res = await authFetch('/wishlist/add', {
      method: 'POST',
      body: JSON.stringify({ ID_San_pham: productId }),
    });
    return res.json();
  },
  
  remove: async (itemId) => {
    const res = await authFetch(`/wishlist/remove/${itemId}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};

// Addresses API
export const addressesAPI = {
  getAll: async () => {
    const res = await authFetch('/addresses');
    return res.json();
  },
  
  create: async (data) => {
    const res = await authFetch('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },
  
  update: async (id, data) => {
    const res = await authFetch(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.json();
  },
  
  delete: async (id) => {
    const res = await authFetch(`/addresses/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};

// Vouchers API
export const vouchersAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/vouchers`);
    return res.json();
  },
  
  check: async (code) => {
    const res = await fetch(`${API_BASE}/vouchers/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Ma_voucher: code }),
    });
    return res.json();
  },
};

// Newsletter API
export const newsletterAPI = {
  subscribe: async (email) => {
    const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },
};

export { getToken, setToken, removeToken };

// --- Admin token helpers ---
const ADMIN_TOKEN_KEY = 'admin_token';
const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
const setAdminToken = (token) => localStorage.setItem(ADMIN_TOKEN_KEY, token);
const removeAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);

// admin authenticated fetch
const adminAuthFetch = async (url, options = {}) => {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAdminToken();
  }

  return response;
};

export { getAdminToken, setAdminToken, removeAdminToken, adminAuthFetch };

// Admin API
export const adminAPI = {
  login: async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Ten_dang_nhap: username, Mat_khau: password }),
      });
      const { data } = await parseJsonResponse(res);
      if (data?.token) {
        setAdminToken(data.token);
      }
      return data;
    } catch (error) {
      return { error: error.message || 'Không thể đăng nhập admin' };
    }
  },

  logout: () => {
    removeAdminToken();
  },

  getUsers: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await adminAuthFetch(`/admin/users${qs}`);
    const { data, meta } = await parseJsonResponse(res);
    return { users: data?.users || [], meta };
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
};

// News API
export const newsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/news`);
    const { data } = await parseJsonResponse(res);
    // backend may return array directly or wrapped payload
    return Array.isArray(data) ? data : (data?.articles || []);
  },
};

