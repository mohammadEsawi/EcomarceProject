import React, { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContextProvider";
import { Audio } from "react-loader-spinner";
import { FaStarHalfStroke, FaStar, FaTruckFast } from "react-icons/fa6";
import { TbShoppingBagPlus } from "react-icons/tb";
import { FaHeart } from "react-icons/fa";
import Footer from "../components/Footer";
import ProductDescription from "../components/ProductDescription";
import { ProductFeatures } from "../components/ProductFeatures";
import RelatedProduct from "../components/RelatedProduct";
import { toast } from "react-toastify";


export default function Product() {
  const { productId } = useParams();
  const { products, currency ,addToCart} = useContext(ShopContext);
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);

  const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    const selectedProduct = products.find((item) => item._id === productId);
    if (selectedProduct) {
      setProduct(selectedProduct);
      setSelectedImage(selectedProduct.image?.[0] || "/images/placeholder.jpg");
    } else {
      setProduct(null);
    }
  }, [productId, products]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Audio height="80" width="80" color="#3B82F6" ariaLabel="loading" />
        <p className="mt-4 text-gray-600">Loading product details...</p>
      </div>
    );
  }

  return (
    <div >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
          {/* Image Gallery */}
          <div className="flex flex-col-reverse lg:flex-row gap-4">
            <div className="flex lg:flex-col gap-2 order-2 lg:order-1">
              {product.image?.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === img
                      ? "border-gray-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <div className="relative aspect-square w-full bg-white rounded-xl shadow-lg overflow-hidden order-1 lg:order-2">
              <img
                src={selectedImage}
                alt="Main product"
                className="w-full h-full object-contain p-6"
              />
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`absolute top-4 right-4 p-2 rounded-full shadow-sm transition-colors ${
                  isWishlisted
                    ? "text-red-500 bg-white"
                    : "text-gray-400 bg-white hover:text-red-400"
                }`}
              >
                <FaHeart className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="w-5 h-5" />
                ))}
              </div>
              <span className="text-sm text-gray-500">(122 reviews)</span>
            </div>

            <div className="mb-6">
              <span className="text-2xl font-bold text-gray-900">
                {currency}
                {product.price.toLocaleString()}.00
              </span>
              {product.originalPrice && (
                <span className="ml-2 text-gray-400 line-through">
                  {currency}
                  {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-gray-600 mb-8">{product.description}</p>

            {/* Size Selection */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Select Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedSize === size
                        ? "bg-secondary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-8">
            <button 
  onClick={() => {
    if (!selectedSize) {
      toast.error("Please select a size first");
      return;
    }
    addToCart(product._id, selectedSize);
  }}
  className="flex-1 bg-secondary hover:bg-secondary-500 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
>
  <TbShoppingBagPlus className="w-5 h-5" />
  Add to Cart
</button>
              <button className="p-3 rounded-lg border border-gray-200 hover:bg-secondary transition-colors">
                <FaHeart className={`w-6 h-6 ${isWishlisted ? 'text-red-500' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Delivery Info */}
            <div className="border-t border-b border-gray-200 py-4 mb-6">
              <div className="flex items-center gap-3 text-gray-600">
                <FaTruckFast className="w-6 h-6 text-gray-700" />
                <div>
                  <p className="font-medium">Free Standard Delivery</p>
                  <p className="text-sm">Arrives in 3-5 business days</p>
                </div>
              </div>
            </div>

            {/* Assurance Badges */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>100% Authentic Products</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <span>Secure Payment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Sections */}
        <div className="mt-16 space-y-16">
          <ProductDescription/>
          <ProductFeatures/>
          <RelatedProduct currentProductId={productId || product?._id} />
          </div>
      </div>
      <Footer />
    </div>
  );
}