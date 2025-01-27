import { Link } from "react-router-dom";
import { TbShoppingBagPlus } from "react-icons/tb";

export default function RelatedProduct() {
  const relatedProducts = [
    {
      id: 1,
      name: "Premium Organic T-Shirt",
      price: 39.99,
      image: "/images/related-1.jpg",
      colors: 4
    },
    {
      id: 2,
      name: "Slim Fit Cotton Shirt",
      price: 49.99,
      image: "/images/related-2.jpg",
      colors: 3
    },
    {
      id: 3,
      name: "Classic Crew Neck Sweatshirt",
      price: 59.99,
      image: "/images/related-3.jpg",
      colors: 5
    },
    {
      id: 4,
      name: "Lightweight Hooded Jacket",
      price: 89.99,
      image: "/images/related-4.jpg",
      colors: 2
    }
  ];

  return (
    <section className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Complete Your Look</h2>
        <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
          View All Products →
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {relatedProducts.map((product) => (
          <article key={product.id} className="group relative">
            <Link to={`/product/${product.id}`} className="block">
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              <div className="mt-4">
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-gray-900">${product.price}</p>
                  <span className="text-sm text-gray-500">
                    {product.colors} colors
                  </span>
                </div>
              </div>
            </Link>

            <button className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full p-2 shadow-sm hover:bg-white transition-colors">
              <TbShoppingBagPlus className="w-5 h-5 text-gray-900" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
