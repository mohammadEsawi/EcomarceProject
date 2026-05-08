import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Footer from "../components/Footer";
import { ShopContext } from "../context/ShopContextProvider";
import { getWishlist, removeWishlistItem } from "../api/client";

export default function Wishlist() {
  const { token, products, navigate } = useContext(ShopContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!token) {
        toast.error("Please login to view your wishlist");
        navigate("/login");
        return;
      }

      try {
        const data = await getWishlist(token);
        const ids = Array.isArray(data.items) ? data.items : [];
        setItems(products.filter((product) => ids.includes(product._id)));
      } catch (error) {
        toast.error(error.message || "Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, products, navigate]);

  const handleRemove = async (productId) => {
    try {
      await removeWishlistItem(productId, token);
      setItems((prev) => prev.filter((item) => item._id !== productId));
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(error.message || "Failed to remove item");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 mt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wishlist</h1>
          <p className="text-gray-600">Your saved items for later</p>
        </div>
        <Link to="/collections" className="text-blue-600 hover:text-blue-800">
          Continue shopping
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading wishlist...</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">No items saved yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <Link to={`/product/${item._id}`}>
                <img
                  src={item.image?.[0]}
                  alt={item.name}
                  className="w-full h-72 object-cover"
                />
              </Link>
              <div className="p-4 space-y-3">
                <h2 className="font-semibold text-gray-900">{item.name}</h2>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    ${Number(item.price || 0).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleRemove(item._id)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Footer />
    </main>
  );
}
