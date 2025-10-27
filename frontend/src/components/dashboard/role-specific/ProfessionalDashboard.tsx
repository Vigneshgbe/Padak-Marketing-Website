import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, CheckCircle, BadgeCheck, Calendar, Users, Briefcase, ChevronLeft,
  ChevronRight, TrendingUp, Target, MessageSquare, Clock, Calendar as CalendarIcon,
  Settings, Moon, Sun, LogOut, FolderOpen, Plus, XCircle, AlertCircle, Search, Filter, Star, ArrowRight, CreditCard, FileText, Building,
  Loader2, Mail, GraduationCap
} from 'lucide-react';
import StatCard from '../common/StatCard';
import { User, UserStats } from '../../../lib/types';
import { useAuth } from '../../../hooks/use-auth';

// Helper function for date formatting (reused from StudentDashboard)
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
    // If it's a non-date string (like '1-2 weeks'), just return it.
    return String(dateString);
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Interfaces for fetched data (combined from StudentDashboard and BusinessDashboard)
interface CourseEnrollment {
  id: number;
  course_id: number;
  courseTitle: string;
  instructorName: string;
  progress: number;
  status: 'active' | 'completed' | 'dropped';
  enrollment_date: string;
  completion_date?: string | null;
  durationWeeks?: number;
}

interface InternshipApplication {
  id: number; // submission ID
  internship_id: number;
  internshipTitle: string;
  companyName: string;
  applicationStatus: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  applicationDate: string;
}

// In ProfessionalDashboard.tsx, update the Service interface
interface Service {
  id: string; // Changed from number to string (Firestore IDs)
  name: string;
  category_id: string; // Changed from number to string
  categoryName: string;
  description: string;
  price: number;
  duration: string;
  rating: number;
  reviews: number;
  features: string[];
  popular: boolean;
}

// ADJUSTED: ServiceRequest interface to match 'service_requests' table
interface ServiceRequest {
  id: number;
  userId: number; // From user_id
  categoryId: number; // Renamed from serviceId, maps to subcategory_id
  categoryName: string; // Renamed from serviceName, fetched from service_categories.name
  // serviceType from original code is now essentially categoryName, or can be removed if redundant.
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  requestDate: string; // From created_at
  projectDetails: string; // From project_details
  budgetRange: string; // From budget_range (varchar)
  timeline: string; // From timeline (varchar)
  fullName: string; // From full_name
  email: string; // From email
  phone: string; // From phone
  company?: string; // From company (optional)
  website?: string; // From website (optional)
  contactMethod: string; // From contact_method
  additionalRequirements?: string; // From additional_requirements (optional)
  // assignedTo removed as it's not in your service_requests table
}

interface ProfessionalDashboardProps {
  user: User;
  stats: UserStats;
  onViewChange: (viewId: string) => void;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ user, stats, onViewChange }) => {
  const { token, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'learning' | 'services'>('learning');
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Learning Progress states (unchanged)
  const [enrolledCourses, setEnrolledCourses] = useState<CourseEnrollment[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // Applied Internships states (unchanged)
  const [appliedInternships, setAppliedInternships] = useState<InternshipApplication[]>([]);
  const [internshipsLoading, setInternshipsLoading] = useState(true);
  const [internshipsError, setInternshipsError] = useState<string | null>(null);

  // ADJUSTED: Service Discovery states
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string>('all'); // Filter by categoryName
  const [searchQuery, setSearchQuery] = useState('');

  // NEW: Pagination states for services
  const [currentPageServices, setCurrentPageServices] = useState(1);
  const itemsPerPageServices = 6; // Display 6 items per page as requested

  // ADJUSTED: My Service Requests states
  const [myServiceRequests, setMyServiceRequests] = useState<ServiceRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  // Service Request Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [requestSubmissionStatus, setRequestSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [requestSubmissionMessage, setRequestSubmissionMessage] = useState<string>('');

  // Dark Mode (optional, from BusinessDashboard)
  const [darkMode, setDarkMode] = useState(false);

  // Helper to get status color (unchanged)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-800';
      case 'in-progress': return 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-800';
      case 'completed': return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-800';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-800';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700';
    }
  };

  // --- Data Fetching Effects (unchanged for courses/internships, adjusted for services/requests) ---

  // Effect for Enrolled Courses (unchanged)
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!isAuthenticated || !user?.id || !token) {
        setCoursesLoading(false);
        return;
      }
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const response = await fetch(`http://localhost:5000/api/users/${user.id}/enrollments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
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

  // Effect for Applied Internships (unchanged)
  useEffect(() => {
    const fetchAppliedInternships = async () => {
      if (!isAuthenticated || !user?.id || !token) {
        setInternshipsLoading(false);
        return;
      }
      setInternshipsLoading(true);
      setInternshipsError(null);
      try {
        const response = await fetch(`http://localhost:5000/api/users/${user.id}/internship-submissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
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

  // ADJUSTED: Effect for Available Services (for 'services' tab)
  useEffect(() => {
    const fetchAvailableServices = async () => {
      if (!isAuthenticated || !token) {
        setServicesLoading(false);
        return;
      }
      setServicesLoading(true);
      setServicesError(null);
      try {
        // This endpoint will now fetch from 'services' table joined with 'service_categories'
        const response = await fetch(`http://localhost:5000/api/services`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data: Service[] = await response.json();
        setAvailableServices(data);
      } catch (err: any) {
        console.error("Failed to fetch available services:", err);
        setServicesError("Failed to load available services. Please try again later.");
      } finally {
        setServicesLoading(false);
      }
    };
    fetchAvailableServices();
  }, [token, isAuthenticated]);

  // ADJUSTED: Effect for My Service Requests
  useEffect(() => {
    const fetchMyServiceRequests = async () => {
      if (!isAuthenticated || !user?.id || !token) {
        setRequestsLoading(false);
        return;
      }
      setRequestsLoading(true);
      setRequestsError(null);
      try {
        const response = await fetch(`http://localhost:5000/api/users/${user.id}/service-requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data: ServiceRequest[] = await response.json();
        setMyServiceRequests(data);
      } catch (err: any) {
        console.error("Failed to fetch my service requests:", err);
        setRequestsError("Failed to load your service requests. Please try again later.");
      } finally {
        setRequestsLoading(false);
      }
    };
    fetchMyServiceRequests();
  }, [user?.id, token, isAuthenticated]);

  // Combined Loading Indicator for the entire dashboard (unchanged)
  useEffect(() => {
    if (!coursesLoading && !internshipsLoading && !servicesLoading && !requestsLoading) {
      setLoadingInitial(false);
    }
  }, [coursesLoading, internshipsLoading, servicesLoading, requestsLoading]);

  // --- NEW: Effect to control body scrolling ---
  useEffect(() => {
    if (showRequestModal) {
      document.body.style.overflow = 'hidden'; // Disable body scroll when modal is open
    } else {
      document.body.style.overflow = ''; // Re-enable body scroll when modal is closed
    }
    // Cleanup function: important to reset when component unmounts or showRequestModal changes
    return () => {
      document.body.style.overflow = '';
    };
  }, [showRequestModal]); // Re-run this effect whenever showRequestModal changes

  // --- Handlers ---

  const handleRequestServiceSubmit = async (requestData: {
    fullName: string;
    email: string;
    phone: string;
    company?: string;
    website?: string;
    projectDetails: string;
    budgetRange: string;
    timeline: string;
    contactMethod: string;
    additionalRequirements?: string;
  }) => {
    if (!selectedService || !user?.id || !token) {
      setRequestSubmissionStatus('error');
      setRequestSubmissionMessage('Authentication or service data missing. Please try again.');
      return;
    }

    setRequestSubmissionStatus('submitting');
    setRequestSubmissionMessage('');

    try {
      const submissionPayload = {
        userId: user.id,
        categoryId: selectedService.category_id, // Use category_id from the selected service
        fullName: requestData.fullName,
        email: requestData.email,
        phone: requestData.phone,
        company: requestData.company,
        website: requestData.website,
        projectDetails: requestData.projectDetails,
        budgetRange: requestData.budgetRange,
        timeline: requestData.timeline,
        contactMethod: requestData.contactMethod,
        additionalRequirements: requestData.additionalRequirements,
      };

      const response = await fetch(`http://localhost:5000/api/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }

      // Add the new request to local state for immediate UI update
      const newRequest: ServiceRequest = {
        id: result.id || Date.now(), // Backend should ideally return an ID
        userId: user.id,
        categoryId: selectedService.category_id,
        categoryName: selectedService.categoryName, // Use categoryName from selected service
        status: 'pending',
        requestDate: new Date().toISOString(), // Use current date for client-side display
        ...requestData // Include all the new fields from the form
      };
      setMyServiceRequests(prev => [...prev, newRequest]);

      setRequestSubmissionStatus('success');
      setRequestSubmissionMessage(result.message || 'Service request submitted successfully!');
    } catch (err: any) {
      console.error('Error creating service request:', err);
      setRequestSubmissionStatus('error');
      setRequestSubmissionMessage(err.message || 'An unexpected error occurred during submission.');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    console.log('Logout functionality not directly in ProfessionalDashboard. Use useAuth.logout() from parent.');
  };

  // ADJUSTED: Filtered services uses categoryName
  const filteredServices = availableServices.filter(service => {
    const matchesFilter = serviceFilter === 'all' || service.categoryName === serviceFilter;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // NEW: Pagination logic for services
  const indexOfLastService = currentPageServices * itemsPerPageServices;
  const indexOfFirstService = indexOfLastService - itemsPerPageServices;
  const paginatedServices = filteredServices.slice(indexOfFirstService, indexOfLastService);

  const totalPagesServices = Math.ceil(filteredServices.length / itemsPerPageServices);

  const handlePageChangeServices = (pageNumber: number) => {
    setCurrentPageServices(pageNumber);
    // Optional: Scroll to the top of the services section after page change
    // You might need to add an ID to your services grid div, e.g., id="services-grid"
    // document.getElementById('services-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  // NEW: Reset service page to 1 when filter or search query changes
  useEffect(() => {
    setCurrentPageServices(1);
  }, [serviceFilter, searchQuery]);


  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="ml-3 text-lg text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white ${darkMode ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">{user.firstName}</span>!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advance your career with learning and professional services.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'learning' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('learning')}
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

        {activeTab === 'learning' ? (
          <>
            {/* Stats Cards (unchanged) */}
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

            {/* Your Learning Progress (unchanged) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-6">Your Enrolled Courses</h2>
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
                  {/* <button
                    onClick={() => onViewChange('courses')}
                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center mx-auto"
                  >
                    Explore Courses <ArrowRight size={16} className="ml-2" />
                  </button> */}
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

            {/* Your Applied Internships (unchanged) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-6">Your Applied Internships</h2>
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
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(application.applicationStatus)}`}>
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
          </>
        ) : ( // activeTab === 'services'
          <>
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Digital Marketing Services
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose from our comprehensive range of digital marketing services to grow your business
              </p>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {/* ADJUSTED: Filter by categoryName */}
                  {Array.from(new Set(availableServices.map(s => s.categoryName))).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Available Services Grid (now paginated) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {servicesLoading ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
                  <p className="text-gray-500 dark:text-gray-400">Loading services...</p>
                </div>
              ) : servicesError ? (
                <div className="col-span-full text-center text-red-600 py-8">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3" />
                  <p>{servicesError}</p>
                </div>
              ) : paginatedServices.length === 0 && filteredServices.length > 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-orange-400" />
                  <p>No services found on this page matching your criteria. Try adjusting filters or navigating pages.</p>
                </div>
              ) : paginatedServices.length === 0 && filteredServices.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-orange-400" />
                  <p>No services available yet.</p>
                </div>
              ) : (
                paginatedServices.map((service) => (
                  <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                      {service.popular && (
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full dark:bg-orange-900 dark:text-orange-200">
                          Popular
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{service.description}</p>

                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">{service.rating}</span>
                      </div>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{service.reviews} reviews</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {/* Ensure service.features is an array before mapping */}
                      {Array.isArray(service.features) && service.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        {/* Assuming price is still a number in the assumed 'services' table */}
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{service.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{service.duration}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedService(service);
                          setShowRequestModal(true);
                          setRequestSubmissionStatus('idle'); // Reset modal status
                          setRequestSubmissionMessage('');
                        }}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                      >
                        Request Service
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* NEW: Pagination Controls for Services */}
            {filteredServices.length > itemsPerPageServices && (
              <div className="flex justify-center items-center space-x-2 mt-4 mb-8">
                <button
                  onClick={() => handlePageChangeServices(currentPageServices - 1)}
                  disabled={currentPageServices === 1}
                  className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPagesServices }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChangeServices(page)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPageServices === page
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChangeServices(currentPageServices + 1)}
                  disabled={currentPageServices === totalPagesServices}
                  className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* My Service Requests */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-6">My Service Requests</h2>
              {requestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
                  <p className="text-gray-500 dark:text-gray-400">Loading your requests...</p>
                </div>
              ) : requestsError ? (
                <div className="text-center text-red-600 py-8">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3" />
                  <p>{requestsError}</p>
                </div>
              ) : myServiceRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Mail className="w-10 h-10 mx-auto mb-3 text-orange-400" />
                  <p>You haven't submitted any service requests yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myServiceRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          {/* ADJUSTED: Use categoryName */}
                          <h3 className="font-semibold text-gray-900 dark:text-white">{request.categoryName}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>

                      {/* ADJUSTED: Display projectDetails */}
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">Project Details: {request.projectDetails}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {/* ADJUSTED: Display budgetRange */}
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Budget Range:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{request.budgetRange}</p>
                        </div>
                        {/* ADJUSTED: Display timeline */}
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Timeline:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{request.timeline}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Request Date:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{formatDateForDisplay(request.requestDate)}</p>
                        </div>
                         {/* ADJUSTED: New fields from service_requests table */}
                         <div>
                          <span className="text-gray-500 dark:text-gray-400">Contact Person:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{request.fullName}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Email:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{request.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{request.phone}</p>
                        </div>
                        {request.company && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Company:</span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{request.company}</p>
                          </div>
                        )}
                        {request.website && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Website:</span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{request.website}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Contact Method:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{request.contactMethod}</p>
                        </div>
                        {request.additionalRequirements && (
                          <div className="col-span-2 md:col-span-4">
                            <span className="text-gray-500 dark:text-gray-400">Additional Requirements:</span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{request.additionalRequirements}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Request Service Modal */}
{showRequestModal && selectedService && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div
      className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full flex flex-col"
      style={{ maxHeight: '90vh' }}
    >
      {/* Fixed Header */}
      <div className="px-6 pt-6 pb-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Request {selectedService.name}</h3>
        <button
          onClick={() => { setShowRequestModal(false); setSelectedService(null); }}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <XCircle size={24} />
        </button>
      </div>

      {requestSubmissionStatus === 'success' ? (
        <div className="flex-grow flex items-center justify-center text-center px-6 py-6">
          <div className="w-full">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-semibold text-lg text-green-600 mb-4">{requestSubmissionMessage}</p>
            <button
              onClick={() => { setShowRequestModal(false); setSelectedService(null); }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Done
            </button>
          </div>
        </div>
      ) : requestSubmissionStatus === 'error' ? (
        <div className="flex-grow flex items-center justify-center text-center px-6 py-6">
          <div className="w-full">
            <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
            <p className="font-semibold text-lg text-red-600 mb-4">{requestSubmissionMessage}</p>
            <button
              onClick={() => setRequestSubmissionStatus('idle')}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          handleRequestServiceSubmit({
            fullName: formData.get('fullName') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            company: formData.get('company') as string,
            website: formData.get('website') as string,
            projectDetails: formData.get('projectDetails') as string,
            budgetRange: formData.get('budgetRange') as string,
            timeline: formData.get('timeline') as string,
            contactMethod: formData.get('contactMethod') as string,
            additionalRequirements: formData.get('additionalRequirements') as string,
          });
        }} className="flex flex-col flex-grow overflow-hidden">

          {/* Scrollable Form Content */}
          <div className="overflow-y-auto flex-grow px-6 py-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  You are requesting: <span className="font-semibold text-gray-900 dark:text-white">{selectedService.categoryName} - {selectedService.name}</span>
                </p>
              </div>

              <h4 className="text-md font-semibold text-gray-900 dark:text-white mt-4">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Your Full Name</label>
                  <input type="text" id="fullName" name="fullName" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue={user ? `${user.firstName} ${user.lastName || ''}`.trim() : ''}
                    disabled={requestSubmissionStatus === 'submitting'} />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                  <input type="email" id="email" name="email" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue={user ? user.email : ''}
                    disabled={requestSubmissionStatus === 'submitting'} />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone Number</label>
                <input type="tel" id="phone" name="phone" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., +91 9876543210"
                  disabled={requestSubmissionStatus === 'submitting'} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Company (Optional)</label>
                  <input type="text" id="company" name="company"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Your company name"
                    disabled={requestSubmissionStatus === 'submitting'} />
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Website (Optional)</label>
                  <input type="url" id="website" name="website"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., https://yourwebsite.com"
                    disabled={requestSubmissionStatus === 'submitting'} />
                </div>
              </div>

              <h4 className="text-md font-semibold text-gray-900 dark:text-white mt-4">Project Details</h4>
              <div>
                <label htmlFor="projectDetails" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Project Description</label>
                <textarea
                  id="projectDetails"
                  name="projectDetails"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  placeholder="Describe your project requirements, goals, and current challenges..."
                  disabled={requestSubmissionStatus === 'submitting'}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budgetRange" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Budget Range</label>
                  <input
                    id="budgetRange"
                    type="text"
                    name="budgetRange"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., ₹10,000 - ₹20,000"
                    disabled={requestSubmissionStatus === 'submitting'}
                  />
                </div>
                <div>
                  <label htmlFor="timeline" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Desired Timeline</label>
                  <input
                    id="timeline"
                    type="text"
                    name="timeline"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., 1-2 weeks, 3 months"
                    disabled={requestSubmissionStatus === 'submitting'}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contactMethod" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Preferred Contact Method</label>
                <select id="contactMethod" name="contactMethod" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={requestSubmissionStatus === 'submitting'}>
                  <option value="">Select a method</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label htmlFor="additionalRequirements" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Additional Requirements (Optional)</label>
                <textarea
                  id="additionalRequirements"
                  name="additionalRequirements"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={2}
                  placeholder="Any other details you want to add?"
                  disabled={requestSubmissionStatus === 'submitting'}
                />
              </div>
            </div>
          </div>

          {/* Fixed Footer with Buttons */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedService(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                disabled={requestSubmissionStatus === 'submitting'}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center"
                disabled={requestSubmissionStatus === 'submitting'}
              >
                {requestSubmissionStatus === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...
                  </>
                ) : 'Submit Request'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  </div>
)}
    </div>
  );
};

export default ProfessionalDashboard;