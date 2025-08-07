// src/components/dashboard/common/DashboardHeader.tsx
import React from 'react';
import { Menu, Search, Bell, ChevronDown, User, Shield } from 'lucide-react';
import { useAuth } from '../../../hooks/use-auth';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onMenuClick, 
  onProfileClick 
}) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-20 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <button 
            onClick={onMenuClick} 
            className="lg:hidden mr-4 text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors"
          >
            <Menu size={24} />
          </button>         
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses, resources..."
              className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-500 transition-colors"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Bell size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
          </button>
          
          <div 
            className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
            onClick={onProfileClick}
          >
            <div className="relative">
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-xl object-cover border-2 border-orange-200 dark:border-orange-500/20"
                />
              ) : (
                <div className="bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-800/10 border-2 border-dashed border-orange-300 dark:border-orange-500/30 rounded-xl w-10 h-10 flex items-center justify-center">
                  {user.accountType === 'admin' ? (
                    <Shield size={20} className="text-orange-500" />
                  ) : (
                    <User size={20} className="text-orange-500" />
                  )}
                </div>
              )}
            </div>
            <div className="ml-2 hidden md:block">
              <div className="font-medium text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {user.accountType === 'admin' ? 'Administrator' : user.accountType}
              </div>
            </div>
            <ChevronDown size={20} className="ml-2 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;