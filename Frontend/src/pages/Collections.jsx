import React, { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContextProvider";
import ShowSearch from "../components/ShowSearch";
import Footer from './../components/Footer';
import Item from "../components/Item";

export default function Collections() {
  const { products, search } = useContext(ShopContext);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("relevant");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const toggleFilter = (value, setter) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  useEffect(() => {
    let filtered = [...products];

    if (category.length > 0) {
      filtered = filtered.filter((product) => category.includes(product.category));
    }

    if (subCategory.length > 0) {
      filtered = filtered.filter((product) => subCategory.includes(product.subCategory));
    }

    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm)
      );
    }

    switch (sortType) {
      case "price":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, category, subCategory, search, sortType]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="max-padd-container !px-0">
      <div className="flex flex-col sm:flex-row gap-8 mb-8">
        {/* Filter Sidebar */}
        <div className="min-w-72 bg-primary p-6 pt-8 lg:pl-12 rounded-r-xl shadow-lg sticky top-0 h-fit">
          <div className="mb-6 mt-10">
            <ShowSearch />
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <h5 className="h5 mb-4 text-black">Categories</h5>
            <div className="space-y-3">
              {["Men", "Women", "Kids"].map((cat) => (
                <label key={cat} className="flex items-center gap-3 text-black-100 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-secondary rounded-sm"
                    onChange={(e) => toggleFilter(e.target.value, setCategory)}
                    value={cat}
                  />
                  <span className="font-medium">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Subcategory Filter */}
          <div className="mb-8">
            <h5 className="h5 mb-4 text-black">Product Types</h5>
            <div className="space-y-3">
              {["Topwear", "Bottomwear", "WinterWear"].map((type) => (
                <label key={type} className="flex items-center gap-3 text-black-100 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-secondary rounded-sm"
                    onChange={(e) => toggleFilter(e.target.value, setSubCategory)}
                    value={type}
                  />
                  <span className="font-medium">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sorting */}
          <div className="mb-8">
            <h5 className="h5 mb-4 text-black">Sort By</h5>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="w-full p-3 rounded-lg bg-white border-2 border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary"
            >
              {[ 
                { value: "relevant", label: "Relevant" },
                { value: "price", label: "Price: Low to High" },
                { value: "price_desc", label: "Price: High to Low" }
              ].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 mt-5">
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <Item key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your criteria</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 gap-2 flex-wrap">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-2 text-sm font-medium text-secondary bg-white border-2 border-secondary rounded-lg hover:bg-secondary hover:text-white disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-secondary transition-all"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => {
                const page = i + 1;
                const isCurrent = page === currentPage;
                const isNear = Math.abs(page - currentPage) <= 2;
                
                if (isNear || page === 1 || page === totalPages) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 text-sm font-medium border-2 rounded-lg ${
                        isCurrent 
                          ? 'bg-secondary border-secondary text-white'
                          : 'text-secondary border-secondary hover:bg-secondary/10'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }

                return null;
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-4 py-2 text-sm font-medium text-secondary bg-white border-2 border-secondary rounded-lg hover:bg-secondary hover:text-white disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-secondary transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}