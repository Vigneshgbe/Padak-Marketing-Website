// src/components/dashboard/role-specific/BusinessDashboard.tsx
import React from 'react';
import { Users, TrendingUp, Target, BarChart } from 'lucide-react';
import StatCard from '../common/StatCard';
import { User, UserStats } from '../../../lib/types';

interface BusinessDashboardProps {
  user: User;
  stats: UserStats;
}

const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ user, stats }) => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">{user.firstName}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your team's growth and business development.
        </p>
      </div>

      {/* Business Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Team Members" 
          value="12" 
          icon={<Users size={20} />} 
          color="from-blue-500 to-blue-400"
        />
        <StatCard 
          title="Active Projects" 
          value="8" 
          icon={<Target size={20} />} 
          color="from-green-500 to-green-400"
        />
        <StatCard 
          title="ROI Improvement" 
          value="24%" 
          icon={<TrendingUp size={20} />} 
          color="from-purple-500 to-purple-400"
        />
        <StatCard 
          title="Training Hours" 
          value="156" 
          icon={<BarChart size={20} />} 
          color="from-orange-500 to-orange-400"
        />
      </div>

      {/* Team Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Team Training Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Marketing Team</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Sales Team</span>
                <span>80%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Support Team</span>
                <span>45%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">ROI Calculator</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-300">Training Investment</h3>
              <p className="text-2xl font-bold text-green-600">₹2,50,000</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">Revenue Increase</h3>
              <p className="text-2xl font-bold text-blue-600">₹6,00,000</p>
            </div>
            <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              View Detailed Report
            </button>
          </div>
        </div>
      </div>

      {/* Business Services */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Business Growth Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 cursor-pointer">
            <h3 className="font-semibold mb-2">Team Training Programs</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Customized training programs for your entire team
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 cursor-pointer">
            <h3 className="font-semibold mb-2">Marketing Automation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Implement automated marketing systems
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 cursor-pointer">
            <h3 className="font-semibold mb-2">Performance Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Advanced analytics and reporting solutions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
      