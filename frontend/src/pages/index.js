import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { FiShoppingBag, FiShield, FiZap, FiUsers, FiArrowRight } from 'react-icons/fi';
import { SiLitecoin } from 'react-icons/si';

const HomePage = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: FiShield,
      title: 'Secure Payments',
      description: 'All transactions are secured with Litecoin cryptocurrency payments'
    },
    {
      icon: FiZap,
      title: 'Instant Delivery',
      description: 'Get your license keys instantly after payment confirmation'
    },
    {
      icon: FiUsers,
      title: 'Trusted Sellers',
      description: 'All sellers are verified and provide quality products'
    },
    {
      icon: SiLitecoin,
      title: 'Crypto Payments',
      description: 'Fast and anonymous payments using Litecoin'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Premium Game Cheats
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Secure marketplace for game enhancement tools with cryptocurrency payments
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/marketplace" className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
                Browse Marketplace
              </Link>
              {!user && (
                <Link href="/auth/register" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We provide a secure, fast, and reliable marketplace for game enhancement tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">1000+</div>
              <div className="text-gray-600 dark:text-gray-400">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-400">Quality Products</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-400">Customer Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-primary-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of gamers who trust our platform for their gaming needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace" className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold flex items-center justify-center gap-2">
              <FiShoppingBag />
              Browse Products
              <FiArrowRight />
            </Link>
            {user?.role === 'seller' ? (
              <Link href="/seller/dashboard" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold">
                Seller Dashboard
              </Link>
            ) : !user && (
              <Link href="/auth/register" className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold">
                Become a Seller
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
