// src/pages/dashboard/admin/AdminOverview.tsx
import React, { useState, useEffect } from 'react';
import { Users, BookOpen, UserCheck, BarChart, PlusCircle, MessageSquare, GraduationCap, ChevronRight } from 'lucide-react';
import StatCard from 'src/components/dashboard/common/StatCard';
import { DashboardStats, RecentUser, RecentEnrollment, ServiceRequest } from '../../../lib/admin-types';
import { useAdminData } from '../../../hooks/useAdminData';

const AdminOverview: React.FC = () => {
  const [adminStats, setAdminStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalRevenue: "₹0",
    pendingContacts: 0,
    pendingServiceRequests: 0
  });

  const { data: recentUsers, loading: usersLoading, error: usersError } = useAdminData('/api/admin/recent-users');
  const { data: recentEnrollments, loading: enrollmentsLoading, error: enrollmentsError } = useAdminData('/api/admin/recent-enrollments');
  const { data: serviceRequests, loading: requestsLoading, error: requestsError } = useAdminData('/api/admin/service-requests');

  useEffect(() => {
    // Fetch dashboard stats
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const baseURL = 'http://localhost:5000';
        const response = await fetch(`${baseURL}/api/admin/dashboard-stats`, {
          method: 'GET',
          headers,
          credentials: 'include'
        });

        if (response.ok) {
          const statsData = await response.json();
          
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
        } else {
          // Use mock data for development
          setAdminStats({
            totalUsers: 125,
            totalCourses: 15,
            totalEnrollments: 342,
            totalRevenue: "₹2,45,000",
            pendingContacts: 8,
            pendingServiceRequests: 5
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Use mock data for development
        setAdminStats({
          totalUsers: 125,
          totalCourses: 15,
          totalEnrollments: 342,
          totalRevenue: "₹2,45,000",
          pendingContacts: 8,
          pendingServiceRequests: 5
        });
      }
    };

    fetchDashboardStats();
  }, []);

  const handleManagementClick = (sectionId: string) => {
    // This would be handled by the parent component to change the active view
    console.log(`Navigate to ${sectionId}`);
  };

  return (
    <div>
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
              onClick={() => handleManagementClick('users')}
              className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
            >
              Manage <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentUsers && recentUsers.length > 0 ? (
              recentUsers.map((user: RecentUser) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">{`${user.first_name} ${user.last_name}`}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                      {user.account_type}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.created_at}</p>
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
              onClick={() => handleManagementClick('enrollments')}
              className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
            >
              Manage <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentEnrollments && recentEnrollments.length > 0 ? (
              recentEnrollments.map((enrollment: RecentEnrollment) => (
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
            onClick={() => handleManagementClick('service-requests')}
            className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
          >
            Manage <ChevronRight size={18} className="ml-1" />
          </button>
        </div>
        <div className="space-y-4">
          {serviceRequests && serviceRequests.length > 0 ? (
            serviceRequests.map((request: ServiceRequest) => (
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
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
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
    </div>
  );
};

export default AdminOverview;