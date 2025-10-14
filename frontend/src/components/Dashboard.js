import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { FiSearch, FiX, FiPlus, FiFilter, FiEdit3, FiTrash2, FiUser, FiLogOut, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

const Dashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'pending'
  });
  const [userActivities, setUserActivities] = useState([]);
  const [crudStats, setCrudStats] = useState({ create: 0, read: 0, update: 0, delete: 0 });

  const API_URL = 'http://localhost:5000/api';
  const isDemoMode = window.location.hostname.includes('github.io');

  useEffect(() => {
    fetchTasks();
    loadUserActivities();
  }, [searchTerm, statusFilter]);

  const loadUserActivities = () => {
    if (!user?.email) return;
    const activities = JSON.parse(localStorage.getItem(`activities_${user.email}`) || '[]');
    // Only show activities for the current logged-in user
    const userSpecificActivities = activities.filter(activity => activity.userEmail === user.email);
    setUserActivities(userSpecificActivities.slice(0, 5)); // Show last 5 activities
    
    // Calculate CRUD stats
    const stats = { create: 0, read: 0, update: 0, delete: 0 };
    userSpecificActivities.forEach(activity => {
      if (activity.action.includes('Created')) stats.create++;
      if (activity.action.includes('Updated')) stats.update++;
      if (activity.action.includes('Deleted')) stats.delete++;
    });
    const allTasks = JSON.parse(localStorage.getItem(`demoTasks_${user.email}`) || '[]');
    stats.read = allTasks.length; // Total tasks available
    setCrudStats(stats);
  };

  const addActivity = (action) => {
    if (!user?.email) return;
    const activities = JSON.parse(localStorage.getItem(`activities_${user.email}`) || '[]');
    const newActivity = {
      id: Date.now(),
      action: action,
      time: new Date().toLocaleString(),
      userEmail: user.email // Explicitly store user email
    };
    activities.unshift(newActivity);
    localStorage.setItem(`activities_${user.email}`, JSON.stringify(activities.slice(0, 20))); // Keep last 20
    loadUserActivities();
  };

  const fetchTasks = async () => {
    try {
      if (isDemoMode) {
        let demoTasks = JSON.parse(localStorage.getItem(`demoTasks_${user?.email}`) || '[]');
        
        // Filter demo tasks
        if (searchTerm) {
          demoTasks = demoTasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        if (statusFilter) {
          demoTasks = demoTasks.filter(task => task.status === statusFilter);
        }
        
        setTasks(demoTasks);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axios.get(`${API_URL}/tasks?${params}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    console.log('Creating task:', taskForm);
    
    const demoTasks = JSON.parse(localStorage.getItem(`demoTasks_${user?.email}`) || '[]');
    
    if (editingTask) {
      const updatedTasks = demoTasks.map(task => 
        task.id === editingTask.id ? { ...task, ...taskForm } : task
      );
      localStorage.setItem(`demoTasks_${user?.email}`, JSON.stringify(updatedTasks));
      addActivity(`Updated task: ${taskForm.title}`);
    } else {
      const newTask = {
        id: Date.now(),
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
        created_at: new Date().toISOString()
      };
      demoTasks.push(newTask);
      localStorage.setItem(`demoTasks_${user?.email}`, JSON.stringify(demoTasks));
      addActivity(`Created task: ${taskForm.title}`);
    }
    
    setTaskForm({ title: '', description: '', status: 'pending' });
    setShowTaskForm(false);
    setEditingTask(null);
    fetchTasks();
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        if (isDemoMode) {
          const demoTasks = JSON.parse(localStorage.getItem(`demoTasks_${user?.email}`) || '[]');
          const taskToDelete = demoTasks.find(task => task.id === id);
          const updatedTasks = demoTasks.filter(task => task.id !== id);
          localStorage.setItem(`demoTasks_${user?.email}`, JSON.stringify(updatedTasks));
          addActivity(`Deleted task: ${taskToDelete?.title}`);
        } else {
          await axios.delete(`${API_URL}/tasks/${id}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          });
        }
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleEditTask = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status
    });
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const result = await updateProfile(profileName);
    if (result.success) {
      setShowProfileEdit(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <FiCheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Task Dashboard</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Manage your tasks efficiently</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                <FiUser className="h-4 w-4" />
                <span className="text-sm font-medium truncate max-w-32 sm:max-w-none">Welcome, {user?.name}</span>
              </div>
              <button
                onClick={() => setShowProfileEdit(true)}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
              >
                <FiEdit3 className="h-4 w-4" />
                <span className="hidden sm:inline">Edit Profile</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FiLogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Enhanced Search and Filter UI */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FiSearch className="h-5 w-5" />
                Search & Filter Tasks
              </h2>
              <span className="text-sm text-gray-500">{tasks.length} tasks found</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by title..."
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFilter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="w-full pl-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Add Task Button */}
              <button
                type="button"
                onClick={() => {
                  console.log('Add Task clicked');
                  setShowTaskForm(true);
                }}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <FiPlus className="h-5 w-5" />
                Add New Task
              </button>
            </div>

            {/* Active Filters */}
            {(searchTerm || statusFilter) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="hover:text-blue-600">
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {statusFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('')} className="hover:text-green-600">
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* CRUD Operations Summary */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Operations (CRUD)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded border-l-4 border-green-500">
                <FiPlus className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-800">CREATE</h3>
                  <p className="text-sm text-green-600">{crudStats.create} tasks created</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                <FiSearch className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-800">READ</h3>
                  <p className="text-sm text-blue-600">{crudStats.read} tasks viewing</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                <FiEdit3 className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-800">UPDATE</h3>
                  <p className="text-sm text-yellow-600">{crudStats.update} tasks updated</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded border-l-4 border-red-500">
                <FiTrash2 className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800">DELETE</h3>
                  <p className="text-sm text-red-600">{crudStats.delete} tasks deleted</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Activities */}
          {userActivities.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Recent Activities</h2>
              <div className="space-y-3">
                {userActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">{activity.action}</span>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Display Area */}
          {tasks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter ? 'No tasks found' : 'No tasks yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter 
                  ? 'No tasks match your current filters. Try adjusting your search or filters.'
                  : 'Create your first task to get started!'}
              </p>
              <button
                onClick={() => {
                  if (searchTerm || statusFilter) {
                    setSearchTerm('');
                    setStatusFilter('');
                  } else {
                    setShowTaskForm(true);
                  }
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FiPlus className="h-4 w-4" />
                {searchTerm || statusFilter ? 'Clear Filters' : 'Create your first task'}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-indigo-200">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">{task.title}</h3>
                  <div className="flex items-center gap-1">
                    {task.status === 'completed' && <FiCheckCircle className="h-4 w-4 text-green-600" />}
                    {task.status === 'in-progress' && <FiClock className="h-4 w-4 text-yellow-600" />}
                    {task.status === 'pending' && <FiAlertCircle className="h-4 w-4 text-gray-600" />}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-sm line-clamp-3">{task.description || 'No description provided'}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {new Date(task.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                    >
                      <FiEdit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}

          {/* Remove duplicate empty state since it's now handled above */}
          {false && (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter ? 'No tasks found' : 'No tasks yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter 
                  ? `No tasks match your current filters`
                  : 'Create your first task to get started!'}
              </p>
              {(searchTerm || statusFilter) ? (
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <FiX className="h-4 w-4" />
                  Clear filters
                </button>
              ) : (
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FiPlus className="h-4 w-4" />
                  Create your first task
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <form onSubmit={handleTaskSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskForm(false);
                    setEditingTask(null);
                    setTaskForm({ title: '', description: '', status: 'pending' });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;