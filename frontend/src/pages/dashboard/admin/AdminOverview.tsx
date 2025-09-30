import React, { useState, useEffect } from 'react';
import { Users, BookOpen, UserCheck, BarChart, MessageSquare, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import StatCard from '../../../components/dashboard/common/StatCard';
import { DashboardStats, RecentUser, RecentEnrollment, ServiceRequest } from '../../../lib/admin-types';

const AdminOverview: React.FC = () => {
  const [adminStats, setAdminStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalRevenue: "₹0",
    pendingContacts: 0,
    pendingServiceRequests: 0
  });

  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to get authentication headers
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token') || 
                 localStorage.getItem('authToken') || 
                 sessionStorage.getItem('token');
                 
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('No authentication token found');
    }

    return headers;
  };

  // Helper function to safely parse JSON responses
  const safelyParseJson = async (response: Response, endpoint: string): Promise<any> => {
    try {
      const text = await response.text();
      
      if (!text) {
        throw new Error(`Empty response from ${endpoint}`);
      }
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error(`Failed to parse response from ${endpoint}:`, text.substring(0, 100));
        throw new Error(`Invalid JSON response from ${endpoint}`);
      }
    } catch (error) {
      console.error(`Error handling response from ${endpoint}:`, error);
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

      // Fetch dashboard stats
      try {
        const statsResponse = await fetch(`${baseURL}/api/admin/dashboard-stats`, {
          method: 'GET',
          headers,
          credentials: 'include'
        });

        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch dashboard stats: ${statsResponse.status}`);
        }

        const statsData = await safelyParseJson(statsResponse, 'dashboard-stats');
        
        // Format revenue with Indian currency
        const formattedRevenue = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(statsData.totalRevenue || 0);

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
        // Don't reset stats on error, keep showing previous values
      }

      // Fetch recent users
      try {
        const usersResponse = await fetch(`${baseURL}/api/admin/recent-users`, {
          method: 'GET',
          headers,
          credentials: 'include'
        });

        if (usersResponse.ok) {
          const usersData = await safelyParseJson(usersResponse, 'recent-users');
          
          // Check if response contains users array
          if (usersData.users && Array.isArray(usersData.users)) {
            setRecentUsers(usersData.users);
          } else if (Array.isArray(usersData)) {
            // Fallback for legacy API format
            setRecentUsers(usersData);
          } else {
            console.warn('Unexpected users data format:', usersData);
            setRecentUsers([]);
          }
        } else {
          console.warn('Failed to fetch recent users');
          // Don't reset users on error, keep showing previous values
        }
      } catch (usersError) {
        console.error('Error fetching users:', usersError);
        // Don't reset users on error, keep showing previous values
      }

      // Fetch recent enrollments
      try {
        const enrollmentsResponse = await fetch(`${baseURL}/api/admin/recent-enrollments`, {
          method: 'GET',
          headers,
          credentials: 'include'
        });

        if (enrollmentsResponse.ok) {
          const enrollmentsData = await safelyParseJson(enrollmentsResponse, 'recent-enrollments');
          
          // Check if response contains enrollments array
          if (enrollmentsData.enrollments && Array.isArray(enrollmentsData.enrollments)) {
            setRecentEnrollments(enrollmentsData.enrollments);
          } else if (Array.isArray(enrollmentsData)) {
            // Fallback for legacy API format
            setRecentEnrollments(enrollmentsData);
          } else {
            console.warn('Unexpected enrollments data format:', enrollmentsData);
            setRecentEnrollments([]);
          }
        } else {
          console.warn('Failed to fetch recent enrollments');
          // Don't reset enrollments on error, keep showing previous values
        }
      } catch (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        // Don't reset enrollments on error, keep showing previous values
      }

      // Fetch service requests
      try {
        const serviceRequestsResponse = await fetch(`${baseURL}/api/admin/service-requests`, {
          method: 'GET',
          headers,
          credentials: 'include'
        });

        if (serviceRequestsResponse.ok) {
          const serviceRequestsData = await safelyParseJson(serviceRequestsResponse, 'service-requests');
          
          let requestsToProcess = [];
          
          // Check if response contains requests array
          if (serviceRequestsData.requests && Array.isArray(serviceRequestsData.requests)) {
            requestsToProcess = serviceRequestsData.requests;
          } else if (Array.isArray(serviceRequestsData)) {
            // Fallback for legacy API format
            requestsToProcess = serviceRequestsData;
          } else {
            console.warn('Unexpected service requests data format:', serviceRequestsData);
            requestsToProcess = [];
          }
          
          // Transform the data to match the ServiceRequest type
          const transformedRequests = requestsToProcess.map((request: any) => ({
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
          console.warn('Failed to fetch service requests');
          // Don't reset service requests on error, keep showing previous values
        }
      } catch (requestsError) {
        console.error('Error fetching service requests:', requestsError);
        // Don't reset service requests on error, keep showing previous values
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const handleManagementClick = (sectionId: string) => {
    // This would be handled by the parent component to change the active view
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
    <div>
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
              <AlertCircle size={20} className="text-red-500 mr-2" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Failed to load dashboard data
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm font-medium"
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
            <h2 className="text-xl font-bold">Recent Users</h2>
            <button
              onClick={() => handleManagementClick('users')}
              className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
            >
              Manage <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentUsers.length > 0 ? (
              recentUsers.map((user: RecentUser) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}</p>
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
            <h2 className="text-xl font-bold">Recent Enrollments</h2>
            <button
              onClick={() => handleManagementClick('enrollments')}
              className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
            >
              Manage <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentEnrollments.length > 0 ? (
              recentEnrollments.map((enrollment: RecentEnrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">{enrollment.user_name || 'Unknown User'}</p>
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
          <h2 className="text-xl font-bold">Service Requests</h2>
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
            serviceRequests.map((request: ServiceRequest) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">{request.name || 'Unknown'}</p>
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