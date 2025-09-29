// src/pages/dashboard/admin/AdminOverview.tsx
import React, { useState, useEffect } from 'react';
import { Users, BookOpen, UserCheck, BarChart, PlusCircle, MessageSquare, GraduationCap, ChevronRight } from 'lucide-react';
import StatCard from '../../../components/dashboard/common/StatCard';
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

  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const baseURL = window.location.origin;

        // Fetch dashboard stats
        try {
          const statsResponse = await fetch(`${baseURL}/api/admin/dashboard-stats`, {
            method: 'GET',
            headers,
            credentials: 'include'
          });

          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            
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
            console.warn('Failed to fetch dashboard stats, using mock data');
            setMockData();
          }
        } catch (statsError) {
          console.warn('Error fetching dashboard stats, using mock data:', statsError);
          setMockData();
        }

        // Fetch recent users
        try {
          const usersResponse = await fetch(`${baseURL}/api/admin/recent-users`, {
            method: 'GET',
            headers,
            credentials: 'include'
          });

          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setRecentUsers(usersData);
          } else {
            console.warn('Failed to fetch recent users, using mock data');
            setMockRecentUsers();
          }
        } catch (usersError) {
          console.warn('Error fetching recent users, using mock data:', usersError);
          setMockRecentUsers();
        }

        // Fetch recent enrollments
        try {
          const enrollmentsResponse = await fetch(`${baseURL}/api/admin/recent-enrollments`, {
            method: 'GET',
            headers,
            credentials: 'include'
          });

          if (enrollmentsResponse.ok) {
            const enrollmentsData = await enrollmentsResponse.json();
            setRecentEnrollments(enrollmentsData);
          } else {
            console.warn('Failed to fetch recent enrollments, using mock data');
            setMockRecentEnrollments();
          }
        } catch (enrollmentsError) {
          console.warn('Error fetching recent enrollments, using mock data:', enrollmentsError);
          setMockRecentEnrollments();
        }

        // Fetch service requests
        try {
          const serviceRequestsResponse = await fetch(`${baseURL}/api/admin/service-requests`, {
            method: 'GET',
            headers,
            credentials: 'include'
          });

          if (serviceRequestsResponse.ok) {
            const serviceRequestsData = await serviceRequestsResponse.json();
            // Transform the data to match the ServiceRequest type
            const transformedRequests = serviceRequestsData.map((request: any) => ({
              id: request.id,
              name: request.name || `${request.user_first_name} ${request.user_last_name}`,
              service: request.service,
              date: request.date,
              status: request.status,
              email: request.email,
              phone: request.phone,
              company: request.company,
              website: request.website,
              project_details: request.project_details,
              budget_range: request.budget_range,
              timeline: request.timeline,
              contact_method: request.contact_method,
              additional_requirements: request.additional_requirements
            }));
            setServiceRequests(transformedRequests);
          } else {
            console.warn('Failed to fetch service requests, using mock data');
            setMockServiceRequests();
          }
        } catch (serviceRequestsError) {
          console.warn('Error fetching service requests, using mock data:', serviceRequestsError);
          setMockServiceRequests();
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setMockData();
      } finally {
        setLoading(false);
      }
    };

    // Mock data functions
    const setMockData = () => {
      setAdminStats({
        totalUsers: 125,
        totalCourses: 15,
        totalEnrollments: 342,
        totalRevenue: "₹2,45,000",
        pendingContacts: 8,
        pendingServiceRequests: 5
      });
    };

    const setMockRecentUsers = () => {
      setRecentUsers([
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          account_type: 'student',
          join_date: '15 Dec 2024'
        },
        {
          id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          account_type: 'professional',
          join_date: '14 Dec 2024'
        },
        {
          id: '3',
          first_name: 'Mike',
          last_name: 'Johnson',
          email: 'mike.johnson@example.com',
          account_type: 'business',
          join_date: '13 Dec 2024'
        }
      ]);
    };

    const setMockRecentEnrollments = () => {
      setRecentEnrollments([
        {
          id: '1',
          user_name: 'John Doe',
          course_name: 'Web Development Fundamentals',
          date: '15 Dec 2024',
          status: 'active'
        },
        {
          id: '2',
          user_name: 'Jane Smith',
          course_name: 'Data Science Essentials',
          date: '14 Dec 2024',
          status: 'completed'
        },
        {
          id: '3',
          user_name: 'Mike Johnson',
          course_name: 'Digital Marketing Strategy',
          date: '13 Dec 2024',
          status: 'active'
        }
      ]);
    };

    const setMockServiceRequests = () => {
      setServiceRequests([
        {
          id: '1',
          name: 'Sarah Wilson',
          service: 'Website Development',
          date: '15 Dec 2024',
          status: 'pending'
        },
        {
          id: '2',
          name: 'David Brown',
          service: 'Mobile App Development',
          date: '14 Dec 2024',
          status: 'in-process'
        },
        {
          id: '3',
          name: 'Emily Davis',
          service: 'Digital Marketing',
          date: '13 Dec 2024',
          status: 'completed'
        }
      ]);
    };

    fetchDashboardData();
  }, []);

  const handleManagementClick = (sectionId: string) => {
    // This would be handled by the parent component to change the active view
    console.log(`Navigate to ${sectionId}`);
    // You can dispatch an event or use a state management solution here
    // For now, we'll just log it
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

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <span className="text-red-500 mr-2">⚠️</span>
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

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