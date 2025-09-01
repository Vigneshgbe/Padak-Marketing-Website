import React from 'react';
import { User, UserStats } from '../../lib/types';

interface DashboardHomeProps {
  user: User; 
  stats: UserStats;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ user, stats }) => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">{user.firstName}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your learning journey today.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Getting Started</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to your personalized dashboard. Use the sidebar to navigate through different sections.
        </p>
      </div>
    </div>
  );
};

export default DashboardHome;