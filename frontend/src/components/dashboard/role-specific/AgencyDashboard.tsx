// src/components/dashboard/role-specific/AgencyDashboard.tsx
import React from 'react';
import { Users, Briefcase, TrendingUp, Star } from 'lucide-react';
import StatCard from '../common/StatCard';
import { User, UserStats } from '../../../lib/types';

interface AgencyDashboardProps {
  user: User;
  stats: UserStats;
}

const AgencyDashboard: React.FC<AgencyDashboardProps> = ({ user, stats }) => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">{user.firstName}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your agency operations and client projects efficiently.
        </p>
      </div>

      {/* Agency Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Active Projects" 
          value="15" 
          icon={<Briefcase size={20} />} 
          color="from-blue-500 to-blue-400"
        />
        <StatCard 
          title="Team Members" 
          value="24" 
          icon={<Users size={20} />} 
          color="from-green-500 to-green-400"
        />
        <StatCard 
          title="Client Satisfaction" 
          value="96%" 
          icon={<Star size={20} />} 
          color="from-purple-500 to-purple-400"
        />
        <StatCard 
          title="Revenue Growth" 
          value="32%" 
          icon={<TrendingUp size={20} />} 
          color="from-orange-500 to-orange-400"
        />
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Active Client Projects</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-semibold">TechCorp SEO Campaign</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Due: Dec 15, 2024</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
                On Track
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-semibold">StartupXYZ Social Media</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Due: Dec 20, 2024</p>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs rounded-full">
                In Progress
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-semibold">E-commerce PPC Setup</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Due: Dec 25, 2024</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
                Planning
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Team Performance</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Project Delivery Rate</span>
                <span>94%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Client Retention</span>
                <span>88%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Team Utilization</span>
                <span>76%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '76%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* White-label Resources */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">White-label Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">Client Presentation Templates</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Professional templates for client presentations
            </p>
            <button className="px-3 py-1 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors">
              Download
            </button>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">Reporting Dashboards</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Customizable client reporting dashboards
            </p>
            <button className="px-3 py-1 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors">
              Access
            </button>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">Training Materials</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Client training and onboarding materials
            </p>
            <button className="px-3 py-1 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors">
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboard;