import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/axios.js';
import { keys, queryClient } from '../lib/queryClient.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from 'react-toastify';

export function useWishlist() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: keys.wishlist(),
    queryFn:  () => api.get('/wishlist'),
    enabled:  !!token,
    select:   (d) => d?.items ?? [],
  });
}

export function useToggleWishlist() {
  return useMutation({
    mutationFn: (productId) => api.post('/wishlist/toggle', { product_id: productId }),
    onSuccess:  (data) => {
      queryClient.invalidateQueries({ queryKey: keys.wishlist() });
      toast.success(data?.action === 'added' ? 'Added to wishlist' : 'Removed from wishlist');
    },
  });
}

export function useRemoveWishlistItem() {
  return useMutation({
    mutationFn: (productId) => api.delete(`/wishlist/${productId}`),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: keys.wishlist() });
      toast.success('Removed from wishlist');
    },
  });
}

export function useIsWishlisted(productId) {
  const { data: items = [] } = useWishlist();
  return items.some((item) => item.product_id === productId);
}
