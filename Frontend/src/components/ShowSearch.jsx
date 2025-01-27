import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContextProvider';
import { useLocation } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

export default function ShowSearch() {
  const { search, setSearch } = useContext(ShopContext); 
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setVisible(location.pathname.includes('collections'));
  }, [location]);

  return visible ? (
    <div className='pt-4 pb-4'> 
      <div className='text-left'>
        <div className='inline-flex items-center justify-between px-3 py-1.5 rounded-full bg-white overflow-hidden w-full border border-gray-200'>
          <input
            type='text'
            placeholder='Search products...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='border-none outline-none w-full bg-white text-sm flex-1' 
          />
          <div className='ml-2 text-gray-400'>
            <FaSearch className='cursor-pointer' />
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
