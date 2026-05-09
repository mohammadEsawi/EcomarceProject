import React from "react";
import { Link } from "react-router-dom";
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";

const LINKS = {
  "Customer Service": [
    { label: "Contact Us",      to: "/contact" },
    { label: "Order Tracking",  to: "/orders" },
    { label: "Returns & Refunds", to: "/contact" },
    { label: "Shipping Info",   to: "/contact" },
  ],
  "Company": [
    { label: "About Us",        to: "/" },
    { label: "Collections",     to: "/collections" },
    { label: "Privacy Policy",  to: "/privacy" },
    { label: "Terms of Service",to: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      {/* Top strip */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-0.5">Location</p>
              <p className="text-sm text-white/80">Nablus City, Palestine</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaPhone className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-0.5">Phone</p>
              <p className="text-sm text-white/80">+970 598-032-500</p>
              <p className="text-xs text-white/40">Sun – Thu: 8 AM – 8 PM</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaEnvelope className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-0.5">Email</p>
              <p className="text-sm text-white/80">support@muradsabahstore.ps</p>
              <p className="text-xs text-white/40">Replies within 2 hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main links section */}
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
        {/* Brand */}
        <div className="space-y-4">
          <div className="text-xl font-extrabold tracking-tight">
            Murad <span className="text-indigo-400">&</span> Sabah Store
          </div>
          <p className="text-sm text-white/50 leading-relaxed">
            Your premier destination for quality clothing and accessories in Nablus.
            Traditional craftsmanship meets modern style.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <a href="https://instagram.com" target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition">
              <FaInstagram className="h-3.5 w-3.5" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition">
              <FaFacebook className="h-3.5 w-3.5" />
            </a>
            <a href="https://wa.me/970598032500" target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition">
              <FaWhatsapp className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Link groups */}
        {Object.entries(LINKS).map(([heading, links]) => (
          <div key={heading}>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">{heading}</h4>
            <ul className="space-y-2.5">
              {links.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-white/60 hover:text-white transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>© 2024 Murad & Sabah Store — Proudly serving Nablus since 2010</span>
          <span>All rights reserved</span>
        </div>
      </div>
    </footer>
  );
}
