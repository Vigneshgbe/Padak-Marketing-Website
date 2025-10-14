// src/pages/dashboard/MyCourses.tsx
import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, User, Play } from 'lucide-react';
import { Enrollment } from '../../lib/types';
import { apiService } from '../../lib/api';

const MyCourses: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        // Auto-link guest enrollments first
        try {
          await apiService.post('/link-guest-enrollments', {});
        } catch (linkError) {
          console.log('No guest enrollments to link or already linked');
        }

        // Fetch enrollments
        const data = await apiService.get<Enrollment[]>('/enrollments/my-courses');
        setEnrollments(data);
      } catch (error) {
        console.error('Failed to fetch enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">My Courses</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Continue your learning journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments.map((enrollment) => (
          <div key={enrollment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {enrollment.course.thumbnail && (
              <img 
                src={enrollment.course.thumbnail} 
                alt={enrollment.course.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2">{enrollment.course.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {enrollment.course.description}
              </p>
              
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <User size={16} className="mr-1" />
                <span className="mr-4">{enrollment.course.instructorName}</span>
                <Clock size={16} className="mr-1" />
                <span>{enrollment.course.durationWeeks} weeks</span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{enrollment.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${enrollment.progress}%` }}
                  ></div>
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center">
                <Play size={16} className="mr-2" />
                Continue Learning
              </button>
            </div>
          </div>
        ))}
      </div>

      {enrollments.length === 0 && (
        <div className="text-center py-12">
          <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No courses enrolled yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start your learning journey by enrolling in a course
          </p>
          <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
            Browse Courses
          </button>
        </div>
      )}
    </div>
  );
};

export default MyCourses;