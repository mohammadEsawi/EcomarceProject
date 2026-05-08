import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContextProvider";
import { useLocation } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

export default function ShowSearch() {
  const { search, setSearch, products } = useContext(ShopContext);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const suggestions = products
    .filter((product) => {
      const term = search.trim().toLowerCase();
      if (!term) return false;
      return [product.name, product.category, product.brand]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    })
    .slice(0, 6);

  useEffect(() => {
    setVisible(location.pathname.includes("collections"));
  }, [location]);

  return visible ? (
    <div className="pt-4 pb-4 relative">
      <div className="text-left">
        <div className="inline-flex items-center justify-between px-3 py-1.5 rounded-full bg-white overflow-hidden w-full border border-gray-200">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onFocus={() => setOpen(true)}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="border-none outline-none w-full bg-white text-sm flex-1"
          />
          <div className="ml-2 text-gray-400">
            <FaSearch className="cursor-pointer" />
          </div>
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
          {suggestions.map((product) => (
            <button
              key={product._id}
              type="button"
              onMouseDown={() => setSearch(product.name)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="font-medium text-gray-800">{product.name}</span>
              <span className="text-xs text-gray-500">
                {product.category}
                {product.brand ? ` • ${product.brand}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;
}
