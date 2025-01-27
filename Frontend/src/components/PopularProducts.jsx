import React, { useContext, useState, useEffect } from 'react';
import Title from './Title'; 
import { ShopContext } from '../context/ShopContextProvider';
import Item from './Item'; 

export default function PopularProducts() {
  const { products } = useContext(ShopContext); 
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    if (products?.length > 0) {
      const data = products.filter(item => item.popular); 
      setPopularProducts(data.slice(0, 5)); 
    }
  }, [products]);

  return (
    <section className='max-padd-container py-16 mt-12'> 
      <Title 
        title1={'Popular'} 
        title2={'Products'} 
        titleStyles={'pb-10'} 
        paraStyles={'!block'} 
      />
      <div className='grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-10'> 
        {popularProducts.map(product => (
          <div key={product._id} > 
            <Item product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}