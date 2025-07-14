import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token');
      if (token) {
        const response = await authService.getMe();
        if (response.success) {
          setUser(response.user);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Login successful!');
        
        // Redirect based on user role
        if (response.user.role === 'admin') {
          router.push('/admin');
        } else if (response.user.role === 'seller') {
          router.push('/seller/dashboard');
        } else {
          router.push('/marketplace');
        }
        
        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const response = await authService.register(data);
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Registration successful! Please verify your email.');
        
        // Redirect to appropriate page
        if (data.role === 'seller') {
          router.push('/seller/onboarding');
        } else {
          router.push('/marketplace');
        }
        
        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      // Even if API call fails, clear local state
      Cookies.remove('token');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authService.updateProfile(data);
      if (response.success) {
        setUser(response.user);
        toast.success('Profile updated successfully');
        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword
      });
      if (response.success) {
        toast.success('Password changed successfully');
        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const response = await authService.resendVerification();
      if (response.success) {
        toast.success('Verification email sent');
        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  // Role-based access control helpers
  const hasRole = (role) => {
    return user?.role === role;
  };

  const isSeller = () => {
    return user?.role === 'seller';
  };

  const isBuyer = () => {
    return user?.role === 'buyer';
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isVerified = () => {
    return user?.isVerified === true;
  };

  const isSellerApproved = () => {
    return user?.role === 'seller' && user?.sellerInfo?.isApproved === true;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    resendVerificationEmail,
    checkAuth,
    hasRole,
    isSeller,
    isBuyer,
    isAdmin,
    isVerified,
    isSellerApproved,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// HOC for protecting routes
export const withAuth = (Component, options = {}) => {
  return function ProtectedRoute(props) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        // Check if user is authenticated
        if (options.requireAuth && !isAuthenticated) {
          router.push('/login');
          return;
        }

        // Check if user has required role
        if (options.role && user?.role !== options.role) {
          toast.error('You do not have permission to access this page');
          router.push('/');
          return;
        }

        // Check if user is verified
        if (options.requireVerification && !user?.isVerified) {
          toast.error('Please verify your email to access this page');
          router.push('/verify-email');
          return;
        }

        // Check if seller is approved
        if (options.requireSellerApproval && user?.role === 'seller' && !user?.sellerInfo?.isApproved) {
          toast.error('Your seller account is pending approval');
          router.push('/seller/pending-approval');
          return;
        }
      }
    }, [loading, isAuthenticated, user, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner w-8 h-8"></div>
        </div>
      );
    }

    // If all checks pass, render the component
    return <Component {...props} />;
  };
};

export default AuthContext;
