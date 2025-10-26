// src/pages/dashboard/MyCourses.tsx
import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, User, Play, RefreshCw } from 'lucide-react';
import { Enrollment } from '../../lib/types';

const API_BASE = 'https://padak-backend.onrender.com';

const MyCourses: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user info from token
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        setError('Please log in to view your courses');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching enrollments with token:', token ? 'Present' : 'Missing');

      // Try to auto-link guest enrollments first
      try {
        console.log('🔗 Attempting to link guest enrollments...');
        const linkResponse = await fetch(`${API_BASE}/link-guest-enrollments`, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include'
        });

        if (linkResponse.ok) {
          const linkData = await linkResponse.json();
          console.log('✅ Guest enrollments linked:', linkData);
        } else {
          console.log('⚠️ No guest enrollments to link or already linked');
        }
      } catch (linkError) {
        console.log('⚠️ Link guest enrollments failed (might be already linked):', linkError);
      }

      // Fetch user's enrollments
      console.log('📚 Fetching enrollments from:', 'https://padak-backend.onrender.com/enrollments/my-courses');
      const response = await fetch(`${API_BASE}/enrollments/my-courses`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please log in again.');
        }
        throw new Error(`Failed to fetch enrollments: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Enrollments fetched:', data);
      setEnrollments(data);

    } catch (error) {
      console.error('❌ Failed to fetch enrollments:', error);
      setError(error instanceof Error ? error.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchEnrollments}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center mx-auto"
          >
            <RefreshCw size={16} className="mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Courses</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Continue your learning journey
          </p>
        </div>
        <button
          onClick={fetchEnrollments}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
          title="Refresh courses"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </button>
      </div>

      {enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {enrollment.course.thumbnail && (
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-6xl bg-gradient-to-br from-orange-50 to-orange-100">
                    {enrollment.course.thumbnail}
                  </div>
                </div>
              )}
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">{enrollment.course.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {enrollment.course.description}
                </p>
                
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <User size={16} className="mr-1" />
                  <span className="mr-4 truncate">{enrollment.course.instructorName}</span>
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
      ) : (
        <div className="text-center py-12">
          <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No courses enrolled yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start your learning journey by enrolling in a course
          </p>
          <button 
            onClick={() => window.location.href = '/courses'}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Browse Courses
          </button>
        </div>
      )}
    </div>
  );
};

export default MyCourses;