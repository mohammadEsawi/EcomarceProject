import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaBan,
  FaBoxes,
  FaCheck,
  FaClock,
  FaDollarSign,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaShoppingCart,
  FaTrash,
} from "react-icons/fa";
import {
  createAdminAccount,
  createProduct,
  deleteProduct,
  getDashboardStats,
  getProducts,
  getStockAlerts,
  resolveStockAlert,
  updateProduct,
} from "../api/client";
import { ShopContext } from "../context/ShopContextProvider";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Products", "Stock Alerts"];

const CATEGORY_MAP = { Men: 1, Women: 2, Kids: 3, Accessories: 4 };
const CATEGORY_OPTIONS = Object.keys(CATEGORY_MAP);

const EMPTY_PRODUCT_FORM = {
  name: "",
  description: "",
  price: "",
  discount_price: "",
  category_name: "Men",
  is_featured: false,
  is_visible: true,
  main_image_url: "",
};

const EMPTY_ADMIN_FORM = { name: "", email: "", password: "" };

// ─── Animation variants ───────────────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const tabContentVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: (dir) => ({
    opacity: 0,
    x: dir < 0 ? 40 : -40,
    transition: { duration: 0.2, ease: "easeIn" },
  }),
};

const cardContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: "easeOut" },
  }),
  exit: { opacity: 0, x: 40, transition: { duration: 0.25 } },
};

const btnMotion = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } };

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    let start = null;
    const numeric = parseFloat(target) || 0;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * numeric));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
      else setValue(numeric);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return value;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, onClick, prefix = "" }) {
  const numeric = parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
  const counted = useCountUp(numeric);
  const formatted =
    prefix === "$"
      ? `$${counted.toLocaleString()}`
      : counted.toLocaleString();

  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-emerald-500 to-emerald-600",
    yellow: "from-amber-400 to-amber-500",
    orange: "from-orange-500 to-orange-600",
    red: "from-rose-500 to-rose-600",
  };

  return (
    <motion.div
      variants={cardVariants}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorMap[color]} p-5 text-white shadow-lg ${onClick ? "cursor-pointer" : ""}`}
      whileHover={onClick ? { scale: 1.03, y: -2 } : { scale: 1.01 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            {label}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{formatted}</p>
        </div>
        <div className="rounded-xl bg-white/20 p-3">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {onClick && (
        <p className="mt-3 text-xs text-white/60">Click to view &rarr;</p>
      )}
      {/* decorative circle */}
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const map = {
    available: "bg-emerald-100 text-emerald-700",
    low_stock: "bg-amber-100 text-amber-700",
    out_of_stock: "bg-rose-100 text-rose-700",
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
  };
  const cls = map[status] || "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function AlertTypeBadge({ type }) {
  const cls =
    type === "out_of_stock"
      ? "bg-rose-100 text-rose-700"
      : "bg-amber-100 text-amber-700";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}
    >
      {type?.replace(/_/g, " ")}
    </span>
  );
}

function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, message, color = "text-gray-400" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Icon className={`h-10 w-10 ${color}`} />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ─── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ stats, loadingStats, onSwitchToStock }) {
  if (loadingStats) return <LoadingSpinner label="Loading dashboard stats..." />;
  if (!stats) return <EmptyState icon={FaBoxes} message="Could not load stats." />;

  const statCards = [
    {
      icon: FaBoxes,
      label: "Total Products",
      value: stats.total_products ?? 0,
      color: "blue",
    },
    {
      icon: FaShoppingCart,
      label: "Total Orders",
      value: stats.total_orders ?? 0,
      color: "purple",
    },
    {
      icon: FaDollarSign,
      label: "Total Revenue",
      value: stats.total_revenue ?? 0,
      color: "green",
      prefix: "$",
    },
    {
      icon: FaClock,
      label: "Pending Orders",
      value: stats.pending_orders ?? 0,
      color: "yellow",
    },
    {
      icon: FaExclamationTriangle,
      label: "Low Stock Items",
      value: stats.low_stock_items ?? 0,
      color: "orange",
      onClick: onSwitchToStock,
    },
    {
      icon: FaBan,
      label: "Out of Stock",
      value: stats.out_of_stock_items ?? 0,
      color: "red",
      onClick: onSwitchToStock,
    },
  ];

  const topProducts = stats.top_selling_products || [];
  const recentOrders = stats.recent_orders || [];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        variants={cardContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </motion.div>

      {/* Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Selling */}
        <motion.div
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">
            Top Selling Products
          </h3>
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No data yet
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-3">#</th>
                  <th className="pb-3 pr-3">Product</th>
                  <th className="pb-3 text-right">Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <motion.tr
                    key={p.id ?? i}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className="border-b last:border-0"
                  >
                    <td className="py-2.5 pr-3 font-bold text-gray-300">
                      {i + 1}
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-gray-800">
                      {p.name}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-indigo-600">
                      {p.units_sold ?? p.total_sold ?? 0}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">
            Recent Orders
          </h3>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No orders yet
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-2">Order ID</th>
                  <th className="pb-3 pr-2">Customer</th>
                  <th className="pb-3 pr-2">Status</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => {
                  const rawId = String(o.id ?? o._id ?? "");
                  const shortId = rawId.length > 8 ? `#${rawId.slice(-8)}` : `#${rawId}`;
                  return (
                    <motion.tr
                      key={rawId || i}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      className="border-b last:border-0"
                    >
                      <td className="py-2.5 pr-2 font-mono text-xs text-gray-500">
                        {shortId}
                      </td>
                      <td className="py-2.5 pr-2 max-w-[120px] truncate text-gray-700">
                        {o.customer_email ?? o.email ?? "—"}
                      </td>
                      <td className="py-2.5 pr-2">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-800">
                        ${Number(o.total ?? o.total_amount ?? 0).toFixed(2)}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Tab: Products ─────────────────────────────────────────────────────────────

function ProductsTab({ adminToken }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [adminFormVisible, setAdminFormVisible] = useState(false);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : data?.products ?? []);
    } catch (err) {
      toast.error(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const resetForm = () => {
    setForm(EMPTY_PRODUCT_FORM);
    setEditingId(null);
  };

  const startEdit = (p) => {
    setEditingId(p.id ?? p._id);
    setForm({
      name: p.name ?? "",
      description: p.description ?? "",
      price: String(p.price ?? ""),
      discount_price: String(p.discount_price ?? ""),
      category_name: p.category_name ?? "Men",
      is_featured: Boolean(p.is_featured),
      is_visible: p.is_visible !== undefined ? Boolean(p.is_visible) : true,
      main_image_url: p.main_image_url ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await updateProduct(
          editingId,
          {
            name: form.name.trim(),
            description: form.description.trim(),
            price: Number(form.price),
            discount_price: form.discount_price ? Number(form.discount_price) : null,
            is_featured: form.is_featured,
            is_visible: form.is_visible,
            main_image_url: form.main_image_url.trim(),
          },
          adminToken,
        );
        toast.success("Product updated");
      } else {
        await createProduct(
          {
            name: form.name.trim(),
            description: form.description.trim(),
            price: Number(form.price),
            discount_price: form.discount_price ? Number(form.discount_price) : null,
            category_id: CATEGORY_MAP[form.category_name] ?? 1,
            is_featured: form.is_featured,
            is_visible: form.is_visible,
            main_image_url: form.main_image_url.trim(),
          },
          adminToken,
        );
        toast.success("Product created");
      }
      await loadProducts();
      resetForm();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id, adminToken);
      setProducts((prev) => prev.filter((p) => (p.id ?? p._id) !== id));
      if (editingId === id) resetForm();
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      setCreatingAdmin(true);
      await createAdminAccount(
        {
          name: adminForm.name.trim(),
          email: adminForm.email.trim(),
          password: adminForm.password,
        },
        adminToken,
      );
      setAdminForm(EMPTY_ADMIN_FORM);
      toast.success("Admin account created");
    } catch (err) {
      toast.error(err.message || "Failed to create admin");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* ── Left: Form ── */}
      <div className="space-y-5 lg:col-span-2">
        {/* Product Form */}
        <motion.div
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h2 className="mb-5 text-lg font-bold text-gray-800">
            {editingId ? "Edit Product" : "Add New Product"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className={inputCls}
              placeholder="Product name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <textarea
              className={`${inputCls} resize-none`}
              placeholder="Description"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className={inputCls}
                type="number"
                min="0"
                step="0.01"
                placeholder="Price *"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                required
              />
              <input
                className={inputCls}
                type="number"
                min="0"
                step="0.01"
                placeholder="Discount price"
                value={form.discount_price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discount_price: e.target.value }))
                }
              />
            </div>
            <select
              className={inputCls}
              value={form.category_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, category_name: e.target.value }))
              }
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              className={inputCls}
              placeholder="Main image URL"
              value={form.main_image_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, main_image_url: e.target.value }))
              }
            />
            <div className="flex gap-6 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_featured: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-indigo-600"
                />
                Featured
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_visible: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-indigo-600"
                />
                Visible
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <motion.button
                {...btnMotion}
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition"
              >
                {saving ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : editingId ? (
                  <FaEdit className="h-4 w-4" />
                ) : (
                  <FaPlus className="h-4 w-4" />
                )}
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Product"
                    : "Add Product"}
              </motion.button>
              {editingId && (
                <motion.button
                  {...btnMotion}
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </motion.button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Create Admin (collapsible) */}
        <motion.div
          className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <button
            onClick={() => setAdminFormVisible((v) => !v)}
            className="flex w-full items-center justify-between px-6 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <span>Create Admin Account</span>
            {adminFormVisible ? (
              <FaEyeSlash className="h-4 w-4 text-gray-400" />
            ) : (
              <FaEye className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {adminFormVisible && (
              <motion.div
                key="admin-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="border-t border-gray-100 px-6 pb-6 pt-4">
                  <form onSubmit={handleCreateAdmin} className="space-y-3">
                    <input
                      className={inputCls}
                      placeholder="Full name"
                      value={adminForm.name}
                      onChange={(e) =>
                        setAdminForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                    />
                    <input
                      className={inputCls}
                      type="email"
                      placeholder="Email"
                      value={adminForm.email}
                      onChange={(e) =>
                        setAdminForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                    />
                    <input
                      className={inputCls}
                      type="password"
                      placeholder="Password (min 8 chars)"
                      value={adminForm.password}
                      minLength={8}
                      onChange={(e) =>
                        setAdminForm((f) => ({
                          ...f,
                          password: e.target.value,
                        }))
                      }
                      required
                    />
                    <motion.button
                      {...btnMotion}
                      type="submit"
                      disabled={creatingAdmin}
                      className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 transition"
                    >
                      {creatingAdmin ? "Creating..." : "Create Admin"}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Right: Products Table ── */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2 className="mb-5 text-lg font-bold text-gray-800">
          All Products
          <span className="ml-2 rounded-full bg-indigo-50 px-2.5 py-0.5 text-sm font-medium text-indigo-600">
            {products.length}
          </span>
        </h2>

        {loading ? (
          <LoadingSpinner label="Loading products..." />
        ) : products.length === 0 ? (
          <EmptyState icon={FaBoxes} message="No products found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-3">Image</th>
                  <th className="pb-3 pr-3">Name</th>
                  <th className="pb-3 pr-3">Category</th>
                  <th className="pb-3 pr-3">Price</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3 pr-3">Featured</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {products.map((p, i) => {
                    const pid = p.id ?? p._id;
                    const isFeatured = Boolean(p.is_featured);
                    return (
                      <motion.tr
                        key={pid}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="border-b last:border-0 hover:bg-gray-50 transition"
                      >
                        <td className="py-3 pr-3">
                          {p.main_image_url ? (
                            <img
                              src={p.main_image_url}
                              alt={p.name}
                              className="h-10 w-10 rounded-lg object-cover shadow-sm"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
                              <FaBoxes className="h-5 w-5" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-3 max-w-[130px]">
                          <p className="truncate font-medium text-gray-800">
                            {p.name}
                          </p>
                        </td>
                        <td className="py-3 pr-3 text-gray-500">
                          {p.category_name ?? "—"}
                        </td>
                        <td className="py-3 pr-3 font-semibold text-gray-800">
                          ${Number(p.price ?? 0).toFixed(2)}
                          {p.discount_price && (
                            <span className="ml-1 text-xs text-gray-400 line-through">
                              ${Number(p.discount_price).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <StatusBadge status={p.status ?? "available"} />
                        </td>
                        <td className="py-3 pr-3">
                          {isFeatured ? (
                            <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                              Yes
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1.5">
                            <motion.button
                              {...btnMotion}
                              onClick={() => startEdit(p)}
                              className="rounded-lg bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100 transition"
                              title="Edit"
                            >
                              <FaEdit className="h-3.5 w-3.5" />
                            </motion.button>
                            <motion.button
                              {...btnMotion}
                              onClick={() => handleDelete(pid)}
                              className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition"
                              title="Delete"
                            >
                              <FaTrash className="h-3.5 w-3.5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Tab: Stock Alerts ─────────────────────────────────────────────────────────

function StockAlertsTab({ adminToken }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStockAlerts(adminToken);
      const list = Array.isArray(data) ? data : data?.alerts ?? [];
      setAlerts(list.filter((a) => !a.resolved_at && !a.is_resolved));
    } catch (err) {
      toast.error(err.message || "Failed to load stock alerts");
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleResolve = async (alertId) => {
    try {
      setResolving(alertId);
      await resolveStockAlert(alertId, adminToken);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success("Alert resolved");
    } catch (err) {
      toast.error(err.message || "Failed to resolve alert");
    } finally {
      setResolving(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading stock alerts..." />;

  if (alerts.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center gap-4 py-28"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <FaCheck className="h-9 w-9 text-emerald-500" />
        </div>
        <p className="text-xl font-bold text-gray-700">All good!</p>
        <p className="text-sm text-gray-400">No stock alerts at the moment.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="mb-5 text-lg font-bold text-gray-800">
        Stock Alerts
        <span className="ml-2 rounded-full bg-rose-50 px-2.5 py-0.5 text-sm font-medium text-rose-600">
          {alerts.length}
        </span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-400">
              <th className="pb-3 pr-4">Product</th>
              <th className="pb-3 pr-4">Color</th>
              <th className="pb-3 pr-4">Size</th>
              <th className="pb-3 pr-4">Qty</th>
              <th className="pb-3 pr-4">Type</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {alerts.map((a, i) => (
                <motion.tr
                  key={a.id}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="border-b last:border-0 hover:bg-gray-50 transition"
                >
                  <td className="py-3 pr-4 font-medium text-gray-800">
                    {a.product_name ?? a.product?.name ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{a.color ?? "—"}</td>
                  <td className="py-3 pr-4 text-gray-500">{a.size ?? "—"}</td>
                  <td className="py-3 pr-4 font-bold text-gray-700">
                    {a.current_quantity ?? a.quantity ?? 0}
                  </td>
                  <td className="py-3 pr-4">
                    <AlertTypeBadge type={a.alert_type ?? a.type} />
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-400">
                    {a.created_at
                      ? new Date(a.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-3">
                    <motion.button
                      {...btnMotion}
                      onClick={() => handleResolve(a.id)}
                      disabled={resolving === a.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition"
                    >
                      {resolving === a.id ? (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      ) : (
                        <FaCheck className="h-3 w-3" />
                      )}
                      Resolve
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ─── Root Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { adminToken, adminUser, adminLogout } = useContext(ShopContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [prevTab, setPrevTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!adminToken) navigate("/admin/login");
  }, [adminToken, navigate]);

  // Load stats when Overview is active
  useEffect(() => {
    if (!adminToken || activeTab !== 0) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingStats(true);
        const data = await getDashboardStats(adminToken);
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) toast.error(err.message || "Failed to load stats");
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminToken, activeTab]);

  const switchTab = (idx) => {
    setPrevTab(activeTab);
    setActiveTab(idx);
  };

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  const dir = activeTab > prevTab ? 1 : -1;

  if (!adminToken) return null;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          {/* Left: title + email */}
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight text-gray-900">
              Admin Dashboard
            </h1>
            {adminUser?.email && (
              <p className="truncate text-xs text-gray-400">
                {adminUser.email}
              </p>
            )}
          </div>

          {/* Center: Tabs */}
          <nav className="flex rounded-xl bg-gray-100 p-1">
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => switchTab(idx)}
                className={`relative rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeTab === idx
                    ? "text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {activeTab === idx && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative">{tab}</span>
              </button>
            ))}
          </nav>

          {/* Right: Logout */}
          <motion.button
            {...btnMotion}
            onClick={handleLogout}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
          >
            Logout
          </motion.button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={activeTab}
            custom={dir}
            variants={tabContentVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {activeTab === 0 && (
              <OverviewTab
                stats={stats}
                loadingStats={loadingStats}
                onSwitchToStock={() => switchTab(2)}
              />
            )}
            {activeTab === 1 && <ProductsTab adminToken={adminToken} />}
            {activeTab === 2 && <StockAlertsTab adminToken={adminToken} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
