// src/pages/Dashboard.tsx (updated)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/common/Sidebar';
import DashboardHeader from '../components/dashboard/common/DashboardHeader';
import ProfileModal from '../components/dashboard/profile/ProfileModal';
import StudentDashboard from '../components/dashboard/role-specific/StudentDashboard';
import ProfessionalDashboard from '../components/dashboard/role-specific/ProfessionalDashboard';
import BusinessDashboard from '../components/dashboard/role-specific/BusinessDashboard';
import AgencyDashboard from '../components/dashboard/role-specific/AgencyDashboard';
import DashboardHome from './dashboard/DashboardHome';
import SocialFeed from '../components/dashboard/social/SocialFeed';
import MyCourses from './dashboard/MyCourses';
import Assignments from './dashboard/Assignments';
import Certificates from './dashboard/Certificates';
import Calendar from './dashboard/Calendar';
import Resources from './dashboard/Resources';
import Services from './dashboard/Services';
import Settings from './dashboard/Settings';
import { UserStats } from '../lib/types';
import Interns from './Interns';

// Admin pages
import AdminOverview from './dashboard/admin/AdminOverview';
import UserManagement from './dashboard/admin/UserManagement';
import CourseManagement from './dashboard/admin/CourseManagement';
import AssignmentManagement from './dashboard/admin/AssignmentManagement';
import EnrollmentManagement from './dashboard/admin/EnrollmentManagement';
import CertificateManagement from './dashboard/admin/CertificateManagement';
import ServiceManagement from './dashboard/admin/ServiceManagement';
import ContactManagement from './dashboard/admin/ContactManagement';
import CalendarManagement from './dashboard/admin/CalendarManagement';
import ServiceRequests from './dashboard/admin/ServiceRequests';

const Dashboard: React.FC = () => {
  const { user, token, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    certificatesEarned: 0,
    learningStreak: 0,
    lastActivity: new Date().toISOString(),
  });
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [internshipApplications, setInternshipApplications] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Set dark mode class on body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !token) return;
      
      setIsLoadingData(true);
      try {
        // Fetch user stats
        const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setUserStats({
            coursesEnrolled: statsData.coursesEnrolled || 0,
            coursesCompleted: statsData.coursesCompleted || 0,
            certificatesEarned: statsData.certificatesEarned || 0,
            learningStreak: statsData.learningStreak || 0,
            lastActivity: statsData.lastActivity || new Date().toISOString(),
          });
        }

        // Fetch enrolled courses if user is not admin
        if (user.accountType !== 'admin') {
          const coursesResponse = await fetch('http://localhost:5000/api/courses/enrolled', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            setEnrolledCourses(coursesData);
          }

          // Fetch internship applications
          const internshipsResponse = await fetch(`http://localhost:5000/api/user/internship-applications`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (internshipsResponse.ok) {
            const internshipsData = await internshipsResponse.json();
            setInternshipApplications(internshipsData);
          }

          // Fetch service requests for professional/business/agency users
          if (['professional', 'business', 'agency'].includes(user.accountType)) {
            const servicesResponse = await fetch(`http://localhost:5000/api/user/service-requests`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (servicesResponse.ok) {
              const servicesData = await servicesResponse.json();
              setServiceRequests(servicesData);
            }
          }

          // Fetch calendar events
          const calendarResponse = await fetch('http://localhost:5000/api/calendar/events', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json();
            setCalendarEvents(calendarData);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, token]);

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const renderDashboardContent = () => {
    if (activeView === 'dashboard') {
      switch (user.accountType) {
        case 'student':
          return (
            <StudentDashboard 
              user={user} 
              stats={userStats} 
              enrolledCourses={enrolledCourses}
              internshipApplications={internshipApplications}
              calendarEvents={calendarEvents}
            />
          );
        case 'professional':
          return (
            <ProfessionalDashboard 
              user={user} 
              stats={userStats} 
              enrolledCourses={enrolledCourses}
              serviceRequests={serviceRequests}
              calendarEvents={calendarEvents}
            />
          );
        case 'business':
          return (
            <BusinessDashboard 
              user={user} 
              stats={userStats} 
              enrolledCourses={enrolledCourses}
              serviceRequests={serviceRequests}
              calendarEvents={calendarEvents}
            />
          );
        case 'agency':
          return (
            <AgencyDashboard 
              user={user} 
              stats={userStats} 
              enrolledCourses={enrolledCourses}
              serviceRequests={serviceRequests}
              calendarEvents={calendarEvents}
            />
          );
        case 'admin':
          return <AdminOverview />;
        default:
          return <DashboardHome user={user} stats={userStats} />;
      }
    }

    // Admin specific views
    if (user.accountType === 'admin') {
      switch (activeView) {
        case 'admin-users':
          return <UserManagement />;
        case 'admin-courses':
          return <CourseManagement />;
        case 'admin-assignments':
          return <AssignmentManagement />;
        case 'admin-enrollments':
          return <EnrollmentManagement />;
        case 'admin-certificates':
          return <CertificateManagement />;
        case 'admin-services':
          return <ServiceManagement />;
        case 'admin-contacts':
          return <ContactManagement />;
        case 'admin-calendar':
          return <CalendarManagement />;
        case 'admin-service-requests':
          return <ServiceRequests />;
        default:
          return <AdminOverview />;
      }
    }

    // Render other views for non-admin users
    switch (activeView) {
      case 'social':
        return <SocialFeed />;
      case 'courses':
        return <MyCourses enrolledCourses={enrolledCourses} />;
      case 'internships':
        return <Interns internshipApplications={internshipApplications} />;
      case 'assignments':
        return <Assignments />;
      case 'certificates':
        return <Certificates />;
      case 'calendar':
        return <Calendar events={calendarEvents} />;
      case 'resources':
        return <Resources />;
      case 'services':
        return <Services serviceRequests={serviceRequests} />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardHome user={user} stats={userStats} />;
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onProfileClick={() => setShowProfileModal(true)}
        />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onProfileClick={() => setShowProfileModal(true)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {renderDashboardContent()}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default Dashboard;