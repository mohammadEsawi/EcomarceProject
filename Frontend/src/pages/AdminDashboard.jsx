import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  FaTachometerAlt, FaBoxes, FaUsers, FaExclamationTriangle,
  FaClipboardList, FaPlus, FaTrash, FaEdit, FaBell, FaTag, FaImage,
  FaDollarSign, FaArrowUp, FaArrowDown, FaShoppingCart, FaChartLine,
} from "react-icons/fa";
import { toast } from "react-toastify";
import AdminSidebar from "../components/AdminSidebar";
import { Modal } from "../components/ui/Modal";
import { Spinner, FullPageSpinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { SkeletonRow } from "../components/ui/SkeletonCard";
import { useAuthStore } from "../store/authStore";
import {
  useAnalyticsOverview, useSalesChart, useTopProducts,
  useAdminUsers, useAdminBrands, useAdminBanners,
  useCreateBrand, useUpdateBrand, useDeleteBrand,
  useCreateBanner, useDeleteBanner, useStockAlerts, useResolveStockAlert,
  useSendNotification,
} from "../hooks/useAdmin";
import { useAllOrders, useUpdateOrderStatus } from "../hooks/useOrders";
import { useProducts, useDeleteProduct, useCreateProduct, useUpdateProduct } from "../hooks/useProducts";
import api from "../lib/axios";

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, color = "indigo", trend }) {
  const colors = {
    indigo: "bg-indigo-500",
    emerald:"bg-emerald-500",
    amber:  "bg-amber-500",
    rose:   "bg-rose-500",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-extrabold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {trend != null && (
            <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${trend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {trend >= 0 ? <FaArrowUp className="h-2.5 w-2.5" /> : <FaArrowDown className="h-2.5 w-2.5" />}
              {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Products tab ──────────────────────────────────────────────────────────────
function ProductsTab({ adminToken }) {
  const { data, isLoading } = useProducts({ limit: 50 });
  const { mutate: deleteProduct, isPending: deleting } = useDeleteProduct();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const { mutate: createProduct, isPending: creating } = useCreateProduct();
  const { mutate: updateProduct, isPending: updating } = useUpdateProduct();
  const [form, setForm] = useState({ name: "", price: "", category_id: "", description: "", is_featured: false });

  const products = Array.isArray(data) ? data : (data?.products ?? []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editProduct) {
      updateProduct({ id: editProduct.id, ...form }, {
        onSuccess: () => { toast.success("Product updated"); setShowForm(false); setEditProduct(null); },
        onError: (e) => toast.error(e.message),
      });
    } else {
      createProduct(form, {
        onSuccess: () => { toast.success("Product created"); setShowForm(false); },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  if (isLoading) return <div className="space-y-3">{Array.from({length:5},(_,i)=><SkeletonRow key={i}/>)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">Products ({products.length})</h2>
        <button onClick={() => { setEditProduct(null); setForm({ name:"", price:"", category_id:"", description:"", is_featured:false }); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition">
          <FaPlus className="h-3.5 w-3.5" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Featured</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.main_image_url ? (
                        <img src={p.main_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                        {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">${Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === "available" ? "success" : p.status === "low_stock" ? "warning" : "danger"}>
                      {p.status?.replace("_"," ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {p.is_featured ? <Badge variant="info">Featured</Badge> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditProduct(p); setForm({ name:p.name, price:p.price, category_id:p.category_id, description:p.description, is_featured:p.is_featured }); setShowForm(true); }}
                      className="p-2 text-gray-400 hover:text-gray-700 transition">
                      <FaEdit className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { if(window.confirm("Delete this product?")) deleteProduct(p.id, { onSuccess:()=>toast.success("Deleted"), onError:(e)=>toast.error(e.message) }); }}
                      className="p-2 text-gray-400 hover:text-rose-500 transition ml-1">
                      <FaTrash className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editProduct ? "Edit Product" : "Add Product"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[["name","Product Name","text",true],["price","Price","number",true],["category_id","Category ID","number",false],["description","Description","text",false]].map(([k,l,t,req])=>(
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{l}{req&&" *"}</label>
              <input type={t} required={req} value={form[k]} onChange={(e)=>setForm(f=>({...f,[k]:e.target.value}))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-gray-900 outline-none" />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={(e)=>setForm(f=>({...f,is_featured:e.target.checked}))} className="accent-gray-900" />
            Featured product
          </label>
          <button type="submit" disabled={creating||updating} className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white disabled:opacity-60 transition flex items-center justify-center gap-2">
            {(creating||updating) && <Spinner size="sm" />}
            {editProduct ? "Update Product" : "Create Product"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const { data, isLoading } = useAdminUsers({ limit: 50 });
  const users = data?.users ?? [];

  if (isLoading) return <div className="space-y-3">{Array.from({length:5},(_,i)=><SkeletonRow key={i}/>)}</div>;

  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-4">Users ({data?.pagination?.total ?? users.length})</h2>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Badge variant={u.is_active !== false ? "success" : "danger"}>{u.is_active !== false ? "Active" : "Inactive"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Brands tab ────────────────────────────────────────────────────────────────
function BrandsTab() {
  const { data: brands = [], isLoading } = useAdminBrands();
  const { mutate: create, isPending: creating } = useCreateBrand();
  const { mutate: update } = useUpdateBrand();
  const { mutate: remove } = useDeleteBrand();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", description:"", logo_url:"", website_url:"" });

  const handleSubmit = (e) => {
    e.preventDefault();
    create(form, {
      onSuccess: () => { toast.success("Brand created"); setShowForm(false); setForm({name:"",description:"",logo_url:"",website_url:""}); },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">Brands ({brands.length})</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition">
          <FaPlus className="h-3.5 w-3.5" /> Add Brand
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
            {b.logo_url ? <img src={b.logo_url} alt="" className="w-12 h-12 rounded-xl object-contain" /> : <div className="w-12 h-12 bg-gray-100 rounded-xl" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{b.name}</p>
              <p className="text-xs text-gray-400">{b.product_count ?? 0} products</p>
            </div>
            <button onClick={() => { if(window.confirm("Delete brand?")) remove(b.id, { onSuccess:()=>toast.success("Brand deleted"), onError:(e)=>toast.error(e.message) }); }}
              className="p-2 text-gray-300 hover:text-rose-500 transition">
              <FaTrash className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Brand">
        <form onSubmit={handleSubmit} className="space-y-4">
          {[["name","Brand Name",true],["logo_url","Logo URL",false],["website_url","Website URL",false],["description","Description",false]].map(([k,l,req])=>(
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{l}{req&&" *"}</label>
              <input required={req} value={form[k]} onChange={(e)=>setForm(f=>({...f,[k]:e.target.value}))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-gray-900 outline-none" />
            </div>
          ))}
          <button type="submit" disabled={creating} className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white disabled:opacity-60 transition">
            {creating ? "Creating…" : "Create Brand"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

// ── Notifications tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const { mutate: send, isPending } = useSendNotification();
  const [form, setForm] = useState({ title:"", message:"", type:"promo", user_id:"" });

  const handleSend = (e) => {
    e.preventDefault();
    const payload = { ...form, user_id: form.user_id ? Number(form.user_id) : undefined };
    send(payload, {
      onSuccess: () => { toast.success("Notification sent!"); setForm({ title:"", message:"", type:"promo", user_id:"" }); },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-bold text-gray-800 mb-4">Send Notification</h2>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Target User ID (blank = broadcast)</label>
            <input type="number" value={form.user_id} onChange={(e)=>setForm(f=>({...f,user_id:e.target.value}))} placeholder="Leave blank to broadcast to all users"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-gray-900 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
            <select value={form.type} onChange={(e)=>setForm(f=>({...f,type:e.target.value}))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-gray-900 outline-none">
              {["promo","order","system","stock"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title *</label>
            <input required value={form.title} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-gray-900 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message *</label>
            <textarea required rows={4} value={form.message} onChange={(e)=>setForm(f=>({...f,message:e.target.value}))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-gray-900 outline-none resize-none" />
          </div>
          <button type="submit" disabled={isPending} className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white disabled:opacity-60 transition flex items-center justify-center gap-2">
            {isPending && <Spinner size="sm" />}
            <FaBell className="h-4 w-4" /> Send Notification
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Stock alerts tab ──────────────────────────────────────────────────────────
function StockTab() {
  const { data: alerts = [], isLoading } = useStockAlerts();
  const { mutate: resolve } = useResolveStockAlert();

  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-4">Stock Alerts ({alerts.length})</h2>
      {isLoading ? (
        <div className="space-y-3">{Array.from({length:4},(_,i)=><SkeletonRow key={i}/>)}</div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <FaExclamationTriangle className="mx-auto h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium">No active stock alerts</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${a.alert_type==="out_of_stock" ? "bg-red-500" : "bg-amber-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{a.product_name}</p>
                <p className="text-xs text-gray-400">{a.color_name} / {a.size_name} — Qty: {a.quantity}</p>
              </div>
              <Badge variant={a.alert_type==="out_of_stock"?"danger":"warning"}>
                {a.alert_type?.replace("_"," ")}
              </Badge>
              <button onClick={() => resolve(a.id, { onSuccess:()=>toast.success("Alert resolved"), onError:(e)=>toast.error(e.message) })}
                className="text-xs text-gray-400 hover:text-emerald-600 underline shrink-0">
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: overview, isLoading: loadingOverview } = useAnalyticsOverview();
  const { data: salesData = [], isLoading: loadingSales } = useSalesChart(30);
  const { data: topProducts = [], isLoading: loadingTop } = useTopProducts(8);

  const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

  if (loadingOverview) return <FullPageSpinner />;

  const rev = overview?.revenue;
  const ord = overview?.orders;
  const usr = overview?.users;
  const pro = overview?.products;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`$${Number(rev?.total_revenue ?? 0).toLocaleString()}`} sub={`$${Number(rev?.month_revenue ?? 0).toLocaleString()} this month`} icon={FaDollarSign} color="indigo" trend={rev?.revenue_growth_pct} />
        <StatCard title="Total Orders"  value={ord?.total_orders ?? 0} sub={`${ord?.orders_7d ?? 0} this week`} icon={FaShoppingCart} color="emerald" />
        <StatCard title="Customers"     value={usr?.total_users ?? 0}  sub={`+${usr?.new_users_30d ?? 0} this month`} icon={FaUsers} color="amber" />
        <StatCard title="Products"      value={pro?.total_products ?? 0} sub={`${pro?.low_stock ?? 0} low stock`} icon={FaBoxes} color="rose" />
      </div>

      {/* Sales chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Revenue — Last 30 Days</h3>
        {loadingSales ? (
          <div className="h-48 flex items-center justify-center"><Spinner /></div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"})} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} width={55} />
              <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]} labelFormatter={(d)=>new Date(d).toLocaleDateString()} />
              <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} fill="url(#revGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Order status + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Order Status Breakdown</h3>
          <div className="space-y-3">
            {[
              { key: "pending",    label: "Pending",    val: ord?.pending_orders    ?? 0, color: "bg-amber-400" },
              { key: "processing", label: "Processing", val: ord?.processing_orders ?? 0, color: "bg-blue-400" },
              { key: "shipped",    label: "Shipped",    val: ord?.shipped_orders    ?? 0, color: "bg-indigo-400" },
              { key: "delivered",  label: "Delivered",  val: ord?.delivered_orders  ?? 0, color: "bg-emerald-400" },
              { key: "cancelled",  label: "Cancelled",  val: ord?.cancelled_orders  ?? 0, color: "bg-rose-400" },
            ].map(({ label, val, color }) => {
              const total = ord?.total_orders || 1;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{label}</span>
                    <span className="text-gray-900 font-bold">{val}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.round((val / total) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Top Selling Products</h3>
          {loadingTop ? (
            <div className="space-y-3">{Array.from({length:5},(_,i)=><SkeletonRow key={i}/>)}</div>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-400">{i + 1}</span>
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.units_sold} sold</p>
                  </div>
                  <span className="text-xs font-bold text-gray-900">${Number(p.revenue).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
const TABS = [
  { id: "overview",       label: "Overview",       icon: FaTachometerAlt },
  { id: "products",       label: "Products",       icon: FaBoxes },
  { id: "users",          label: "Users",          icon: FaUsers },
  { id: "brands",         label: "Brands",         icon: FaTag },
  { id: "notifications",  label: "Notifications",  icon: FaBell },
  { id: "stock",          label: "Stock Alerts",   icon: FaExclamationTriangle },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!adminToken) navigate("/login");
  }, [adminToken, navigate]);

  if (!adminToken) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar activeTab={activeTab} setTab={setActiveTab} />

      <div className="md:ml-60">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="flex items-center gap-2 overflow-x-auto px-4 py-1 scrollbar-hide md:hidden">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${activeTab === id ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-800"}`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <h1 className="text-xl font-extrabold text-gray-900 capitalize">{activeTab.replace("-"," ")}</h1>
            <p className="text-sm text-gray-400">Murad & Sabah Store — Admin</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {activeTab === "overview"      && <OverviewTab />}
              {activeTab === "products"      && <ProductsTab adminToken={adminToken} />}
              {activeTab === "users"         && <UsersTab />}
              {activeTab === "brands"        && <BrandsTab />}
              {activeTab === "notifications" && <NotificationsTab />}
              {activeTab === "stock"         && <StockTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
