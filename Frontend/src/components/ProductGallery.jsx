import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaExpand, FaImage } from "react-icons/fa";

export default function ProductGallery({ images = [], mainImage }) {
  const allImages = [
    ...(mainImage ? [mainImage] : []),
    ...images.filter((img) => img && img !== mainImage),
  ].filter(Boolean);

  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const prev = () => setActive((i) => (i === 0 ? allImages.length - 1 : i - 1));
  const next = () => setActive((i) => (i === allImages.length - 1 ? 0 : i + 1));

  const src = allImages[active];

  // No images at all — show a clean placeholder
  if (allImages.length === 0) {
    return (
      <div className="rounded-2xl bg-gray-100 aspect-[4/5] flex flex-col items-center justify-center gap-3 text-gray-300">
        <FaImage className="h-16 w-16" />
        <p className="text-sm font-medium">No photo yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-[4/5] cursor-zoom-in"
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={active}
              src={src}
              alt="Product"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`w-full h-full object-cover transition-transform duration-500 ${zoomed ? "scale-110" : "scale-100"}`}
            />
          </AnimatePresence>

          {/* Nav arrows */}
          {allImages.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition">
                <FaChevronLeft className="h-3 w-3 text-gray-700" />
              </button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition">
                <FaChevronRight className="h-3 w-3 text-gray-700" />
              </button>
            </>
          )}

          {/* Expand */}
          <button
            onClick={() => setLightbox(true)}
            className="absolute bottom-3 right-3 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition"
          >
            <FaExpand className="h-3 w-3 text-gray-700" />
          </button>

          {/* Counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
              {active + 1} / {allImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  active === i ? "border-gray-900" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <img src={src} alt="Product" className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl" />
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl">&times;</button>
        </div>
      )}
    </>
  );
}
