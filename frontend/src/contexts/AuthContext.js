import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

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

  const API_URL = 'https://your-render-url.onrender.com/api/v1';
  const isDemoMode = window.location.hostname.includes('github.io');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (isDemoMode) {
        const demoUser = JSON.parse(localStorage.getItem('demoUser') || '{}');
        setUser(demoUser);
        setLoading(false);
      } else {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        fetchProfile();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const role = email === 'admin@test.com' ? 'admin' : 'user';
    const mockUser = { id: 1, name: role === 'admin' ? 'Admin User' : 'Demo User', email: email, role: role };
    setUser(mockUser);
    return { success: true };
  };

  const register = async (name, email, password) => {
    if (isDemoMode) {
      const demoUser = { id: 1, name, email };
      const demoToken = 'demo-jwt-token-' + Date.now();
      localStorage.setItem('token', demoToken);
      localStorage.setItem('demoUser', JSON.stringify(demoUser));
      setUser(demoUser);
      return { success: true };
    }

    try {
      const response = await axios.post(`${API_URL}/register`, 
        { name, email, password }
      );
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = async (name) => {
    try {
      await axios.put(`${API_URL}/profile`, 
        { name },
        { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
      );
      setUser(prev => ({ ...prev, name }));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Update failed' 
      };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};