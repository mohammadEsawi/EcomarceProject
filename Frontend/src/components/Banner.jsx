import React from 'react'
import {Link} from'react-router-dom'
import banner from'../assets/banner.png'
import Collections from './../pages/Collections';
import { FaArrowRight } from 'react-icons/fa';
export default function Banner() {
  return (
    <section className='mx-auto max-w-[1440px]'>
      <div className='flexBetween bg-white'>
        <div className='hidden lg:block flex-1 px-6 x1:px-12'>
        <h2 className='h2 uppercase'> Affordable Style, Timeless Appeal</h2>
        <h3 className='h4 uppercase'>Discover our latest products and exclusive deals</h3>
          <div className='flex mt-5'>
            <Link to='/collections' className='  py-4 px-12 btn-secondary !py-0 !pr-0 rounded-full flexCenter gap-x-2 group text-white hover:bg-primary-dark'> Explore Collections
            <FaArrowRight className='bg-white text-black rounded-full h-9 w-9 p-3 m-[3px] group-hover:-rotate-[20deg] transition-all duration-500 '/>
             </Link>
           
          </div>
        </div>
      </div>
      <div className='flex-1'>
        <img src={banner} 
        alt="banner"
        className='rounded-t1-3x1 rounded-bl-3xl' />
      </div>
      
    </section>
  )
}
