import React, { useContext, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShopContext } from "../context/ShopContextProvider";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import { createOrder, validateCoupon } from "../api/client";

// ── Animation variants ────────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: "easeOut" },
  }),
};

const slideDown = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: {
    opacity: 1,
    height: "auto",
    overflow: "hidden",
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    overflow: "hidden",
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getProductImage(product) {
  if (!product) return null;
  if (product.main_image_url) return product.main_image_url;
  if (Array.isArray(product.image) && product.image.length > 0)
    return product.image[0];
  return null;
}

function findProduct(products, productId) {
  return (products || []).find(
    (p) =>
      String(p._id) === String(productId) ||
      String(p.id) === String(productId),
  );
}

// ── Input field component ─────────────────────────────────────────────────────

function Field({ label, id, type = "text", value, onChange, required, half }) {
  return (
    <motion.div variants={fadeInUp} className={half ? "" : "sm:col-span-2"}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm placeholder-gray-400"
      />
    </motion.div>
  );
}

// ── Payment option component ──────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
  {
    value: "stripe",
    label: "Credit / Debit Card",
    sub: "Secure payment via Stripe",
    icon: "💳",
  },
  {
    value: "paypal",
    label: "PayPal",
    sub: "Safer and faster online payments",
    icon: "🅿️",
  },
  {
    value: "cash_on_delivery",
    label: "Cash on Delivery",
    sub: "Pay when your order arrives",
    icon: "💵",
  },
];

function PaymentOption({ option, selected, onSelect }) {
  return (
    <label
      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all select-none ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-gray-200 hover:border-blue-300"
      }`}
    >
      <input
        type="radio"
        name="paymentMethod"
        value={option.value}
        checked={selected}
        onChange={() => onSelect(option.value)}
        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
      />
      <span className="text-xl leading-none">{option.icon}</span>
      <div>
        <span className="block text-sm font-medium text-gray-800">
          {option.label}
        </span>
        <span className="block text-xs text-gray-500">{option.sub}</span>
      </div>
    </label>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PlaceOrder() {
  const {
    currency,
    cartItems,
    products,
    delivery_charges,
    navigate,
    token,
    setCartItems,
  } = useContext(ShopContext);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [submitting, setSubmitting] = useState(false);

  // ── Coupon state ────────────────────────────────────────────────────────────
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  // appliedCoupon = { code, discount_amount, discount_type, ... }

  // ── Order lines derived from cart ──────────────────────────────────────────
  const cartLines = useMemo(() => {
    const lines = [];
    for (const [productId, sizes] of Object.entries(cartItems || {})) {
      const product = findProduct(products, productId);
      if (!product) continue;
      for (const [sizeName, quantity] of Object.entries(sizes)) {
        if (quantity <= 0) continue;
        lines.push({ product, productId, sizeName, quantity });
      }
    }
    return lines;
  }, [cartItems, products]);

  const isEmpty = cartLines.length === 0;

  // ── Price calculations ──────────────────────────────────────────────────────
  const subtotal = useMemo(
    () =>
      cartLines.reduce(
        (acc, { product, quantity }) => acc + (product.price || 0) * quantity,
        0,
      ),
    [cartLines],
  );

  const shippingFee = delivery_charges || 0;

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === "percentage") {
      return (subtotal * (appliedCoupon.discount_value || 0)) / 100;
    }
    return appliedCoupon.discount_amount || appliedCoupon.discount_value || 0;
  }, [appliedCoupon, subtotal]);

  const total = Math.max(0, subtotal + shippingFee - couponDiscount);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    setCouponError("");
    setCouponLoading(true);
    try {
      const result = await validateCoupon(code, subtotal);
      // result may be { valid, coupon, discount_amount } or the coupon object itself
      if (result && (result.valid !== false)) {
        const couponData = result.coupon || result;
        setAppliedCoupon({
          code,
          discount_amount: result.discount_amount ?? couponData.discount_amount ?? 0,
          discount_value: couponData.discount_value ?? couponData.amount ?? 0,
          discount_type: couponData.discount_type ?? couponData.type ?? "fixed",
        });
        toast.success(`Coupon "${code}" applied!`);
      } else {
        setCouponError(result?.message || "Invalid or expired coupon.");
      }
    } catch (err) {
      setCouponError(err.message || "Could not validate coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please log in to place an order.");
      navigate("/login");
      return;
    }

    if (isEmpty) {
      toast.error("Your cart is empty.");
      return;
    }

    const orderPayload = {
      items: cartLines.map(({ productId, sizeName, quantity }) => ({
        product_id: productId,
        size_name: sizeName,
        quantity,
      })),
      shipping_address: formData,
      payment_method: paymentMethod,
      ...(appliedCoupon ? { coupon_code: appliedCoupon.code } : {}),
    };

    try {
      setSubmitting(true);
      const createdOrder = await createOrder(orderPayload, token);
      setCartItems({});
      toast.success("Order placed successfully!");
      const orderId = createdOrder?.id || createdOrder?._id;
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Empty cart guard ────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-24 px-4 text-center">
          <div className="text-6xl">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800">
            Your cart is empty
          </h2>
          <p className="text-gray-500 max-w-xs">
            Add some items before checking out.
          </p>
          <Link
            to="/collections"
            className="inline-block mt-2 bg-black text-white px-7 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Browse Collections
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen mt-8 py-12 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-12"
        >
          {/* ── LEFT: Shipping + Payment + Coupon ───────────────────────────── */}
          <div className="lg:pr-4">
            {/* Shipping information */}
            <motion.div
              initial="hidden"
              animate="visible"
              className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100"
            >
              <motion.h2
                variants={fadeInUp}
                custom={0}
                className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4"
              >
                Shipping Information
              </motion.h2>

              <motion.div
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <Field
                  label="First Name"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  half
                />
                <Field
                  label="Last Name"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  half
                />
                <Field
                  label="Email Address"
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <Field
                  label="Phone Number"
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
                <Field
                  label="Street Address"
                  id="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  required
                />
                <Field
                  label="City"
                  id="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  half
                />
                <Field
                  label="State / Province"
                  id="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  half
                />
                <Field
                  label="ZIP / Postal Code"
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                  half
                />
                <Field
                  label="Country"
                  id="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  half
                />
              </motion.div>

              {/* Payment method */}
              <motion.div variants={fadeInUp} custom={10} className="pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Method
                </h3>
                <div className="space-y-3">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <PaymentOption
                      key={opt.value}
                      option={opt}
                      selected={paymentMethod === opt.value}
                      onSelect={setPaymentMethod}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Coupon section */}
              <motion.div variants={fadeInUp} custom={11} className="pt-8">
                <button
                  type="button"
                  onClick={() => setCouponOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span className="text-base">{couponOpen ? "▲" : "▼"}</span>
                  {appliedCoupon
                    ? `Coupon applied: ${appliedCoupon.code}`
                    : "Have a coupon code?"}
                </button>

                <AnimatePresence initial={false}>
                  {couponOpen && (
                    <motion.div
                      key="coupon-panel"
                      variants={slideDown}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="mt-3"
                    >
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-green-700">
                              {appliedCoupon.code}
                            </p>
                            <p className="text-xs text-green-600">
                              Saving {currency}
                              {couponDiscount.toFixed(2)} on this order
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter coupon code"
                              value={couponInput}
                              onChange={(e) =>
                                setCouponInput(e.target.value.toUpperCase())
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), handleApplyCoupon())
                              }
                              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase placeholder-normal"
                            />
                            <button
                              type="button"
                              onClick={handleApplyCoupon}
                              disabled={couponLoading}
                              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-60 whitespace-nowrap"
                            >
                              {couponLoading ? "Checking…" : "Apply"}
                            </button>
                          </div>
                          {couponError && (
                            <p className="text-xs text-red-500">{couponError}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </div>

          {/* ── RIGHT: Order summary ─────────────────────────────────────────── */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">
                Order Summary
              </h2>

              {/* Cart items list */}
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto pr-1">
                {cartLines.map(({ product, productId, sizeName, quantity }, i) => {
                  const imgSrc = getProductImage(product);
                  const lineTotal = (product.price || 0) * quantity;
                  return (
                    <motion.div
                      key={`${productId}-${sizeName}`}
                      variants={fadeInUp}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      className="py-4 flex items-center gap-3"
                    >
                      {/* Product thumbnail */}
                      <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">
                            👕
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Size: {sizeName} &nbsp;·&nbsp; Qty: {quantity}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">
                          {quantity} × {currency}
                          {(product.price || 0).toFixed(2)}
                        </p>
                        <p className="font-semibold text-gray-900 text-sm">
                          {currency}
                          {lineTotal.toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Price breakdown */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>
                    {currency}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {shippingFee === 0
                      ? "Free"
                      : `${currency}${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between text-sm text-green-600 font-medium"
                  >
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>−{currency}{couponDiscount.toFixed(2)}</span>
                  </motion.div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>
                    {currency}
                    {total.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 text-right">
                  Includes VAT where applicable
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 bg-black text-white py-3.5 px-8 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Placing order…
                  </span>
                ) : (
                  "Place Order"
                )}
              </button>

              <p className="mt-4 text-xs text-gray-400 text-center">
                By placing your order you agree to our{" "}
                <Link
                  to="/terms"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Terms of Service
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
