// src/components/dashboard/role-specific/BusinessDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Target, BarChart, BookOpen, Award, MessageSquare, Clock } from 'lucide-react';
import StatCard from '../common/StatCard';
import { User, UserStats } from '../../../lib/types';

interface BusinessDashboardProps {
  user: User;
  stats: UserStats;
}

interface StudentProgress {
  studentId: number;
  studentName: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  lastActivity: string;
  completionRate: number;
}

interface ServiceRequest {
  id: number;
  studentId: number;
  studentName: string;
  serviceType: string;
  status: string;
  requestDate: string;
  description: string;
}

interface BusinessMetrics {
  totalStudents: number;
  activeInternships: number;
  completedCourses: number;
  pendingServiceRequests: number;
  avgCompletionRate: number;
  totalCertificates: number;
  monthlyRevenue: number;
  studentProgress: StudentProgress[];
  serviceRequests: ServiceRequest[];
  coursesData: any[];
}

const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ user, stats }) => {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    totalStudents: 0,
    activeInternships: 0,
    completedCourses: 0,
    pendingServiceRequests: 0,
    avgCompletionRate: 0,
    totalCertificates: 0,
    monthlyRevenue: 0,
    studentProgress: [],
    serviceRequests: [],
    coursesData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessMetrics();
  }, []);

  const fetchBusinessMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple endpoints
      const [
        studentsResponse,
        coursesResponse,
        certificatesResponse,
        serviceRequestsResponse,
        userStatsResponse,
        enrollmentsResponse
      ] = await Promise.all([
        fetch('/api/users?role=student'),
        fetch('/api/courses/statistics'),
        fetch('/api/certificates/statistics'),
        fetch('/api/service-requests/pending'),
        fetch('/api/user-stats/all'),
        fetch('/api/enrollments/active')
      ]);

      const studentsData = await studentsResponse.json();
      const coursesData = await coursesResponse.json();
      const certificatesData = await certificatesResponse.json();
      const serviceRequestsData = await serviceRequestsResponse.json();
      const userStatsData = await userStatsResponse.json();
      const enrollmentsData = await enrollmentsResponse.json();

      // Process student progress data
      const studentProgressData = await processStudentProgress(userStatsData);

      // Calculate metrics
      const totalCompleted = userStatsData.reduce((sum: number, stat: any) => sum + stat.courses_completed, 0);
      const totalEnrolled = userStatsData.reduce((sum: number, stat: any) => sum + stat.courses_enrolled, 0);
      const avgCompletionRate = totalEnrolled > 0 ? (totalCompleted / totalEnrolled) * 100 : 0;

      setBusinessMetrics({
        totalStudents: studentsData.length || 0,
        activeInternships: enrollmentsData.filter((e: any) => e.type === 'internship').length || 0,
        completedCourses: totalCompleted,
        pendingServiceRequests: serviceRequestsData.length || 0,
        avgCompletionRate: Math.round(avgCompletionRate),
        totalCertificates: certificatesData.total || 0,
        monthlyRevenue: calculateMonthlyRevenue(servicerequeststData, certificatesData),
        studentProgress: studentProgressData,
        serviceRequests: serviceRequestsData.slice(0, 5) || [], // Show top 5 recent requests
        coursesData: coursesData || []
      });
    } catch (error) {
      console.error('Error fetching business metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processStudentProgress = async (userStatsData: any[]): Promise<StudentProgress[]> => {
    return userStatsData.map((stat: any) => ({
      studentId: stat.user_id,
      studentName: `Student ${stat.user_id}`, // You might want to join with users table
      coursesEnrolled: stat.courses_enrolled || 0,
      coursesCompleted: stat.courses_completed || 0,
      certificatesEarned: stat.certificates_earned || 0,
      lastActivity: stat.last_activity || new Date().toISOString(),
      completionRate: stat.courses_enrolled > 0 ? (stat.courses_completed / stat.courses_enrolled) * 100 : 0
    }));
  };

  const calculateMonthlyRevenue = (serviceRequests: any[], certificates: any): number => {
    // Estimate: ₹500 per service request + ₹1000 per certificate
    const serviceRevenue = serviceRequests.filter((req: any) => req.status === 'completed').length * 500;
    const certificateRevenue = certificates.monthlyIssued * 1000;
    return serviceRevenue + certificateRevenue;
  };

  const handleServiceRequest = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      await fetch(`/api/service-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected' })
      });
      
      // Refresh data
      fetchBusinessMetrics();
    } catch (error) {
      console.error('Error updating service request:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Digital Marketing Academy Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track student progress, manage internships, and handle service requests for your digital marketing platform.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Students" 
          value={businessMetrics.totalStudents.toString()} 
          icon={<Users size={20} />} 
          color="from-blue-500 to-blue-400"
        />
        <StatCard 
          title="Active Internships" 
          value={businessMetrics.activeInternships.toString()} 
          icon={<Target size={20} />} 
          color="from-green-500 to-green-400"
        />
        <StatCard 
          title="Avg Completion Rate" 
          value={`${businessMetrics.avgCompletionRate}%`} 
          icon={<TrendingUp size={20} />} 
          color="from-purple-500 to-purple-400"
        />
        <StatCard 
          title="Certificates Issued" 
          value={businessMetrics.totalCertificates.toString()} 
          icon={<Award size={20} />} 
          color="from-orange-500 to-orange-400"
        />
      </div>

      {/* Student Progress & Service Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Student Learning Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BookOpen size={20} />
            Student Learning Progress
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {businessMetrics.studentProgress.slice(0, 6).map((student, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{student.studentName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {student.coursesCompleted}/{student.coursesEnrolled} courses completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">{Math.round(student.completionRate)}%</p>
                    <p className="text-xs text-gray-500">{student.certificatesEarned} certificates</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${student.completionRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Requests */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare size={20} />
            Service Requests
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {businessMetrics.pendingServiceRequests}
            </span>
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {businessMetrics.serviceRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{request.studentName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{request.serviceType}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    request.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {request.description}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleServiceRequest(request.id, 'approve')}
                    className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleServiceRequest(request.id, 'reject')}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course Performance & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Course Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Course Performance</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">Digital Marketing Fundamentals</h3>
              <div className="flex justify-between text-sm mt-2">
                <span>Completion Rate: 85%</span>
                <span>156 students enrolled</span>
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-300">Social Media Marketing</h3>
              <div className="flex justify-between text-sm mt-2">
                <span>Completion Rate: 72%</span>
                <span>89 students enrolled</span>
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-purple-800 dark:text-purple-300">SEO & Content Marketing</h3>
              <div className="flex justify-between text-sm mt-2">
                <span>Completion Rate: 68%</span>
                <span>134 students enrolled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue & Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Business Analytics</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-300">Monthly Revenue</h3>
              <p className="text-2xl font-bold text-green-600">
                ₹{businessMetrics.monthlyRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">Active Internships</h3>
              <p className="text-2xl font-bold text-blue-600">
                {businessMetrics.activeInternships}
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-purple-800 dark:text-purple-300">Service Requests</h3>
              <p className="text-2xl font-bold text-purple-600">
                {businessMetrics.pendingServiceRequests} pending
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Marketing Services */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Digital Marketing Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 cursor-pointer transition-colors">
            <h3 className="font-semibold mb-2">SEO Services</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Students provide SEO optimization services
            </p>
            <div className="mt-2 text-xs text-orange-600">
              12 active projects
            </div>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 cursor-pointer transition-colors">
            <h3 className="font-semibold mb-2">Social Media Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Comprehensive social media marketing solutions
            </p>
            <div className="mt-2 text-xs text-orange-600">
              8 active campaigns
            </div>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 cursor-pointer transition-colors">
            <h3 className="font-semibold mb-2">Content Marketing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Professional content creation and strategy
            </p>
            <div className="mt-2 text-xs text-orange-600">
              15 content pieces delivered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;