import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaFilter, FaSearch, FaTimes } from "react-icons/fa";
import { FiPackage } from "react-icons/fi";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import FilterPanel from "../components/FilterPanel";
import { SkeletonGrid } from "../components/ui/SkeletonCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { useProducts, useProduct } from "../hooks/useProducts";
import { useUiStore } from "../store/uiStore";
import { useCartStore } from "../store/cartStore";
import { imgUrl } from "../lib/imageUrl";

// ── Inline Quick-View ─────────────────────────────────────────────────────────
function QuickViewModal({ product: stub, onClose }) {
  const { data: product, isLoading } = useProduct(stub?.id);
  const addItem = useCartStore((s) => s.addItem);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const variants = product?.variants ?? [];
  const sizes    = [...new Set(variants.map((v) => v.size_name).filter(Boolean))];
  const price    = product ? Number(product.discount_price ?? product.price) : 0;

  if (!stub) return null;

  return (
    <Modal open={!!stub} onClose={onClose} title="Quick View" size="lg">
      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
      ) : product ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-xl overflow-hidden bg-gray-50 aspect-square">
            <img
              src={imgUrl(product.main_image_url || product.images?.[0])}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-4">
            {product.brand_name && (
              <p className="text-xs text-gray-400 uppercase tracking-widest">{product.brand_name}</p>
            )}
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-lg font-bold text-gray-900">${price.toFixed(2)}</p>
            {sizes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const v        = variants.find((vv) => vv.size_name === s);
                    const inStock  = (v?.stock ?? 0) > 0;
                    return (
                      <button
                        key={s}
                        disabled={!inStock}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                          selectedVariant?.size_name === s
                            ? "bg-gray-900 text-white border-gray-900"
                            : inStock
                            ? "border-gray-200 hover:border-gray-400 text-gray-700"
                            : "border-gray-100 text-gray-300 cursor-not-allowed line-through"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <button
              disabled={sizes.length > 0 && !selectedVariant}
              onClick={() => {
                addItem({
                  productId: product.id,
                  variantId: selectedVariant?.id ?? product.id,
                  name:      product.name,
                  price,
                  image:     imgUrl(product.main_image_url),
                  color:     selectedVariant?.color_name,
                  size:      selectedVariant?.size_name,
                  stock:     selectedVariant?.stock,
                });
                onClose();
              }}
              className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {sizes.length > 0 && !selectedVariant ? "Select a size" : "Add to Cart"}
            </button>
            <a href={`/product/${product.id}`} className="block text-center text-xs text-gray-400 hover:text-gray-700 underline">
              View full details →
            </a>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────
function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded-full">
      {label}
      <button onClick={onRemove}><FaTimes className="h-2.5 w-2.5" /></button>
    </span>
  );
}

const SORT_LABELS = {
  newest:     "Newest",
  price_asc:  "Price ↑",
  price_desc: "Price ↓",
  popular:    "Popular",
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Collections() {
  const { filters, setFilter, resetFilters } = useUiStore();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [search, setSearch] = useState("");

  const apiParams = useMemo(() => {
    const p = { sort: filters.sort, limit: 48 };
    if (filters.category)     p.category_id = filters.category;
    if (filters.minPrice)     p.min_price   = filters.minPrice;
    if (filters.maxPrice)     p.max_price   = filters.maxPrice;
    if (filters.sizes.length) p.sizes       = filters.sizes.join(",");
    if (filters.inStock)      p.in_stock    = true;
    if (search.trim())        p.search      = search.trim();
    return p;
  }, [filters, search]);

  const { data, isLoading, isError, refetch } = useProducts(apiParams);

  const products   = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data.products ?? []);
  }, [data]);

  const total      = data?.pagination?.total ?? products.length;

  const activeCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    ...filters.sizes,
    filters.inStock ? "1" : "",
  ].filter(Boolean).length;

  return (
    <>
      <div className="pt-20 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Collections</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {isLoading ? "Loading…" : `${total} products`}
              </p>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FaTimes className="h-3 w-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="max-w-7xl mx-auto px-4 pb-4 flex flex-wrap gap-2 items-center">
              {filters.minPrice && <Chip label={`≥ $${filters.minPrice}`} onRemove={() => setFilter("minPrice", "")} />}
              {filters.maxPrice && <Chip label={`≤ $${filters.maxPrice}`} onRemove={() => setFilter("maxPrice", "")} />}
              {filters.inStock  && <Chip label="In Stock Only" onRemove={() => setFilter("inStock", false)} />}
              {filters.sizes.map((s) => <Chip key={s} label={`Size: ${s}`} onRemove={() => setFilter("sizes", filters.sizes.filter((x) => x !== s))} />)}
              <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-700 underline ml-1">
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Desktop sidebar filter */}
            <aside className="hidden lg:block w-60 shrink-0">
              <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <FilterPanel />
              </div>
            </aside>

            {/* Product grid */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 transition"
                >
                  <FaFilter className="h-3.5 w-3.5" />
                  Filters
                  {activeCount > 0 && (
                    <span className="ml-1 bg-gray-900 text-white text-xs rounded-full px-1.5 py-0.5">{activeCount}</span>
                  )}
                </button>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-gray-400 hidden sm:inline">Sort by:</span>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilter("sort", e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:border-gray-900 outline-none cursor-pointer"
                  >
                    {Object.entries(SORT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isLoading ? (
                <SkeletonGrid count={12} />
              ) : isError ? (
                <EmptyState
                  icon={FiPackage}
                  title="Failed to load products"
                  description="Check your connection and try again."
                  action={refetch}
                  actionLabel="Retry"
                />
              ) : products.length === 0 ? (
                <EmptyState
                  icon={FiPackage}
                  title="No products found"
                  description="Try adjusting your filters or search query."
                  action={resetFilters}
                  actionLabel="Clear filters"
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  <AnimatePresence>
                    {products.map((p) => (
                      <ProductCard key={p.id} product={p} onQuickView={setQuickViewProduct} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setMobileFilterOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-white overflow-y-auto shadow-2xl"
            >
              <div className="p-5">
                <FilterPanel onClose={() => setMobileFilterOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick view modal */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />

      <Footer />
    </>
  );
}
