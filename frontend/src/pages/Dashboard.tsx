// src/pages/Dashboard.tsx
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
import AdminDashboard from '../components/dashboard/role-specific/AdminDashboard';
import DashboardHome from './dashboard/DashboardHome';
import MyCourses from './dashboard/MyCourses';
import Assignments from './dashboard/Assignments';
import Certificates from './dashboard/Certificates';
import Calendar from './dashboard/Calendar';
import Resources from './dashboard/Resources';
import Services from './dashboard/Services';
import Settings from './dashboard/Settings';
import { UserStats } from '../lib/types';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
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

  // Set dark mode class on body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load user stats
  useEffect(() => {
    if (user) {
      // TODO: Fetch user stats from API
      setUserStats({
        coursesEnrolled: 5,
        coursesCompleted: 2,
        certificatesEarned: 2,
        learningStreak: 12,
        lastActivity: new Date().toISOString(),
      });
    }
  }, [user]);

  if (loading) {
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
          return <StudentDashboard user={user} stats={userStats} />;
        case 'professional':
          return <ProfessionalDashboard user={user} stats={userStats} />;
        case 'business':
          return <BusinessDashboard user={user} stats={userStats} />;
        case 'agency':
          return <AgencyDashboard user={user} stats={userStats} />;
        case 'admin':
          return <AdminDashboard />;
        default:
          return <DashboardHome user={user} stats={userStats} />;
      }
    }

    // Render other views
    switch (activeView) {
      case 'courses':
        return <MyCourses />;
      case 'assignments':
        return <Assignments />;
      case 'certificates':
        return <Certificates />;
      case 'calendar':
        return <Calendar />;
      case 'resources':
        return <Resources />;
      case 'services':
        return <Services />;
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