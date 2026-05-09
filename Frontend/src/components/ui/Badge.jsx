import React from "react";

const VARIANTS = {
  default:   "bg-gray-100 text-gray-700",
  primary:   "bg-gray-900 text-white",
  success:   "bg-green-100 text-green-700",
  warning:   "bg-amber-100 text-amber-700",
  danger:    "bg-red-100 text-red-700",
  info:      "bg-blue-100 text-blue-700",
  sale:      "bg-rose-500 text-white",
  new:       "bg-emerald-500 text-white",
  trending:  "bg-indigo-500 text-white",
};

export function Badge({ children, variant = "default", className = "", size = "sm" }) {
  const sizeClass = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold tracking-wide ${sizeClass} ${VARIANTS[variant] ?? VARIANTS.default} ${className}`}>
      {children}
    </span>
  );
}
