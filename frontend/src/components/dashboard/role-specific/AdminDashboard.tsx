// src/components/dashboard/role-specific/AdminDashboard.tsx
import React from 'react';
import { Users, BookOpen, UserCheck, BarChart, PlusCircle, MessageSquare, GraduationCap, ChevronRight } from 'lucide-react';
import StatCard from '../common/StatCard';
import { DashboardStats } from '../../../lib/types';

const AdminDashboard: React.FC = () => {
  const adminStats: DashboardStats = {
    totalUsers: 1250,
    totalCourses: 24,
    totalEnrollments: 3456,
    totalRevenue: "₹45,67,890",
    activeInternships: 12,
    pendingContacts: 8
  };

  const recentUsers = [
    { id: 101, name: "Rahul Kumar", email: "rahul@example.com", type: "student", joinDate: "2024-06-10" },
    { id: 102, name: "Priya Singh", email: "priya@example.com", type: "professional", joinDate: "2024-06-09" },
    { id: 103, name: "Tech Solutions Ltd", email: "contact@techsol.com", type: "business", joinDate: "2024-06-08" }
  ];

  const recentEnrollments = [
    { id: 201, userName: "Amit Sharma", courseName: "SEO Mastery", date: "2024-06-11", status: "active" },
    { id: 202, userName: "Neha Patel", courseName: "Social Media Marketing", date: "2024-06-10", status: "active" }
  ];

  const serviceRequests = [
    { id: 301, name: "Rahul Kumar", service: "SEO Audit", date: "2024-06-15", status: "pending" },
    { id: 302, name: "Tech Solutions", service: "Google Ads Setup", date: "2024-06-14", status: "in-progress" }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your platform efficiently
        </p>
      </div>
      
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
            <button className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center">
              View All <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                    {user.type}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.joinDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Enrollments</h2>
            <button className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center">
              View All <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentEnrollments.map(enrollment => (
              <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">{enrollment.userName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{enrollment.courseName}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {enrollment.status}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{enrollment.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service Requests */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Service Requests</h2>
          <button className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center">
            View All <ChevronRight size={18} className="ml-1" />
          </button>
        </div>
        <div className="space-y-4">
          {serviceRequests.map(request => (
            <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium">{request.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{request.service}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  request.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {request.status}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{request.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
            <PlusCircle size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Add Course</p>
          </button>
          <button className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
            <Users size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Manage Users</p>
          </button>
          <button className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
            <MessageSquare size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">View Messages</p>
          </button>
          <button className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
            <GraduationCap size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Internships</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;