// src/components/dashboard/role-specific/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, UserCheck, BarChart, PlusCircle, MessageSquare, 
  GraduationCap, ChevronRight, AlertCircle, Settings, FileText,
  Calendar, Award, Briefcase, Mail, Edit, Trash2, Eye
} from 'lucide-react';
import StatCard from '../common/StatCard';
import { DashboardStats } from '../../../lib/types';

interface RecentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_type: string;
  join_date: string;
}

interface RecentEnrollment {
  id: number;
  user_name: string;
  course_name: string;
  date: string;
  status: string;
}

interface ServiceRequest {
  id: number;
  name: string;
  service: string;
  date: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
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
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getAuthToken = () => {
    // Check multiple possible storage locations and keys
    const token = localStorage.getItem('token') || 
                 localStorage.getItem('authToken') || 
                 localStorage.getItem('accessToken') ||
                 sessionStorage.getItem('token') ||
                 sessionStorage.getItem('authToken');
    
    // Also check if token is stored as part of user object
    const userStr = localStorage.getItem('user');
    if (!token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) return user.token;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    return token;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      
      if (!token) {
        console.warn('No token found, attempting to fetch without authentication');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = 'http://localhost:5000';

      // Fetch all data in parallel
      const fetchPromises = [
        fetch(`${baseURL}/api/admin/dashboard-stats`, { 
          method: 'GET',
          headers,
          credentials: 'include'
        }),
        fetch(`${baseURL}/api/admin/recent-users`, { 
          method: 'GET',
          headers,
          credentials: 'include'
        }),
        fetch(`${baseURL}/api/admin/recent-enrollments`, { 
          method: 'GET',
          headers,
          credentials: 'include'
        }),
        fetch(`${baseURL}/api/admin/service-requests`, { 
          method: 'GET',
          headers,
          credentials: 'include'
        })
      ];

      const [statsRes, usersRes, enrollmentsRes, requestsRes] = await Promise.all(fetchPromises);

      // Check responses
      const responses = [
        { name: 'stats', res: statsRes },
        { name: 'users', res: usersRes },
        { name: 'enrollments', res: enrollmentsRes },
        { name: 'requests', res: requestsRes }
      ];

      for (const { name, res } of responses) {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Authentication failed. Please login again.');
          }
          const errorData = await res.text();
          console.error(`${name} error:`, errorData);
          throw new Error(`Failed to fetch ${name}: ${res.status}`);
        }
      }

      // Parse all responses
      const [statsData, usersData, enrollmentsData, requestsData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        enrollmentsRes.json(),
        requestsRes.json()
      ]);

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
      
      setRecentUsers(usersData || []);
      setRecentEnrollments(enrollmentsData || []);
      setServiceRequests(requestsData || []);
      
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const managementSections = [
    { id: 'users', title: 'User Management', icon: Users, color: 'blue' },
    { id: 'courses', title: 'Course Management', icon: BookOpen, color: 'green' },
    { id: 'assignments', title: 'Assignment Management', icon: FileText, color: 'purple' },
    { id: 'enrollments', title: 'Enrollment Management', icon: UserCheck, color: 'indigo' },
    { id: 'certificates', title: 'Certificate Management', icon: Award, color: 'yellow' },
    { id: 'services', title: 'Service Management', icon: Briefcase, color: 'pink' },
    { id: 'contacts', title: 'Contact Messages', icon: Mail, color: 'red' },
    { id: 'calendar', title: 'Calendar Events', icon: Calendar, color: 'teal' },
  ];

  const handleManagementClick = (sectionId: string) => {
    console.log(`Navigate to ${sectionId} management`);
    // Add your navigation logic here
    // window.location.href = `/admin/${sectionId}`;
  };

  const handleRetry = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto mt-8">
        <div className="flex items-center mb-4">
          <AlertCircle className="text-red-500 mr-2" size={24} />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button 
          onClick={handleRetry}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete platform management at your fingertips
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('management')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'management'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Management Tools
          </button>
        </nav>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Admin Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Total Users" 
              value={adminStats.totalUsers!} 
              icon={<Users size={20} />} 
              color="from-blue-500 to-blue-400"
            />
            <StatCard 
              title="Total Courses" 
              value={adminStats.totalCourses!} 
              icon={<BookOpen size={20} />} 
              color="from-green-500 to-green-400"
            />
            <StatCard 
              title="Total Enrollments" 
              value={adminStats.totalEnrollments!} 
              icon={<UserCheck size={20} />} 
              color="from-purple-500 to-purple-400"
            />
            <StatCard 
              title="Total Revenue" 
              value={adminStats.totalRevenue!} 
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
                  onClick={() => setActiveTab('management')}
                  className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
                >
                  Manage <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
              <div className="space-y-4">
                {recentUsers.length > 0 ? (
                  recentUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium">{`${user.first_name} ${user.last_name}`}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                          {user.account_type}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.join_date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent users</p>
                )}
              </div>
            </div>

            {/* Recent Enrollments */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Recent Enrollments</h2>
                <button 
                  onClick={() => setActiveTab('management')}
                  className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
                >
                  Manage <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
              <div className="space-y-4">
                {recentEnrollments.length > 0 ? (
                  recentEnrollments.map(enrollment => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium">{enrollment.user_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{enrollment.course_name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          enrollment.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : enrollment.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}>
                          {enrollment.status}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{enrollment.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent enrollments</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Requests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Service Requests</h2>
              <button 
                onClick={() => setActiveTab('management')}
                className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
              >
                Manage <ChevronRight size={18} className="ml-1" />
              </button>
            </div>
            <div className="space-y-4">
              {serviceRequests.length > 0 ? (
                serviceRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium">{request.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.service}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        request.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                          : request.status === 'in-process'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : request.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}>
                        {request.status}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{request.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No service requests</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => handleManagementClick('courses')}
                className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors"
              >
                <PlusCircle size={24} className="text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Add Course</p>
              </button>
              <button 
                onClick={() => handleManagementClick('users')}
                className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Users size={24} className="text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Manage Users</p>
              </button>
              <button 
                onClick={() => handleManagementClick('contacts')}
                className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors"
              >
                <MessageSquare size={24} className="text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-medium">View Messages</p>
              </button>
              <button 
                onClick={() => handleManagementClick('assignments')}
                className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors"
              >
                <GraduationCap size={24} className="text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Assignments</p>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Management Tools Tab */
        <div className="space-y-6">
          {/* Management Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleManagementClick(section.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-${section.color}-100 dark:bg-${section.color}-900/30`}>
                      <Icon size={24} className={`text-${section.color}-600 dark:text-${section.color}-400`} />
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(`View ${section.id}`);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Eye size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(`Edit ${section.id}`);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(`Add new ${section.id}`);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <PlusCircle size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage all {section.title.toLowerCase().replace(' management', '')} data
                  </p>
                </div>
              );
            })}
          </div>

          {/* Additional Management Features */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Advanced Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Database Operations</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    Export All Data
                  </button>
                  <button className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    Import Data
                  </button>
                  <button className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    Backup Database
                  </button>
                </div>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">System Settings</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    Platform Settings
                  </button>
                  <button className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    Email Templates
                  </button>
                  <button className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    API Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Create New Items Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Create New</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => console.log('Create new course')}
                className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                <PlusCircle size={20} className="mx-auto mb-2" />
                <p className="text-sm font-medium">New Course</p>
              </button>
              <button 
                onClick={() => console.log('Create new assignment')}
                className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
              >
                <PlusCircle size={20} className="mx-auto mb-2" />
                <p className="text-sm font-medium">New Assignment</p>
              </button>
              <button 
                onClick={() => console.log('Create new service')}
                className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
              >
                <PlusCircle size={20} className="mx-auto mb-2" />
                <p className="text-sm font-medium">New Service</p>
              </button>
              <button 
                onClick={() => console.log('Create new event')}
                className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                <PlusCircle size={20} className="mx-auto mb-2" />
                <p className="text-sm font-medium">New Event</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;