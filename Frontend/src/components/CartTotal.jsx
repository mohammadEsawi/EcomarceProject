import React from 'react';

export default function CartTotal({ subtotal, shippingFee, total, currency }) {
    return (
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
                    </div>
                </div>
            </div>
        </div>
    );
}


