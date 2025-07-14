import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  FiUsers, 
  FiPackage, 
  FiDollarSign, 
  FiAlertCircle,
  FiCheck,
  FiX,
  FiEye,
  FiLock,
  FiUnlock
} from 'react-icons/fi';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, productsRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/products?approvalStatus=pending'),
        api.get('/admin/users?limit=10')
      ]);
      
      setStats(statsRes.data.dashboard);
      setPendingProducts(productsRes.data.products);
      setUsers(usersRes.data.users);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const handleProductApproval = async (productId, approvalStatus, reason = '') => {
    try {
      await api.put(`/admin/products/${productId}/approval`, {
        approvalStatus,
        reason
      });
      alert(`Product ${approvalStatus} successfully`);
      fetchDashboardData();
    } catch (error) {
      alert('Failed to update product approval');
    }
  };

  const handleProductFreeze = async (productId, freeze, reason = '') => {
    try {
      await api.put(`/admin/products/${productId}/freeze`, {
        freeze,
        reason
      });
      alert(`Product ${freeze ? 'frozen' : 'unfrozen'} successfully`);
      fetchDashboardData();
    } catch (error) {
      alert('Failed to update product freeze status');
    }
  };

  const handleUserBan = async (userId, ban) => {
    try {
      const endpoint = ban ? `/admin/users/${userId}/ban` : `/admin/users/${userId}/unban`;
      await api.put(endpoint, ban ? { reason: 'Admin action' } : {});
      alert(`User ${ban ? 'banned' : 'unbanned'} successfully`);
      fetchDashboardData();
    } catch (error) {
      alert('Failed to update user status');
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

  return (
    <Layout>
      <Head>
        <title>Admin Dashboard - Fail.ac</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats.stats.users.total}</p>
                  <p className="text-sm text-gray-500">
                    {stats.stats.users.sellers} sellers, {stats.stats.users.buyers} buyers
                  </p>
                </div>
                <FiUsers className="text-3xl text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold">{stats.stats.products.total}</p>
                </div>
                <FiPackage className="text-3xl text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">{stats.stats.revenue.total} LTC</p>
                  <p className="text-sm text-gray-500">
                    Commission: {stats.stats.revenue.commission} LTC
                  </p>
                </div>
                <FiDollarSign className="text-3xl text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">
                    {stats.stats.pending.sellerApprovals + stats.stats.pending.disputes}
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.stats.pending.sellerApprovals} sellers, {stats.stats.pending.disputes} disputes
                  </p>
                </div>
                <FiAlertCircle className="text-3xl text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'products'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Pending Products ({pendingProducts.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'users'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Users
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Order ID</th>
                        <th className="text-left py-2">Product</th>
                        <th className="text-left py-2">Buyer</th>
                        <th className="text-left py-2">Seller</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((order) => (
                        <tr key={order._id} className="border-b">
                          <td className="py-2">{order.orderId}</td>
                          <td className="py-2">{order.productId?.name || 'N/A'}</td>
                          <td className="py-2">{order.buyerId?.username || 'Guest'}</td>
                          <td className="py-2">{order.sellerId?.username || 'N/A'}</td>
                          <td className="py-2">{order.total} LTC</td>
                          <td className="py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Product Approvals</h2>
                {pendingProducts.length === 0 ? (
                  <p className="text-gray-600">No pending products</p>
                ) : (
                  <div className="space-y-4">
                    {pendingProducts.map((product) => (
                      <div key={product._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            <p className="text-gray-600">Game: {product.game}</p>
                            <p className="text-gray-600">Price: {product.price} LTC</p>
                            <p className="text-gray-600">
                              Seller: {product.sellerId?.username} ({product.sellerId?.email})
                            </p>
                            <p className="text-sm text-gray-500 mt-2">{product.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleProductApproval(product._id, 'approved')}
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                              <FiCheck />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason:');
                                if (reason) handleProductApproval(product._id, 'rejected', reason);
                              }}
                              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                            >
                              <FiX />
                            </button>
                            <button
                              onClick={() => window.open(`/products/${product._id}`, '_blank')}
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                              <FiEye />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">User Management</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Username</th>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Role</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Joined</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id} className="border-b">
                          <td className="py-2">{user.username}</td>
                          <td className="py-2">{user.email}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-2">
                            {user.isBanned ? (
                              <span className="text-red-600">Banned</span>
                            ) : (
                              <span className="text-green-600">Active</span>
                            )}
                          </td>
                          <td className="py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="py-2">
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleUserBan(user._id, !user.isBanned)}
                                className={`px-3 py-1 rounded text-white ${
                                  user.isBanned 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-red-600 hover:bg-red-700'
                                }`}
                              >
                                {user.isBanned ? <FiUnlock /> : <FiLock />}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
