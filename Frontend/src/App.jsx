import React, { Suspense, lazy } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "./components/Header";
import { FullPageSpinner } from "./components/ui/Spinner";

// ── Lazy page imports for code splitting ──────────────────────────────────────
const Home             = lazy(() => import("./pages/Home"));
const Collections      = lazy(() => import("./pages/Collections"));
const Product          = lazy(() => import("./pages/Product"));
const Cart             = lazy(() => import("./pages/Cart"));
const PlaceOrder       = lazy(() => import("./pages/PlaceOrder"));
const Orders           = lazy(() => import("./pages/Orders"));
const Wishlist         = lazy(() => import("./pages/Wishlist"));
const Profile          = lazy(() => import("./pages/Profile"));
const OrderConfirmation= lazy(() => import("./pages/OrderConfirmation"));
const Login            = lazy(() => import("./pages/Login"));
const Signup           = lazy(() => import("./pages/Signup"));
const ForgotPassword   = lazy(() => import("./pages/ForgotPassword"));
const Contact          = lazy(() => import("./pages/Contact"));
const Testimonials     = lazy(() => import("./pages/Testimonials"));
const AdminDashboard   = lazy(() => import("./pages/AdminDashboard"));
const AdminOrders      = lazy(() => import("./pages/AdminOrders"));

function StaticPage({ title, body }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 mt-16 bg-gray-50">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-500 max-w-prose text-center leading-relaxed">
        {body || "This page is coming soon. Please check back later."}
      </p>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <main className="overflow-hidden text-[#40404d]">
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
      {!isAdmin && <Header />}

      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          {/* Public */}
          <Route path="/"                       element={<Home />} />
          <Route path="/collections"            element={<Collections />} />
          <Route path="/product/:productId"     element={<Product />} />
          <Route path="/contact"                element={<Contact />} />
          <Route path="/testimonial"            element={<Testimonials />} />
          <Route path="/cart"                   element={<Cart />} />

          {/* Auth */}
          <Route path="/login"                  element={<Login />} />
          <Route path="/signup"                 element={<Signup />} />
          <Route path="/forgot-password"        element={<ForgotPassword />} />

          {/* User */}
          <Route path="/orders"                 element={<Orders />} />
          <Route path="/wishlist"               element={<Wishlist />} />
          <Route path="/profile"                element={<Profile />} />
          <Route path="/place-order"            element={<PlaceOrder />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

          {/* Admin */}
          <Route path="/admin/login"            element={<Navigate to="/login" replace />} />
          <Route path="/admin/dashboard"        element={<AdminDashboard />} />
          <Route path="/admin/orders"           element={<AdminOrders />} />

          {/* Static pages */}
          <Route path="/terms"                  element={<StaticPage title="Terms of Service" />} />
          <Route path="/privacy"                element={<StaticPage title="Privacy Policy" />} />
          <Route path="*"                       element={<StaticPage title="404 — Not Found" body="The page you're looking for doesn't exist." />} />
        </Routes>
      </Suspense>
    </main>
  );
}
