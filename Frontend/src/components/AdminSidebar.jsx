import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import {
  FaTachometerAlt, FaBoxes, FaUsers, FaExclamationTriangle,
  FaClipboardList, FaSignOutAlt, FaStore,
} from "react-icons/fa";
import { ShopContext } from "../context/ShopContextProvider";

const NAV = [
  { label: "Overview",     href: "/admin/dashboard", icon: FaTachometerAlt, hash: "overview"  },
  { label: "Products",     href: "/admin/dashboard", icon: FaBoxes,         hash: "products"  },
  { label: "Orders",       href: "/admin/orders",    icon: FaClipboardList                    },
  { label: "Users",        href: "/admin/dashboard", icon: FaUsers,         hash: "users"     },
  { label: "Stock Alerts", href: "/admin/dashboard", icon: FaExclamationTriangle, hash: "stock" },
];

export default function AdminSidebar({ activeTab, setTab }) {
  const { adminToken, adminUser, adminLogout } = useContext(ShopContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { adminLogout(); navigate("/login"); };

  const isActive = (item) => {
    if (item.href === "/admin/orders") return pathname === "/admin/orders";
    return pathname === "/admin/dashboard" && activeTab === item.hash;
  };

  const handleClick = (item) => {
    if (item.href === "/admin/orders") { navigate("/admin/orders"); return; }
    if (setTab && item.hash) { navigate("/admin/dashboard"); setTab(item.hash); }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-gray-900 text-white fixed top-0 left-0 h-full z-40 shrink-0">
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <FaStore className="h-5 w-5 text-indigo-400" />
            <span className="text-lg font-extrabold tracking-tight">Admin Panel</span>
          </div>
          <p className="text-xs text-white/40 truncate">{adminUser?.email ?? ""}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.label}
                onClick={() => handleClick(item)}
                className={`flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-white/50 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <Link to="/" className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition mb-1">
            <FaStore className="h-4 w-4" />View Store
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white/40 hover:bg-rose-500/10 hover:text-rose-400 transition"
          >
            <FaSignOutAlt className="h-4 w-4" />Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-gray-900 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <FaStore className="h-4 w-4 text-indigo-400" />
          <span className="text-white font-bold text-sm">Admin Panel</span>
        </div>
        <button onClick={handleLogout} className="text-white/60 hover:text-rose-400 transition">
          <FaSignOutAlt className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex overflow-x-auto gap-1 bg-gray-800 px-3 py-2 scrollbar-hide">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.label}
              onClick={() => handleClick(item)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                active ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
