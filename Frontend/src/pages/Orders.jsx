import React, { useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ShopContext } from '../context/ShopContextProvider';
import { Link } from 'react-router-dom';
import { 
  FiArrowRight, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiPackage, 
  FiTruck 
} from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import Footer from '../components/Footer';

// Constants for status types
const ORDER_STATUS = {
  DELIVERED: 'delivered',
  PROCESSING: 'processing',
  CANCELLED: 'cancelled'
};

const OrderList = () => {
  const { products, token } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const generateMockOrder = (product, index) => ({
    id: `order-${index + 1}-${Date.now()}`,
    orderNumber: `ORD${1000 + index}`,
    status: Object.values(ORDER_STATUS)[index % 3],
    orderDate: new Date().toISOString(),
    totalAmount: product.price * (index + 1),
    paymentMethod: index % 2 === 0 ? 'Credit Card' : 'PayPal',
    items: [{
      ...product,
      quantity: index + 1,
      size: ['S', 'M', 'L'][index % 3],
    }],
  });

  const fetchOrderData = async () => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOrders = products.slice(0, 5).map(generateMockOrder);
      setOrderData(mockOrders);
    } catch (error) {
      setError('Failed to retrieve order information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError('Authentication required. Please log in to view your orders.');
      setLoading(false);
      return;
    }
    
    fetchOrderData();
  }, [products, token]);

  const filteredOrders = useMemo(() => 
    orderData.filter(order => {
      const statusMatch = filterStatus === 'all' || order.status === filterStatus;
      const searchMatch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return statusMatch && searchMatch;
    }), 
    [orderData, filterStatus, searchQuery]
  );

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      [ORDER_STATUS.DELIVERED]: {
        icon: FiCheckCircle,
        color: 'green'
      },
      [ORDER_STATUS.PROCESSING]: {
        icon: FiClock,
        color: 'blue'
      },
      [ORDER_STATUS.CANCELLED]: {
        icon: FiXCircle,
        color: 'red'
      }
    };

    const { icon: Icon, color } = statusConfig[status] || {};
    
    return (
      <span 
        className={`bg-${color}-100 text-${color}-800 px-3 py-1 rounded-full text-sm flex items-center gap-2`}
        aria-label={`Order status: ${status}`}
      >
        {Icon && <Icon className="shrink-0" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const OrderItem = ({ item }) => (
    <div className="flex items-center gap-4">
      <img
        src={item.image[0]}
        alt={item.name}
        className="w-16 h-16 object-cover rounded-lg"
        loading="lazy"
      />
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{item.name}</h3>
        <dl className="text-sm text-gray-500">
          <div className="mt-1">
            <dt className="sr-only">Quantity</dt>
            <dd>Quantity: {item.quantity}</dd>
          </div>
          <div className="mt-1">
            <dt className="sr-only">Size</dt>
            <dd>Size: {item.size}</dd>
          </div>
          <div className="mt-1">
            <dt className="sr-only">Price</dt>
            <dd>Price: ${item.price.toFixed(2)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );

  const SkeletonLoader = () => (
    Array(5).fill(0).map((_, index) => (
      <div key={index} className="p-6 border-b last:border-0">
        <Skeleton height={24} width={200} />
        <Skeleton height={20} width={300} className="mt-2" />
        <Skeleton height={20} width={150} className="mt-2" />
      </div>
    ))
  );

  const ErrorMessage = ({ message }) => (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
      <div className="flex items-center">
        <FiXCircle className="h-5 w-5 text-red-400 shrink-0" />
        <p className="ml-3 text-sm text-red-700">{message}</p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 mt-9">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FiPackage className="text-blue-600" aria-hidden="true" />
          Order History
        </h1>
        <p className="mt-2 text-gray-600">Review your recent purchases and track order progress</p>
      </header>

      <section aria-labelledby="filterSection">
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="search"
            placeholder="Search by order number..."
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search orders"
          />
          
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter orders by status"
          >
            <option value="all">All Orders</option>
            {Object.values(ORDER_STATUS).map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section aria-labelledby="orderList">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {loading ? (
            <SkeletonLoader />
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500" aria-live="polite">
              <FiPackage className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
              <p className="mt-4">No orders found matching your criteria</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <article 
                key={order._id}
                className="p-6 border-b last:border-0 transition-colors "
                aria-labelledby={`order-${order._id}-header`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h2 id={`order-${order._id}-header`} className="font-medium text-gray-900">
                        Order #{order.orderNumber}
                      </h2>
                      <StatusBadge status={order.status} />
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      Placed on {new Date(order.orderDate).toLocaleDateString()}
                    </p>

                    <div className="mt-4 space-y-4">
                      {order.items.map((item, index) => (
                        <OrderItem key={index} item={item} />
                      ))}
                    </div>

                    <dl className="mt-4 text-sm text-gray-500">
                      <dt className="sr-only">Payment Method</dt>
                      <dd>Payment Method: {order.paymentMethod}</dd>
                    </dl>
                  </div>

                  <div className="md:text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                    <button
                      className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={() => alert(`Tracking order ${order.orderNumber}`)}
                      aria-label={`Track order ${order.orderNumber}`}
                    >
                      <FiTruck aria-hidden="true" />
                      Track Order
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Pagination Placeholder */}
      <nav aria-label="Order pagination" className="mt-6 flex justify-center">
        <ul className="inline-flex rounded-md shadow-sm -space-x-px">
          {['Previous', 1, 2, 'Next'].map((item, index) => (
            <li key={index}>
              <button
                className={`px-4 py-2 border ${
                  index === 0 ? 'rounded-l-lg' : 
                  index === 3 ? 'rounded-r-lg' : 'border-l-0'
                } text-gray-700 hover:bg-secondary`}
                disabled={typeof item === 'string'}
                aria-disabled={typeof item === 'string'}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </nav>
          <Footer/>
    </main>
  );
};


export default OrderList;