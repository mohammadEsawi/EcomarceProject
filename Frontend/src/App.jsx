import React from 'react';
import Header from './components/Header';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Collections from './pages/Collections';
import Product from './pages/Product';
import Testimonials from './pages/Testimonials';
import Contact from './pages/Contact';

export default function App() {
  return (
    <main className='overflow-hidden text-[]#40404]'>
  
      <Header />
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/collections" element={<Collections />} />
        <Route exact path="/product" element={<Product />} />
        <Route exact path="/testimonials" element={<Testimonials />} />
        <Route exact path="/contact" element={<Contact />} />
      </Routes>
  
    </main>
  );
}
