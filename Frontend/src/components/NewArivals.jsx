import React, { useContext, useEffect, useState } from 'react';
import Tittle from './Title';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Autoplay, Pagination } from 'swiper/modules';
import Item from './Item';
import { ShopContext } from '../context/ShopContextProvider';

export default function NewArrivals() {
  const { products } = useContext(ShopContext);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    if (products?.length > 0) {
      
      const duplicatedProducts = [...products, ...products].slice(0, 10);
      setNewArrivals(duplicatedProducts);
    }
  }, [products]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Tittle
        title1={'New'}
        title2={'Arrivals'}
        titleStyle="pb-9"
        paraStyle="!block"
      />

      <Swiper
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        breakpoints={{
          640: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 25,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 30,
          },
          1280: {
            slidesPerView: 4, 
            spaceBetween: 30,
          }
        }}
        modules={[Autoplay, Pagination]}
        className="!pb-14"
        loop={true}
        speed={800}
        loopAdditionalSlides={4} 
      >
        {newArrivals.map((product, index) => (
          <SwiperSlide 
            key={`${product._id}-${index}`} 
            className="!h-auto transform transition-transform duration-300 hover:scale-95"
          >
            <div className="h-full p-2">
              <Item product={product} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}