import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/axios.js';
import { keys, queryClient } from '../lib/queryClient.js';
import { useAuthStore } from '../store/authStore.js';

function adminEnabled() {
  return !!useAuthStore.getState().adminToken;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: keys.adminStats(),
    queryFn:  () => api.get('/admin/dashboard'),
    enabled:  adminEnabled(),
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: keys.analytics('overview'),
    queryFn:  () => api.get('/analytics/overview'),
    enabled:  adminEnabled(),
  });
}

export function useSalesChart(period = 30) {
  return useQuery({
    queryKey: keys.analytics(`sales-${period}`),
    queryFn:  () => api.get('/analytics/sales', { params: { period } }),
    enabled:  adminEnabled(),
  });
}

export function useTopProducts(limit = 10) {
  return useQuery({
    queryKey: keys.analytics(`top-${limit}`),
    queryFn:  () => api.get('/analytics/top-products', { params: { limit } }),
    enabled:  adminEnabled(),
  });
}

export function useCategoryBreakdown() {
  return useQuery({
    queryKey: keys.analytics('categories'),
    queryFn:  () => api.get('/analytics/category-breakdown'),
    enabled:  adminEnabled(),
  });
}

export function useInventoryHealth() {
  return useQuery({
    queryKey: keys.analytics('inventory-health'),
    queryFn:  () => api.get('/analytics/inventory-health'),
    enabled:  adminEnabled(),
    staleTime: 1000 * 60,
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────
export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: keys.users(params),
    queryFn:  () => api.get('/admin/users', { params }),
    enabled:  adminEnabled(),
  });
}

// ── Brands ────────────────────────────────────────────────────────────────────
export function useAdminBrands() {
  return useQuery({
    queryKey: keys.brands(),
    queryFn:  () => api.get('/brands'),
    enabled:  adminEnabled(),
  });
}

export function useCreateBrand() {
  return useMutation({
    mutationFn: (data) => api.post('/brands', data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: keys.brands() }),
  });
}

export function useUpdateBrand() {
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/brands/${id}`, data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: keys.brands() }),
  });
}

export function useDeleteBrand() {
  return useMutation({
    mutationFn: (id) => api.delete(`/brands/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: keys.brands() }),
  });
}

// ── Banners ───────────────────────────────────────────────────────────────────
export function useAdminBanners() {
  return useQuery({
    queryKey: [...keys.banners('all'), 'admin'],
    queryFn:  () => api.get('/banners/all'),
    enabled:  adminEnabled(),
  });
}

export function useCreateBanner() {
  return useMutation({
    mutationFn: (data) => api.post('/banners', data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
  });
}

export function useUpdateBanner() {
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/banners/${id}`, data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
  });
}

export function useDeleteBanner() {
  return useMutation({
    mutationFn: (id) => api.delete(`/banners/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
  });
}

// ── Stock alerts ──────────────────────────────────────────────────────────────
export function useStockAlerts() {
  return useQuery({
    queryKey: keys.stockAlerts(),
    queryFn:  () => api.get('/inventory/alerts'),
    enabled:  adminEnabled(),
    refetchInterval: 1000 * 60 * 2,
  });
}

export function useResolveStockAlert() {
  return useMutation({
    mutationFn: (alertId) => api.patch(`/inventory/alerts/${alertId}/resolve`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: keys.stockAlerts() }),
  });
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function useSendNotification() {
  return useMutation({
    mutationFn: (data) => api.post('/notifications/send', data),
  });
}
