import React from 'react'
import Hero from '../components/Hero'
import Featuers from '../components/Featuers'
import NewArivals from '../components/NewArivals'
import Banner from '../components/Banner'
import PopularProducts from '../components/PopularProducts'
import Blog from '../components/Blog'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div>
      <Hero/>
      <Featuers/>
      <NewArivals/>
      <Banner/>
      <PopularProducts/>
      <Blog/>
      <Footer/>
      
    </div>
  )
}
