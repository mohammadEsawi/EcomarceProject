import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { products } from "../assets/data";
import { toast } from "react-toastify";

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
  const [token, setToken] = useState("fs");
  const [cartItems, setCartItems] = useState({});
  const addToCart = (itemId, size) => {
    if (!size) {
      toast.error("Please select a size before adding to the cart.");
      return;
    }
  
    const product = products.find(p => p._id === itemId);
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
  useEffect(() => {

  }, [cartItems]);

  const updateQuantities = async(itemId, size, quantity) => {
    setCartItems((prevCartItems) => {
      const updatedCartItems = {...prevCartItems };
      if (updatedCartItems[itemId] && updatedCartItems[itemId][size]) {
        updatedCartItems[itemId][size] = quantity;
      }
      return updatedCartItems;
    });
  };
  const value = {
    currency,
    delivery_charges,
    navigate,
    products,
    token,
    setToken,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    addToCart,
    getCartCount,
    cartItems,
    setCartItems,
    updateQuantities,
    
    
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}