import React, { useState, useContext, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShopContext } from "../context/ShopContextProvider";
import { getProduct, toggleWishlist, getWishlist } from "../api/client";
import { FaStar, FaStarHalfAlt, FaRegStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { FaTruckFast } from "react-icons/fa6";
import { TbShoppingBagPlus } from "react-icons/tb";
import { MdOutlineVerified, MdLockOutline } from "react-icons/md";
import { toast } from "react-toastify";
import Footer from "../components/Footer";
import ProductDescription from "../components/ProductDescription";
import { ProductFeatures } from "../components/ProductFeatures";
import RelatedProduct from "../components/RelatedProduct";

// ─── Star Rating Helper ────────────────────────────────────────────────────────
function StarRating({ rating = 0, count = 0 }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (rating >= i + 1) return "full";
    if (rating >= i + 0.5) return "half";
    return "empty";
  });
  return (
    <div className="flex items-center gap-2">
      <div className="flex text-amber-400">
        {stars.map((type, i) =>
          type === "full" ? (
            <FaStar key={i} className="w-4 h-4" />
          ) : type === "half" ? (
            <FaStarHalfAlt key={i} className="w-4 h-4" />
          ) : (
            <FaRegStar key={i} className="w-4 h-4 text-amber-300" />
          )
        )}
      </div>
      <span className="text-sm text-gray-500 font-medium">
        {rating.toFixed(1)}
        <span className="ml-1 font-normal text-gray-400">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      </span>
    </div>
  );
}

// ─── Loading Spinner ───────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-t-secondary animate-spin" />
      </div>
      <p className="text-gray-500 text-sm font-medium tracking-wide">
        Loading product…
      </p>
    </div>
  );
}

// ─── 404 State ─────────────────────────────────────────────────────────────────
function NotFound({ navigate }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6 px-4 text-center">
      <div className="text-7xl">🛍️</div>
      <h2 className="text-2xl font-bold text-gray-800">Product Not Found</h2>
      <p className="text-gray-500 max-w-sm">
        This product doesn&apos;t exist or has been removed.
      </p>
      <button
        onClick={() => navigate("/collections")}
        className="px-6 py-3 bg-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        Browse Collections
      </button>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    available: { label: "In Stock", classes: "bg-emerald-100 text-emerald-700" },
    low_stock: { label: "Low Stock", classes: "bg-amber-100 text-amber-700" },
    out_of_stock: { label: "Out of Stock", classes: "bg-red-100 text-red-600" },
    discontinued: { label: "Discontinued", classes: "bg-gray-200 text-gray-500" },
  };
  const cfg = map[status] ?? map.available;
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Product() {
  const { productId } = useParams();
  const { currency, addToCart, token, navigate } = useContext(ShopContext);

  const [product, setProduct]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [notFound, setNotFound]         = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize]  = useState(null);
  const [isWishlisted, setIsWishlisted]  = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ── Fetch product ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      setSelectedColor(null);
      setSelectedSize(null);
      try {
        const data = await getProduct(productId);
        if (cancelled) return;
        setProduct(data);
        // Set initial image
        const firstImage =
          data.images?.[0]?.image_url ?? data.main_image_url ?? "";
        setSelectedImage(firstImage);
        // Default to first color
        if (data.colors?.length > 0) {
          setSelectedColor(data.colors[0]);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [productId]);

  // ── Fetch wishlist status ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !productId) return;
    async function loadWishlist() {
      try {
        const data = await getWishlist(token);
        const ids = (data?.items ?? []).map((i) =>
          typeof i === "object" ? String(i.product_id ?? i.id) : String(i)
        );
        setIsWishlisted(ids.includes(String(productId)));
      } catch {
        setIsWishlisted(false);
      }
    }
    loadWishlist();
  }, [token, productId]);

  // ── Derived sizes from selected color ────────────────────────────────────────
  const availableSizes = selectedColor?.sizes ?? product?.colors?.[0]?.sizes ?? [];

  // ── Wishlist toggle ──────────────────────────────────────────────────────────
  const handleWishlistToggle = useCallback(async () => {
    if (!token) {
      toast.error("Please log in to save items to your wishlist");
      navigate("/login");
      return;
    }
    setWishlistLoading(true);
    try {
      await toggleWishlist(productId, token);
      setIsWishlisted((prev) => !prev);
      toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist ♡");
    } catch (err) {
      toast.error(err.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  }, [token, productId, isWishlisted, navigate]);

  // ── Add to cart ──────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(() => {
    if (product?.status === "out_of_stock") {
      toast.error("This product is out of stock");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color first");
      return;
    }
    if (!selectedSize) {
      toast.error("Please select a size first");
      return;
    }
    addToCart(product.id, selectedSize.name);
  }, [product, selectedColor, selectedSize, addToCart]);

  const handleBuyNow = useCallback(() => {
    handleAddToCart();
    navigate("/place-order");
  }, [handleAddToCart, navigate]);

  // ── Guards ───────────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner />;
  if (notFound || !product) return <NotFound navigate={navigate} />;

  const isOutOfStock = product.status === "out_of_stock";
  const hasDiscount  = product.discount_price && product.discount_price < product.price;
  const displayPrice = hasDiscount ? product.discount_price : product.price;
  const images       = product.images?.length > 0
    ? product.images
    : [{ id: "main", image_url: product.main_image_url, is_main: true }];

  return (
    <AnimatePresence>
      <motion.div
        key="product-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
          {/* ── Product Main Section ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">

            {/* ── Image Gallery ── */}
            <div className="flex flex-col-reverse lg:flex-row gap-4">
              {/* Thumbnails */}
              <div className="flex lg:flex-col gap-2 order-2 lg:order-1 overflow-x-auto lg:overflow-y-auto lg:max-h-[560px]">
                {images.map((img, idx) => (
                  <motion.button
                    key={img.id ?? idx}
                    onClick={() => setSelectedImage(img.image_url)}
                    whileTap={{ scale: 0.93 }}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img.image_url
                        ? "border-secondary shadow-md"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`View ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>

              {/* Main Image */}
              <div className="relative aspect-square w-full bg-white rounded-xl shadow-lg overflow-hidden order-1 lg:order-2">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={selectedImage}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-contain p-6"
                  />
                </AnimatePresence>

                {/* Wishlist overlay button */}
                <button
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className={`absolute top-4 right-4 p-2.5 rounded-full shadow-md transition-all ${
                    isWishlisted
                      ? "bg-red-50 text-red-500"
                      : "bg-white text-gray-400 hover:text-red-400"
                  } ${wishlistLoading ? "opacity-60 cursor-wait" : ""}`}
                >
                  {isWishlisted ? (
                    <FaHeart className="w-5 h-5" />
                  ) : (
                    <FaRegHeart className="w-5 h-5" />
                  )}
                </button>

                {/* Discount badge */}
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-secondary text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    -{Math.round((1 - product.discount_price / product.price) * 100)}% OFF
                  </div>
                )}
              </div>
            </div>

            {/* ── Product Details Panel ── */}
            <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col gap-5">

              {/* Category + Status */}
              <div className="flex items-center gap-3 flex-wrap">
                {product.category_name && (
                  <span className="text-xs font-semibold uppercase tracking-widest text-secondary border border-secondary/30 bg-secondary/5 px-3 py-1 rounded-full">
                    {product.category_name}
                  </span>
                )}
                <StatusBadge status={product.status} />
              </div>

              {/* Name */}
              <h1 className="text-3xl font-bold text-gray-900 leading-snug">
                {product.name}
              </h1>

              {/* Rating */}
              {product.review_count > 0 && (
                <StarRating rating={product.avg_rating} count={product.review_count} />
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  {currency}{Number(displayPrice).toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-gray-400 line-through">
                    {currency}{Number(product.price).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed text-sm">
                {product.description}
              </p>

              {/* ── Color Selection ── */}
              {product.colors?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Color
                    {selectedColor && (
                      <span className="ml-2 text-gray-400 font-normal">
                        — {selectedColor.name}
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <motion.button
                        key={color.id}
                        whileTap={{ scale: 0.85 }}
                        whileHover={{ scale: 1.08 }}
                        onClick={() => {
                          setSelectedColor(color);
                          setSelectedSize(null);
                        }}
                        title={color.name}
                        className={`relative w-9 h-9 rounded-full transition-all ${
                          selectedColor?.id === color.id
                            ? "ring-2 ring-offset-2 ring-secondary shadow-md"
                            : "ring-1 ring-gray-300 hover:ring-gray-400"
                        }`}
                        style={{ backgroundColor: color.hex_code }}
                      >
                        {selectedColor?.id === color.id && (
                          <span
                            className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold"
                            style={{
                              textShadow: "0 0 4px rgba(0,0,0,0.7)",
                              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Size Selection ── */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Size
                  {selectedSize && (
                    <span className="ml-2 text-gray-400 font-normal">
                      — {selectedSize.name}
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {availableSizes.map((sz) => {
                      const isOos      = sz.stock_quantity === 0;
                      const isLow      = !isOos && sz.stock_quantity <= 3;
                      const isSelected = selectedSize?.id === sz.id;
                      return (
                        <motion.div
                          key={sz.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="relative group"
                          title={isOos ? "Out of Stock" : isLow ? `Only ${sz.stock_quantity} left!` : ""}
                        >
                          <motion.button
                            whileTap={isOos ? {} : { scale: 0.88 }}
                            whileHover={isOos ? {} : { scale: 1.05 }}
                            disabled={isOos}
                            onClick={() => !isOos && setSelectedSize(sz)}
                            className={`relative px-4 py-2 rounded-md text-sm font-medium transition-all border ${
                              isOos
                                ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed line-through"
                                : isSelected
                                ? "bg-secondary text-white border-secondary shadow-sm"
                                : "bg-white text-gray-700 border-gray-300 hover:border-secondary hover:text-secondary"
                            }`}
                          >
                            {sz.name}
                            {isLow && !isOos && (
                              <span className="absolute -top-2 -right-2 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                {sz.stock_quantity}
                              </span>
                            )}
                          </motion.button>

                          {/* Tooltip for out of stock */}
                          {isOos && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                              <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                                Out of Stock
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {availableSizes.length === 0 && (
                    <p className="text-sm text-gray-400 italic">
                      No sizes available
                    </p>
                  )}
                </div>

                {/* Low stock warning */}
                {selectedSize && selectedSize.stock_quantity <= 3 && selectedSize.stock_quantity > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-xs text-amber-600 font-medium"
                  >
                    ⚠ Only {selectedSize.stock_quantity} left in this size — order soon!
                  </motion.p>
                )}
              </div>

              {/* ── Action Buttons ── */}
              <div className="flex gap-3 pt-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    isOutOfStock
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-secondary hover:opacity-90 text-white shadow-sm"
                  }`}
                >
                  <TbShoppingBagPlus className="w-5 h-5" />
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className={`p-3 rounded-lg border transition-all ${
                    isWishlisted
                      ? "border-red-200 bg-red-50 text-red-500"
                      : "border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-400"
                  } ${wishlistLoading ? "opacity-60 cursor-wait" : ""}`}
                >
                  {isWishlisted ? <FaHeart className="w-5 h-5" /> : <FaRegHeart className="w-5 h-5" />}
                </motion.button>

                {!isOutOfStock && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBuyNow}
                    className="px-5 rounded-lg border border-secondary text-secondary hover:bg-secondary hover:text-white font-semibold transition-all"
                  >
                    Buy Now
                  </motion.button>
                )}
              </div>

              {/* ── Delivery Info ── */}
              <div className="border-t border-b border-gray-100 py-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <FaTruckFast className="w-6 h-6 text-gray-700 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Free Standard Delivery</p>
                    <p className="text-xs text-gray-400">Arrives in 3–5 business days</p>
                  </div>
                </div>
              </div>

              {/* ── Assurance Badges ── */}
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MdOutlineVerified className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span>100% Authentic</span>
                </div>
                <div className="flex items-center gap-2">
                  <MdLockOutline className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span>Secure Payment</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Sections ── */}
          <div className="mt-16 space-y-16">
            <ProductDescription />
            <ProductFeatures />
            <RelatedProduct currentProductId={productId ?? product?.id} />
          </div>
        </div>

        <Footer />
      </motion.div>
    </AnimatePresence>
  );
}
