import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { products as localProducts } from "../assets/data";
import { toast } from "react-toastify";
import { getCurrentUser } from "../api/client";

export const ShopContext = createContext({
  currency: "$",
  delivery_charges: 10,
  navigate: () => {},
  products: [],
});

export default function ShopContextProvider({ children }) {
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

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
  const [cartItems, setCartItems] = useState(() => {
    const raw = localStorage.getItem("cartItems");
    return raw ? JSON.parse(raw) : {};
  });

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch(`${apiBaseUrl}/products`);
        if (!res.ok) {
          throw new Error("Failed to load products");
        }
        const data = await res.json();
        setProducts(
          Array.isArray(data) && data.length > 0 ? data : localProducts,
        );
      } catch {
        setProducts(localProducts);
      }
    }

    loadProducts();
  }, [apiBaseUrl]);

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

  const addToCart = (itemId, size) => {
    if (!size) {
      toast.error("Please select a size before adding to the cart.");
      return;
    }

    const product = products.find((p) => p._id === itemId);
    if (!product) {
      toast.error("Product not found.");
      return;
    }

    setCartItems((prevCartItems) => {
      const updatedCartItems = { ...prevCartItems };

      if (updatedCartItems[itemId]) {
        if (updatedCartItems[itemId][size]) {
          updatedCartItems[itemId][size] += 1;
        } else {
          updatedCartItems[itemId][size] = 1;
        }
      } else {
        updatedCartItems[itemId] = { [size]: 1 };
      }

      return updatedCartItems;
    });

    toast.success(`${product.name} (Size: ${size}) added to cart!`);
  };
  // Get cart count
  const getCartCount = () => {
    let totalCount = 0;
    for (const itemId in cartItems) {
      const sizes = cartItems[itemId];
      for (const size in sizes) {
        totalCount += sizes[size];
      }
    }
    return totalCount;
  };
  const updateQuantities = (itemId, size, quantity) => {
    setCartItems((prevCartItems) => {
      const updatedCartItems = { ...prevCartItems };
      if (updatedCartItems[itemId] && updatedCartItems[itemId][size]) {
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
