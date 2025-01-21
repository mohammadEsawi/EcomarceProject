import React from "react";
import { FaBox, FaTruck, FaShieldAlt } from "react-icons/fa";

export default function Features() {
  return (
    <div className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-center">
              <FaBox className="text-4xl sm:text-5xl text-secondary mb-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Quality Product</h3>
            <p className="text-sm sm:text-base text-gray-600">
              We offer only the highest quality products, carefully curated to meet your needs and
              exceed your expectations.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-center">
              <FaTruck className="text-4xl sm:text-5xl text-secondary mb-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Fast Delivery</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Enjoy quick and reliable delivery services. We ensure your orders reach you in the
              shortest time possible.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-center">
              <FaShieldAlt className="text-4xl sm:text-5xl text-secondary mb-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Secure Payment</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Your transactions are safe with us. We use advanced encryption to protect your payment
              information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}