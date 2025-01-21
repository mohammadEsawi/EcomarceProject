import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import { FaBars, FaSearch } from "react-icons/fa";
import { TbBasket, TbUserCircle } from "react-icons/tb";
import { RiUserLine } from "react-icons/ri";

export default function Header() {
  const [token, setToken] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flexBetween py-3">
          <Link to={"/"} className="flex flex-1">
            <div className="text-2xl sm:text-3xl font-bold">
              Murad <span className="text-secondary">&</span> Sabah Store
            </div>
          </Link>

          <div className="hidden lg:flex flex-1 justify-center">
            <Navbar />
          </div>

          <div className="flex-1 flex items-center justify-end gap-x-4 sm:gap-x-6">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <FaBars className="text-2xl" />
            </button>

            <FaSearch className="text-2xl cursor-pointer hidden sm:block" />

            <Link to={"/cart"} className="flex relative">
              <TbBasket className="text-2xl sm:text-[27px]" />
              <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs font-semibold flexCenter w-5 h-5 rounded-full shadow-md">
                0
              </span>
            </Link>

            <div>
              {token ? (
                <TbUserCircle className="text-2xl cursor-pointer" />
              ) : (
                <button className="flex items-center gap-x-1">
                  <span className="hidden sm:block">Login</span>
                  <RiUserLine className="text-xl" />
                </button>
              )}
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white shadow-lg">
            <Navbar />
          </div>
        )}
      </div>
    </header>
  );
}
