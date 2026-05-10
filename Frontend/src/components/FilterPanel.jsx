import React from "react";
import { FaTimes } from "react-icons/fa";
import { useUiStore } from "../store/uiStore.js";

const SORT_OPTIONS = [
  { value: "newest",    label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc",label: "Price: High → Low" },
  { value: "popular",   label: "Most Popular" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function FilterPanel({ categories = [], onClose }) {
  const { filters, setFilter, resetFilters } = useUiStore();

  const toggleSize = (s) =>
    setFilter("sizes", filters.sizes.includes(s)
      ? filters.sizes.filter((x) => x !== s)
      : [...filters.sizes, s]);

  const section = (title, children) => (
    <div className="border-b border-gray-100 pb-5 mb-5">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-gray-900">Filters</h3>
        <div className="flex items-center gap-3">
          <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-700 underline">Clear all</button>
          {onClose && <button onClick={onClose}><FaTimes className="h-4 w-4 text-gray-400" /></button>}
        </div>
      </div>

      {/* Sort */}
      {section("Sort by",
        <select
          value={filters.sort}
          onChange={(e) => setFilter("sort", e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:border-gray-900 focus:ring-0 outline-none"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {/* Category */}
      {categories.length > 0 && section("Category",
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="cat" checked={!filters.category} onChange={() => setFilter("category", "")} className="accent-gray-900" />
            <span>All</span>
          </label>
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="cat" checked={filters.category === String(c.id)} onChange={() => setFilter("category", String(c.id))} className="accent-gray-900" />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      )}

      {/* Price */}
      {section("Price Range",
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" min="0" value={filters.minPrice} onChange={(e) => setFilter("minPrice", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:border-gray-900 outline-none" />
          <span className="text-gray-300">—</span>
          <input type="number" placeholder="Max" min="0" value={filters.maxPrice} onChange={(e) => setFilter("maxPrice", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:border-gray-900 outline-none" />
        </div>
      )}

      {/* Sizes */}
      {section("Size",
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={`w-10 h-10 rounded-lg text-xs font-semibold border transition ${
                filters.sizes.includes(s) ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* In Stock */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={filters.inStock} onChange={(e) => setFilter("inStock", e.target.checked)} className="w-4 h-4 accent-gray-900 rounded" />
        <span className="text-sm font-medium text-gray-700">In Stock Only</span>
      </label>
    </div>
  );
}
