// src/components/dashboard/role-specific/StudentDashboard.tsx
import React from 'react';
import { BookOpen, CheckCircle, BadgeCheck, Calendar, GraduationCap } from 'lucide-react';
import StatCard from '../common/StatCard';
import { User, UserStats } from '../../../lib/types';

interface StudentDashboardProps {
  user: User;
  stats: UserStats;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, stats }) => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">{user.firstName}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Continue your learning journey and achieve your goals.
        </p>
      </div>

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

      {/* Learning Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Your Learning Progress</h2>
        <div className="space-y-4">
          {/* Course progress items would be mapped here */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">SEO Fundamentals</h3>
              <span className="text-sm text-orange-500">75%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Instructor: John Smith</span>
              <span>4 weeks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Internship Opportunities */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center mb-4">
          <GraduationCap size={24} className="text-orange-500 mr-3" />
          <h2 className="text-xl font-bold">Internship Opportunities</h2>
        </div>
        <div className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold mb-2">Digital Marketing Intern</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Join top digital marketing agencies and gain real-world experience.
          </p>
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            View Opportunities
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;