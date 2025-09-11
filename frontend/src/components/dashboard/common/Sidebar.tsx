// src/components/dashboard/common/Sidebar.tsx (updated)
import React from 'react';
import {
  LayoutDashboard, BookOpen, ListChecks, BadgeCheck, Calendar,
  Users, Briefcase, BarChart, Settings, LogOut,
  Shield, UserCheck, MessageSquare, FileText,
  Sun, Moon, User,
  Award, HardHat, Mail, GraduationCap, DollarSign 
} from 'lucide-react';
import { getImageUrl } from '../../../utils/image-utils';
import { useAuth } from '../../../hooks/use-auth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onProfileClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  darkMode,
  onToggleDarkMode,
  onProfileClick
}) => {
  const { user, logout } = useAuth();

  const PadakLogo = () => (
    <img 
      src="https://github.com/Sweety-Vigneshg/Padak-Marketing-Website/blob/main/frontend/src/assets/padak_p.png?raw=true" 
      alt="Padak Logo" 
      width="28" 
      height="28" 
      className="object-contain"
    />
  );

  const getNavItems = (): NavItem[] => {
    // Admin navigation items
    if (user?.accountType === 'admin') {
      return [
        { id: 'dashboard', label: 'Admin Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'admin-users', label: 'User Management', icon: <Users size={20} /> },
        { id: 'admin-courses', label: 'Course Management', icon: <BookOpen size={20} /> },
        { id: 'admin-assignments', label: 'Assignment Manage', icon: <HardHat size={20} /> },
        { id: 'admin-enrollments', label: 'Enrollment Manage', icon: <UserCheck size={20} /> },
        { id: 'admin-certificates', label: 'Certificate Manage', icon: <Award size={20} /> },
        { id: 'admin-services', label: 'Service Management', icon: <Briefcase size={20} /> },
        { id: 'admin-contacts', label: 'Contact Messages', icon: <Mail size={20} /> },
        { id: 'admin-calendar', label: 'Calendar Events', icon: <Calendar size={20} /> },
        { id: 'admin-service-requests', label: 'Service Requests', icon: <MessageSquare size={20} /> },
        { id: 'admin-resources', label: 'Resource Manage', icon: <FileText size={20} /> },
        { id: 'admin-payments', label: 'Payments Data', icon: <DollarSign  size={20} /> },
      ];
    }

    // Default/Student/Professional/Business/Agency user navigation items
    const baseItems: NavItem[] = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'social', label: 'Social Feed', icon: <MessageSquare size={20} /> },
      { id: 'courses', label: 'My Courses', icon: <BookOpen size={20} /> },
      { id: 'internships', label: 'Internships', icon: <Briefcase size={20} /> },
      { id: 'assignments', label: 'Assignments', icon: <ListChecks size={20} /> },
      { id: 'certificates', label: 'Certificates', icon: <BadgeCheck size={20} /> },
      { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
      { id: 'resources', label: 'Resources', icon: <FileText size={20} /> },
    ];

    if (['professional', 'business', 'agency'].includes(user?.accountType || '')) {
      baseItems.push({ id: 'services', label: 'Request Services', icon: <Briefcase size={20} /> });
    }

    baseItems.push({ id: 'settings', label: 'Settings', icon: <Settings size={20} /> });
    return baseItems;
  };

  const navItems = getNavItems();

  if (!user) return null;

  // Determine which item is active
  const isActive = (item: NavItem) => {
    return activeView === item.id;
  };

  return (
    <aside className="fixed lg:static z-30 h-screen w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-3 mr-6">
            <div className="flex items-center justify-center">
              <PadakLogo />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                Padak
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-grow">
        <div
          className="flex items-center mb-6 p-3 rounded-lg bg-orange-50 dark:bg-gray-700 cursor-pointer hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors"
          onClick={onProfileClick}
        >
          <div className="relative flex-shrink-0">
             {user.profileImage ? (
              <img 
                src={getImageUrl(user.profileImage)} // Use getImageUrl here
                alt="Profile" 
                className="w-10 h-10 rounded-xl object-cover border-2 border-orange-200 dark:border-orange-500/20"
              />
            ) : (
              <div className="bg-gray-200 dark:bg-gray-600 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl w-12 h-12 flex items-center justify-center">
                {user.accountType === 'admin' ? (
                  <Shield size={24} className="text-orange-500" />
                ) : (
                  <span className="text-lg font-semibold text-gray-400 uppercase">
                    {user.firstName?.charAt(0) || <User size={24} />}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="ml-3 flex-grow">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{user.firstName} {user.lastName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {user.accountType === 'admin' ? 'Administrator' : user.accountType}
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                isActive(item)
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={onToggleDarkMode}
          className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <span className="mr-3">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </span>
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={logout}
          className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <span className="mr-3">
            <LogOut size={20} />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;