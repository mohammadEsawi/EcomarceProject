import React from 'react';
import { blogs } from '../assets/data';
import Title from './Title'; // Ensure Title is properly imported

export default function Blog() {
  return (
    <section className='max-padd-container py-16'>
      {/* Section Title */}
      <Title 
        title1={'Our Expert'} 
        title2={'Blog'} 
        titleStyles={'pb-10'} 
        paraStyles={'!block'} 
      />
      
      {/* Blog Grid */}
      <div 
        className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8'
      >
        {blogs.map((blog) => (
          <div 
            key={blog.title} 
            className='rounded-3xl border border-primary overflow-hidden relative bg-white shadow-md transition-transform transform hover:scale-105 focus-within:scale-105'
          >
            {/* Blog Image */}
            <img 
              src={blog.image} 
              alt={blog.title} 
              className='w-full h-48 object-cover'
            />
            
            {/* Overlay Content */}
            <div className='absolute inset-0 bg-black/25 opacity-0 hover:opacity-100 transition-opacity'>
              <div className='absolute bottom-4 left-4 text-white'>
                <h3 className='font-semibold text-lg pr-4 leading-5'>{blog.title}</h3>
                <h4 className='medium-14 pb-2'>{blog.category}</h4>
                <p className='text-sm italic pb-2'>
                  {blog.author || 'Unknown Author'} - {blog.publicationDate || 'N/A'}
                </p>
                <button 
                  className='btn-light px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:ring-2 focus:ring-offset-2 focus:ring-white'
                  aria-label={`Read more about ${blog.title}`}
                >
                  Continue Reading
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
