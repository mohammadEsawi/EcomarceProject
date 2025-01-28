import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { TbBasket, TbUserCircle } from "react-icons/tb";
import { RiUserLine } from "react-icons/ri";
import { ShopContext } from "../context/ShopContextProvider";
import Navbar from "./Navbar";

export default function Header() {
  const { token, getCartCount} = useContext(ShopContext);
  const location = useLocation();

  return (
    <Disclosure
      as="header"
      className="fixed top-0 left-0 w-full z-50 bg-white shadow-md"
    >
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              {/* Logo */}
              <Link to="/" className="flex-1">
                <div className="text-2xl sm:text-3xl font-bold">
                  Murad <span className="text-secondary">&</span> Sabah Store
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex flex-1 justify-center">
                <Navbar />
              </div>

              {/* Right Section */}
              <div className="flex flex-1 items-center justify-end gap-x-4 sm:gap-x-6">
                {/* Cart */}
                <Link to="/cart" className="flex relative">
                  <TbBasket className="text-2xl sm:text-[27px]" />
                  <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs font-semibold flexCenter w-5 h-5 rounded-full shadow-md">
                    {getCartCount()}
                  </span>
                </Link>

                {/* User */}
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

                {/* Mobile Menu Button */}
                <DisclosureButton className="lg:hidden p-2 text-gray-700 rounded-md hover:bg-gray-100">
                  {open ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </DisclosureButton>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <DisclosurePanel className="lg:hidden bg-white border-t">
            <div className="px-4 py-2">
              <Navbar mobile />
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
