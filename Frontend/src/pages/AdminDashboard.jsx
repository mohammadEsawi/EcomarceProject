import React, { useEffect, useMemo, useState } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createAdminAccount,
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../api/client";
import { ShopContext } from "../context/ShopContextProvider";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "Men",
  subCategory: "Topwear",
  sizes: "S,M,L",
  image: "https://placehold.co/600x800?text=Cloth",
  popular: false,
};

export default function AdminDashboard() {
  const { adminToken, adminUser, adminLogout } = useContext(ShopContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }

    loadProducts();
  }, [adminToken, navigate]);

  const productCount = useMemo(() => products.length, [products.length]);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!adminToken) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      subCategory: form.subCategory,
      sizes: form.sizes
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      image: [form.image.trim() || "https://placehold.co/600x800?text=Cloth"],
      popular: Boolean(form.popular),
    };

    if (!payload.name || !payload.description || !payload.price) {
      toast.error("Name, description and price are required");
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await updateProduct(editingId, payload, adminToken);
        toast.success("Product updated");
      } else {
        await createProduct(payload, adminToken);
        toast.success("Product added");
      }
      await loadProducts();
      resetForm();
    } catch (error) {
      toast.error(error.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price || ""),
      category: product.category || "Men",
      subCategory: product.subCategory || "Topwear",
      sizes: Array.isArray(product.sizes) ? product.sizes.join(",") : "S,M,L",
      image: Array.isArray(product.image) ? product.image[0] : "",
      popular: Boolean(product.popular),
    });
  };

  const handleDelete = async (id) => {
    if (!adminToken) return;
    if (!window.confirm("Delete this product?")) return;

    try {
      await deleteProduct(id, adminToken);
      setProducts((prev) => prev.filter((item) => item._id !== id));
      toast.success("Product deleted");
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      toast.error(error.message || "Delete failed");
    }
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    if (!adminToken) return;

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

      setAdminForm({ name: "", email: "", password: "" });
      toast.success("Admin account created");
    } catch (error) {
      toast.error(error.message || "Failed to create admin account");
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-8 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Manage clothes inventory with full CRUD.
            </p>
            {adminUser && (
              <p className="text-xs text-gray-400 mt-1">
                Signed in as {adminUser.email}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm bg-gray-100 px-3 py-1.5 rounded-full">
              Total Products: {productCount}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-black text-white hover:bg-secondary transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Product name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
              <textarea
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
              <input
                type="number"
                min="1"
                placeholder="Price"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                </select>

                <select
                  value={form.subCategory}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      subCategory: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Topwear">Topwear</option>
                  <option value="Bottomwear">Bottomwear</option>
                  <option value="WinterWear">WinterWear</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Sizes comma separated (e.g. S,M,L)"
                value={form.sizes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sizes: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />

              <input
                type="text"
                placeholder="Main image URL"
                value={form.image}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, image: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.popular}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, popular: e.target.checked }))
                  }
                />
                Mark as popular
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-black text-white py-2.5 rounded-lg hover:bg-secondary transition-colors disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Product"
                      : "Add Product"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-lg border border-gray-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 border-t pt-6">
              <h3 className="text-md font-semibold mb-3">
                Create Admin Account
              </h3>
              <form onSubmit={handleCreateAdmin} className="space-y-3">
                <input
                  type="text"
                  placeholder="Admin full name"
                  value={adminForm.name}
                  onChange={(e) =>
                    setAdminForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
                <input
                  type="email"
                  placeholder="Admin email"
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
                <input
                  type="password"
                  placeholder="Admin password (min 8 chars)"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  minLength={8}
                  required
                />
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {creatingAdmin ? "Creating admin..." : "Create Admin"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold mb-4">All Products</h2>

            {loading ? (
              <p className="text-sm text-gray-500">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-gray-500">No products found.</p>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Category</th>
                      <th className="py-2 pr-3">Price</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id} className="border-b last:border-0">
                        <td className="py-2 pr-3">{product.name}</td>
                        <td className="py-2 pr-3">
                          {product.category} / {product.subCategory}
                        </td>
                        <td className="py-2 pr-3">${product.price}</td>
                        <td className="py-2 pr-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(product)}
                              className="px-3 py-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="px-3 py-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
