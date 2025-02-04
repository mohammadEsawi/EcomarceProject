import React from 'react'
import { FaMailBulk } from 'react-icons/fa'
import { FaLocationDot, FaPhone, FaQuestion } from 'react-icons/fa6'

const Footer = () => {
    return (
        <footer className='mt-10'>
            <div className='max-padd-container flex items-start justify-between flex-col lg:flex-row gap-8 py-6 mb-7 bg-primary'>
                <div>
                    <h4 className='h4'>We are always here to help</h4>
                    <p> At Murad & Sabah Store, we're committed to providing exceptional service. 
                        <br/>Whether you have questions about products, orders, or deliveries, our team 
                        is always ready to assist you.</p>
                </div>
                <div className='flexStart flex-wrap gap-8'>
                    <div className='flexCenter gap-x-6'>
                        <FaLocationDot />
                        <div>
                            <h5 className='h5'>Location</h5>
                            <p> Nablus City, Palestine</p>
                        </div>
                    </div>
                    <div className='flexCenter gap-x-6'>
                        <FaPhone />
                        <div>
                            <h5 className='h5'>Phone</h5>
                            <p>+970 598-032-500<br/>
                            Sun-Thu: 8AM - 8PM (Local Time)</p>
                        </div>
                    </div>
                    <div className='flexCenter gap-x-6'>
                        <FaMailBulk />
                        <div>
                            <h5 className='h5'>Email Support</h5>
                            <p>    support@muradsabahstore.ps<br/>
                            Typically replies within 2 hours</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='max-padd-container flex items-start justify-between flex-wrap gap-12 mt-12'>
                {/* logo - Left side */}
                <div className='flex flex-col max-w-sm gap-y-5'>
                    <div className='bold-32'>
                    Murad <span className="text-secondary">&</span> Sabah Store
                    </div>
                    <p> Your premier destination for quality clothing and accessories in Nablus. 
                        We combine traditional Palestinian craftsmanship with modern fashion trends 
                        to bring you unique, authentic pieces.</p>
                </div>
                <div className='flexStart gap-7 xl:gap-x-36 flex-wrap'>
                    <ul>
                        <h4 className='h4 mb-3'>Customer Service</h4>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Help center</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Payment methods</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Contact</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Shipping status</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Complaints</a></li>
                    </ul>
                    <ul>
                        <h4 className='h4 mb-3'>Legal</h4>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Privacy Policy</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Cookie settings</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Terms & conditions</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Cancelation</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Imprint</a></li>
                    </ul>
                    <ul>
                        <h4 className='h4 mb-3'>Others</h4>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Our teams</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Sustainability</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Press</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Jobs</a></li>
                        <li className='my-2'><a href="" className='text-gray-30 regular-14 '>Newsletter</a></li>
                    </ul>
                </div>
            </div>
            {/* copyrights */}
            <p className='max-padd-container bg-primary medium-14 py-2 px-8 rounded flexBetween mt-6'><span> © 2024 Murad & Sabah Store - Proudly Serving Nablus Since 2010</span><span>All rights reserved</span></p>
        </footer>
    )
}

export default Footer