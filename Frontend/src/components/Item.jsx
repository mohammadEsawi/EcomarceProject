import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Item = ({ product }) => {
  // Handle both old (_id) and new (id) API formats
  const productId = product.id || product._id;
  const imageUrl = product.main_image_url || product.image?.[0] || '/placeholder.jpg';
  const price = product.discount_price || product.price;
  const originalPrice = product.discount_price ? product.price : null;
  const status = product.status || 'available';

  const statusBadge = {
    out_of_stock: { label: 'Out of Stock', className: 'bg-red-100 text-red-700' },
    low_stock: { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' },
    available: null,
  }[status];

  return (
    <motion.div
      className="bottom-12 relative mt-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/product/${productId}`} className="flexCenter relative top-12 overflow-hidden m-2.5 rounded-xl block">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full object-cover aspect-[3/4] rounded-xl transition-transform duration-500 hover:scale-105"
          onError={(e) => { e.target.src = 'https://placehold.co/300x400?text=No+Image'; }}
        />
        {statusBadge && (
          <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        )}
      </Link>

      <div className="p-3 rounded-lg pt-12 bg-white shadows">
        <h4 className="bold-15 line-clamp-1 !my-0">{product.name}</h4>
        <div className="flexBetween pt-1">
          <div className="flex items-baseline gap-1">
            <h5 className="h5">${Number(price || 0).toFixed(2)}</h5>
            {originalPrice && (
              <span className="text-xs text-gray-400 line-through">${Number(originalPrice).toFixed(2)}</span>
            )}
          </div>
          <div className="flex items-baseline gap-x-1">
            <FaStar className="text-secondary" />
            <h5 className="h5 relative -bottom-0.5">
              {product.avg_rating ? Number(product.avg_rating).toFixed(1) : '4.8'}
            </h5>
          </div>
        </div>
        <p className="line-clamp-2 py-1 text-sm text-gray-500">
          {product.description || 'No description available.'}
        </p>
      </div>
    </motion.div>
  );
};

export default Item;
