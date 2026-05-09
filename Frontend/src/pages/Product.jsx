import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHeart, FaRegHeart, FaStar, FaRegStar, FaStarHalfAlt,
  FaShoppingBag, FaBolt, FaChevronDown, FaChevronUp,
} from "react-icons/fa";
import { FaTruck, FaShield as FaShieldAlt, FaRotateLeft } from "react-icons/fa6";
import { MdVerified } from "react-icons/md";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Footer from "../components/Footer";
import ProductGallery from "../components/ProductGallery";
import { Badge } from "../components/ui/Badge";
import { Spinner, FullPageSpinner } from "../components/ui/Spinner";
import { SkeletonGrid } from "../components/ui/SkeletonCard";
import ProductCard from "../components/ProductCard";
import { useProduct, useProducts, useProductReviews, useCreateReview } from "../hooks/useProducts";
import { useToggleWishlist, useIsWishlisted } from "../hooks/useWishlist";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";

// ── Review star rating ────────────────────────────────────────────────────────
function Stars({ rating, size = "sm" }) {
  const sz = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        if (rating >= i + 1)     return <FaStar    key={i} className={`${sz} text-amber-400`} />;
        if (rating >= i + 0.5)   return <FaStarHalfAlt key={i} className={`${sz} text-amber-400`} />;
        return <FaRegStar key={i} className={`${sz} text-gray-200`} />;
      })}
    </div>
  );
}

// ── Interactive star picker ───────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          {(hover || value) >= n
            ? <FaStar    className="h-6 w-6 text-amber-400" />
            : <FaRegStar className="h-6 w-6 text-gray-300" />}
        </button>
      ))}
    </div>
  );
}

// ── Accordion section ─────────────────────────────────────────────────────────
function Accordion({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-4 text-sm font-semibold text-gray-800"
      >
        {title}
        {open ? <FaChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <FaChevronDown className="h-3.5 w-3.5 text-gray-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-gray-500 leading-relaxed">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Review form schema ────────────────────────────────────────────────────────
const reviewSchema = z.object({
  rating:  z.number({ required_error: "Rating required" }).min(1).max(5),
  title:   z.string().min(3, "Title too short").max(100),
  body:    z.string().min(10, "Review too short").max(2000),
});

// ── Review list ───────────────────────────────────────────────────────────────
function ReviewSection({ productId }) {
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const { mutate: createReview, isPending } = useCreateReview();
  const token = useAuthStore((s) => s.token);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, title: "", body: "" },
  });
  const rating = watch("rating");

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const onSubmit = (data) => {
    createReview(
      { productId, ...data },
      {
        onSuccess: () => { toast.success("Review submitted!"); reset(); setShowForm(false); },
        onError:   (e)  => toast.error(e.message),
      },
    );
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Stars rating={avgRating} />
              <span className="text-sm text-gray-500">{avgRating.toFixed(1)} / 5 ({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
            </div>
          )}
        </div>
        {token && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-900 transition"
          >
            {showForm ? "Cancel" : "Write a Review"}
          </button>
        )}
      </div>

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSubmit(onSubmit)}
            className="bg-gray-50 rounded-2xl p-6 mb-8 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Rating *</label>
              <StarPicker value={rating} onChange={(v) => setValue("rating", v)} />
              {errors.rating && <p className="text-xs text-red-500 mt-1">{errors.rating.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Review Title *</label>
              <input
                {...register("title")}
                placeholder="Summarize your experience"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none"
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Review *</label>
              <textarea
                {...register("body")}
                rows={4}
                placeholder="Tell others about your experience with this product"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none resize-none"
              />
              {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 transition flex items-center gap-2"
            >
              {isPending && <Spinner size="sm" />}
              Submit Review
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Review list */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No reviews yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-gray-100 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Stars rating={r.rating} />
                    {r.is_verified && (
                      <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-medium">
                        <MdVerified className="h-3.5 w-3.5" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.body}</p>
              <p className="text-xs text-gray-400 mt-2">— {r.user_name ?? "Anonymous"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Product Page ─────────────────────────────────────────────────────────
export default function Product() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const addItem   = useCartStore((s) => s.addItem);
  const token     = useAuthStore((s) => s.token);

  const { data: product, isLoading, isError } = useProduct(productId);
  const { mutate: toggleWishlist } = useToggleWishlist();
  const wishlisted = useIsWishlisted(Number(productId));

  // Track view
  useEffect(() => {
    if (product?.id && token) {
      // Fire and forget — just update view count
      import("../lib/axios.js").then(({ default: api }) => {
        api.post(`/products/${product.id}/view`).catch(() => {});
      });
    }
  }, [product?.id, token]);

  // Variants derived state
  const variants = product?.variants ?? [];
  const colors   = useMemo(() => [...new Map(variants.filter((v) => v.color_name).map((v) => [v.color_name, { name: v.color_name, hex: v.hex_code }])).values()], [variants]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize,  setSelectedSize]  = useState(null);

  const filteredByColor = useMemo(
    () => selectedColor ? variants.filter((v) => v.color_name === selectedColor) : variants,
    [variants, selectedColor],
  );
  const sizes = useMemo(
    () => [...new Set(filteredByColor.map((v) => v.size_name).filter(Boolean))],
    [filteredByColor],
  );

  const selectedVariant = useMemo(
    () => variants.find((v) => v.color_name === selectedColor && v.size_name === selectedSize),
    [variants, selectedColor, selectedSize],
  );

  const isOutOfStock = product?.status === "out_of_stock";
  const stock        = selectedVariant?.stock ?? null;
  const displayPrice = product ? Number(product.discount_price ?? product.price) : 0;
  const originalPrice = product?.discount_price ? Number(product.price) : null;
  const discount = originalPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;

  // Related products
  const { data: relatedData } = useProducts(
    product ? { category_id: product.category_id, limit: 6, sort: "popular" } : {},
  );
  const related = useMemo(() => {
    const list = Array.isArray(relatedData) ? relatedData : (relatedData?.products ?? []);
    return list.filter((p) => p.id !== Number(productId)).slice(0, 4);
  }, [relatedData, productId]);

  const handleAddToCart = (buyNow = false) => {
    if (!product) return;
    const needsVariant = variants.length > 0;
    if (needsVariant && (!selectedColor || !selectedSize)) {
      toast.error("Please select color and size");
      return;
    }
    if (stock !== null && stock === 0) { toast.error("Out of stock"); return; }
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? product.id,
      name:      product.name,
      price:     displayPrice,
      image:     product.main_image_url,
      color:     selectedColor,
      size:      selectedSize,
      stock,
    });
    if (buyNow) navigate("/cart");
  };

  if (isLoading) return <FullPageSpinner />;
  if (isError || !product) return (
    <div className="pt-24 text-center py-20">
      <p className="text-gray-500">Product not found.</p>
      <Link to="/collections" className="mt-4 inline-block text-sm underline text-gray-900">Back to collections</Link>
    </div>
  );

  const images = product.images?.map((i) => i.image_url ?? i) ?? [];

  return (
    <>
      <div className="pt-20 min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <span>/</span>
            <Link to="/collections" className="hover:text-gray-700">Collections</Link>
            {product.category_name && (
              <><span>/</span><span className="hover:text-gray-700">{product.category_name}</span></>
            )}
            <span>/</span>
            <span className="text-gray-700 font-medium truncate max-w-[180px]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Gallery */}
            <div>
              <ProductGallery images={images} mainImage={product.main_image_url} />
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Brand & badges */}
              <div className="flex items-start justify-between">
                <div>
                  {product.brand_name && (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{product.brand_name}</p>
                  )}
                  <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>
                </div>
                <button
                  onClick={() => { if (!token) { toast.error("Login to save"); return; } toggleWishlist(product.id); }}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-rose-500 hover:border-rose-200 transition shrink-0"
                >
                  {wishlisted ? <FaHeart className="h-5 w-5 text-rose-500" /> : <FaRegHeart className="h-5 w-5" />}
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {isOutOfStock && <Badge variant="danger">Out of Stock</Badge>}
                {!isOutOfStock && discount > 0 && <Badge variant="sale">-{discount}% OFF</Badge>}
                {product.is_new && <Badge variant="new">New Arrival</Badge>}
                {product.is_trending && <Badge variant="trending">Trending</Badge>}
                {stock !== null && stock > 0 && stock <= 5 && <Badge variant="warning">Only {stock} left</Badge>}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-gray-900">${displayPrice.toFixed(2)}</span>
                {originalPrice && (
                  <span className="text-lg text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
                )}
              </div>

              {/* Color selector */}
              {colors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</span>
                    {selectedColor && <span className="text-sm text-gray-600">{selectedColor}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(({ name, hex }) => (
                      <button
                        key={name}
                        title={name}
                        onClick={() => { setSelectedColor(name); setSelectedSize(null); }}
                        className={`w-9 h-9 rounded-full border-2 transition-all ${
                          selectedColor === name ? "border-gray-900 scale-110" : "border-transparent hover:border-gray-300"
                        }`}
                        style={{ backgroundColor: hex || name }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size selector */}
              {sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</span>
                    <button className="text-xs text-gray-400 underline hover:text-gray-700">Size guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => {
                      const v       = filteredByColor.find((vv) => vv.size_name === s);
                      const inStock = (v?.stock ?? 0) > 0;
                      return (
                        <button
                          key={s}
                          disabled={!inStock}
                          onClick={() => setSelectedSize(s)}
                          className={`min-w-[44px] px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                            selectedSize === s
                              ? "bg-gray-900 text-white border-gray-900"
                              : inStock
                              ? "border-gray-200 text-gray-700 hover:border-gray-900"
                              : "border-gray-100 text-gray-300 cursor-not-allowed relative"
                          }`}
                        >
                          {s}
                          {!inStock && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="w-full border-t border-gray-300 absolute" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock indicator */}
              {selectedVariant && (
                <div className="flex items-center gap-2 text-sm">
                  {stock === 0 ? (
                    <span className="text-red-500 font-medium">Out of stock</span>
                  ) : stock !== null && stock <= 5 ? (
                    <span className="text-amber-600 font-medium">Only {stock} left — order soon!</span>
                  ) : (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> In stock
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={isOutOfStock}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-900 px-6 py-3.5 text-sm font-bold text-gray-900 hover:bg-gray-900 hover:text-white disabled:opacity-40 transition"
                >
                  <FaShoppingBag className="h-4 w-4" />
                  Add to Cart
                </button>
                <button
                  onClick={() => handleAddToCart(true)}
                  disabled={isOutOfStock}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-40 transition"
                >
                  <FaBolt className="h-4 w-4" />
                  Buy Now
                </button>
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: FaTruck,     label: "Free Shipping", sub: "Orders over $100" },
                  { icon: FaRotateLeft,label: "Easy Returns",  sub: "14-day policy" },
                  { icon: FaShieldAlt, label: "Secure",        sub: "Safe checkout" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50">
                    <Icon className="h-4 w-4 text-gray-600 mb-1" />
                    <p className="text-xs font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Accordion details */}
              <div>
                <Accordion title="Description">
                  <p>{product.description || "No description available."}</p>
                </Accordion>
                {product.material && (
                  <Accordion title="Material & Care">
                    <p>Material: {product.material}</p>
                    {product.care_instructions && <p className="mt-2">{product.care_instructions}</p>}
                  </Accordion>
                )}
                <Accordion title="Shipping & Returns">
                  <p>Free standard shipping on orders over $100. Express shipping available at checkout.</p>
                  <p className="mt-2">Return or exchange within 14 days of delivery in original condition.</p>
                </Accordion>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <ReviewSection productId={productId} />

          {/* Related products */}
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {related.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
