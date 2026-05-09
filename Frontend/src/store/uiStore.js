import { create } from 'zustand';

export const useUiStore = create((set, get) => ({
  // Search
  searchQuery:  '',
  showSearch:   false,
  setSearch:    (q)  => set({ searchQuery: q }),
  toggleSearch: ()   => set({ showSearch: !get().showSearch }),
  closeSearch:  ()   => set({ showSearch: false }),

  // Quick view
  quickViewProduct: null,
  openQuickView:    (product) => set({ quickViewProduct: product }),
  closeQuickView:   ()        => set({ quickViewProduct: null }),

  // Filters (Collections page)
  filters: {
    category: '',
    brand:    '',
    gender:   '',
    minPrice: '',
    maxPrice: '',
    sizes:    [],
    colors:   [],
    sort:     'newest',
    inStock:  false,
  },
  setFilter:   (key, val) => set((s) => ({ filters: { ...s.filters, [key]: val } })),
  resetFilters: ()        => set({ filters: { category: '', brand: '', gender: '', minPrice: '', maxPrice: '', sizes: [], colors: [], sort: 'newest', inStock: false } }),

  // Mobile sidebar
  mobileSidebarOpen: false,
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  closeMobileSidebar:  () => set({ mobileSidebarOpen: false }),
}));
