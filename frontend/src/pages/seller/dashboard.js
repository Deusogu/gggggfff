import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiDollarSign, 
  FiPackage, 
  FiTrendingUp,
  FiUsers,
  FiUpload,
  FiExternalLink
} from 'react-icons/fi';
import { SiLitecoin } from 'react-icons/si';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SellerDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    totalSales: 0,
    activeProducts: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'seller') {
      router.push('/marketplace');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, ordersRes, statsRes] = await Promise.all([
        api.get('/seller/products'),
        api.get('/seller/orders'),
        api.get('/seller/stats')
      ]);

      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
      setStats(statsRes.data.stats || stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete product');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Seller Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your products and track your sales
            </p>
          </div>
          <button
            onClick={() => setShowAddProduct(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus />
            Add Product
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
                <div className="flex items-center gap-1 mt-1">
                  <SiLitecoin className="w-5 h-5 text-gray-600" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalEarnings}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <FiDollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Earnings</p>
                <div className="flex items-center gap-1 mt-1">
                  <SiLitecoin className="w-5 h-5 text-gray-600" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.pendingEarnings}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <FiTrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalSales}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <FiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeProducts}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <FiPackage className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="card p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Products
            </h2>
            <button
              onClick={() => setShowAddProduct(true)}
              className="btn-outline flex items-center gap-2"
            >
              <FiPlus />
              Add New
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't added any products yet
              </p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="btn-primary"
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Game
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Price
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Stock
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {product.screenshots?.[0] && (
                            <img
                              src={product.screenshots[0]}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {product.duration}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white">
                        {product.game}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <SiLitecoin className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-900 dark:text-white">
                            {product.price}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`badge ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white">
                        {product.stockCount || 0}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/purchase/${product._id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            title="View Product"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/seller/products/edit/${product._id}`)}
                            className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                            title="Edit Product"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            title="Delete Product"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Recent Sales
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No sales yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order._id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-4 px-4 font-mono text-sm text-gray-900 dark:text-white">
                        {order.orderId}
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white">
                        {order.productName}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <SiLitecoin className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-900 dark:text-white">
                            {order.total}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white">
                        {new Date(order.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`badge ${
                          order.paymentStatus === 'completed' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal would go here */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Product
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Use the full product creation form for better management.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddProduct(false);
                  router.push('/seller/products/new');
                }}
                className="btn-primary flex-1"
              >
                Create Product
              </button>
              <button
                onClick={() => setShowAddProduct(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
