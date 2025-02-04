import React from 'react';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';
import user1 from '../assets/testimonials/user1.png';
import user2 from '../assets/testimonials/user2.png';
import product1 from '../assets/product_1.png';
import product2 from '../assets/product_6.png';
import product3 from '../assets/product_3.png';
import product4 from '../assets/product_5.png';
import Footer from "./../components/Footer";
import { Link } from 'react-router-dom';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Michael Chen ",
      role: "Fashion Blogger",
      photo: user1,
      text: "As someone who's particular about quality and style, I'm thoroughly impressed with Murad & Sabah Store. The premium fabrics and attention to detail in every piece make their collections stand out. Their customer service team helped me perfectly style my entire winter wardrobe!",
      products: [product1, product2, product3, product4],
      rating: 5
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "Frequent Customer",
      photo: user2,
      text: "The shopping experience here is unparalleled. From the intuitive website navigation to the fast shipping, every aspect reflects their commitment to customer satisfaction. The tailored fit of their shirts has become my new standard for business casual wear.",
      products: [product1, product2, product3, product4],
      rating: 5
    }
  ];

  return (
    <section className="py-16 mt-8 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
            Client Testimonials
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover why discerning clients choose Murad & Sabah for exceptional craftsmanship 
            and unparalleled service
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-all duration-300 group border border-gray-100"
            >
              <div className="flex items-start mb-6">
                <div className="relative flex-shrink-0">
                  <img 
                    src={testimonial.photo}
                    alt={testimonial.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <div className="absolute -inset-2 border-2 border-white/30 rounded-full" />
                </div>
                <div className="ml-6">
                  <h3 className="text-xl font-semibold text-gray-900 font-serif">
                    {testimonial.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">{testimonial.role}</p>
                  <div className="flex items-center mt-2 space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar 
                        key={i}
                        className="w-5 h-5 text-amber-500"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-8 relative">
                <FaQuoteLeft className="text-gray-300 text-3xl absolute -top-2 left-0" />
                <p className="text-gray-700 leading-relaxed pl-12 text-lg font-light italic">
                  {testimonial.text}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                  Featured Purchases
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  {testimonial.products.map((product, index) => (
                    <Link 
                      to="/collections" 
                      key={index} 
                      className="relative block overflow-hidden rounded-lg group/product transition-transform duration-300 hover:-translate-y-1"
                    >
                      <img
                        src={product}
                        alt={`Product ${index + 1}`}
                        className="w-full h-28 object-cover border border-gray-100 transform transition-transform duration-300 group-hover/product:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover/product:bg-black/10" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Refined CTA Section */}
        <div className="mt-20 text-center bg-white p-12 rounded-2xl shadow-lg border border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-serif font-bold text-gray-900 mb-4">
              Craft Your Signature Style
            </h3>
            <p className="text-gray-600 mb-8 text-xl font-light max-w-2xl mx-auto">
              Join our community of sophisticated clients and discover apparel that 
              redefines modern elegance
            </p>
            <Link 
              to="/collections"
              className="inline-block bg-gray-900 text-white px-10 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300 shadow-sm hover:shadow-md border-2 border-gray-900 hover:border-gray-800"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      </div>
      <Footer/>
    </section>
  );
};

export default Testimonials;