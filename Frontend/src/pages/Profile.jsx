import React, { useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaLock, FaShoppingBag, FaEye, FaEyeSlash, FaSignOutAlt } from "react-icons/fa";
import { FiCheckCircle, FiClock, FiXCircle, FiPackage } from "react-icons/fi";
import { toast } from "react-toastify";
import Footer from "../components/Footer";
import { ShopContext } from "../context/ShopContextProvider";
import { getProfile, saveProfile, changePassword, getMyOrders } from "../api/client";

const TABS = [
  { id: "account",  label: "Account",  icon: FaUser },
  { id: "security", label: "Security", icon: FaLock },
  { id: "orders",   label: "Orders",   icon: FaShoppingBag },
];

const STATUS_STYLE = {
  delivered:  "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  shipped:    "bg-indigo-100 text-indigo-700",
  cancelled:  "bg-red-100 text-red-700",
  pending:    "bg-amber-100 text-amber-700",
};
const STATUS_ICON = {
  delivered:  FiCheckCircle,
  processing: FiClock,
  shipped:    FiPackage,
  cancelled:  FiXCircle,
};

function Avatar({ name }) {
  const initials = (name || "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-bold shrink-0">
      {initials}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition placeholder:text-gray-400";

// ── Account Tab ──────────────────────────────────────────────────────────────
function AccountTab({ token }) {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile(token)
      .then((d) => setProfile({ name: d.name ?? "", email: d.email ?? "", phone: d.phone ?? "" }))
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await saveProfile({ name: profile.name, phone: profile.phone }, token);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>;

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-lg">
      <Field label="Full Name">
        <input
          className={inputCls}
          placeholder="Your full name"
          value={profile.name}
          onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          required
        />
      </Field>
      <Field label="Email Address">
        <input
          className={`${inputCls} opacity-60 cursor-not-allowed`}
          value={profile.email}
          disabled
          readOnly
        />
        <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
      </Field>
      <Field label="Phone Number">
        <input
          className={inputCls}
          placeholder="+970 598-000-000"
          value={profile.phone}
          onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
        />
      </Field>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 transition"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

// ── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab({ token, onLogout }) {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const toggle = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (!/\d/.test(form.new_password)) { toast.error("New password must contain at least one number"); return; }
    if (form.new_password !== form.confirm) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    try {
      await changePassword({ current_password: form.current_password, new_password: form.new_password }, token);
      toast.success("Password changed — please log in again");
      setTimeout(onLogout, 1500);
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const pwField = (id, label, fieldKey) => (
    <Field label={label}>
      <div className="relative">
        <input
          type={show[fieldKey] ? "text" : "password"}
          className={`${inputCls} pr-10`}
          placeholder="••••••••"
          value={form[id]}
          onChange={set(id)}
          required
        />
        <button
          type="button"
          onClick={() => toggle(fieldKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show[fieldKey] ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {pwField("current_password", "Current Password", "current")}
      {pwField("new_password", "New Password", "new")}
      {pwField("confirm", "Confirm New Password", "confirm")}
      <p className="text-xs text-gray-400">Minimum 8 characters and at least 1 number.</p>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 transition"
      >
        {saving ? "Changing…" : "Change Password"}
      </button>
    </form>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders(token, { limit: 20 })
      .then((d) => setOrders(d?.orders ?? []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="py-12 text-center text-gray-400 text-sm">Loading orders…</div>;

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <FiPackage className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm font-medium">No orders yet</p>
        <p className="text-gray-400 text-xs mt-1">Your order history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const statusKey = (order.status ?? "processing").toLowerCase();
        const Icon = STATUS_ICON[statusKey] ?? FiClock;
        const badge = STATUS_STYLE[statusKey] ?? "bg-gray-100 text-gray-600";
        return (
          <div key={order.id} className="rounded-xl border border-gray-100 bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900">Order #{order.id}</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge}`}>
                  <Icon className="h-3 w-3" />
                  {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                {order.item_count != null && ` · ${order.item_count} item${order.item_count !== 1 ? "s" : ""}`}
              </p>
              {order.payment_method && (
                <p className="text-xs text-gray-400 capitalize">Payment: {order.payment_method.replace(/_/g, " ")}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-gray-900">
                ${Number(order.total_amount ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Profile() {
  const { token, user, setToken, setUser, navigate } = useContext(ShopContext);
  const [activeTab, setActiveTab] = useState("account");
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    getProfile(token)
      .then((d) => setProfileName(d.name ?? ""))
      .catch(() => {});
  }, [token, navigate]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  const panel = {
    initial:   { opacity: 0, y: 8 },
    animate:   { opacity: 1, y: 0 },
    exit:      { opacity: 0, y: -8 },
    transition: { duration: 0.2 },
  };

  return (
    <>
      <div className="pt-20 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Header card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={profileName} />
              <div>
                <h1 className="text-lg font-bold text-gray-900">{profileName || "My Account"}</h1>
                <p className="text-sm text-gray-400">{user?.email ?? ""}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-500 transition"
            >
              <FaSignOutAlt className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>

          {/* Tabs + content */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                    activeTab === id
                      ? "text-gray-900 border-b-2 border-gray-900"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                {activeTab === "account" && (
                  <motion.div key="account" {...panel}>
                    <h2 className="text-base font-bold text-gray-800 mb-5">Personal Information</h2>
                    <AccountTab token={token} />
                  </motion.div>
                )}
                {activeTab === "security" && (
                  <motion.div key="security" {...panel}>
                    <h2 className="text-base font-bold text-gray-800 mb-5">Change Password</h2>
                    <SecurityTab token={token} onLogout={handleLogout} />
                  </motion.div>
                )}
                {activeTab === "orders" && (
                  <motion.div key="orders" {...panel}>
                    <h2 className="text-base font-bold text-gray-800 mb-5">Order History</h2>
                    <OrdersTab token={token} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
