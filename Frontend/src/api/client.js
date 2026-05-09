/**
 * Legacy API client — now a thin wrapper around the Axios instance.
 * All new code should import from src/lib/axios.js or use React Query hooks.
 * This file remains for backwards compatibility with existing page components.
 */
import api from '../lib/axios.js';

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
}

// AUTH
export const userRegister = (payload) => api.post('/auth/register', payload);
export const userLogin    = (email, password) => api.post('/auth/login', { email, password });
export const getCurrentUser = () => api.get('/auth/me');
export const adminLogin   = (email, password) => api.post('/auth/admin/login', { email, password });

// PRODUCTS
export const getProducts = (params = {}) => api.get('/products', { params });
export const getProduct  = (id) => api.get(`/products/${id}`);
export const getFeaturedProducts = (limit = 8) => api.get('/products/featured', { params: { limit } });
export const createProduct = (payload) => api.post('/products', payload);
export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const addProductVariant = (productId, payload) => api.post(`/products/${productId}/variants`, payload);
export const updateInventory   = (variantId, quantity) => api.put(`/products/variants/${variantId}/inventory`, { quantity });
export const uploadProductImages = (productId, files) => {
  const form = new FormData();
  files.forEach((f) => form.append('images', f));
  return api.post(`/products/${productId}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// BRANDS
export const getBrands    = () => api.get('/brands');
export const createBrand  = (payload) => api.post('/brands', payload);
export const updateBrand  = (id, payload) => api.put(`/brands/${id}`, payload);
export const deleteBrand  = (id) => api.delete(`/brands/${id}`);

// BANNERS
export const getBanners   = (position) => api.get('/banners', { params: position ? { position } : {} });
export const createBanner = (payload) => api.post('/banners', payload);
export const updateBanner = (id, payload) => api.put(`/banners/${id}`, payload);
export const deleteBanner = (id) => api.delete(`/banners/${id}`);

// ADMIN
export const getDashboardStats   = () => api.get('/admin/dashboard');
export const createAdminAccount  = (payload) => api.post('/admin/accounts', payload);
export const getAdminProfile     = () => api.get('/admin/profile');
export const getAdminUsers       = (params = {}) => api.get('/admin/users', { params });

// ANALYTICS
export const getAnalyticsOverview  = () => api.get('/analytics/overview');
export const getSalesChart         = (period) => api.get('/analytics/sales', { params: { period } });
export const getTopProducts        = (limit) => api.get('/analytics/top-products', { params: { limit } });
export const getCategoryBreakdown  = () => api.get('/analytics/category-breakdown');
export const getInventoryHealth    = () => api.get('/analytics/inventory-health');

// ORDERS
export const createOrder      = (payload) => api.post('/orders', payload);
export const getMyOrders      = (params = {}) => api.get('/orders/my', { params });
export const getAllOrders      = (params = {}) => api.get('/orders', { params });
export const getOrderById     = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const cancelOrder      = (id) => api.patch(`/orders/${id}/cancel`);

// INVENTORY
export const getStockAlerts    = () => api.get('/inventory/alerts');
export const resolveStockAlert = (alertId) => api.patch(`/inventory/alerts/${alertId}/resolve`);
export const getInventoryReport = () => api.get('/inventory/report');
export const updateStock       = (variantId, quantity) => api.patch(`/inventory/stock/${variantId}`, { quantity });

// WISHLIST
export const getWishlist       = () => api.get('/wishlist');
export const toggleWishlist    = (productId) => api.post('/wishlist/toggle', { product_id: productId });
export const removeWishlistItem = (productId) => api.delete(`/wishlist/${productId}`);

// PROFILE
export const getProfile     = () => api.get('/profile');
export const saveProfile    = (payload) => api.put('/profile', payload);
export const changePassword = (payload) => api.post('/profile/change-password', payload);

// SHIPPING ADDRESSES
export const getMyAddresses   = () => api.get('/shipping-addresses');
export const createAddress    = (payload) => api.post('/shipping-addresses', payload);
export const updateAddress    = (id, payload) => api.put(`/shipping-addresses/${id}`, payload);
export const deleteAddress    = (id) => api.delete(`/shipping-addresses/${id}`);
export const setDefaultAddress = (id) => api.patch(`/shipping-addresses/${id}/default`);

// REVIEWS
export const getProductReviews  = (productId) => api.get(`/reviews/product/${productId}`);
export const createProductReview = (productId, payload) => api.post(`/reviews/product/${productId}`, payload);
export const markReviewHelpful  = (reviewId) => api.post(`/reviews/${reviewId}/helpful`);

// COUPONS
export const getActiveCoupons = () => api.get('/coupons/active');
export const validateCoupon   = (code, order_amount) => api.post('/coupons/validate', { code, order_amount });
export const createCoupon     = (payload) => api.post('/coupons', payload);

// NOTIFICATIONS
export const getNotifications  = (params = {}) => api.get('/notifications', { params });
export const getUnreadCount    = () => api.get('/notifications/unread-count');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all');
