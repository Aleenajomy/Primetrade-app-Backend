import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Mock user data
    setUsers([
      { id: 1, name: 'admin', email: 'admin@test.com', role: 'admin', status: 'active' },
      { id: 2, name: 'john', email: 'john@test.com', role: 'user', status: 'active' },
      { id: 3, name: 'sarah', email: 'sarah@test.com', role: 'user', status: 'inactive' }
    ]);
    
    // Mock activity data
    setActivities([
      { id: 1, user: 'john@test.com', action: 'Login', time: '2 mins ago' },
      { id: 2, user: 'sarah@test.com', action: 'Created task', time: '5 mins ago' },
      { id: 3, user: 'admin@test.com', action: 'Accessed admin panel', time: '10 mins ago' },
      { id: 4, user: 'john@test.com', action: 'Updated profile', time: '15 mins ago' }
    ]);
  }, []);

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
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
            <h3 className="font-semibold">Total Users</h3>
            <p className="text-2xl font-bold text-red-600">{users.length}</p>
          </div>
          <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
            <h3 className="font-semibold">Active Users</h3>
            <p className="text-2xl font-bold text-red-600">{users.filter(u => u.status === 'active').length}</p>
          </div>
          <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
            <h3 className="font-semibold">Recent Activities</h3>
            <p className="text-2xl font-bold text-red-600">{activities.length}</p>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-red-600">User Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-red-600">Recent User Activities</h2>
          <div className="space-y-3">
            {activities.map(activity => (
              <div key={activity.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-gray-600 ml-2">{activity.action}</span>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;