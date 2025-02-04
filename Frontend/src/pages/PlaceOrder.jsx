import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContextProvider";
import { Link } from "react-router-dom";
import Footer from '../components/Footer'
import CartTotal from "../components/CartTotal";

export default function PlaceOrder() {
  const { currency, total, cartItems, products, delivery_charges, navigate, token, getCartCount } = useContext(ShopContext);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("stripe");

  const calculateSubtotal = () => {
    return Object.entries(cartItems).reduce((sum, [productId, sizes]) => {
      const product = (products || []).find((p) => p._id === productId);
      if (!product) return sum;

      return sum + Object.entries(sizes).reduce((subSum, [size, quantity]) => {
        return subSum + (product.price * quantity);
      }, 0);
    }, 0);
  };

  const shippingFee = delivery_charges || 0;
  const subtotal = calculateSubtotal();
  const totalAmount = subtotal + shippingFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const orderData = {
      ...formData,
      paymentMethod,
      items: cartItems || {},
      total: totalAmount || 0
    };
    console.log("Order Data:", orderData);
  };

  return (
    <div className="min-h-screen mt-8 py-12 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-12"
        >
          {/* Order Form */}
          <div className="lg:pr-4">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">
                Shipping Information
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="street"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      State/Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="zipCode"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Payment Method
                  </h3>
                  <div className="space-y-3">
                    <label
                      className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                        paymentMethod === "stripe"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="stripe"
                        checked={paymentMethod === "stripe"}
                        onChange={() => setPaymentMethod("stripe")}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-700">
                          Credit/Debit Card
                        </span>
                        <span className="block text-sm text-gray-500">
                          Secure payment via Stripe
                        </span>
                      </div>
                    </label>
                    <label
                      className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                        paymentMethod === "paypal"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={paymentMethod === "paypal"}
                        onChange={() => setPaymentMethod("paypal")}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-700">
                          PayPal
                        </span>
                        <span className="block text-sm text-gray-500">
                          Safer and faster online payments
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">
                Order Summary
              </h2>

              {/* List of Cart Items */}
              <div className="divide-y divide-gray-100">
                {cartItems &&
                  Object.entries(cartItems).map(([productId, sizes]) => {
                    const product = (products || []).find(
                      (p) => p._id === productId
                    );
                    if (!product) return null;

                    return Object.entries(sizes).map(
                      ([size, quantity]) =>
                        quantity > 0 && (
                          <div
                            key={`${productId}-${size}`}
                            className="py-4 flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Size: {size}
                              </p>
                            </div>
                            <div className="ml-4 text-right">
                              <p className="text-sm text-gray-600">
                                {quantity} × {currency}
                                {(product.price || 0).toFixed(2)}
                              </p>
                              <p className="font-medium text-gray-900">
                                {currency}
                                {(
                                  (quantity || 0) * (product.price || 0)
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )
                    );
                  })}
              </div>

              <CartTotal
                subtotal={subtotal}
                shippingFee={shippingFee}
                total={totalAmount}
                currency={currency}
                navigate={navigate}
              />

              <button
                type="submit"
                className="w-full mt-8 bg-black text-white py-3.5 px-8 rounded-lg font-medium hover:bg-secondary transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Place Order
              </button>

              <p className="mt-4 text-sm text-gray-500 text-center">
                By placing your order, you agree to our{" "}
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
