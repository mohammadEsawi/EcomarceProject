import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaMinus, FaPlus, FaTrash, FaShoppingBag, FaTag, FaTruck, FaImage } from "react-icons/fa";
import { toast } from "react-toastify";
import Footer from "../components/Footer";
import { EmptyState } from "../components/ui/EmptyState";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import { imgUrl } from "../lib/imageUrl";

const SHIPPING_THRESHOLD = 100;
const FLAT_SHIPPING      = 10;

function ItemImage({ src, alt }) {
  const [error, setError] = useState(false);
  const url = imgUrl(src);
  if (!url || error) {
    return (
      <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
        <FaImage className="h-7 w-7 text-gray-300" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className="w-20 h-20 rounded-xl object-cover bg-gray-100 shrink-0"
      onError={() => setError(true)}
    />
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const token    = useAuthStore((s) => s.token);
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [couponCode, setCouponCode]     = useState("");
  const [couponData, setCouponData]     = useState(null);
  const [validatingCoupon, setValidating] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const discount = couponData?.discount_amount ?? 0;
  const total    = Math.max(0, subtotal + shipping - discount);

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidating(true);
    try {
      const data = await api.post("/coupons/validate", { code: couponCode.trim(), order_amount: subtotal });
      setCouponData(data);
      toast.success(`Coupon applied! You save $${Number(data.discount_amount).toFixed(2)}`);
    } catch (err) {
      toast.error(err.message);
      setCouponData(null);
    } finally {
      setValidating(false);
    }
  };

  const handleCheckout = () => {
    if (!token) { toast.error("Please log in to checkout"); navigate("/login"); return; }
    if (items.length === 0) { toast.error("Your cart is empty"); return; }
    navigate("/place-order", { state: { coupon: couponData } });
  };

  if (items.length === 0) {
    return (
      <>
        <div className="pt-20 min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <EmptyState
              icon={FaShoppingBag}
              title="Your cart is empty"
              description="Looks like you haven't added anything yet."
              actionTo="/collections"
              actionLabel="Browse Collections"
            />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="pt-20 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-8">Shopping Cart ({items.length} items)</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {items.filter((item) => item.productId && item.productId !== 'undefined').map((item) => {
                  const key = `${item.productId}-${item.variantId}`;
                  return (
                    <motion.div
                      key={key}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start"
                    >
                      {/* Image */}
                      <Link to={`/product/${item.productId}`}>
                        <ItemImage src={item.image} alt={item.name} />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Link to={`/product/${item.productId}`}>
                            <h3 className="font-semibold text-gray-900 text-sm hover:text-gray-600 transition line-clamp-2 leading-snug">{item.name}</h3>
                          </Link>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="shrink-0 p-1.5 text-gray-300 hover:text-rose-500 transition rounded-lg hover:bg-rose-50"
                          >
                            <FaTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {item.size && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                              Size {item.size}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition text-gray-600"
                            >
                              <FaMinus className="h-2.5 w-2.5" />
                            </button>
                            <span className="text-sm font-bold text-gray-900 w-7 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              disabled={item.stock != null && item.quantity >= item.stock}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 disabled:opacity-40 transition text-gray-600"
                            >
                              <FaPlus className="h-2.5 w-2.5" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                            {item.quantity > 1 && (
                              <p className="text-xs text-gray-400">${item.price.toFixed(2)} each</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <button onClick={clearCart} className="text-xs text-gray-400 hover:text-rose-500 underline transition">
                Clear cart
              </button>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              {/* Coupon */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FaTag className="h-3.5 w-3.5 text-gray-500" /> Coupon Code
                </h3>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-mono focus:border-gray-900 outline-none"
                  />
                  <button
                    onClick={handleCoupon}
                    disabled={validatingCoupon}
                    className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 transition"
                  >
                    {validatingCoupon ? "…" : "Apply"}
                  </button>
                </div>
                {couponData && (
                  <p className="mt-2 text-xs text-emerald-600 font-medium">
                    ✓ Saving ${Number(couponData.discount_amount).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Order summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-gray-800">Order Summary</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <FaTruck className="h-3 w-3" /> Shipping
                    </span>
                    <span>{shipping === 0 ? <span className="text-emerald-600 font-medium">Free</span> : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Coupon discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {shipping > 0 && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <FaTruck className="h-3 w-3" />
                    Add ${(SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}

                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-lg">${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white hover:bg-gray-700 transition flex items-center justify-center gap-2"
                >
                  <FaShoppingBag className="h-4 w-4" />
                  Proceed to Checkout
                </button>

                <Link to="/collections" className="block text-center text-xs text-gray-400 hover:text-gray-700 underline">
                  Continue shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
