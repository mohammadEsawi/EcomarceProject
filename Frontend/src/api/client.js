const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Core fetch helper
async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;
  if (!response.ok) throw new Error(data?.message || `Request failed: ${response.status}`);
  return data?.data ?? data;
}

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getApiBaseUrl() { return API_BASE_URL; }

// AUTH
export const userRegister = (payload) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
export const userLogin = (email, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getCurrentUser = (token) => apiFetch('/auth/me', { headers: authHeader(token) });
export const adminLogin = (email, password) => apiFetch('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });

// PRODUCTS
export const getProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/products${qs ? `?${qs}` : ''}`);
};
export const getProduct = (id) => apiFetch(`/products/${id}`);
export const getFeaturedProducts = (limit = 8) => apiFetch(`/products/featured?limit=${limit}`);
export const createProduct = (payload, token) => apiFetch('/products', { method: 'POST', headers: authHeader(token), body: JSON.stringify(payload) });
export const updateProduct = (id, payload, token) => apiFetch(`/products/${id}`, { method: 'PUT', headers: authHeader(token), body: JSON.stringify(payload) });
export const deleteProduct = (id, token) => apiFetch(`/products/${id}`, { method: 'DELETE', headers: authHeader(token) });

// PRODUCT VARIANTS & INVENTORY
export const addProductVariant = (productId, payload, token) => apiFetch(`/products/${productId}/variants`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(payload) });
export const updateInventory = (variantId, quantity, token) => apiFetch(`/products/variants/${variantId}/inventory`, { method: 'PUT', headers: authHeader(token), body: JSON.stringify({ quantity }) });

// IMAGE UPLOAD - use FormData, no Content-Type header
export const uploadProductImages = async (productId, files, token) => {
  const formData = new FormData();
  files.forEach(f => formData.append('images', f));
  const response = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
    method: 'POST',
    headers: authHeader(token),
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Upload failed');
  return data;
};

// ADMIN
export const getDashboardStats = (token) => apiFetch('/admin/dashboard', { headers: authHeader(token) });
export const createAdminAccount = (payload, token) => apiFetch('/admin/accounts', { method: 'POST', headers: authHeader(token), body: JSON.stringify(payload) });
export const getAdminProfile = (token) => apiFetch('/admin/profile', { headers: authHeader(token) });
export const getAdminUsers = (token, params = {}) => { const qs = new URLSearchParams(params).toString(); return apiFetch(`/admin/users${qs ? `?${qs}` : ''}`, { headers: authHeader(token) }); };

// ORDERS
export const createOrder = (payload, token) => apiFetch('/orders', { method: 'POST', headers: authHeader(token), body: JSON.stringify(payload) });
export const getMyOrders = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/orders/my${qs ? `?${qs}` : ''}`, { headers: authHeader(token) });
};
export const getAllOrders = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/orders${qs ? `?${qs}` : ''}`, { headers: authHeader(token) });
};
export const getOrderById = (id, token) => apiFetch(`/orders/${id}`, { headers: authHeader(token) });
export const updateOrderStatus = (id, status, token) => apiFetch(`/orders/${id}/status`, { method: 'PATCH', headers: authHeader(token), body: JSON.stringify({ status }) });
export const cancelOrder = (id, token) => apiFetch(`/orders/${id}/cancel`, { method: 'PATCH', headers: authHeader(token) });

// INVENTORY (admin)
export const getStockAlerts = (token) => apiFetch('/inventory/alerts', { headers: authHeader(token) });
export const resolveStockAlert = (alertId, token) => apiFetch(`/inventory/alerts/${alertId}/resolve`, { method: 'PATCH', headers: authHeader(token) });
export const getInventoryReport = (token) => apiFetch('/inventory/report', { headers: authHeader(token) });
export const updateStock = (variantId, quantity, token) => apiFetch(`/inventory/stock/${variantId}`, { method: 'PATCH', headers: authHeader(token), body: JSON.stringify({ quantity }) });

// WISHLIST
export const getWishlist = (token) => apiFetch('/wishlist', { headers: authHeader(token) });
export const toggleWishlist = (productId, token) => apiFetch('/wishlist/toggle', { method: 'POST', headers: authHeader(token), body: JSON.stringify({ product_id: productId }) });
export const removeWishlistItem = (productId, token) => apiFetch(`/wishlist/${productId}`, { method: 'DELETE', headers: authHeader(token) });

// PROFILE
export const getProfile = (token) => apiFetch('/profile', { headers: authHeader(token) });
export const saveProfile = (payload, token) => apiFetch('/profile', { method: 'PUT', headers: authHeader(token), body: JSON.stringify(payload) });
export const changePassword = (payload, token) => apiFetch('/profile/change-password', { method: 'POST', headers: authHeader(token), body: JSON.stringify(payload) });
export const addAddress = (address, token) => apiFetch('/profile/addresses', { method: 'POST', headers: authHeader(token), body: JSON.stringify({ address }) });

// REVIEWS
export const getProductReviews = (productId) => apiFetch(`/reviews/product/${productId}`);
export const createProductReview = (productId, payload, token) => apiFetch(`/reviews/product/${productId}`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(payload) });
export const markReviewHelpful = (reviewId, token) => apiFetch(`/reviews/${reviewId}/helpful`, { method: 'POST', headers: authHeader(token) });

// COUPONS
export const getActiveCoupons = () => apiFetch('/coupons/active');
export const validateCoupon = (code, order_amount) => apiFetch('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, order_amount }) });
export const createCoupon = (payload, token) => apiFetch('/coupons', { method: 'POST', headers: authHeader(token), body: JSON.stringify(payload) });
