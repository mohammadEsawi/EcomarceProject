import React from "react";
import heroImg from "../assets/bg.png";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <div className="relative h-screen flex items-center text-white overflow-hidden bg-black">
      {/* Left Section */}
      <div className="w-1/2 h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">Make your</h1>
          <h2 className="text-6xl font-bold mb-4">Fashion Look</h2>
          <h3 className="text-4xl font-semibold mb-8">More Charming</h3>
          <Link
            
            className="inline-block bg-secondary text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-200 transition-all"
          >
            Check our modern Collection
          </Link>
          <div className="mt-6">
            <p className="text-sm animate-bounce">Scroll down</p>
          </div>
        </div>
      </div>

      {/* Right Section - Full Image */}
      <div className="w-1/2 h-full relative">
        <img
          src={heroImg}
          alt="Fashion Model"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}