import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaHeart, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import Footer from "../components/Footer";
import { ShopContext } from "../context/ShopContextProvider";
import { getWishlist, removeWishlistItem } from "../api/client";
import { imgUrl } from "../lib/imageUrl";

export default function Wishlist() {
  const { token, navigate } = useContext(ShopContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    getWishlist(token)
      .then((d) => setItems(Array.isArray(d?.items) ? d.items : []))
      .catch(() => toast.error("Failed to load wishlist"))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const handleRemove = async (productId) => {
    setRemoving(productId);
    try {
      await removeWishlistItem(productId, token);
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error(err.message || "Failed to remove item");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <>
      <div className="pt-20 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaHeart className="text-rose-500 h-5 w-5" />
                My Wishlist
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {items.length} saved item{items.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link
              to="/collections"
              className="text-sm font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-600 transition"
            >
              Continue shopping
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-60 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FaHeart className="h-12 w-12 text-gray-200 mb-4" />
              <h2 className="text-lg font-semibold text-gray-700 mb-1">Your wishlist is empty</h2>
              <p className="text-sm text-gray-400 mb-6">Save items you love and come back to them later.</p>
              <Link
                to="/collections"
                className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition"
              >
                Browse Collections
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {items.map((item) => {
                  const price = Number(item.discount_price || item.price || 0);
                  const original = item.discount_price ? Number(item.price || 0) : null;
                  return (
                    <motion.div
                      key={item.product_id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group"
                    >
                      <Link to={`/product/${item.product_id}`} className="block overflow-hidden">
                        {item.main_image ? (
                          <img
                            src={imgUrl(item.main_image)}
                            alt={item.name}
                            className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-60 bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                            No image
                          </div>
                        )}
                      </Link>
                      <div className="p-4">
                        <Link to={`/product/${item.product_id}`}>
                          <h2 className="font-semibold text-gray-900 text-sm hover:text-gray-600 transition line-clamp-1">
                            {item.name}
                          </h2>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-gray-900">${price.toFixed(2)}</span>
                          {original && (
                            <span className="text-xs text-gray-400 line-through">${original.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Link
                            to={`/product/${item.product_id}`}
                            className="flex-1 rounded-xl bg-gray-900 py-2 text-center text-xs font-semibold text-white hover:bg-gray-700 transition"
                          >
                            View Product
                          </Link>
                          <button
                            onClick={() => handleRemove(item.product_id)}
                            disabled={removing === item.product_id}
                            className="rounded-xl border border-gray-200 p-2 text-gray-400 hover:text-rose-500 hover:border-rose-200 disabled:opacity-40 transition"
                          >
                            <FaTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
