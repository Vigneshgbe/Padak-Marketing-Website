import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, CheckCircle, BadgeCheck, Calendar, GraduationCap, ArrowRight, Briefcase, Mail, Clock, Loader2, AlertCircle, Building } from 'lucide-react';
import StatCard from '../common/StatCard';
import { User, UserStats } from '../../../lib/types';
import { useAuth } from '../../../hooks/use-auth';

// Helper function for date formatting (no change)
const formatDateForDisplay = (dateString?: string | Date) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    const parts = String(dateString).match(/(\d{4})-(\d{2})-(\d{2})T/);
    if (parts) {
      const parsedDate = new Date(`${parts[1]}-${parts[2]}-${parts[3]}`);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    const customParts = String(dateString).match(/(\d{2}) (\w{3}) (\d{4})/);
    if (customParts) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = monthNames.findIndex(m => m === customParts[2]);
      if (monthIndex !== -1) {
        const isoDateCandidate = `${customParts[3]}-${(monthIndex + 1).toString().padStart(2, '0')}-${customParts[1]}`;
        const reParsedDate = new Date(isoDateCandidate);
        if (!isNaN(reParsedDate.getTime())) {
          return reParsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
    }
    return String(dateString);
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};


// New interfaces for fetched data (no change)
interface CourseEnrollment {
  id: number;
  course_id: number;
  courseTitle: string; // Assuming backend provides this
  instructorName: string; // Assuming backend provides this
  progress: number; // decimal(5,2)
  status: 'active' | 'completed' | 'dropped';
  enrollment_date: string;
  completion_date?: string | null;
  durationWeeks?: number; 
}

interface InternshipApplication {
  id: number; // submission ID
  internship_id: number;
  internshipTitle: string; // Assuming backend provides this
  companyName: string; // Assuming backend provides this
  applicationStatus: 'pending' | 'accepted' | 'rejected' | 'withdrawn'; // Assuming this status
  applicationDate: string; // timestamp from submission
}


interface StudentDashboardProps {
  user: User;
  stats: UserStats;
  onViewChange: (viewId: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, stats, onViewChange }) => {
  const { token, isAuthenticated } = useAuth();

  const [enrolledCourses, setEnrolledCourses] = useState<CourseEnrollment[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [appliedInternships, setAppliedInternships] = useState<InternshipApplication[]>([]);
  const [internshipsLoading, setInternshipsLoading] = useState(true);
  const [internshipsError, setInternshipsError] = useState<string | null>(null);

  // Fetch Enrolled Courses
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!isAuthenticated || !user?.id || !token) {
        setCoursesLoading(false);
        setCoursesError("Authentication required to fetch courses.");
        return;
      }

      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const response = await fetch(`https://localhost:5000/api/users/${user.id}/enrollments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: CourseEnrollment[] = await response.json();
        setEnrolledCourses(data);
      } catch (err: any) {
        console.error("Failed to fetch enrolled courses:", err);
        setCoursesError("Failed to load your enrolled courses. Please try again later.");
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [user?.id, token, isAuthenticated]);

  // Fetch Applied Internships
  useEffect(() => {
    const fetchAppliedInternships = async () => {
      if (!isAuthenticated || !user?.id || !token) {
        setInternshipsLoading(false);
        setInternshipsError("Authentication required to fetch internships.");
        return;
      }

      setInternshipsLoading(true);
      setInternshipsError(null);
      try {
        const response = await fetch(`https://localhost:5000/api/users/${user.id}/internship-submissions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: InternshipApplication[] = await response.json();
        setAppliedInternships(data);
      } catch (err: any) {
        console.error("Failed to fetch applied internships:", err);
        setInternshipsError("Failed to load your applied internships. Please try again later.");
      } finally {
        setInternshipsLoading(false);
      }
    };

    fetchAppliedInternships();
  }, [user?.id, token, isAuthenticated]);


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

      {/* Your Applied Internships */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <Briefcase size={24} className="text-orange-500 mr-3" />
          <h2 className="text-xl font-bold">Your Applied Internships</h2>
        </div>
        {internshipsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
            <p className="text-gray-500 dark:text-gray-400">Loading applied internships...</p>
          </div>
        ) : internshipsError ? (
          <div className="text-center text-red-600 py-8">
            <AlertCircle className="w-10 h-10 mx-auto mb-3" />
            <p>{internshipsError}</p>
          </div>
        ) : appliedInternships.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Mail className="w-10 h-10 mx-auto mb-3 text-orange-400" />
            <p>You haven't applied for any internships yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appliedInternships.map((application) => (
              <div key={application.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{application.internshipTitle}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                    <Building size={14} /> {application.companyName}
                  </p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    application.applicationStatus === 'accepted' ? 'bg-green-100 text-green-700' :
                    application.applicationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {application.applicationStatus.charAt(0).toUpperCase() + application.applicationStatus.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock size={14} /> Applied on {formatDateForDisplay(application.applicationDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your Learning Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Your Learning Progress</h2>
        {coursesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
            <p className="text-gray-500 dark:text-gray-400">Loading courses...</p>
          </div>
        ) : coursesError ? (
          <div className="text-center text-red-600 py-8">
            <AlertCircle className="w-10 h-10 mx-auto mb-3" />
            <p>{coursesError}</p>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-orange-400" />
            <p>You haven't enrolled in any courses yet.</p>
            <button
              onClick={() => onViewChange('courses')}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center mx-auto"
            >
              Explore Courses <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {enrolledCourses.map((enrollment) => (
              <div key={enrollment.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{enrollment.courseTitle}</h3>
                  <span className={`text-sm ${enrollment.status === 'completed' ? 'text-green-500' : 'text-orange-500'}`}>
                    {enrollment.status === 'completed' ? 'Completed' : `${Math.floor(enrollment.progress)}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${enrollment.progress}%` }}></div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Instructor: {enrollment.instructorName || 'N/A'}</span>
                  <span>{enrollment.durationWeeks ? `${enrollment.durationWeeks} weeks` : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;