import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/axios.js';
import { keys, queryClient } from '../lib/queryClient.js';

// ── Queries ───────────────────────────────────────────────────────────────────
export function useProducts(params = {}) {
  return useQuery({
    queryKey: keys.products(params),
    queryFn:  () => api.get('/products', { params }),
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: keys.product(id),
    queryFn:  () => api.get(`/products/${id}`),
    enabled:  !!id,
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: [...keys.featured(), limit],
    queryFn:  () => api.get('/products/featured', { params: { limit } }),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: keys.categories(),
    queryFn:  () => api.get('/products/categories').catch(() => []),
    staleTime: 1000 * 60 * 10,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: keys.brands(),
    queryFn:  () => api.get('/brands'),
    staleTime: 1000 * 60 * 10,
  });
}

export function useBanners(position) {
  return useQuery({
    queryKey: keys.banners(position),
    queryFn:  () => api.get('/banners', { params: position ? { position } : {} }),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProductReviews(productId) {
  return useQuery({
    queryKey: keys.reviews(productId),
    queryFn:  () => api.get(`/reviews/product/${productId}`),
    enabled:  !!productId,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function useCreateProduct() {
  return useMutation({
    mutationFn: (payload) => api.post('/products', payload),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/products/${id}`, data),
    onSuccess:  (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: keys.product(id) });
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useCreateReview() {
  return useMutation({
    mutationFn: ({ productId, ...data }) => api.post(`/reviews/product/${productId}`, data),
    onSuccess:  (_, { productId }) => queryClient.invalidateQueries({ queryKey: keys.reviews(productId) }),
  });
}
