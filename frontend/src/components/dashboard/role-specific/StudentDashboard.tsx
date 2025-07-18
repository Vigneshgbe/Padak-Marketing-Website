// src/components/dashboard/role-specific/StudentDashboard.tsx
import React from 'react';
import { BookOpen, CheckCircle, BadgeCheck, Calendar, GraduationCap, ArrowRight } from 'lucide-react'; // Added ArrowRight
import StatCard from '../common/StatCard';
import { User, UserStats } from '../../../lib/types';
// No need for useNavigate here directly, as the parent will handle navigation via onViewChange

interface StudentDashboardProps {
  user: User;
  stats: UserStats;
  onViewChange: (viewId: string) => void; // Added prop to notify parent of view change
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, stats, onViewChange }) => {
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

      {/* Learning Progress (Example) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Your Learning Progress</h2>
        <div className="space-y-4">
          {/* Static example - in a real app, map through user's course progress */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">SEO Fundamentals</h3>
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
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Social Media Marketing</h3>
              <span className="text-sm text-orange-500">30%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '30%' }}></div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Instructor: Jane Doe</span>
              <span>6 weeks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Internship Opportunities (as a teaser/link) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center mb-4">
          <GraduationCap size={24} className="text-orange-500 mr-3" />
          <h2 className="text-xl font-bold">Internship Opportunities</h2>
        </div>
        <div className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Explore Digital Marketing Internships</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 md:mb-0">
              Find real-world experience with top companies and kickstart your career.
            </p>
          </div>
          <button
            onClick={() => onViewChange('internships')} // Call the prop to change view
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center md:self-start"
          >
            View Opportunities <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;