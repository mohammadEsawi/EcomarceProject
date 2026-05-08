import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaPaperPlane } from "react-icons/fa";
import { toast } from "react-toastify";
import Footer from "../components/Footer";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

const INFO = [
  {
    icon: FaMapMarkerAlt,
    title: "Our Location",
    lines: ["Nablus City, Palestine"],
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: FaPhone,
    title: "Phone",
    lines: ["+970 598-032-500", "Sun–Thu: 8 AM – 8 PM"],
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: FaEnvelope,
    title: "Email",
    lines: ["support@muradsabahstore.ps", "Replies within 2 hours"],
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: FaClock,
    title: "Working Hours",
    lines: ["Sunday – Thursday", "8:00 AM – 8:00 PM"],
    color: "bg-amber-50 text-amber-600",
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", subject: "", message: "" });
    setLoading(false);
  };

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition placeholder:text-gray-400";

  return (
    <>
      <div className="pt-20 min-h-screen bg-white">
        {/* Hero */}
        <div className="bg-gray-900 text-white py-16 px-4 text-center">
          <motion.h1 {...fade()} className="text-4xl md:text-5xl font-extrabold mb-3">
            Get In Touch
          </motion.h1>
          <motion.p {...fade(0.1)} className="text-gray-400 max-w-md mx-auto text-sm">
            Have a question, feedback, or a wholesale inquiry? We'd love to hear from you.
          </motion.p>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Info cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {INFO.map(({ icon: Icon, title, lines, color }, i) => (
              <motion.div key={title} {...fade(i * 0.08)} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">{title}</h3>
                {lines.map((l, j) => (
                  <p key={j} className="text-xs text-gray-500 leading-relaxed">{l}</p>
                ))}
              </motion.div>
            ))}
          </div>

          {/* Main section: form + map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Contact form */}
            <motion.div {...fade(0.1)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Send us a message</h2>
              <p className="text-sm text-gray-400 mb-7">We typically respond within 2 business hours.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={inputCls}
                      placeholder="Mohammad Esawi"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      className={inputCls}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                    Subject
                  </label>
                  <select
                    className={inputCls}
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  >
                    <option value="">Select a subject…</option>
                    <option>Order Issue</option>
                    <option>Product Question</option>
                    <option>Return & Refund</option>
                    <option>Wholesale Inquiry</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={5}
                    placeholder="Tell us how we can help you…"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 transition"
                >
                  {loading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <FaPaperPlane className="h-4 w-4" />
                  )}
                  {loading ? "Sending…" : "Send Message"}
                </motion.button>
              </form>
            </motion.div>

            {/* Map + FAQ */}
            <div className="space-y-6">
              {/* Map placeholder */}
              <motion.div {...fade(0.15)} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-64 bg-gray-100 relative">
                <iframe
                  title="Store location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26870.51!2d35.2578!3d32.2211!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151cfe0ea48fde77%3A0x6e1c8c2c2c2c2c2c!2sNablus%2C%20Palestine!5e0!3m2!1sen!2s!4v1000000000000"
                  className="w-full h-full"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                />
              </motion.div>

              {/* FAQ */}
              <motion.div {...fade(0.2)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Frequently Asked</h3>
                {[
                  { q: "How long does shipping take?", a: "Local orders arrive in 2–3 business days. International orders take 7–14 days." },
                  { q: "Can I return an item?", a: "Yes — items can be returned within 14 days of delivery in original condition." },
                  { q: "Do you offer wholesale pricing?", a: "Yes. Select 'Wholesale Inquiry' above and we'll reach out with pricing details." },
                ].map(({ q, a }) => (
                  <details key={q} className="group border-b border-gray-100 py-3 last:border-0">
                    <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-gray-700 select-none list-none">
                      {q}
                      <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <p className="mt-2 text-xs text-gray-500 leading-relaxed">{a}</p>
                  </details>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
