import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import api from '../../services/api';
import { FiCopy, FiCheck, FiDownload, FiHelpCircle, FiStar } from 'react-icons/fi';

export default function PublicOrderPage() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/public/${orderId}`);
      setOrder(response.data.order);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order');
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post(`/orders/public/${orderId}/review`, {
        rating,
        comment
      });
      alert('Review submitted successfully!');
      setShowReview(false);
      fetchOrder(); // Refresh to show review status
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link href="/">
              <a className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Return to Marketplace
              </a>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Order {order.orderId} - Fail.ac</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Order Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {order.productName} for {order.game}
            </h1>
            <p className="text-gray-600">Duration: {order.duration}</p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Order ID:</p>
                <p className="font-semibold">{order.orderId}</p>
              </div>
              <div>
                <p className="text-gray-600">Amount:</p>
                <p className="font-semibold">{order.amount}</p>
              </div>
              <div>
                <p className="text-gray-600">Total:</p>
                <p className="font-semibold">{order.total}p</p>
              </div>
              <div>
                <p className="text-gray-600">Time of purchase:</p>
                <p className="font-semibold">{new Date(order.purchaseTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Email:</p>
                <p className="font-semibold">{order.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Payment method:</p>
                <p className="font-semibold flex items-center">
                  <span className="mr-2">💰</span> LITECOIN
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-600">Payment status:</p>
              <p className="font-semibold text-green-600">✓ paid</p>
            </div>
          </div>

          {/* License Key */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your License Key</h2>
            <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between">
              <code className="text-lg font-mono">{order.licenseKey}</code>
              <button
                onClick={() => copyToClipboard(order.licenseKey)}
                className="ml-4 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {copied ? <FiCheck /> : <FiCopy />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={order.instructionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <FiDownload className="mr-2" />
                Instruction and loader
              </a>
              <button
                onClick={() => alert(`Support Contact: ${order.supportContact}`)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <FiHelpCircle className="mr-2" />
                Help
              </button>
            </div>
          </div>

          {/* Review Section */}
          {!order.hasReviewed && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Leave a Review</h2>
              {!showReview ? (
                <button
                  onClick={() => setShowReview(true)}
                  className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 flex items-center"
                >
                  <FiStar className="mr-2" />
                  Rate this product
                </button>
              ) : (
                <form onSubmit={submitReview}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-2xl ${
                            star <= rating ? 'text-yellow-500' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                      Comment (optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      rows="4"
                      placeholder="Share your experience..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReview(false)}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Save Link Notice */}
          <div className="mt-8 text-center text-gray-600">
            <p>Save this link to access your order anytime:</p>
            <p className="font-mono text-sm mt-2 break-all">
              {typeof window !== 'undefined' && window.location.href}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
