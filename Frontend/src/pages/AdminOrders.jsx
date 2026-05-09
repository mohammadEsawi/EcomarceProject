import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaBan, FaChevronLeft, FaChevronRight, FaClipboardList,
  FaDollarSign, FaSearch, FaSyncAlt, FaTruck,
} from "react-icons/fa";
import { getAllOrders, updateOrderStatus } from "../api/client";
import { useAuthStore } from "../store/authStore";
import AdminSidebar from "../components/AdminSidebar";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

const STATUS_OPTIONS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

const NEXT_STATUSES = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// ─── Animation variants ───────────────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -18 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.035, duration: 0.28, ease: "easeOut" },
  }),
  exit: { opacity: 0, x: 30, transition: { duration: 0.2 } },
};

const btnMotion = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function shortId(id) {
  const s = String(id ?? "");
  return s.length > 8 ? `${s.slice(0, 8)}…` : s;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_BADGE_CLS = {
  pending:    "bg-gray-100 text-gray-600",
  processing: "bg-blue-100 text-blue-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-emerald-100 text-emerald-700",
  cancelled:  "bg-rose-100 text-rose-700",
};

function StatusBadge({ status }) {
  const cls = STATUS_BADGE_CLS[status] ?? "bg-gray-100 text-gray-500";
  return (
    <motion.span
      layout
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors duration-300 ${cls}`}
    >
      {status ?? "—"}
    </motion.span>
  );
}

function SummaryCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-400 to-amber-500",
  };
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
      }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorMap[color]} p-5 text-white shadow-lg`}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="rounded-xl bg-white/20 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-5 -right-5 h-20 w-20 rounded-full bg-white/10" />
    </motion.div>
  );
}

// Loading skeleton rows
function SkeletonRow() {
  return (
    <tr className="border-b">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="py-3.5 pr-4">
          <div className="h-4 w-full animate-pulse rounded-lg bg-gray-100" />
        </td>
      ))}
    </tr>
  );
}

function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 py-24"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <FaClipboardList className="h-9 w-9 text-gray-300" />
      </div>
      <p className="text-lg font-semibold text-gray-500">No orders found</p>
      <p className="text-sm text-gray-400">
        Try adjusting your filters or search query.
      </p>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminOrders() {
  const adminToken = useAuthStore((s) => s.adminToken);
  const navigate = useNavigate();

  // ── Filter state ──
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  // ── Data state ──
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_LIMIT,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { if (!adminToken) navigate("/login"); }, [adminToken, navigate]);

  // ── Fetch orders ──
  const fetchOrders = useCallback(
    async (page = 1) => {
      if (!adminToken) return;
      setLoading(true);
      try {
        const params = {
          page,
          limit: PAGE_LIMIT,
          ...(filterStatus !== "all" && { status: filterStatus }),
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
        };
        const data = await getAllOrders(params);
        setOrders(Array.isArray(data) ? data : data?.orders ?? []);
        if (data?.pagination) setPagination(data.pagination);
        else
          setPagination((p) => ({
            ...p,
            page,
            total: Array.isArray(data) ? data.length : 0,
          }));
      } catch (err) {
        toast.error(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    },
    [adminToken, filterStatus, dateFrom, dateTo],
  );

  // Re-fetch whenever filters change (reset to page 1)
  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  // ── Client-side search filter (order id / email) ──
  const displayedOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        String(o.id ?? "").toLowerCase().includes(q) ||
        String(o.user_email ?? "").toLowerCase().includes(q),
    );
  }, [orders, search]);

  // ── Summary stats ──
  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0),
    [orders],
  );

  // ── Status update ──
  const handleStatusChange = async (orderId, newStatus) => {
    if (!newStatus || updatingId === orderId) return;
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) =>
          (o.id ?? o._id) === orderId ? { ...o, status: newStatus } : o,
        ),
      );
      toast.success(`Order updated to "${newStatus}"`);
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Pagination ──
  const goToPage = (page) => {
    if (page < 1 || page > pagination.total_pages) return;
    fetchOrders(page);
  };

  const inputCls =
    "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition";

  if (!adminToken) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <div className="md:ml-60">
        {/* Page header */}
        <div className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-gray-200 bg-white">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Order Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">{pagination.total} total orders</p>
          </div>
          <motion.button {...btnMotion} onClick={() => fetchOrders(pagination.page)}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition">
            <FaSyncAlt className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </motion.button>
        </div>

      <div className="px-4 md:px-8 py-6 space-y-6">
        {/* ── Summary cards ── */}
        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          animate="visible"
        >
          <SummaryCard
            icon={FaClipboardList}
            label="Total Orders"
            value={pagination.total.toLocaleString()}
            color="indigo"
          />
          <SummaryCard
            icon={FaDollarSign}
            label="Revenue (loaded)"
            value={formatCurrency(totalRevenue)}
            color="emerald"
          />
          <SummaryCard
            icon={FaTruck}
            label="In Transit"
            value={orders
              .filter((o) => o.status === "shipped")
              .length.toString()}
            color="purple"
          />
          <SummaryCard
            icon={FaBan}
            label="Cancelled"
            value={orders
              .filter((o) => o.status === "cancelled")
              .length.toString()}
            color="amber"
          />
        </motion.div>

        {/* ── Filters row ── */}
        <motion.div
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              className={`${inputCls} w-full pl-9`}
              placeholder="Search order ID or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Status
            </label>
            <select
              className={inputCls}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              From
            </label>
            <input
              type="date"
              className={inputCls}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          {/* Date to */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              To
            </label>
            <input
              type="date"
              className={inputCls}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Clear filters */}
          {(filterStatus !== "all" || dateFrom || dateTo || search) && (
            <motion.button
              {...btnMotion}
              onClick={() => {
                setFilterStatus("all");
                setDateFrom("");
                setDateTo("");
                setSearch("");
              }}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
            >
              Clear
            </motion.button>
          )}
        </motion.div>

        {/* ── Orders table ── */}
        <motion.div
          className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.35 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3.5">Order ID</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Update Status</th>
                </tr>
              </thead>

              <tbody>
                {/* Loading skeletons */}
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={`skel-${i}`} />
                  ))}

                {/* Empty state */}
                {!loading && displayedOrders.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState />
                    </td>
                  </tr>
                )}

                {/* Data rows — AnimatePresence wraps individual motion.tr elements directly */}
                <AnimatePresence mode="popLayout">
                  {!loading &&
                    displayedOrders.map((order, i) => {
                      const orderId = order.id ?? order._id;
                      const nextOptions = NEXT_STATUSES[order.status] ?? [];
                      const isUpdating = updatingId === orderId;

                      return (
                        <motion.tr
                          key={String(orderId)}
                          custom={i}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          className="border-b last:border-0 hover:bg-gray-50/70 transition-colors"
                        >
                            {/* Order ID */}
                            <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                              <span title={String(orderId)}>
                                #{shortId(orderId)}
                              </span>
                            </td>

                            {/* Customer email */}
                            <td className="px-4 py-3.5 max-w-[160px]">
                              <span
                                className="block truncate font-medium text-gray-700"
                                title={order.user_email}
                              >
                                {order.user_email ?? "—"}
                              </span>
                            </td>

                            {/* Items count */}
                            <td className="px-4 py-3.5 text-center font-semibold text-gray-700">
                              {order.item_count ?? 0}
                            </td>

                            {/* Total */}
                            <td className="px-4 py-3.5 font-semibold text-gray-800">
                              {formatCurrency(order.total_amount)}
                              {Number(order.discount_amount ?? 0) > 0 && (
                                <span className="ml-1.5 text-xs font-normal text-emerald-600">
                                  -{formatCurrency(order.discount_amount)}
                                </span>
                              )}
                            </td>

                            {/* Payment method */}
                            <td className="px-4 py-3.5 capitalize text-gray-500">
                              {order.payment_method ?? "—"}
                            </td>

                            {/* Status badge */}
                            <td className="px-4 py-3.5">
                              <StatusBadge status={order.status} />
                            </td>

                            {/* Created at */}
                            <td className="px-4 py-3.5 text-xs text-gray-400">
                              {formatDate(order.created_at)}
                            </td>

                            {/* Status update dropdown */}
                            <td className="px-4 py-3.5">
                              {nextOptions.length === 0 ? (
                                <span className="text-xs text-gray-300 italic">
                                  {order.status === "delivered"
                                    ? "Completed"
                                    : "No actions"}
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <select
                                    className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50"
                                    defaultValue=""
                                    disabled={isUpdating}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val) handleStatusChange(orderId, val);
                                      e.target.value = "";
                                    }}
                                  >
                                    <option value="" disabled>
                                      Move to…
                                    </option>
                                    {nextOptions.map((s) => (
                                      <option key={s} value={s}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                  {isUpdating && (
                                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                                  )}
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {!loading && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">
                Page{" "}
                <span className="font-semibold text-gray-600">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-600">
                  {pagination.total_pages}
                </span>{" "}
                &mdash; {pagination.total} orders
              </p>
              <div className="flex items-center gap-2">
                <motion.button
                  {...btnMotion}
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
                >
                  <FaChevronLeft className="h-3 w-3" />
                </motion.button>

                {/* Page number buttons: show up to 5 around current */}
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === pagination.total_pages ||
                      Math.abs(p - pagination.page) <= 2,
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "…" ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm">
                        …
                      </span>
                    ) : (
                      <motion.button
                        key={item}
                        {...btnMotion}
                        onClick={() => goToPage(item)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
                          item === pagination.page
                            ? "bg-gray-900 text-white shadow-sm"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {item}
                      </motion.button>
                    ),
                  )}

                <motion.button
                  {...btnMotion}
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
                >
                  <FaChevronRight className="h-3 w-3" />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      </div>
    </div>
  );
}
