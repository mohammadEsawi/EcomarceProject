import React, { useContext, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiXCircle, FiPackage } from "react-icons/fi";
import { toast } from "react-toastify";
import Footer from "../components/Footer";
import { ShopContext } from "../context/ShopContextProvider";
import { getMyOrders } from "../api/client";

const ORDER_STATUS = {
  DELIVERED: "delivered",
  PROCESSING: "processing",
  CANCELLED: "cancelled",
};

const statusStyles = {
  [ORDER_STATUS.DELIVERED]: "bg-green-100 text-green-800",
  [ORDER_STATUS.PROCESSING]: "bg-blue-100 text-blue-800",
  [ORDER_STATUS.CANCELLED]: "bg-red-100 text-red-800",
};

const statusIcons = {
  [ORDER_STATUS.DELIVERED]: FiCheckCircle,
  [ORDER_STATUS.PROCESSING]: FiClock,
  [ORDER_STATUS.CANCELLED]: FiXCircle,
};

export default function Orders() {
  const { token, navigate } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        toast.error("Please login to view your orders");
        navigate("/login");
        return;
      }

      try {
        const data = await getMyOrders(token);
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, navigate]);

  const filteredOrders = useMemo(() => {
    if (filterStatus === "all") return orders;
    return orders.filter((order) => order.status === filterStatus);
  }, [orders, filterStatus]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 mt-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FiPackage className="text-blue-600" />
          Order History
        </h1>
        <p className="mt-2 text-gray-600">Track all your orders in real time</p>
      </header>

      <div className="mb-6 max-w-xs">
        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
        >
          <option value="all">All Orders</option>
          <option value={ORDER_STATUS.PROCESSING}>Processing</option>
          <option value={ORDER_STATUS.DELIVERED}>Delivered</option>
          <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
        </select>
      </div>

      <section>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No orders found.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const Icon = statusIcons[order.status] || FiClock;
              const statusClass =
                statusStyles[order.status] || "bg-gray-100 text-gray-700";
              return (
                <article key={order._id} className="p-6 border-b last:border-0">
                  <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h2 className="font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h2>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${statusClass}`}
                        >
                          <Icon />
                          {String(order.status || "processing")
                            .charAt(0)
                            .toUpperCase() +
                            String(order.status || "processing").slice(1)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500">
                        Placed on{" "}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>

                      <p className="text-sm text-gray-500">
                        Payment: {order.paymentMethod}
                      </p>

                      <div className="space-y-2">
                        {(order.items || []).map((item, index) => (
                          <div
                            key={`${order._id}-${index}`}
                            className="flex items-center gap-3 text-sm text-gray-700"
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded" />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-gray-500">
                                Size: {item.size} | Qty: {item.quantity} | $
                                {Number(item.price || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${Number(order.totals?.total || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
