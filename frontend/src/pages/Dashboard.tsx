// src/pages/dashboard/DashboardHome.tsx
import React from 'react';
import { User } from '../../lib/types';
import { BookOpen, Award, Calendar, TrendingUp, Target, Clock, ChevronRight, Star, Bookmark, Users, BarChart3 } from 'lucide-react';

interface DashboardHomeProps {
  user: User;
  stats: {
    coursesEnrolled: number;
    coursesCompleted: number;
    certificatesEarned: number;
    learningStreak: number;
    lastActivity: string;
  };
  enrolledCourses?: Array<any>;
  internshipApplications?: Array<any>;
  serviceRequests?: Array<any>;
  calendarEvents?: Array<any>;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ 
  user, 
  stats, 
  enrolledCourses = [], 
  internshipApplications = [], 
  calendarEvents = [] 
}) => {
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate progress percentage for a course
  const getProgressPercentage = (progress: number) => {
    return Math.round(progress * 100);
  };

  // Get upcoming events (next 3 days)
  const upcomingEvents = calendarEvents
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {user.firstName}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Continue your learning journey and achieve your goals. You're doing great!
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/20 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.learningStreak} day streak
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Keep learning to maintain your streak!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Enrolled</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.coursesEnrolled}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.coursesCompleted}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Certificates</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.certificatesEarned}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-900/20 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Streak</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.learningStreak} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Learning Progress</h2>
              <button className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="p-6">
              {enrolledCourses.length > 0 ? (
                <div className="space-y-4">
                  {enrolledCourses.slice(0, 3).map((course, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/20 h-12 w-12 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900 dark:text-white">{course.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{course.instructor}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                            {getProgressPercentage(course.progress)}%
                          </span>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${getProgressPercentage(course.progress)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No courses yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Enroll in your first course to start learning</p>
                  <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
                    Browse Courses
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Internship Applications */}
          {internshipApplications && internshipApplications.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Internship Applications</h2>
                <button className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {internshipApplications.slice(0, 2).map((application, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/20 h-12 w-12 rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900 dark:text-white">{application.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{application.company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          application.status === 'accepted' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                            : application.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Applied on {new Date(application.applicationDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Upcoming Events and Quick Actions */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h2>
            </div>
            <div className="p-6">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/20 h-10 w-10 rounded-full flex items-center justify-center mt-0.5">
                        <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900 dark:text-white">{event.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(event.date).toLocaleDateString()} • {event.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No upcoming events</p>
                </div>
              )}
              <button className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" />
                View Full Calendar
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-1" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Courses</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                <Award className="h-6 w-6 text-green-600 dark:text-green-400 mb-1" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Certificates</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-1" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Internships</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 rounded-lg transition-colors">
                <BarChart3 className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-1" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Progress</span>
              </button>
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Achievements</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <div className="bg-orange-100 dark:bg-orange-900/20 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="h-8 w-8 text-orange-500 dark:text-orange-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Learning Streak</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You've learned for {stats.learningStreak} consecutive days!
                  </p>
                </div>
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                <Award className="h-4 w-4 mr-2" />
                View All Achievements
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;