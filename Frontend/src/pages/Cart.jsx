import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from "../context/ShopContextProvider";
import { FaMinus, FaPlus, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function Cart() {
    const { products, currency, cartItems, getCartCount, updateQuantities, removeItem, navigate } = useContext(ShopContext);
    const [cartData, setCartData] = useState([]);
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        if (products.length > 0) {
            const tempData = [];
            const initialQuantities = {};
            for (const items in cartItems) {
                for (const item in cartItems[items]) {
                    if (cartItems[items][item] > 0) {
                        tempData.push({
                            _id: items,
                            size: item,
                            quantity: cartItems[items][item]
                        });
                        initialQuantities[`${items} - ${item}`] = cartItems[items][item];
                    }
                }
            }
            setCartData(tempData);
            setQuantities(initialQuantities);
        }
    }, [cartItems, products]);

    const increment = (id, size) => {
        const key = `${id} - ${size}`;
        const newValue = quantities[key] + 1;
        setQuantities(prev => ({ ...prev, [key]: newValue }));
        updateQuantities(id, size, newValue);
    };

    const decrement = (id, size) => {
        const key = `${id} - ${size}`;
        if (quantities[key] > 1) {
            const newValue = quantities[key] - 1;
            setQuantities(prev => ({ ...prev, [key]: newValue }));
            updateQuantities(id, size, newValue);
        }
    };

    // Calculate prices
    const subtotal = cartData.reduce((total, item) => {
        const product = products.find(p => p._id === item._id);
        return total + (product.price * quantities[`${item._id} - ${item.size}`]);
    }, 0);
    
    const shippingFee = 10.00;
    const total = subtotal + shippingFee;

    return (
        <div className="min-h-screen mt-10 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto lg:max-w-none">
                    {/* Enhanced Header Section */}
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
                            Your <span className='text-secondary' >Shopping</span> Cart
                        </h1>
                        <div className="flex items-center justify-center space-x-4 mt-4">
                            <p className="text-lg text-gray-600">
                                {getCartCount()} {getCartCount() === 1 ? 'Item' : 'Items'}
                            </p>
                            <span className="text-gray-300">|</span>
                            <Link 
                                to="/collections"
                                className="text-black hover:text-secondary text-lg font-medium transition-colors"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    {cartData.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="max-w-md mx-auto">
                                <div className="mb-8 text-6xl text-gray-200">🛒</div>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                    Your Cart Feels Lonely
                                </h2>
                                <button
                                    onClick={() => navigate('/collections')}
                                    className="bg-black text-white px-8 py-3 rounded-lg hover:bg-secondary transition-all transform hover:scale-105"
                                >
                                    Start Shopping
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                            {/* Cart Items List */}
                            <div className="divide-y divide-gray-100">
                                {cartData.map((item, index) => {
                                    const productData = products.find(product => product._id === item._id);
                                    const key = `${item._id} - ${item.size}`;
                                    
                                    return (
                                        <div 
                                            key={`${item._id}-${item.size}`} 
                                            className="p-6 group transition-all hover:bg-secondary"
                                        >
                                            <div className="flex items-start space-x-6">
                                                <img 
                                                    src={productData.image[0]} 
                                                    alt={productData.name} 
                                                    className="w-32 h-32 object-cover rounded-xl shadow-sm"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                                                {productData.name}
                                                            </h3>
                                                            <div className="flex items-center space-x-3">
                                                                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                                                                    Size: {item.size}
                                                                </span>
                                                                {productData.color && (
                                                                    <span 
                                                                        className="w-5 h-5 rounded-full border shadow-inner"
                                                                        style={{ backgroundColor: productData.color }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => updateQuantities(item._id, item.size,0)}
                                                            className="text-gray-400 hover:text-red-600 transition-colors p-2 -mt-2 -mr-2"
                                                            title="Remove item"
                                                        >
                                                            <FaTimes className="h-6 w-6" />
                                                        </button>
                                                    </div>

                                                    <div className="mt-6 flex items-center justify-between">
                                                        <div className="flex items-center border rounded-full bg-white shadow-sm">
                                                            <button
                                                                onClick={() => decrement(item._id, item.size)}
                                                                className="p-3 hover:bg-gray-100 transition-colors rounded-l-full"
                                                            >
                                                                <FaMinus className="h-4 w-4 text-gray-600" />
                                                            </button>
                                                            <span className="px-4 text-gray-700 font-medium">
                                                                {quantities[key]}
                                                            </span>
                                                            <button
                                                                onClick={() => increment(item._id, item.size)}
                                                                className="p-3 hover:bg-gray-100 transition-colors rounded-r-full"
                                                            >
                                                                <FaPlus className="h-4 w-4 text-gray-600" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xl font-bold text-gray-900">
                                                            {currency}{(productData.price * quantities[key]).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Sticky Checkout Summary */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-100">
                                <div className="px-6 py-6 bg-gradient-to-r from-indigo-50 to-blue-50">
                                    <div className="max-w-xl ml-auto">
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>{currency}{subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Shipping:</span>
                                                <span>{currency}{shippingFee.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-2xl font-bold text-gray-900">
                                                <span>Total:</span>
                                                <span>{currency}{total.toFixed(2)}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 text-right">
                                                Includes VAT. Shipping calculated at checkout
                                            </p>
                                            <div className="flex flex-col space-y-4">
                                                <button onClick={()=>navigate('/place-order')}
                                                    className="w-full bg-black text-white py-4 px-8 rounded-xl hover:shadow-lg transition-all hover:scale-[1.02]"
                                                >
                                                    Proceed to Checkout
                                                </button>
                                                <button
                                                    onClick={() => navigate('/collections')}
                                                    className="text-black hover:text-secondary text-sm font-medium text-center"
                                                >
                                                    ← Continue Shopping
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}