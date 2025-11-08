// API utility functions
const API_BASE = 'http://localhost:3001/api';

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
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok && result.token) {
      setToken(result.token);
    }
    return result;
  },
  
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Email: email, Mat_khau: password }),
    });
    const result = await res.json();
    if (res.ok && result.token) {
      setToken(result.token);
    }
    return result;
  },

  requestOTP: async (email) => {
    const res = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Email: email }),
    });
    return res.json();
  },

  loginOTP: async (email, otp) => {
    const res = await fetch(`${API_BASE}/auth/login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Email: email, otp }),
    });
    const result = await res.json();
    if (res.ok && result.token) {
      setToken(result.token);
    }
    return result;
  },
  
  logout: () => {
    removeToken();
  },
  
  getMe: async () => {
    const res = await authFetch('/auth/me');
    return res.json();
  },
};

// Products API
export const productsAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/products?${query}`);
    return res.json();
  },
  
  getById: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`);
    return res.json();
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

