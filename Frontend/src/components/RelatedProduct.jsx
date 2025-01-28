import { Link } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContextProvider";
import Item from "./Item";

export default function RelatedProduct({ currentProductId }) {
  const { products } = useContext(ShopContext);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (products.length > 0 && currentProductId) {
      const currentProduct = products.find((p) => p._id === currentProductId);
      
      if (currentProduct) {
        const sameCategory = products.filter(p => 
          p.category === currentProduct.category &&
          p._id !== currentProductId
        );

        const shuffledProducts = [...products]
          .sort(() => 0.5 - Math.random())
          .filter(p => p._id !== currentProductId);

        const combined = [...new Set([
          ...sameCategory.slice(0, 4),
          ...shuffledProducts.slice(0, 2)
        ])];

        const selection = combined.length >= 4 
          ? combined.slice(0, 4)
          : [...combined, ...shuffledProducts.slice(0, 4 - combined.length)];

        setRelated(selection.slice(0, 4));
      }
    }
  }, [currentProductId, products]);

  return (
    <section className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Complete Your Look</h2>
        <Link 
          to="/collections" 
          className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
        >
          View All Products →
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {related.map((product) => (
          <Item 
            key={product._id} 
            product={product}
            className="transition-transform hover:scale-105"
          />
        ))}
      </div>
     
    </section>
  );
}