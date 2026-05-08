import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaBan, FaBoxes, FaCheck, FaClock, FaDollarSign, FaEdit,
  FaExclamationTriangle, FaEye, FaEyeSlash, FaPlus, FaShoppingCart,
  FaTrash, FaUsers,
} from "react-icons/fa";
import {
  createAdminAccount, createProduct, deleteProduct, getDashboardStats,
  getAdminUsers, getProducts, getStockAlerts, resolveStockAlert, updateProduct,
} from "../api/client";
import { ShopContext } from "../context/ShopContextProvider";
import AdminSidebar from "../components/AdminSidebar";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = ["overview", "products", "users", "stock"];

const CATEGORY_MAP    = { Men: 1, Women: 2, Kids: 3, Accessories: 4 };
const CATEGORY_OPTIONS = Object.keys(CATEGORY_MAP);

const EMPTY_FORM = {
  name: "", description: "", price: "", discount_price: "",
  category_name: "Men", is_featured: false, is_visible: true, main_image_url: "",
};

// ─── Motion helpers ───────────────────────────────────────────────────────────
const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const btn = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target, ms = 1100) {
  const [v, setV] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let t0 = null;
    const n = parseFloat(target) || 0;
    const step = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / ms, 1);
      setV(Math.floor(p * n));
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setV(n);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms]);
  return v;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, prefix = "", onClick }) {
  const n = useCountUp(parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0);
  const display = prefix === "$" ? `$${n.toLocaleString()}` : n.toLocaleString();
  const grad = {
    blue:   "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    green:  "from-emerald-500 to-emerald-600",
    amber:  "from-amber-400 to-amber-500",
    orange: "from-orange-500 to-orange-600",
    red:    "from-rose-500 to-rose-600",
    indigo: "from-indigo-500 to-indigo-600",
  };
  return (
    <motion.div
      variants={fade}
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad[color]} p-5 text-white shadow-lg ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">{label}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight">{display}</p>
        </div>
        <div className="rounded-xl bg-white/20 p-2.5"><Icon className="h-5 w-5" /></div>
      </div>
      {onClick && <p className="mt-2.5 text-[11px] text-white/60">View details →</p>}
      <div className="pointer-events-none absolute -bottom-5 -right-5 h-20 w-20 rounded-full bg-white/10" />
    </motion.div>
  );
}

function Badge({ status }) {
  const map = {
    available: "bg-emerald-100 text-emerald-700",
    low_stock: "bg-amber-100 text-amber-700",
    out_of_stock: "bg-rose-100 text-rose-700",
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
    customer: "bg-gray-100 text-gray-600",
    admin: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition";

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ stats, loading, onStockTab }) {
  if (loading) return <Spinner label="Loading dashboard…" />;
  if (!stats)  return <p className="py-20 text-center text-gray-400">Could not load stats.</p>;

  const cards = [
    { icon: FaBoxes,              label: "Products",      value: stats.total_products ?? 0,     color: "blue"   },
    { icon: FaShoppingCart,       label: "Total Orders",  value: stats.total_orders   ?? 0,     color: "purple" },
    { icon: FaDollarSign,         label: "Revenue",       value: stats.total_revenue  ?? 0,     color: "green",  prefix: "$" },
    { icon: FaClock,              label: "Pending",       value: stats.pending_orders ?? 0,     color: "amber"  },
    { icon: FaExclamationTriangle,label: "Low Stock",     value: stats.low_stock_items    ?? 0, color: "orange", onClick: onStockTab },
    { icon: FaBan,                label: "Out of Stock",  value: stats.out_of_stock_items ?? 0, color: "red",    onClick: onStockTab },
  ];

  const top     = stats.top_selling_products ?? [];
  const recent  = stats.recent_orders        ?? [];

  return (
    <div className="space-y-8">
      <motion.div className="grid grid-cols-2 gap-4 sm:grid-cols-3" variants={stagger} initial="hidden" animate="visible">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top selling */}
        <motion.div variants={fade} initial="hidden" animate="visible" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Top Selling Products</h3>
          {top.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No sales yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3">#</th><th className="pb-3">Product</th><th className="pb-3 text-right">Units</th><th className="pb-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {top.map((p, i) => (
                  <tr key={p.id ?? i} className="border-b last:border-0">
                    <td className="py-2.5 pr-3 font-bold text-gray-300">{i + 1}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        {p.main_image_url && <img src={p.main_image_url} className="h-8 w-8 rounded-lg object-cover" alt="" />}
                        <span className="font-medium text-gray-800 truncate max-w-[110px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-indigo-600">{p.units_sold ?? 0}</td>
                    <td className="py-2.5 text-right text-gray-600">${Number(p.revenue ?? 0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* Recent orders */}
        <motion.div variants={fade} initial="hidden" animate="visible" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs font-semibold text-indigo-600 hover:underline">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No orders yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3">ID</th><th className="pb-3">Customer</th><th className="pb-3">Status</th><th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o, i) => (
                  <tr key={o.id ?? i} className="border-b last:border-0">
                    <td className="py-2.5 pr-3 font-mono text-xs text-gray-400">#{String(o.id).slice(-6)}</td>
                    <td className="py-2.5 pr-3 max-w-[120px] truncate text-gray-700">{o.customer_email ?? o.user_email ?? "—"}</td>
                    <td className="py-2.5 pr-3"><Badge status={o.status} /></td>
                    <td className="py-2.5 text-right font-semibold">${Number(o.total_amount ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Tab: Products ────────────────────────────────────────────────────────────
function ProductsTab({ adminToken }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getProducts({ limit: 100 });
      setProducts(Array.isArray(d) ? d : d?.products ?? []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(EMPTY_FORM); setEditId(null); };

  const startEdit = (p) => {
    setEditId(p.id ?? p._id);
    setForm({
      name: p.name ?? "", description: p.description ?? "",
      price: String(p.price ?? ""), discount_price: String(p.discount_price ?? ""),
      category_name: p.category_name ?? "Men",
      is_featured: Boolean(p.is_featured), is_visible: p.is_visible !== false,
      main_image_url: p.main_image_url ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) { toast.error("Name and price required"); return; }
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(), description: form.description.trim(),
        price: Number(form.price),
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        is_featured: form.is_featured, is_visible: form.is_visible,
        main_image_url: form.main_image_url.trim(),
      };
      if (editId) { await updateProduct(editId, payload, adminToken); toast.success("Product updated"); }
      else { await createProduct({ ...payload, category_id: CATEGORY_MAP[form.category_name] ?? 1 }, adminToken); toast.success("Product created"); }
      await load(); reset();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await deleteProduct(id, adminToken); setProducts((p) => p.filter((x) => (x.id ?? x._id) !== id)); if (editId === id) reset(); toast.success("Deleted"); }
    catch (e) { toast.error(e.message); }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      setCreatingAdmin(true);
      await createAdminAccount({ name: adminForm.name.trim(), email: adminForm.email.trim(), password: adminForm.password }, adminToken);
      setAdminForm({ name: "", email: "", password: "" });
      toast.success("Admin account created");
    } catch (e) { toast.error(e.message); }
    finally { setCreatingAdmin(false); }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Form panel */}
      <div className="space-y-5 lg:col-span-2">
        <motion.div variants={fade} initial="hidden" animate="visible" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-gray-800">{editId ? "Edit Product" : "Add Product"}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input className={inputCls} placeholder="Product name *" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <input className={inputCls} type="number" min="0" step="0.01" placeholder="Price *" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required />
              <input className={inputCls} type="number" min="0" step="0.01" placeholder="Discount price" value={form.discount_price} onChange={(e) => setForm(f => ({ ...f, discount_price: e.target.value }))} />
            </div>
            <select className={inputCls} value={form.category_name} onChange={(e) => setForm(f => ({ ...f, category_name: e.target.value }))}>
              {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className={inputCls} placeholder="Main image URL" value={form.main_image_url} onChange={(e) => setForm(f => ({ ...f, main_image_url: e.target.value }))} />
            <div className="flex gap-6 pt-1">
              {[["is_featured","Featured"],["is_visible","Visible"]].map(([key,lbl]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer text-gray-700">
                  <input type="checkbox" checked={form[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.checked }))} className="h-4 w-4 rounded accent-indigo-600" />
                  {lbl}
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <motion.button {...btn} type="submit" disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition">
                {saving ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : editId ? <FaEdit className="h-3.5 w-3.5" /> : <FaPlus className="h-3.5 w-3.5" />}
                {saving ? "Saving…" : editId ? "Update" : "Add Product"}
              </motion.button>
              {editId && <motion.button {...btn} type="button" onClick={reset} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</motion.button>}
            </div>
          </form>
        </motion.div>

        {/* Create admin (collapsible) */}
        <motion.div variants={fade} initial="hidden" animate="visible" className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <button onClick={() => setShowAdminForm(v => !v)} className="flex w-full items-center justify-between px-6 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
            <span>Create Admin Account</span>
            {showAdminForm ? <FaEyeSlash className="h-4 w-4 text-gray-400" /> : <FaEye className="h-4 w-4 text-gray-400" />}
          </button>
          <AnimatePresence initial={false}>
            {showAdminForm && (
              <motion.div key="af" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
                <div className="border-t border-gray-100 px-6 pb-6 pt-4">
                  <form onSubmit={handleCreateAdmin} className="space-y-3">
                    <input className={inputCls} placeholder="Full name" value={adminForm.name} onChange={(e) => setAdminForm(f => ({ ...f, name: e.target.value }))} required />
                    <input className={inputCls} type="email" placeholder="Email" value={adminForm.email} onChange={(e) => setAdminForm(f => ({ ...f, email: e.target.value }))} required />
                    <input className={inputCls} type="password" placeholder="Password (min 8 chars)" minLength={8} value={adminForm.password} onChange={(e) => setAdminForm(f => ({ ...f, password: e.target.value }))} required />
                    <motion.button {...btn} type="submit" disabled={creatingAdmin} className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 transition">
                      {creatingAdmin ? "Creating…" : "Create Admin"}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Products table */}
      <motion.div variants={fade} initial="hidden" animate="visible" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-3">
        <h2 className="mb-5 text-lg font-bold text-gray-800">
          All Products <span className="ml-2 rounded-full bg-indigo-50 px-2.5 py-0.5 text-sm font-medium text-indigo-600">{products.length}</span>
        </h2>
        {loading ? <Spinner label="Loading products…" /> : products.length === 0 ? (
          <p className="py-20 text-center text-gray-400">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-3">Image</th><th className="pb-3 pr-3">Name</th>
                  <th className="pb-3 pr-3">Price</th><th className="pb-3 pr-3">Status</th>
                  <th className="pb-3 pr-3">Featured</th><th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {products.map((p, i) => {
                    const pid = p.id ?? p._id;
                    return (
                      <motion.tr key={pid} custom={i} variants={fade} initial="hidden" animate="visible" exit={{ opacity: 0, x: 30 }} className="border-b last:border-0 hover:bg-gray-50 transition">
                        <td className="py-3 pr-3">
                          {p.main_image_url
                            ? <img src={p.main_image_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover shadow-sm" />
                            : <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300"><FaBoxes /></div>}
                        </td>
                        <td className="py-3 pr-3 max-w-[130px]"><p className="truncate font-medium text-gray-800">{p.name}</p></td>
                        <td className="py-3 pr-3 font-semibold">
                          ${Number(p.price ?? 0).toFixed(2)}
                          {p.discount_price && <span className="ml-1 text-xs text-gray-400 line-through">${Number(p.discount_price).toFixed(2)}</span>}
                        </td>
                        <td className="py-3 pr-3"><Badge status={p.status ?? "available"} /></td>
                        <td className="py-3 pr-3">
                          {p.is_featured ? <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">Yes</span> : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1.5">
                            <motion.button {...btn} onClick={() => startEdit(p)} className="rounded-lg bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100 transition"><FaEdit className="h-3.5 w-3.5" /></motion.button>
                            <motion.button {...btn} onClick={() => handleDelete(pid)} className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition"><FaTrash className="h-3.5 w-3.5" /></motion.button>
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

// ─── Tab: Users ───────────────────────────────────────────────────────────────
function UsersTab({ adminToken }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const d = await getAdminUsers(adminToken, { limit: 50 });
        setUsers(d?.users ?? []);
        setTotal(d?.pagination?.total ?? 0);
      } catch (e) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, [adminToken]);

  if (loading) return <Spinner label="Loading users…" />;

  return (
    <motion.div variants={fade} initial="hidden" animate="visible" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-bold text-gray-800">
        Registered Users <span className="ml-2 rounded-full bg-indigo-50 px-2.5 py-0.5 text-sm font-medium text-indigo-600">{total}</span>
      </h2>
      {users.length === 0 ? (
        <p className="py-20 text-center text-gray-400">No users yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-3 pr-4">ID</th><th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th><th className="pb-3 pr-4">Phone</th>
                <th className="pb-3 pr-4">Role</th><th className="pb-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr key={u.id} custom={i} variants={fade} initial="hidden" animate="visible" className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="py-3 pr-4 font-mono text-xs text-gray-400">#{String(u.id).slice(-4)}</td>
                  <td className="py-3 pr-4 font-medium text-gray-800">{u.name}</td>
                  <td className="py-3 pr-4 text-gray-600 max-w-[180px] truncate">{u.email}</td>
                  <td className="py-3 pr-4 text-gray-500">{u.phone ?? "—"}</td>
                  <td className="py-3 pr-4"><Badge status={u.role} /></td>
                  <td className="py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

// ─── Tab: Stock Alerts ────────────────────────────────────────────────────────
function StockAlertsTab({ adminToken }) {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getStockAlerts(adminToken);
      const list = Array.isArray(d) ? d : d?.alerts ?? [];
      setAlerts(list.filter((a) => !a.resolved_at && !a.is_resolved));
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [adminToken]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id) => {
    try {
      setResolving(id);
      await resolveStockAlert(id, adminToken);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast.success("Alert resolved");
    } catch (e) { toast.error(e.message); }
    finally { setResolving(null); }
  };

  if (loading) return <Spinner label="Loading stock alerts…" />;
  if (alerts.length === 0) {
    return (
      <motion.div variants={fade} initial="hidden" animate="visible" className="flex flex-col items-center justify-center gap-4 py-28">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <FaCheck className="h-8 w-8 text-emerald-500" />
        </div>
        <p className="text-xl font-bold text-gray-700">All clear!</p>
        <p className="text-sm text-gray-400">No stock alerts right now.</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fade} initial="hidden" animate="visible" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-bold text-gray-800">
        Stock Alerts <span className="ml-2 rounded-full bg-rose-50 px-2.5 py-0.5 text-sm font-medium text-rose-600">{alerts.length}</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-400">
              <th className="pb-3 pr-4">Product</th><th className="pb-3 pr-4">Color</th>
              <th className="pb-3 pr-4">Size</th><th className="pb-3 pr-4">Qty</th>
              <th className="pb-3 pr-4">Type</th><th className="pb-3 pr-4">Date</th>
              <th className="pb-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {alerts.map((a, i) => (
                <motion.tr key={a.id} custom={i} variants={fade} initial="hidden" animate="visible" exit={{ opacity: 0, x: 30 }} layout className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="py-3 pr-4 font-medium text-gray-800">{a.product_name ?? "—"}</td>
                  <td className="py-3 pr-4 text-gray-500">{a.color ?? "—"}</td>
                  <td className="py-3 pr-4 text-gray-500">{a.size  ?? "—"}</td>
                  <td className="py-3 pr-4 font-bold text-gray-700">{a.current_quantity ?? a.quantity ?? 0}</td>
                  <td className="py-3 pr-4"><Badge status={a.alert_type ?? a.type} /></td>
                  <td className="py-3 pr-4 text-xs text-gray-400">{a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}</td>
                  <td className="py-3">
                    <motion.button {...btn} onClick={() => handleResolve(a.id)} disabled={resolving === a.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition">
                      {resolving === a.id ? <span className="h-3 w-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <FaCheck className="h-3 w-3" />}
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

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { adminToken } = useContext(ShopContext);
  const navigate = useNavigate();
  const [tab, setTab]              = useState("overview");
  const [stats, setStats]          = useState(null);
  const [loadingStats, setLoading] = useState(true);

  useEffect(() => { if (!adminToken) navigate("/login"); }, [adminToken, navigate]);

  useEffect(() => {
    if (!adminToken || tab !== "overview") return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const d = await getDashboardStats(adminToken);
        if (!cancelled) setStats(d);
      } catch (e) { if (!cancelled) toast.error(e.message); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [adminToken, tab]);

  if (!adminToken) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar activeTab={tab} setTab={setTab} />

      <div className="md:ml-60">
        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              {tab === "overview" && <OverviewTab stats={stats} loading={loadingStats} onStockTab={() => setTab("stock")} />}
              {tab === "products" && <ProductsTab adminToken={adminToken} />}
              {tab === "users"    && <UsersTab    adminToken={adminToken} />}
              {tab === "stock"    && <StockAlertsTab adminToken={adminToken} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
