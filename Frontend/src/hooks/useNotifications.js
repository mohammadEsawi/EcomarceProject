import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/axios.js';
import { keys, queryClient } from '../lib/queryClient.js';
import { useAuthStore } from '../store/authStore.js';

export function useNotifications(params = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: keys.notifications(),
    queryFn:  () => api.get('/notifications', { params }),
    enabled:  !!token,
  });
}

export function useUnreadCount() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: keys.unreadCount(),
    queryFn:  () => api.get('/notifications/unread-count'),
    enabled:  !!token,
    refetchInterval: 1000 * 60,
    select: (d) => d?.count ?? 0,
  });
}

export function useMarkRead() {
  return useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: keys.notifications() });
      queryClient.invalidateQueries({ queryKey: keys.unreadCount() });
    },
  });
}

export function useMarkAllRead() {
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: keys.notifications() });
      queryClient.invalidateQueries({ queryKey: keys.unreadCount() });
    },
  });
}
