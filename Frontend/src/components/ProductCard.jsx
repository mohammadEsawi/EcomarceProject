import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaHeart, FaRegHeart, FaEye, FaShoppingBag } from "react-icons/fa";
import { Badge } from "./ui/Badge.jsx";
import { useAuthStore } from "../store/authStore.js";
import { useToggleWishlist, useIsWishlisted } from "../hooks/useWishlist.js";
import { useUiStore } from "../store/uiStore.js";
import { toast } from "react-toastify";
import { imgUrl } from "../lib/imageUrl.js";

export default function ProductCard({ product, onQuickView }) {
  const [hovered, setHovered] = useState(false);
  const token = useAuthStore((s) => s.token);
  const wishlisted = useIsWishlisted(product.id);
  const { mutate: toggleWishlist } = useToggleWishlist();
  const openQuickView = useUiStore((s) => s.openQuickView);

  const price         = Number(product.price ?? 0);
  const discountPrice = product.discount_price ? Number(product.discount_price) : null;
  const discount      = discountPrice ? Math.round((1 - discountPrice / price) * 100) : 0;
  const displayPrice  = discountPrice ?? price;

  // Use main_image_url (API) or image array fallback
  const images = Array.isArray(product.images) ? product.images : [];
  const mainImg   = imgUrl(product.main_image_url || images[0] || null);
  const hoverImg  = imgUrl(images[1] || null) || mainImg;

  const isOutOfStock = product.status === "out_of_stock";

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) { toast.error("Login to save items"); return; }
    toggleWishlist(product.id);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
    else openQuickView(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <Link to={`/product/${product.id}`} className="block overflow-hidden relative">
        <div className="relative h-64 bg-gray-50">
          {mainImg ? (
            <>
              <img
                src={mainImg}
                alt={product.name}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${hovered && hoverImg !== mainImg ? "opacity-0 scale-105" : "opacity-100 scale-100"}`}
              />
              {hoverImg && hoverImg !== mainImg && (
                <img
                  src={hoverImg}
                  alt={product.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${hovered ? "opacity-100 scale-105" : "opacity-0 scale-100"}`}
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">No image</div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isOutOfStock && <Badge variant="danger">Out of Stock</Badge>}
            {!isOutOfStock && discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
            {product.is_new && !isOutOfStock && <Badge variant="new">New</Badge>}
            {product.is_trending && !isOutOfStock && <Badge variant="trending">Trending</Badge>}
          </div>

          {/* Action buttons */}
          <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}>
            <button
              onClick={handleWishlist}
              className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:text-rose-500 transition-colors"
            >
              {wishlisted ? <FaHeart className="h-3.5 w-3.5 text-rose-500" /> : <FaRegHeart className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handleQuickView}
              className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaEye className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Quick add overlay */}
        {!isOutOfStock && (
          <div className={`absolute bottom-0 left-0 right-0 bg-gray-900 text-white text-center py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${hovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
            <FaShoppingBag className="h-3.5 w-3.5" />
            Quick Add
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        {product.brand_name && (
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-0.5">{product.brand_name}</p>
        )}
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition line-clamp-1 mb-1">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.avg_rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }, (_, i) => (
              <svg key={i} className={`h-3 w-3 ${i < Math.round(product.avg_rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-xs text-gray-400">({product.review_count ?? 0})</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
            {discountPrice && (
              <span className="text-xs text-gray-400 line-through">${price.toFixed(2)}</span>
            )}
          </div>
          {isOutOfStock && (
            <span className="text-xs text-red-500 font-medium">Out of Stock</span>
          )}
          {!isOutOfStock && product.status === "low_stock" && (
            <span className="text-xs text-amber-500 font-medium">Low Stock</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
