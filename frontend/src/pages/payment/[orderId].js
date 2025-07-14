import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SiLitecoin } from 'react-icons/si';
import { FiCopy, FiCheck, FiClock, FiRefreshCw } from 'react-icons/fi';
import QRCode from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderAndPayment();
    }
  }, [orderId]);

  useEffect(() => {
    let interval;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            // Payment expired
            toast.error('Payment time expired');
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    // Auto-check payment status every 30 seconds
    const interval = setInterval(() => {
      if (order && order.paymentStatus === 'pending') {
        checkPaymentStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [order]);

  const fetchOrderAndPayment = async () => {
    try {
      const [orderResponse, paymentResponse] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get(`/payments/order/${orderId}`)
      ]);

      setOrder(orderResponse.data.order);
      setPaymentData(paymentResponse.data);

      // Set timer (15 minutes from creation)
      const createdAt = new Date(orderResponse.data.order.createdAt);
      const expiresAt = new Date(createdAt.getTime() + 15 * 60 * 1000);
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);

      // If already paid, redirect to confirmation
      if (orderResponse.data.order.paymentStatus === 'completed') {
        router.push(`/purchase-confirmation/${orderId}`);
      }
    } catch (error) {
      toast.error('Order not found');
      router.push('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (checking) return;
    
    setChecking(true);
    try {
      const response = await api.get(`/orders/${orderId}`);
      const updatedOrder = response.data.order;
      
      if (updatedOrder.paymentStatus === 'completed') {
        toast.success('Payment confirmed!');
        router.push(`/purchase-confirmation/${orderId}`);
      } else if (updatedOrder.paymentStatus === 'failed') {
        toast.error('Payment failed');
      }
      
      setOrder(updatedOrder);
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setChecking(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order || !paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Payment not found
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <SiLitecoin className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Complete Payment
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Send Litecoin to the address below to complete your purchase
          </p>
        </div>

        {/* Timer */}
        {timeLeft > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2">
              <FiClock className="text-yellow-600" />
              <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                Time remaining: {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        )}

        {/* Payment Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          {/* Order Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Order Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                <span className="font-mono text-gray-900 dark:text-white">{order.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {order.total} LTC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`badge ${
                  order.paymentStatus === 'pending' ? 'badge-warning' :
                  order.paymentStatus === 'completed' ? 'badge-success' :
                  'badge-danger'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Address */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Payment Address
            </h3>
            
            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCode
                  value={`litecoin:${paymentData.address}?amount=${order.total}`}
                  size={200}
                />
              </div>
            </div>

            {/* Address */}
            <div className="relative">
              <input
                type="text"
                value={paymentData.address}
                readOnly
                className="input pr-12 font-mono text-sm"
              />
              <CopyToClipboard text={paymentData.address} onCopy={handleCopy}>
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
                </button>
              </CopyToClipboard>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Exact Amount to Send
            </h3>
            <div className="relative">
              <input
                type="text"
                value={`${order.total} LTC`}
                readOnly
                className="input pr-12 font-mono text-lg font-semibold"
              />
              <CopyToClipboard text={order.total.toString()} onCopy={() => toast.success('Amount copied')}>
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FiCopy />
                </button>
              </CopyToClipboard>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              ⚠️ Send the exact amount. Partial payments will not be processed.
            </p>
          </div>

          {/* Check Payment Button */}
          <button
            onClick={checkPaymentStatus}
            disabled={checking}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <div className="spinner"></div>
                Checking...
              </>
            ) : (
              <>
                <FiRefreshCw />
                Check Payment Status
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
            Payment Instructions
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <li>1. Copy the payment address above</li>
            <li>2. Open your Litecoin wallet</li>
            <li>3. Send exactly {order.total} LTC to the address</li>
            <li>4. Wait for confirmation (usually 2-6 confirmations)</li>
            <li>5. You'll be automatically redirected once payment is confirmed</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Payments are automatically detected. 
              If you don't see confirmation within 30 minutes, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
