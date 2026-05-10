import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { products as localProducts } from "../assets/data";
import { toast } from "react-toastify";
import { getCurrentUser, getProducts } from "../api/client";

export const ShopContext = createContext({
  currency: "$",
  delivery_charges: 10,
  navigate: () => {},
  products: [],
});

export default function ShopContextProvider({ children }) {
  const currency = "$";
  const delivery_charges = 10;
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(null);
  const [adminToken, setAdminToken] = useState(() =>
    localStorage.getItem("adminToken"),
  );
  const [adminUser, setAdminUser] = useState(() => {
    const raw = localStorage.getItem("adminUser");
    return raw ? JSON.parse(raw) : null;
  });
  const [products, setProducts] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [cartItems, setCartItems] = useState(() => {
    const raw = localStorage.getItem("cartItems");
    return raw ? JSON.parse(raw) : {};
  });

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts({ limit: 100 });
        // Handle both array response (old API) and { products, pagination } (new API)
        const prods = Array.isArray(data)
          ? data
          : data?.products || data?.data || [];

        if (prods.length === 0) {
          setProducts([]);
          return;
        }

        // Normalize fields so components work with both old and new API shapes
        const normalized = prods.map((p) => ({
          ...p,
          _id: p._id || p.id,
          id: p.id || p._id,
          image: p.image || (p.main_image_url ? [p.main_image_url] : []),
        }));

        setProducts(normalized);
      } catch {
        setProducts([]);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem("adminToken", adminToken);
    } else {
      localStorage.removeItem("adminToken");
      setAdminUser(null);
      localStorage.removeItem("adminUser");
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem("adminUser", JSON.stringify(adminUser));
    }
  }, [adminUser]);

  useEffect(() => {
    async function loadUser() {
      if (!token) return;
      try {
        const data = await getCurrentUser(token);
        setUser(data.user);
      } catch {
        setToken(null);
      }
    }

    loadUser();
  }, [token]);

  const addToCart = (itemId, size, colorName) => {
    if (!size) {
      toast.error("Please select a size before adding to the cart.");
      return;
    }

    const product = products.find(
      (p) => String(p._id) === String(itemId) || String(p.id) === String(itemId),
    );
    if (!product) {
      toast.error("Product not found.");
      return;
    }

    // Key format: size only (backward compat). Color is informational.
    const key = size;

    setCartItems((prevCartItems) => {
      const updatedCartItems = { ...prevCartItems };

      if (updatedCartItems[itemId]) {
        updatedCartItems[itemId] = {
          ...updatedCartItems[itemId],
          [key]: (updatedCartItems[itemId][key] || 0) + 1,
        };
      } else {
        updatedCartItems[itemId] = { [key]: 1 };
      }

      return updatedCartItems;
    });

    const colorLabel = colorName ? ` / ${colorName}` : "";
    toast.success(`${product.name} (Size: ${size}${colorLabel}) added to cart!`);
  };

  // Get total item count across all cart entries
  const getCartCount = () => {
    let totalCount = 0;
    for (const itemId in cartItems) {
      const sizes = cartItems[itemId];
      for (const key in sizes) {
        totalCount += sizes[key];
      }
    }
    return totalCount;
  };

  const updateQuantities = (itemId, size, quantity) => {
    setCartItems((prevCartItems) => {
      const updatedCartItems = { ...prevCartItems };
      if (updatedCartItems[itemId] && updatedCartItems[itemId][size] !== undefined) {
        if (quantity <= 0) {
          delete updatedCartItems[itemId][size];
          if (Object.keys(updatedCartItems[itemId]).length === 0) {
            delete updatedCartItems[itemId];
          }
        } else {
          updatedCartItems[itemId][size] = quantity;
        }
      }
      return updatedCartItems;
    });
  };

  const removeItem = (itemId, size) => {
    updateQuantities(itemId, size, 0);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCartItems({});
    localStorage.removeItem("authToken");
  };

  const adminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
  };

  const value = {
    currency,
    delivery_charges,
    navigate,
    products,
    setProducts,
    token,
    setToken,
    user,
    setUser,
    adminToken,
    setAdminToken,
    adminUser,
    setAdminUser,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    selectedColor,
    setSelectedColor,
    addToCart,
    getCartCount,
    cartItems,
    setCartItems,
    updateQuantities,
    removeItem,
    logout,
    adminLogout,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
