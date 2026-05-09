import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function EmptyState({ icon: Icon, title, description, action, actionTo, actionLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center px-4"
    >
      {Icon && <Icon className="h-14 w-14 text-gray-200 mb-4" />}
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
      {actionTo && (
        <Link to={actionTo} className="mt-6 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition">
          {actionLabel ?? "Browse"}
        </Link>
      )}
      {action && !actionTo && (
        <button onClick={action} className="mt-6 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition">
          {actionLabel ?? "Try again"}
        </button>
      )}
    </motion.div>
  );
}
