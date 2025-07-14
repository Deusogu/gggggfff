import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSearch, FiFilter, FiStar, FiShoppingCart } from 'react-icons/fi';
import { SiLitecoin } from 'react-icons/si';
import api from '../services/api';

const Marketplace = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    game: '',
    status: '',
    priceRange: '',
    sortBy: 'newest'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, filters]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.game.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Game filter
    if (filters.game) {
      filtered = filtered.filter(product => product.game === filters.game);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(product => product.status === filters.status);
    }

    // Price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        if (max) {
          return product.price >= min && product.price <= max;
        }
        return product.price >= min;
      });
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredProducts(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'undetected':
        return 'bg-green-100 text-green-800';
      case 'detected':
        return 'bg-red-100 text-red-800';
      case 'updating':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const handlePurchase = (productId) => {
    router.push(`/purchase/${productId}`);
  };

  const uniqueGames = [...new Set(products.map(p => p.game))];

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Fail.ac
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and purchase game cheats with secure Litecoin payments
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search cheats, games..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Game Filter */}
            <select
              className="input"
              value={filters.game}
              onChange={(e) => setFilters({ ...filters, game: e.target.value })}
            >
              <option value="">All Games</option>
              {uniqueGames.map(game => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="undetected">Undetected</option>
              <option value="detected">Detected</option>
              <option value="updating">Updating</option>
            </select>

            {/* Sort */}
            <select
              className="input"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="product-card">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-200 dark:bg-gray-700 rounded-t-xl overflow-hidden">
                {product.screenshots && product.screenshots[0] ? (
                  <img
                    src={product.screenshots[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`badge ${getStatusColor(product.status)} flex items-center gap-1`}>
                    <span className={`w-2 h-2 rounded-full ${getStatusDot(product.status)}`}></span>
                    {product.status}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {product.game}
                  </p>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {product.description}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({product.totalReviews})
                  </span>
                </div>

                {/* Price and Duration */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <SiLitecoin className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {product.price} LTC
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {product.duration}
                  </span>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(product._id)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <FiShoppingCart className="w-4 h-4" />
                  Purchase
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No cheats found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
