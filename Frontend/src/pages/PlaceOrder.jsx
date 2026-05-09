import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FaMapMarkerAlt, FaCreditCard, FaCheckCircle, FaChevronRight, FaLock } from "react-icons/fa";
import { toast } from "react-toastify";
import Footer from "../components/Footer";
import { Spinner } from "../components/ui/Spinner";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useCreateOrder } from "../hooks/useOrders";

// ── Validation schema ─────────────────────────────────────────────────────────
const addressSchema = z.object({
  full_name:     z.string().min(2, "Name required"),
  phone:         z.string().min(7, "Phone required"),
  address_line1: z.string().min(5, "Address required"),
  address_line2: z.string().optional(),
  city:          z.string().min(2, "City required"),
  state:         z.string().optional(),
  postal_code:   z.string().optional(),
  country:       z.string().min(2, "Country required").default("Palestine"),
  notes:         z.string().optional(),
});

const PAYMENT_METHODS = [
  { value: "cash_on_delivery", label: "Cash on Delivery",   sub: "Pay when you receive" },
  { value: "bank_transfer",    label: "Bank Transfer",      sub: "Transfer to our account" },
  { value: "credit_card",      label: "Credit / Debit Card",sub: "Coming soon", disabled: true },
];

const STEPS = ["Shipping", "Payment", "Review"];

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}{required && " *"}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition";

export default function PlaceOrder() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { items, subtotal: getSubtotal, clearCart } = useCartStore();
  const token     = useAuthStore((s) => s.token);
  const { mutate: createOrder, isPending } = useCreateOrder();

  const coupon    = location.state?.coupon ?? null;
  const subtotal  = getSubtotal();
  const shipping  = subtotal >= 100 ? 0 : 10;
  const discount  = coupon?.discount_amount ?? 0;
  const total     = Math.max(0, subtotal + shipping - discount);

  const [step, setStep]   = useState(0);
  const [payment, setPayment] = useState("cash_on_delivery");

  const { register, handleSubmit, trigger, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "Palestine" },
  });

  const nextStep = async () => {
    if (step === 0) {
      const ok = await trigger(["full_name","phone","address_line1","city","country"]);
      if (!ok) return;
    }
    setStep((s) => s + 1);
  };

  const placeOrder = () => {
    const address = getValues();
    const orderItems = items.map((i) => ({
      variant_id: i.variantId,
      product_id: i.productId,
      quantity:   i.quantity,
      unit_price: i.price,
      color_name: i.color,
      size_name:  i.size,
      product_name: i.name,
    }));

    createOrder(
      {
        items:            orderItems,
        shipping_address: address,
        payment_method:   payment,
        coupon_code:      coupon?.code,
        notes:            address.notes,
      },
      {
        onSuccess: (data) => {
          clearCart();
          toast.success("Order placed successfully!");
          navigate(`/order-confirmation/${data.order?.id ?? data.id}`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  if (!token) {
    return (
      <div className="pt-24 text-center py-16">
        <p className="text-gray-500 mb-4">Please log in to checkout.</p>
        <Link to="/login" className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white">Log In</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-24 text-center py-16">
        <p className="text-gray-500 mb-4">Your cart is empty.</p>
        <Link to="/collections" className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white">Shop Now</Link>
      </div>
    );
  }

  return (
    <>
      <div className="pt-20 min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-10">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step ? "bg-emerald-500 text-white" : i === step ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    {i < step ? <FaCheckCircle className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`mt-1 text-xs font-medium ${i === step ? "text-gray-900" : "text-gray-400"}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 mb-4 transition-all ${i < step ? "bg-emerald-500" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form area */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* Step 0: Shipping */}
                {step === 0 && (
                  <motion.div key="shipping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <FaMapMarkerAlt className="h-4 w-4 text-indigo-500" /> Shipping Address
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Full Name" error={errors.full_name?.message} required>
                          <input {...register("full_name")} className={inputCls} placeholder="Mohammad Esawi" />
                        </Field>
                        <Field label="Phone" error={errors.phone?.message} required>
                          <input {...register("phone")} className={inputCls} placeholder="+970 598-000-000" />
                        </Field>
                      </div>
                      <Field label="Address Line 1" error={errors.address_line1?.message} required>
                        <input {...register("address_line1")} className={inputCls} placeholder="Street, building, apartment" />
                      </Field>
                      <Field label="Address Line 2" error={errors.address_line2?.message}>
                        <input {...register("address_line2")} className={inputCls} placeholder="Optional" />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="City" error={errors.city?.message} required>
                          <input {...register("city")} className={inputCls} placeholder="Nablus" />
                        </Field>
                        <Field label="State / Region" error={errors.state?.message}>
                          <input {...register("state")} className={inputCls} placeholder="West Bank" />
                        </Field>
                        <Field label="Postal Code" error={errors.postal_code?.message}>
                          <input {...register("postal_code")} className={inputCls} placeholder="00970" />
                        </Field>
                      </div>
                      <Field label="Country" error={errors.country?.message} required>
                        <input {...register("country")} className={inputCls} />
                      </Field>
                      <Field label="Order Notes" error={errors.notes?.message}>
                        <textarea {...register("notes")} rows={2} className={`${inputCls} resize-none`} placeholder="Special instructions for delivery…" />
                      </Field>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Payment */}
                {step === 1 && (
                  <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <FaCreditCard className="h-4 w-4 text-indigo-500" /> Payment Method
                      </h2>
                      {PAYMENT_METHODS.map((m) => (
                        <label key={m.value} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                          m.disabled ? "opacity-40 cursor-not-allowed border-gray-100" : payment === m.value ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-300"
                        }`}>
                          <input type="radio" name="payment" value={m.value} checked={payment === m.value} disabled={m.disabled}
                            onChange={() => setPayment(m.value)} className="accent-gray-900" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                            <p className="text-xs text-gray-400">{m.sub}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Review */}
                {step === 2 && (
                  <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <FaCheckCircle className="h-4 w-4 text-emerald-500" /> Review Your Order
                      </h2>
                      <div className="space-y-3">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-gray-400">{[item.color, item.size && `Size: ${item.size}`, `Qty: ${item.quantity}`].filter(Boolean).join(" · ")}</p>
                            </div>
                            <span className="text-sm font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-100 pt-3 flex items-center gap-2 text-xs text-gray-500">
                        <FaLock className="h-3 w-3 text-emerald-500" />
                        Your payment information is secure and encrypted.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-5">
                <button
                  onClick={() => step === 0 ? navigate("/cart") : setStep((s) => s - 1)}
                  className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-400 transition"
                >
                  {step === 0 ? "Back to Cart" : "← Back"}
                </button>
                {step < 2 ? (
                  <button onClick={nextStep} className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white hover:bg-gray-700 transition flex items-center gap-2">
                    Continue <FaChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={isPending}
                    className="rounded-xl bg-gray-900 px-8 py-3 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-60 transition flex items-center gap-2"
                  >
                    {isPending && <Spinner size="sm" />}
                    Place Order — ${total.toFixed(2)}
                  </button>
                )}
              </div>
            </div>

            {/* Order summary sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm mb-4">
                  {items.slice(0, 3).map((i, idx) => (
                    <div key={idx} className="flex justify-between text-gray-600">
                      <span className="truncate max-w-[150px]">{i.name} ×{i.quantity}</span>
                      <span className="font-medium text-gray-900 shrink-0">${(i.price * i.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {items.length > 3 && <p className="text-xs text-gray-400">+{items.length - 3} more items</p>}
                </div>
                <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping}`}</span></div>
                  {discount > 0 && <div className="flex justify-between text-emerald-600 font-medium"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
                </div>
                <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
