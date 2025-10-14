import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-red-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.name}</span>
            <button 
              onClick={logout}
              className="bg-red-700 px-4 py-2 rounded hover:bg-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Admin Panel</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
              <h3 className="font-semibold">User Management</h3>
              <p className="text-gray-600">Manage all users</p>
            </div>
            <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
              <h3 className="font-semibold">System Settings</h3>
              <p className="text-gray-600">Configure system</p>
            </div>
            <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
              <h3 className="font-semibold">Reports</h3>
              <p className="text-gray-600">View analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;