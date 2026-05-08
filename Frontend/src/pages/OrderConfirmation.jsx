import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Footer from "../components/Footer";
import { getOrderById } from "../api/client";
import { ShopContext } from "../context/ShopContextProvider";
import { useContext } from "react";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { token, navigate } = useContext(ShopContext);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    async function load() {
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const data = await getOrderById(orderId, token);
        setOrder(data);
      } catch (error) {
        toast.error(error.message || "Failed to load order");
      }
    }

    load();
  }, [orderId, token, navigate]);

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 mt-10">Loading order...</div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-16 mt-10">
      <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
        <div>
          <p className="text-sm text-green-600 font-medium">Order confirmed</p>
          <h1 className="text-3xl font-bold text-gray-900">
            Order #{order.orderNumber}
          </h1>
          <p className="text-gray-600">Your order is now being processed.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <p className="font-semibold mb-2">Shipping address</p>
            <p>
              {order.shippingAddress?.firstName}{" "}
              {order.shippingAddress?.lastName}
            </p>
            <p>{order.shippingAddress?.street}</p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.state}
            </p>
            <p>{order.shippingAddress?.country}</p>
          </div>
          <div>
            <p className="font-semibold mb-2">Payment</p>
            <p>{order.paymentMethod}</p>
            <p className="mt-4 font-semibold">
              Total: ${Number(order.totals?.total || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <Link
          to="/orders"
          className="inline-flex px-4 py-2 rounded-lg bg-black text-white"
        >
          View orders
        </Link>
      </div>
      <Footer />
    </main>
  );
}
