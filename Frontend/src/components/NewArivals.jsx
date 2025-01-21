import React, { useContext, useEffect, useState } from 'react';
import Tittle from './Tittle';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Autoplay, Pagination } from 'swiper/modules';
import Item from './Item';
import { ShopContext } from '../context/ShopContextProvider';

export default function NewArrivals() {
  const { products } = useContext(ShopContext);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    if (products && products.length > 0) {
      const data = products.slice(0, 10); // Get the first 10 products
      setNewArrivals(data);
    }
  }, [products]);

  return (
    <section>
      <Tittle
        title1={'New'}
        title2={'Arrivals'}
        titleStyle={'pb-9'}
        paraStyle={'!block'}
      />

      <Swiper
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        breakpoints={{
          400: {
            slidesPerView: 2,
            spaceBetween: 10,
          },
          700: {
            slidesPerView: 3,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 30,
          },
        }}
        modules={[Autoplay, Pagination]}
        className="h-[555px] sm:h-[411px] md:h-[488px]"
      >
        {newArrivals.map((product) => (
          <SwiperSlide key={product._id}>
            <Item product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}