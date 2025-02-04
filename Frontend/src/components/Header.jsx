import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { TbBasket, TbUserCircle, TbLogout, TbListDetails } from "react-icons/tb";
import { RiUserLine } from "react-icons/ri";
import { ShopContext } from "../context/ShopContextProvider";
import Navbar from "./Navbar";

export default function Header() {
  const { token, getCartCount, setToken } = useContext(ShopContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Close dropdown when clicking outside or navigating
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current?.contains(event.target) &&
          !triggerRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const handleUserAction = () => {
    if (token) {
      setIsDropdownOpen(prev => !prev);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  const handleOrdersNavigation = () => {
    navigate("/orders");
    setIsDropdownOpen(false);
  };

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

                {/* Authentication Section */}
                <div className="relative">
                  {token ? (
                    <>
                      <button
                        ref={triggerRef}
                        onClick={handleUserAction}
                        className="flex items-center gap-1 hover:text-secondary transition-colors"
                        aria-expanded={isDropdownOpen}
                        aria-controls="user-dropdown"
                      >
                        <TbUserCircle className="text-2xl cursor-pointer" />
                        <span className="sr-only">User menu</span>
                      </button>

                      {/* User Dropdown */}
                      {isDropdownOpen && (
                        <div
                          ref={dropdownRef}
                          id="user-dropdown"
                          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50"
                          role="menu"
                        >
                          <div className="p-2 space-y-1">
                            <button
                              onClick={handleOrdersNavigation}
                              className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                              role="menuitem"
                            >
                              <TbListDetails className="mr-2" />
                              My Orders
                            </button>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                              role="menuitem"
                            >
                              <TbLogout className="mr-2" />
                              Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link 
                      to="/login" 
                      className="flex items-center gap-x-1 hover:text-secondary transition-colors"
                    >
                      <span className="hidden sm:block">Login</span>
                      <RiUserLine className="text-xl" />
                    </Link>
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