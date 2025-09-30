import React, { useState, useEffect } from 'react';
import { Users, BookOpen, UserCheck, BarChart, MessageSquare, ChevronRight, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-gradient-to-br ${color} text-white rounded-xl shadow-lg p-6`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="bg-white/20 p-3 rounded-lg">
        {icon}
      </div>
    </div>
  </div>
);

const AdminOverview = () => {
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalRevenue: "₹0",
    pendingContacts: 0,
    pendingServiceRequests: 0
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [diagnostics, setDiagnostics] = useState([]);

  const addDiagnostic = (endpoint, status, message) => {
    setDiagnostics(prev => [...prev, {
      endpoint,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const getAuthHeaders = () => {
    const token = window.localStorage?.getItem('token') || 
                 window.localStorage?.getItem('authToken') || 
                 window.sessionStorage?.getItem('token');
                 
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      addDiagnostic('Auth', 'success', 'Token found');
    } else {
      addDiagnostic('Auth', 'warning', 'No token found');
    }

    return headers;
  };

  const testEndpoint = async (endpoint, headers, baseURL) => {
    const fullUrl = `${baseURL}${endpoint}`;
    console.log(`Testing endpoint: ${fullUrl}`);
    
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      const contentType = response.headers.get('content-type');
      console.log(`${endpoint} - Status: ${response.status}, Content-Type: ${contentType}`);

      if (!response.ok) {
        addDiagnostic(endpoint, 'error', `HTTP ${response.status}: ${response.statusText}`);
        return { success: false, status: response.status };
      }

      if (contentType && contentType.includes('text/html')) {
        addDiagnostic(endpoint, 'error', 'Returned HTML instead of JSON');
        return { success: false, status: response.status };
      }

      const data = await response.json();
      addDiagnostic(endpoint, 'success', `Success - ${JSON.stringify(data).substring(0, 50)}...`);
      return { success: true, data };

    } catch (error) {
      console.error(`Error testing ${endpoint}:`, error);
      addDiagnostic(endpoint, 'error', error.message);
      return { success: false, error: error.message };
    }
  };

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
        setDiagnostics([]);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const headers = getAuthHeaders();
      const baseURL = window.location.origin;

      addDiagnostic('System', 'info', `Base URL: ${baseURL}`);

      // Test all endpoints
      const endpoints = [
        '/api/admin/dashboard-stats',
        '/api/admin/recent-users',
        '/api/admin/recent-enrollments',
        '/api/admin/service-requests'
      ];

      let allSuccessful = true;

      // Dashboard Stats
      const statsResult = await testEndpoint(endpoints[0], headers, baseURL);
      if (statsResult.success && statsResult.data) {
        const statsData = statsResult.data;
        const revenue = parseFloat(statsData.totalRevenue || 0);
        const formattedRevenue = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(revenue);

        setAdminStats({
          totalUsers: statsData.totalUsers || 0,
          totalCourses: statsData.totalCourses || 0,
          totalEnrollments: statsData.totalEnrollments || 0,
          totalRevenue: formattedRevenue,
          pendingContacts: statsData.pendingContacts || 0,
          pendingServiceRequests: statsData.pendingServiceRequests || 0
        });
      } else {
        allSuccessful = false;
      }

      // Recent Users
      const usersResult = await testEndpoint(endpoints[1], headers, baseURL);
      if (usersResult.success && usersResult.data) {
        const usersList = usersResult.data.users || usersResult.data || [];
        setRecentUsers(Array.isArray(usersList) ? usersList : []);
      } else {
        allSuccessful = false;
      }

      // Recent Enrollments
      const enrollmentsResult = await testEndpoint(endpoints[2], headers, baseURL);
      if (enrollmentsResult.success && enrollmentsResult.data) {
        const enrollmentsList = enrollmentsResult.data.enrollments || enrollmentsResult.data || [];
        setRecentEnrollments(Array.isArray(enrollmentsList) ? enrollmentsList : []);
      } else {
        allSuccessful = false;
      }

      // Service Requests
      const requestsResult = await testEndpoint(endpoints[3], headers, baseURL);
      if (requestsResult.success && requestsResult.data) {
        const requestsList = requestsResult.data.requests || requestsResult.data || [];
        setServiceRequests(Array.isArray(requestsList) ? requestsList : []);
      } else {
        allSuccessful = false;
      }

      if (!allSuccessful) {
        setError('Some endpoints failed. Check diagnostics below.');
      }

    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setError(error.message);
      addDiagnostic('System', 'error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard - Diagnostic Mode</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle size={20} className="text-red-500 mr-2 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                Failed to load some dashboard data
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostics Panel */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          API Diagnostics
        </h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {diagnostics.map((diag, index) => (
            <div key={index} className="flex items-start gap-3 p-2 bg-white dark:bg-gray-900 rounded text-sm">
              <div className="flex-shrink-0 mt-1">
                {diag.status === 'success' && <CheckCircle size={16} className="text-green-500" />}
                {diag.status === 'error' && <XCircle size={16} className="text-red-500" />}
                {diag.status === 'warning' && <AlertCircle size={16} className="text-yellow-500" />}
                {diag.status === 'info' && <AlertCircle size={16} className="text-blue-500" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">{diag.endpoint}</span>
                  <span className="text-xs text-gray-500">{diag.timestamp}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{diag.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={adminStats.totalUsers}
          icon={<Users size={20} />}
          color="from-blue-500 to-blue-400"
        />
        <StatCard
          title="Total Courses"
          value={adminStats.totalCourses}
          icon={<BookOpen size={20} />}
          color="from-green-500 to-green-400"
        />
        <StatCard
          title="Total Enrollments"
          value={adminStats.totalEnrollments}
          icon={<UserCheck size={20} />}
          color="from-purple-500 to-purple-400"
        />
        <StatCard
          title="Total Revenue"
          value={adminStats.totalRevenue}
          icon={<BarChart size={20} />}
          color="from-orange-500 to-orange-400"
        />
      </div>

      {/* Data Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Recent Users ({recentUsers.length})</h3>
          <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(recentUsers, null, 2)}
          </pre>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Recent Enrollments ({recentEnrollments.length})</h3>
          <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(recentEnrollments, null, 2)}
          </pre>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Service Requests ({serviceRequests.length})</h3>
          <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(serviceRequests, null, 2)}
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">Diagnostic Instructions:</h3>
        <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
          <li>Check the API Diagnostics panel above for detailed error messages</li>
          <li>Look for red (error) or yellow (warning) indicators</li>
          <li>HTTP 404 means the endpoint doesn't exist on your backend</li>
          <li>Verify your backend server is running and the routes are properly registered</li>
          <li>Check if the routes are defined AFTER your authentication middleware</li>
          <li>Open browser DevTools (F12) → Network tab to see the actual requests</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminOverview;