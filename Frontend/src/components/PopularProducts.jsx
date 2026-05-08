import React, { useContext, useState, useEffect } from "react";
import Title from "./Title";
import { ShopContext } from "../context/ShopContextProvider";
import Item from "./Item";
import { motion } from "framer-motion";

export default function PopularProducts() {
  const { products } = useContext(ShopContext);
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    if (products?.length > 0) {
      // Handle both old (popular) and new (is_featured) API fields
      const data = products.filter((item) => item.is_featured || item.popular);
      setPopularProducts(data.slice(0, 5));
    }
  }, [products]);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="max-padd-container py-16 mt-12">
      <Title
        title1={"Popular"}
        title2={"Products"}
        titleStyles={"pb-10"}
        paraStyles={"!block"}
      />
      <motion.div
        className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {popularProducts.map((product) => (
          <motion.div key={product.id || product._id} variants={itemVariants}>
            <Item product={product} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
