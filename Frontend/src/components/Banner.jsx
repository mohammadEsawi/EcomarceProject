import React from 'react'
import {Link} from'react-router-dom'
import banner from'../assets/banner.png'
import Collections from './../pages/Collections';
import { FaArrowRight } from 'react-icons/fa';

export default function Banner() {
  return (
    <section className='mx-auto max-w-[1440px] px-4 lg:px-8'>
      <div className='flex flex-col lg:flex-row bg-white items-center'>
        <div className='lg:w-1/2 px-6 xl:px-12 order-2 lg:order-1'>
          <h2 className='h2 uppercase'>Affordable Style, Timeless Appeal</h2>
          <h3 className='h4 uppercase mt-4'>Discover our latest products and exclusive deals</h3>
          <div className='flex mt-5'>
            <Link to='/collections' className='py-4 px-12 btn-secondary !py-0 !pr-0 rounded-full flexCenter gap-x-2 group text-white hover:bg-primary-dark'>
              Explore Collections
              <FaArrowRight className='bg-white text-black rounded-full h-9 w-9 p-3 m-[3px] group-hover:-rotate-[20deg] transition-all duration-500'/>
            </Link>
          </div>
        </div>
        <div className='lg:w-1/2 order-1 lg:order-2'>
          <img 
            src={banner} 
            alt="banner"
            className='w-full h-full object-cover rounded-tr-3xl rounded-bl-3xl' 
          />
        </div>
      </div>
    </section>
  )
}