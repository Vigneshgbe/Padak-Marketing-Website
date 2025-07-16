// src/components/dashboard/role-specific/ProfessionalDashboard.tsx
import React, { useState } from 'react';
import { BookOpen, CheckCircle, BadgeCheck, Calendar, Users, Briefcase } from 'lucide-react';
import StatCard from '../common/StatCard';
import { User, UserStats } from '../../../lib/types';

interface ProfessionalDashboardProps {
  user: User;
  stats: UserStats;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ user, stats }) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'services'>('progress');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">{user.firstName}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Advance your career with professional development and services.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'progress' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setActiveTab('progress')}
        >
          Learning Progress
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'services' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setActiveTab('services')}
        >
          Professional Services
        </button>
      </div>

      {activeTab === 'progress' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Courses Enrolled" 
              value={stats.coursesEnrolled} 
              icon={<BookOpen size={20} />} 
              color="from-blue-500 to-blue-400"
            />
            <StatCard 
              title="Courses Completed" 
              value={stats.coursesCompleted} 
              icon={<CheckCircle size={20} />} 
              color="from-green-500 to-green-400"
            />
            <StatCard 
              title="Certificates" 
              value={stats.certificatesEarned} 
              icon={<BadgeCheck size={20} />} 
              color="from-purple-500 to-purple-400"
            />
            <StatCard 
              title="Learning Streak" 
              value={`${stats.learningStreak} days`} 
              icon={<Calendar size={20} />} 
              color="from-orange-500 to-orange-400"
            />
          </div>

          {/* Advanced Courses */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">Advanced Professional Courses</h2>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">Advanced Analytics</h3>
                  <span className="text-sm text-orange-500">90%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Instructor: Sarah Wilson</span>
                  <span>5 weeks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Networking */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center mb-4">
              <Users size={24} className="text-orange-500 mr-3" />
              <h2 className="text-xl font-bold">Professional Networking</h2>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">Industry Connect Event</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Connect with industry professionals and expand your network.
              </p>
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                Join Event
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center mb-6">
            <Briefcase size={24} className="text-orange-500 mr-3" />
            <h2 className="text-xl font-bold">Request Professional Services</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get expert help with your digital marketing projects and campaigns.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 cursor-pointer">
              <h3 className="font-semibold mb-2">SEO Optimization</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Professional SEO audit and optimization services
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 cursor-pointer">
              <h3 className="font-semibold mb-2">PPC Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Expert Google Ads and social media advertising
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 cursor-pointer">
              <h3 className="font-semibold mb-2">Content Strategy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Professional content marketing and strategy
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalDashboard;