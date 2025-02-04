import React from 'react';
import Header from './components/Header';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Product from './pages/Product';
import Testimonials from './pages/Testimonials';
import Contact from './pages/Contact';
import Collections from './pages/Collections';
import Cart from './pages/Cart';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PlaceOrder from './pages/PlaceOrder';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Orders from './pages/Orders';

export default function App() {
  
  return (
    <main className='overflow-hidden text-[]#40404]'>
      <ToastContainer />
  
      <Header />
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route exact path="/testimonial" element={<Testimonials />} />
        <Route exact path="/contact" element={<Contact />} />
        <Route exact path="/cart" element={<Cart />} />
        <Route exact path="/login" element={<Login />} />
        <Route exact path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/orders" element={<Orders />} />
        <Route exact path="/place-order" element={<PlaceOrder />} />


      </Routes>
  
    </main>
  );
}
