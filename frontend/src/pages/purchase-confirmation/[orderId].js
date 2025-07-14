import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FiCopy, FiCheck, FiExternalLink, FiHelpCircle } from 'react-icons/fi';
import { SiLitecoin } from 'react-icons/si';
import { orderService } from '../../services/api';
import toast from 'react-hot-toast';
import Head from 'next/head';

export default function PurchaseConfirmation() {
  const router = useRouter();
  const { orderId } = router.query;
  const [copied, setCopied] = useState(false);

  // Fetch order details
  const { data, isLoading, error } = useQuery(
    ['order', orderId],
    () => orderService.getOrder(orderId),
    {
      enabled: !!orderId,
      refetchInterval: (data) => {
        // Stop refetching if order is completed
        return data?.order?.status === 'completed' ? false : 5000;
      },
    }
  );

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = () => {
    setCopied(true);
    toast.success('License key copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Order Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
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

  const order = data.order;
  const isCompleted = order.status === 'completed' && order.paymentStatus === 'paid';

  if (!isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Payment Processing</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your payment is being processed. This page will update automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Order Confirmation - {order.orderId}</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full mb-4">
              <FiCheck className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Purchase Successful!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="card p-8">
            {/* Product Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {order.productSnapshot.name} for {order.productSnapshot.game}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Duration: {order.productSnapshot.duration}
              </p>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Order:</p>
                <p className="font-mono text-gray-900 dark:text-white">{order.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Amount:</p>
                <p className="font-mono text-gray-900 dark:text-white">{order.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total:</p>
                <p className="font-mono text-gray-900 dark:text-white">{order.total} LTC</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time of purchase:</p>
                <p className="font-mono text-gray-900 dark:text-white">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email:</p>
                <p className="font-mono text-gray-900 dark:text-white">{order.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Payment method:</p>
                <div className="flex items-center gap-2 mt-1">
                  <SiLitecoin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-mono text-gray-900 dark:text-white">LITECOIN</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Payment status:</p>
              <div className="flex items-center gap-2">
                <FiCheck className="w-5 h-5 text-success-600" />
                <span className="text-success-600 font-medium">paid</span>
              </div>
            </div>

            {/* License Key Section */}
            <div className="mb-8">
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your keys:</p>
              <div className="relative">
                <input
                  type="text"
                  value={order.license_key}
                  readOnly
                  className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm"
                />
                <CopyToClipboard text={order.license_key} onCopy={handleCopy}>
                  <button
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-all ${
                      copied
                        ? 'text-success-600 bg-success-100 dark:bg-success-900'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {copied ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
                  </button>
                </CopyToClipboard>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={order.productSnapshot.instruction_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <FiExternalLink className="w-4 h-4" />
                Instruction and loader
              </a>
              <button
                onClick={() => {
                  // Show support contact in a modal or toast
                  toast.success(`Support contact: ${order.productSnapshot.support_contact}`, {
                    duration: 6000,
                  });
                }}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <FiHelpCircle className="w-4 h-4" />
                Help
              </button>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              A confirmation email has been sent to {order.email}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Keep this page bookmarked or save your license key in a secure location.
            </p>
            <button
              onClick={() => router.push('/orders')}
              className="mt-6 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              View All Orders →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
