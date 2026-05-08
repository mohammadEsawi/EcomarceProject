import React from "react";
import heroImg from "../assets/bg.png";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <div className="relative h-screen flex items-center text-white overflow-hidden bg-black">
      {/* Left Section */}
      <div className="w-1/2 h-full flex items-center justify-center bg-black">
        <div className="text-center px-8">
          <motion.h1
            className="text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Make your
          </motion.h1>
          <motion.h2
            className="text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Fashion Look
          </motion.h2>
          <motion.h3
            className="text-4xl font-semibold mb-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            More Charming
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              to="/collections"
              className="inline-block bg-secondary text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-200 transition-all"
            >
              Check our modern Collection
            </Link>
          </motion.div>
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <p className="text-sm animate-bounce">Scroll down</p>
          </motion.div>
        </div>
      </div>

      {/* Right Section - Full Image */}
      <motion.div
        className="w-1/2 h-full relative"
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
      >
        <img
          src={heroImg}
          alt="Fashion Model"
          className="w-full h-full object-cover"
        />
      </motion.div>
    </div>
  );
}