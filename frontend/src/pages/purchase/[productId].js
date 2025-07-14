import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { FiStar, FiClock, FiShield, FiArrowLeft } from 'react-icons/fi';
import { SiLitecoin } from 'react-icons/si';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PurchasePage = () => {
  const router = useRouter();
  const { productId } = router.query;
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [ltcPrice, setLtcPrice] = useState(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchLtcPrice();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${productId}`);
      setProduct(response.data.product);
    } catch (error) {
      toast.error('Product not found');
      router.push('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const fetchLtcPrice = async () => {
    try {
      const response = await api.get('/payments/ltc-price');
      setLtcPrice(response.data.price);
    } catch (error) {
      console.error('Error fetching LTC price:', error);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please login to purchase');
      router.push('/auth/login');
      return;
    }

    setPurchasing(true);

    try {
      const response = await api.post('/orders', {
        productId: product._id,
        paymentMethod: 'litecoin'
      });

      const { orderId } = response.data;
      toast.success('Order created! Redirecting to payment...');
      router.push(`/payment/${orderId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'undetected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'detected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'updating':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'undetected':
        return 'bg-green-500 animate-pulse';
      case 'detected':
        return 'bg-red-500';
      case 'updating':
        return 'bg-yellow-500 animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Product not found
          </h2>
          <button
            onClick={() => router.push('/marketplace')}
            className="btn-primary"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <FiArrowLeft />
          Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {product.screenshots && product.screenshots[0] ? (
                <img
                  src={product.screenshots[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
            </div>

            {/* Additional Screenshots */}
            {product.screenshots && product.screenshots.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {product.screenshots.slice(1, 4).map((screenshot, index) => (
                  <div key={index} className="aspect-video bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <img
                      src={screenshot}
                      alt={`Screenshot ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {product.name}
                </h1>
                <span className={`badge ${getStatusColor(product.status)} flex items-center gap-1`}>
                  <span className={`w-2 h-2 rounded-full ${getStatusDot(product.status)}`}></span>
                  {product.status}
                </span>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                for {product.game}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                {product.rating.toFixed(1)} ({product.totalReviews} reviews)
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Description
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <FiClock className="text-primary-600" />
                <span className="text-gray-600 dark:text-gray-400">
                  Duration: {product.duration}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiShield className="text-primary-600" />
                <span className="text-gray-600 dark:text-gray-400">
                  Status: {product.status}
                </span>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <SiLitecoin className="w-6 h-6 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {product.price} LTC
                    </span>
                  </div>
                  {ltcPrice && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ≈ ${(product.price * ltcPrice).toFixed(2)} USD
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={purchasing || product.status === 'detected'}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : product.status === 'detected' ? (
                  'Currently Detected - Unavailable'
                ) : (
                  <>
                    <SiLitecoin className="w-4 h-4" />
                    Purchase with Litecoin
                  </>
                )}
              </button>

              {product.status === 'updating' && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 text-center">
                  ⚠️ This cheat is currently being updated
                </p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                🔒 Secure Purchase
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Instant license key delivery after payment</li>
                <li>• Secure Litecoin payment processing</li>
                <li>• 24/7 customer support</li>
                <li>• Automatic updates when available</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
