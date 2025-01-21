import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';

const Item = ({ product }) => {
  return (
    <div className="max-w-sm bg-white rounded-lg shadow-md overflow-hidden mx-auto">
      <Link to={`/product/${product.id}`}>
        <div className="w-full h-64 flex items-center justify-center bg-gray-100">
          <img
            src={product.image[0]}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </Link>

      <div className="p-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
          {product.name}
        </h3>

        <h4 className="text-xl sm:text-2xl pt-1 font-bold text-gray-900">
          ${product.price.toFixed(2)}
        </h4>

        <div className="mt-2 flex items-center gap-x-1">
          <FaStar className="text-yellow-500" />
          <span className="ml-1 text-sm text-gray-600">4.8</span>
        </div>

        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {product.description || 'No description available.'}
        </p>
      </div>
    </div>
  );
};

export default Item;
