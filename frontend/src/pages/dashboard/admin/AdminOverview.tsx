import React, { useState, useEffect } from 'react';
import { Users, BookOpen, UserCheck, BarChart, MessageSquare, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

// StatCard Component (inline since we can't import)
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
    }

    return headers;
  };

  const safelyParseJson = async (response, endpoint) => {
    const contentType = response.headers.get('content-type');
    
    // Check if response is HTML (error page)
    if (contentType && contentType.includes('text/html')) {
      console.error(`Received HTML instead of JSON from ${endpoint}`);
      throw new Error(`Server returned HTML instead of JSON for ${endpoint}. This usually means the endpoint doesn't exist or there's a routing issue.`);
    }

    const text = await response.text();
    
    if (!text || text.trim() === '') {
      console.warn(`Empty response from ${endpoint}`);
      return { success: false, data: [] };
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error(`JSON parse error for ${endpoint}:`, text.substring(0, 200));
      throw new Error(`Invalid JSON from ${endpoint}: ${parseError.message}`);
    }
  };

  const fetchWithTimeout = async (url, options, timeout = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  };

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const headers = getAuthHeaders();
      const baseURL = window.location.origin;

      console.log('Fetching dashboard data from:', baseURL);

      // Fetch dashboard stats
      try {
        const statsResponse = await fetchWithTimeout(
          `${baseURL}/api/admin/dashboard-stats`,
          {
            method: 'GET',
            headers,
            credentials: 'include'
          }
        );

        if (!statsResponse.ok) {
          console.error('Stats response not OK:', statsResponse.status, statsResponse.statusText);
          throw new Error(`HTTP ${statsResponse.status}: ${statsResponse.statusText}`);
        }

        const statsData = await safelyParseJson(statsResponse, 'dashboard-stats');
        
        if (statsData.success === false) {
          console.error('Stats API returned success=false:', statsData);
        }
        
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
      } catch (statsError) {
        console.error('Error fetching stats:', statsError);
        setError(`Stats: ${statsError.message}`);
      }

      // Fetch recent users
      try {
        const usersResponse = await fetchWithTimeout(
          `${baseURL}/api/admin/recent-users`,
          {
            method: 'GET',
            headers,
            credentials: 'include'
          }
        );

        if (usersResponse.ok) {
          const usersData = await safelyParseJson(usersResponse, 'recent-users');
          
          let usersList = [];
          if (usersData.success !== false) {
            usersList = usersData.users || usersData || [];
          }
          
          setRecentUsers(Array.isArray(usersList) ? usersList : []);
        } else {
          console.warn('Failed to fetch recent users:', usersResponse.status);
        }
      } catch (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Fetch recent enrollments
      try {
        const enrollmentsResponse = await fetchWithTimeout(
          `${baseURL}/api/admin/recent-enrollments`,
          {
            method: 'GET',
            headers,
            credentials: 'include'
          }
        );

        if (enrollmentsResponse.ok) {
          const enrollmentsData = await safelyParseJson(enrollmentsResponse, 'recent-enrollments');
          
          let enrollmentsList = [];
          if (enrollmentsData.success !== false) {
            enrollmentsList = enrollmentsData.enrollments || enrollmentsData || [];
          }
          
          setRecentEnrollments(Array.isArray(enrollmentsList) ? enrollmentsList : []);
        } else {
          console.warn('Failed to fetch recent enrollments:', enrollmentsResponse.status);
        }
      } catch (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      }

      // Fetch service requests
      try {
        const serviceRequestsResponse = await fetchWithTimeout(
          `${baseURL}/api/admin/service-requests`,
          {
            method: 'GET',
            headers,
            credentials: 'include'
          }
        );

        if (serviceRequestsResponse.ok) {
          const serviceRequestsData = await safelyParseJson(serviceRequestsResponse, 'service-requests');
          
          let requestsList = [];
          if (serviceRequestsData.success !== false) {
            requestsList = serviceRequestsData.requests || serviceRequestsData || [];
          }
          
          const transformedRequests = (Array.isArray(requestsList) ? requestsList : []).map((request) => ({
            id: request.id,
            name: request.name || `${request.user_first_name || ''} ${request.user_last_name || ''}`.trim() || 'Unknown',
            service: request.service || 'General Inquiry',
            date: request.date || 'N/A',
            status: request.status || 'pending',
            email: request.email || '',
            phone: request.phone || '',
            company: request.company || '',
            website: request.website || '',
            project_details: request.project_details || '',
            budget_range: request.budget_range || '',
            timeline: request.timeline || '',
            contact_method: request.contact_method || 'email',
            additional_requirements: request.additional_requirements || ''
          }));
          
          setServiceRequests(transformedRequests);
        } else {
          console.warn('Failed to fetch service requests:', serviceRequestsResponse.status);
        }
      } catch (requestsError) {
        console.error('Error fetching service requests:', requestsError);
      }

    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
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

  const handleManagementClick = (sectionId) => {
    console.log(`Navigate to ${sectionId}`);
    window.dispatchEvent(new CustomEvent('admin-navigation', { 
      detail: { section: sectionId } 
    }));
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
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle size={20} className="text-red-500 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Failed to load some dashboard data
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {error}
                </p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                  This usually means the API endpoint doesn't exist or Firestore indexes are missing. Check the browser console for details.
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm font-medium ml-4"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Admin Stats Cards */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Users</h2>
            <button
              onClick={() => handleManagementClick('users')}
              className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
            >
              Manage <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email || 'No email'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                      {user.account_type || 'student'}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.join_date || 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No recent users found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Users will appear here as they register
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Enrollments</h2>
            <button
              onClick={() => handleManagementClick('enrollments')}
              className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
            >
              Manage <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentEnrollments.length > 0 ? (
              recentEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{enrollment.user_name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{enrollment.course_name || 'Unknown Course'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      enrollment.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : enrollment.status === 'completed'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {enrollment.status || 'pending'}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{enrollment.date || 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <UserCheck size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No recent enrollments</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Course enrollments will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Requests */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Service Requests</h2>
          <div className="flex items-center gap-4">
            {serviceRequests.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {adminStats.pendingServiceRequests} pending
              </span>
            )}
            <button
              onClick={() => handleManagementClick('service-requests')}
              className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
            >
              Manage <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {serviceRequests.length > 0 ? (
            serviceRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{request.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{request.service || 'General Inquiry'}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : request.status === 'in-process'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {request.status || 'pending'}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{request.date || 'N/A'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No service requests</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Service requests from users will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;