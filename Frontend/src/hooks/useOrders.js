import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/axios.js';
import { keys, queryClient } from '../lib/queryClient.js';
import { useAuthStore } from '../store/authStore.js';

export function useMyOrders(params = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: keys.orders(params),
    queryFn:  () => api.get('/orders/my', { params }),
    enabled:  !!token,
  });
}

export function useOrder(id) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: keys.order(id),
    queryFn:  () => api.get(`/orders/${id}`),
    enabled:  !!token && !!id,
  });
}

export function useAllOrders(params = {}) {
  const adminToken = useAuthStore((s) => s.adminToken);
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn:  () => api.get('/orders', { params }),
    enabled:  !!adminToken,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (payload) => api.post('/orders', payload),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: keys.cart() });
    },
  });
}

export function useUpdateOrderStatus() {
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess:  (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: keys.order(id) });
    },
  });
}

export function useCancelOrder() {
  return useMutation({
    mutationFn: (id) => api.patch(`/orders/${id}/cancel`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}
