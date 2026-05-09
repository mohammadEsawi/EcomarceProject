import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 2,   // 2 minutes
      gcTime:             1000 * 60 * 10,  // 10 minutes
      retry:              1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (err) => {
        console.error('[mutation error]', err);
      },
    },
  },
});

// Query key factories — centralised so hooks and invalidations stay in sync
export const keys = {
  products:     (params) => ['products', params ?? {}],
  product:      (id)     => ['product',  id],
  featured:     ()       => ['featured'],
  categories:   ()       => ['categories'],
  brands:       ()       => ['brands'],
  banners:      (pos)    => ['banners',  pos ?? 'all'],
  cart:         ()       => ['cart'],
  wishlist:     ()       => ['wishlist'],
  orders:       (params) => ['orders',   params ?? {}],
  order:        (id)     => ['order',    id],
  profile:      ()       => ['profile'],
  addresses:    ()       => ['addresses'],
  notifications:()       => ['notifications'],
  unreadCount:  ()       => ['notifications', 'unread'],
  adminStats:   ()       => ['admin', 'stats'],
  analytics:    (key)    => ['analytics', key],
  users:        (params) => ['admin', 'users', params ?? {}],
  inventory:    ()       => ['inventory'],
  stockAlerts:  ()       => ['stock-alerts'],
  reviews:      (id)     => ['reviews', id],
};
