import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShopContext } from "../context/ShopContextProvider";
import { getProducts } from "../api/client";
import ShowSearch from "../components/ShowSearch";
import Footer from "../components/Footer";
import Item from "../components/Item";
import { FiPackage, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

// ─── Static Mappings ──────────────────────────────────────────────────────────
const CATEGORY_IDS  = { Men: 1, Women: 2, Kids: 3, Accessories: 4 };
const SIZE_IDS      = { XS: 1, S: 2, M: 3, L: 4, XL: 5 };
const COLOR_IDS     = { Black: 1, White: 2, Navy: 3, Red: 4, Green: 5, Beige: 6 };
const COLOR_HEX     = {
  Black: "#111827", White: "#F9FAFB", Navy: "#1E3A5F",
  Red: "#EF4444",   Green: "#16A34A", Beige: "#D4C5A9",
};
const SORT_OPTIONS  = [
  { value: "",          label: "Relevant"         },
  { value: "newest",    label: "Newest"           },
  { value: "price_asc", label: "Price: Low → High"},
  { value: "price_desc",label: "Price: High → Low"},
  { value: "popular",   label: "Most Popular"     },
];

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-200 aspect-square" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  );
}

// ─── Active Filter Tag ─────────────────────────────────────────────────────────
function FilterTag({ label, onRemove }) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.85, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.75, y: -4 }}
      transition={{ duration: 0.18 }}
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full border border-secondary/20"
    >
      {label}
      <button
        onClick={onRemove}
        className="hover:text-red-500 transition-colors ml-0.5"
        aria-label={`Remove ${label} filter`}
      >
        <FiX className="w-3 h-3" />
      </button>
    </motion.span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-20 gap-5 text-center"
    >
      <FiPackage className="w-16 h-16 text-gray-300" />
      <h3 className="text-xl font-semibold text-gray-600">No products found</h3>
      <p className="text-gray-400 text-sm max-w-xs">
        Try adjusting your filters or search term to find what you're looking for.
      </p>
    </motion.div>
  );
}

// ─── Checkbox Row ─────────────────────────────────────────────────────────────
function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer">
      <input
        type="checkbox"
        className="w-4 h-4 accent-secondary rounded-sm"
        checked={checked}
        onChange={onChange}
      />
      <span className="font-medium text-sm">{label}</span>
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Collections() {
  const { search, setSearch } = useContext(ShopContext);

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSizes,      setSelectedSizes]      = useState([]);
  const [selectedColors,     setSelectedColors]     = useState([]);
  const [minPrice,           setMinPrice]           = useState(0);
  const [maxPrice,           setMaxPrice]           = useState(2000);
  const [inStockOnly,        setInStockOnly]        = useState(false);
  const [sortType,           setSortType]           = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 12;

  // Results
  const [products,   setProducts]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);

  // Debounce search
  const searchDebounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 380);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  // ── Build params and fetch ─────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page:  currentPage,
        limit: LIMIT,
      };
      if (debouncedSearch.trim())      params.search    = debouncedSearch.trim();
      if (selectedCategories.length)   params.category_id = CATEGORY_IDS[selectedCategories[0]];
      if (selectedSizes.length)        params.size_id   = SIZE_IDS[selectedSizes[0]];
      if (selectedColors.length)       params.color_id  = COLOR_IDS[selectedColors[0]];
      if (minPrice > 0)                params.min_price = minPrice;
      if (maxPrice < 2000)             params.max_price = maxPrice;
      if (inStockOnly)                 params.in_stock  = true;
      if (sortType)                    params.sort      = sortType;

      const data = await getProducts(params);

      // Support both { products, pagination } and plain array responses
      if (Array.isArray(data)) {
        setProducts(data);
        setPagination({
          total: data.length,
          page: 1,
          limit: LIMIT,
          total_pages: Math.ceil(data.length / LIMIT),
        });
      } else {
        setProducts(data.products ?? []);
        setPagination(data.pagination ?? null);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedCategories, selectedSizes, selectedColors, minPrice, maxPrice, inStockOnly, sortType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filters change (not page itself)
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategories, selectedSizes, selectedColors, minPrice, maxPrice, inStockOnly, sortType]);

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const toggle = (value, setter) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
    setCurrentPage(1);
  };

  // ── Clear all filters ──────────────────────────────────────────────────────
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setMinPrice(0);
    setMaxPrice(2000);
    setInStockOnly(false);
    setSortType("");
    setSearch("");
    setCurrentPage(1);
  };

  // ── Active filter tags ─────────────────────────────────────────────────────
  const activeTags = [
    ...selectedCategories.map((c) => ({ key: `cat-${c}`,   label: c,            remove: () => toggle(c, setSelectedCategories) })),
    ...selectedSizes.map((s) =>      ({ key: `sz-${s}`,    label: `Size: ${s}`, remove: () => toggle(s, setSelectedSizes) })),
    ...selectedColors.map((c) =>     ({ key: `col-${c}`,   label: c,            remove: () => toggle(c, setSelectedColors) })),
    ...(inStockOnly ? [{ key: "stock", label: "In Stock", remove: () => setInStockOnly(false) }] : []),
    ...(minPrice > 0 ? [{ key: "min", label: `Min $${minPrice}`, remove: () => setMinPrice(0) }] : []),
    ...(maxPrice < 2000 ? [{ key: "max", label: `Max $${maxPrice}`, remove: () => setMaxPrice(2000) }] : []),
    ...(debouncedSearch.trim() ? [{ key: "q", label: `"${debouncedSearch.trim()}"`, remove: () => { setSearch(""); setDebouncedSearch(""); } }] : []),
  ];

  const totalPages = pagination?.total_pages ?? 1;

  // ── Pagination pages array ─────────────────────────────────────────────────
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2
  );

  return (
    <div className="max-padd-container !px-0">
      <div className="flex flex-col sm:flex-row gap-8 mb-8">

        {/* ── Filter Sidebar ── */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="min-w-72 bg-primary p-6 pt-8 lg:pl-12 rounded-r-xl shadow-lg sticky top-0 h-fit"
        >
          {/* Search */}
          <div className="mb-6 mt-10">
            <ShowSearch />
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h5 className="h5 mb-4 text-black">Categories</h5>
            <div className="space-y-3">
              {Object.keys(CATEGORY_IDS).map((cat) => (
                <CheckboxRow
                  key={cat}
                  label={cat}
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggle(cat, setSelectedCategories)}
                />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-8">
            <h5 className="h5 mb-4 text-black">Sizes</h5>
            <div className="flex flex-wrap gap-2">
              {Object.keys(SIZE_IDS).map((sz) => (
                <motion.button
                  key={sz}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggle(sz, setSelectedSizes)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    selectedSizes.includes(sz)
                      ? "bg-secondary text-white border-secondary shadow-sm"
                      : "bg-white text-gray-700 border-gray-300 hover:border-secondary hover:text-secondary"
                  }`}
                >
                  {sz}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="mb-8">
            <h5 className="h5 mb-4 text-black">Colors</h5>
            <div className="flex flex-wrap gap-2.5">
              {Object.keys(COLOR_IDS).map((col) => (
                <motion.button
                  key={col}
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.08 }}
                  onClick={() => toggle(col, setSelectedColors)}
                  title={col}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColors.includes(col)
                      ? "ring-2 ring-offset-2 ring-secondary shadow-md"
                      : "ring-1 ring-gray-300 hover:ring-gray-500"
                  }`}
                  style={{ backgroundColor: COLOR_HEX[col] }}
                />
              ))}
            </div>
            {selectedColors.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                {selectedColors.join(", ")}
              </p>
            )}
          </div>

          {/* Price Range */}
          <div className="mb-8">
            <h5 className="h5 mb-4 text-black">Price Range</h5>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Min</label>
                  <input
                    type="number"
                    min={0}
                    max={maxPrice}
                    value={minPrice}
                    onChange={(e) => { setMinPrice(Number(e.target.value)); setCurrentPage(1); }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Max</label>
                  <input
                    type="number"
                    min={minPrice}
                    max={9999}
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(Number(e.target.value)); setCurrentPage(1); }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={2000}
                value={maxPrice}
                onChange={(e) => { setMaxPrice(Number(e.target.value)); setCurrentPage(1); }}
                className="w-full accent-secondary"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>${minPrice}</span>
                <span>${maxPrice}</span>
              </div>
            </div>
          </div>

          {/* In Stock Toggle */}
          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => { setInStockOnly((v) => !v); setCurrentPage(1); }}
                className={`relative w-10 h-6 rounded-full transition-colors ${inStockOnly ? "bg-secondary" : "bg-gray-300"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${inStockOnly ? "translate-x-5" : "translate-x-1"}`}
                />
              </div>
              <span className="font-medium text-sm text-gray-700">In Stock Only</span>
            </label>
          </div>

          {/* Sort By */}
          <div className="mb-8">
            <h5 className="h5 mb-4 text-black">Sort By</h5>
            <select
              value={sortType}
              onChange={(e) => { setSortType(e.target.value); setCurrentPage(1); }}
              className="w-full p-3 rounded-lg bg-white border-2 border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary text-sm outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="w-full py-3 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Clear All Filters
          </button>
        </motion.aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0">

          {/* Active Filter Tags */}
          <AnimatePresence>
            {activeTags.length > 0 && (
              <motion.div
                key="filter-tags"
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 px-4 pt-4 pb-2 overflow-hidden"
              >
                <AnimatePresence>
                  {activeTags.map((tag) => (
                    <FilterTag key={tag.key} label={tag.label} onRemove={tag.remove} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          {!loading && pagination && (
            <p className="px-4 pt-3 pb-1 text-xs text-gray-400 font-medium">
              {pagination.total ?? products.length} products found
            </p>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 mt-2">
            <AnimatePresence mode="wait">
              {loading ? (
                Array.from({ length: LIMIT }).map((_, i) => (
                  <SkeletonCard key={`sk-${i}`} />
                ))
              ) : products.length > 0 ? (
                products.map((product, idx) => (
                  <motion.div
                    key={product.id ?? product._id ?? idx}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                  >
                    <Item product={product} />
                  </motion.div>
                ))
              ) : (
                <EmptyState key="empty" />
              )}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center mt-12 gap-2 flex-wrap px-4"
            >
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 rounded-lg border-2 border-secondary text-secondary hover:bg-secondary hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-secondary transition-all"
                aria-label="Previous page"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((page, i) => {
                const prevPage = pageNumbers[i - 1];
                const showEllipsis = prevPage && page - prevPage > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && (
                      <span className="px-1 text-gray-400 select-none">…</span>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 text-sm font-semibold border-2 rounded-lg transition-all ${
                        page === currentPage
                          ? "bg-secondary border-secondary text-white shadow-sm"
                          : "text-secondary border-secondary hover:bg-secondary/10"
                      }`}
                    >
                      {page}
                    </motion.button>
                  </React.Fragment>
                );
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-lg border-2 border-secondary text-secondary hover:bg-secondary hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-secondary transition-all"
                aria-label="Next page"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
