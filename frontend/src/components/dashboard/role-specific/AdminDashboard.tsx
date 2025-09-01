import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, BookOpen, UserCheck, BarChart, PlusCircle, MessageSquare,
  GraduationCap, ChevronRight, AlertCircle, Settings, FileText,
  Calendar, Award, Briefcase, Mail, Edit, Trash2, Eye, X, Search,
  Filter, ArrowUpDown, Check, ChevronLeft, Save, Plus, Download, Phone,
  HardHat,  // For assignments
  Code,     // For service categories (example icon)
  Layers    // For service sub-categories (example icon)
} from 'lucide-react';
import StatCard from '../common/StatCard'; // Corrected path to go up one level, then into common

import toast from 'react-hot-toast'; // For better notifications
import { Line, Bar } from 'react-chartjs-2'; // For Analytics page
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import {
  DashboardStats,
  RecentUser,
  DetailedUser,
  RecentEnrollment,
  DetailedEnrollment,
  RecentServiceRequest,
  DetailedServiceRequest,
  Course,
  Assignment,
  Certificate,
  ContactMessage,
  CalendarEvent,
  ServiceCategory,
  ServiceSubCategory,
  ServiceOffering, // New type for 'service' table
  UserLookup,
  CourseLookup,
  ServiceCategoryLookup,
  ServiceSubCategoryLookup,
  Internship
} from '../../../lib/types';

// CORRECTED: Access environment variables using import.meta.env for Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// --- Reusable UI Components ---

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, size = 'md', isLoading = false }) => {
  if (!isOpen) return null;
  const sizeClasses = {
    sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl'
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex-grow relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-70 dark:bg-opacity-70 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
  }[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
}

function DataTable<T extends { id: number }>({
  data, columns, onRowClick, actions, currentPage, totalPages,
  onPageChange, pageSize, onPageSizeChange, isLoading
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column, i) => (
                <th key={i} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {column.header}
                </th>
              ))}
              {actions && (<th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th>)}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading data...</span>
                </div>
              </td></tr>
            ) : data.length > 0 ? (
              data.map((item) => (
                <tr key={item.id} className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}>
                  {columns.map((column, i) => {
                    const cellContent = typeof column.accessor === 'function' ? column.accessor(item) : item[column.accessor as keyof T];
                    return (<td key={i} className={`px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 ${column.className || ''}`}>
                      {cellContent as React.ReactNode}
                    </td>);
                  })}
                  {actions && (<td className="px-4 py-3 text-right whitespace-nowrap"><div onClick={(e) => e.stopPropagation()}>{actions(item)}</div></td>)}
                </tr>
              ))
            ) : (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && (
        <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Rows per page:</span>
            <select value={pageSize} onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm">
              {[5, 10, 20, 50].map(size => (<option key={size} value={size}>{size}</option>))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  let baseClass = "inline-block px-2 py-1 text-xs rounded-full ";
  switch (status.toLowerCase()) {
    case 'active': case 'verified': case 'completed': case 'resolved': case 'accepted':
      baseClass += "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"; break;
    case 'in-process': case 'in-progress': case 'contacted': case 'reviewed': case 'graded': case 'returned':
      baseClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"; break;
    case 'pending': case 'submitted':
      baseClass += "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"; break;
    case 'cancelled': case 'inactive': case 'rejected': case 'closed':
      baseClass += "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"; break;
    default: baseClass += "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
  return (<span className={`${baseClass} ${className || ''}`}>{status}</span>);
};


// --- AnalyticsPage Component ---
interface AnalyticsPageProps {
  headers: HeadersInit;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ headers }) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/analytics`, { headers, credentials: 'include' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `Failed to fetch analytics: ${response.status}`);
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Failed to load analytics data.');
        toast.error(err.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [headers]);

  if (loading) return (<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>);
  if (error) return (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><strong className="font-bold">Error!</strong><span className="block sm:inline"> {error}</span></div>);
  if (!analyticsData) return <p className="text-center text-gray-500 dark:text-gray-400">No analytics data available.</p>;

  // Prepare chart data
  const userGrowthChartData = {
    labels: analyticsData.userGrowth.map((d: any) => d.month),
    datasets: [{
      label: 'New Users',
      data: analyticsData.userGrowth.map((d: any) => d.count),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.1,
    }],
  };

  const courseEnrollmentsChartData = {
    labels: analyticsData.courseEnrollments.map((d: any) => d.title),
    datasets: [{
      label: 'Enrollments',
      data: analyticsData.courseEnrollments.map((d: any) => d.enrollments),
      backgroundColor: 'rgba(255, 159, 64, 0.6)',
    }],
  };

  const revenueDataChartData = {
    labels: analyticsData.revenueData.map((d: any) => d.month),
    datasets: [{
      label: 'Revenue (INR)',
      data: analyticsData.revenueData.map((d: any) => d.revenue),
      backgroundColor: 'rgba(153, 102, 255, 0.6)',
    }],
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Analytics Overview</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">User Growth (Last 6 Months)</h3>
          <Line data={userGrowthChartData} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Top 10 Courses by Enrollment</h3>
          <Bar data={courseEnrollmentsChartData} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Revenue by Month (Last 6 Months)</h3>
        <Bar data={revenueDataChartData} />
      </div>
    </div>
  );
};


// --- Main AdminDashboard Component ---
interface AdminDashboardProps {
  initialSection?: string;
  onViewChange?: (view: string) => void; // Prop for Sidebar to signal section change
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialSection, onViewChange }) => {
  const [adminStats, setAdminStats] = useState<DashboardStats>({
    totalUsers: 0, totalCourses: 0, totalEnrollments: 0,
    totalRevenue: "₹0", pendingContacts: 0, pendingServiceRequests: 0
  });

  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [recentServiceRequests, setRecentServiceRequests] = useState<RecentServiceRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [activeSection, setActiveSection] = useState<string>(initialSection || 'overview');

  const [allUsers, setAllUsers] = useState<DetailedUser[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<DetailedEnrollment[]>([]);
  const [allCertificates, setAllCertificates] = useState<Certificate[]>([]);
  const [allContactMessages, setAllContactMessages] = useState<ContactMessage[]>([]);
  const [allCalendarEvents, setAllCalendarEvents] = useState<CalendarEvent[]>([]);
  const [allServiceCategories, setAllServiceCategories] = useState<ServiceCategory[]>([]);
  const [allServiceSubCategories, setAllServiceSubCategories] = useState<ServiceSubCategory[]>([]);
  const [allServiceOfferings, setAllServiceOfferings] = useState<ServiceOffering[]>([]); // New state for 'service' table
  const [allServiceRequests, setAllServiceRequests] = useState<DetailedServiceRequest[]>([]);
  const [allInternships, setAllInternships] = useState<Internship[]>([]);

  const [userLookup, setUserLookup] = useState<UserLookup[]>([]);
  const [courseLookup, setCourseLookup] = useState<CourseLookup[]>([]);
  const [serviceCategoryLookup, setServiceCategoryLookup] = useState<ServiceCategoryLookup[]>([]);
  const [serviceSubCategoryLookup, setServiceSubCategoryLookup] = useState<ServiceSubCategoryLookup[]>([]);

  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'analytics'>('list');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [modalTitle, setModalTitle] = useState('');
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [formData, setFormData] = useState<any>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Sync initialSection prop with activeSection state
  useEffect(() => {
    if (initialSection) {
      if (initialSection === 'admin-dashboard') { // The main 'Admin Dashboard' overview
        setActiveTab('overview');
        setActiveSection('overview');
        setViewMode('list');
      } else if (initialSection === 'analytics') {
        setActiveTab('overview');
        setActiveSection('analytics');
        setViewMode('analytics');
      }
      else { // All other management sections
        setActiveTab('management');
        setActiveSection(initialSection);
        setViewMode('list');
      }
      setCurrentPage(1);
      setSearchTerm('');
      setSelectedFilter('all');
    }
  }, [initialSection]);


  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) return user.token;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    return token;
  }, []);

  const getHeaders = useCallback(() => {
    const token = getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) { headers['Authorization'] = `Bearer ${token}`; }
    return headers;
  }, [getAuthToken]);


  // --- Data Fetching Functions ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const headers = getHeaders();
      const fetchPromises = [
        fetch(`${API_BASE_URL}/api/admin/dashboard-stats`, { headers, credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/admin/recent-users`, { headers, credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/admin/recent-enrollments`, { headers, credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/admin/recent-service-requests`, { headers, credentials: 'include' })
      ];
      const [statsRes, usersRes, enrollmentsRes, requestsRes] = await Promise.all(fetchPromises);

      for (const { name, res } of [{ name: 'stats', res: statsRes }, { name: 'users', res: usersRes }, { name: 'enrollments', res: enrollmentsRes }, { name: 'requests', res: requestsRes }]) {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: res.statusText }));
          if (res.status === 401 || res.status === 403) throw new Error(`Authentication failed for ${name}: ${errorData.message || 'Please login again.'}`);
          throw new Error(`Failed to fetch ${name}: ${errorData.message || res.status}`);
        }
      }

      const [statsData, usersData, enrollmentsData, requestsData] = await Promise.all([
        statsRes.json(), usersRes.json(), enrollmentsRes.json(), requestsRes.json()
      ]);

      const formattedRevenue = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(statsData.totalRevenue || 0);

      setAdminStats({
        totalUsers: statsData.totalUsers || 0, totalCourses: statsData.totalCourses || 0,
        totalEnrollments: statsData.totalEnrollments || 0, totalRevenue: formattedRevenue,
        pendingContacts: statsData.pendingContacts || 0, pendingServiceRequests: statsData.pendingServiceRequests || 0
      });
      setRecentUsers(usersData || []); setRecentEnrollments(enrollmentsData || []); setRecentServiceRequests(requestsData || []);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err); setError(err.message || 'Failed to load dashboard data.');
      toast.error(err.message || 'Failed to load dashboard data.');
    } finally { setLoading(false); }
  }, [getHeaders]);


  const fetchSectionData = useCallback(async (section: string, page: number, size: number, search: string, filter: string) => {
    setLoading(true); setError(null);
    try {
      const headers = getHeaders(); let endpoint = ''; let dataKey = '';

      const queryParams = new URLSearchParams({
        limit: String(size), offset: String((page - 1) * size), search
      });
      // Add specific filters as needed
      if (filter !== 'all') {
        if (['users', 'enrollments', 'service-requests'].includes(section)) queryParams.append('status', filter);
        else if (section === 'courses') queryParams.append('level', filter);
        else if (section === 'assignments') queryParams.append('course_id', filter);
        else if (section === 'service-sub-categories') queryParams.append('category_id', filter);
        else if (section === 'service-offerings') queryParams.append('category_id', filter); // For 'service' table
        else if (section === 'calendar') queryParams.append('event_type', filter);
      }

      switch (section) {
        case 'users': endpoint = `/api/admin/users?${queryParams.toString()}`; dataKey = 'users'; break;
        case 'courses': endpoint = `/api/admin/courses?${queryParams.toString()}`; dataKey = 'courses'; break;
        case 'assignments': endpoint = `/api/admin/assignments?${queryParams.toString()}`; dataKey = 'assignments'; break;
        case 'enrollments': endpoint = `/api/admin/enrollments?${queryParams.toString()}`; dataKey = 'enrollments'; break;
        case 'certificates': endpoint = `/api/admin/certificates?${queryParams.toString()}`; dataKey = 'certificates'; break;
        case 'service-categories': endpoint = `/api/admin/service-categories?${queryParams.toString()}`; dataKey = 'categories'; break;
        case 'service-sub-categories': endpoint = `/api/admin/service-sub-categories?${queryParams.toString()}`; dataKey = 'subcategories'; break;
        case 'service-offerings': endpoint = `/api/admin/services?${queryParams.toString()}`; dataKey = 'services'; break; // For 'service' table
        case 'service-requests': endpoint = `/api/admin/service-requests?${queryParams.toString()}`; dataKey = 'requests'; break;
        case 'contacts': endpoint = `/api/admin/contact-messages?${queryParams.toString()}`; dataKey = 'messages'; break;
        case 'calendar': endpoint = `/api/admin/calendar-events?${queryParams.toString()}`; dataKey = 'events'; break;
        case 'internships': endpoint = `/api/admin/internships?${queryParams.toString()}`; dataKey = 'internships'; break;
        default: throw new Error(`Unknown section: ${section}`);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'GET', headers, credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        if (response.status === 401 || response.status === 403) throw new Error(`Authentication failed for ${section}: ${errorData.message || 'Please login again.'}`);
        throw new Error(`Failed to fetch ${section}: ${errorData.message || response.status}`);
      }
      const data = await response.json(); setTotalItems(data.total || 0);

      switch (section) {
        case 'users': setAllUsers(data[dataKey]); break;
        case 'courses': setAllCourses(data[dataKey]); break;
        case 'assignments': setAllAssignments(data[dataKey]); break;
        case 'enrollments': setAllEnrollments(data[dataKey]); break;
        case 'certificates': setAllCertificates(data[dataKey]); break;
        case 'service-categories': setAllServiceCategories(data[dataKey]); break;
        case 'service-sub-categories': setAllServiceSubCategories(data[dataKey]); break;
        case 'service-offerings': setAllServiceOfferings(data[dataKey]); break;
        case 'service-requests': setAllServiceRequests(data[dataKey]); break;
        case 'contacts': setAllContactMessages(data[dataKey]); break;
        case 'calendar': setAllCalendarEvents(data[dataKey]); break;
        case 'internships': setAllInternships(data[dataKey]); break;
      }
    } catch (err: any) {
      console.error(`Error fetching ${section} data:`, err);
      setError(err.message || `Failed to load ${section} data.`);
      toast.error(err.message || `Failed to load ${section} data.`);
    } finally { setLoading(false); }
  }, [getHeaders]);

  const fetchLookupData = useCallback(async (type: 'users' | 'courses' | 'service-categories' | 'service-sub-categories') => {
    try {
      const headers = getHeaders(); let endpoint = ''; let setDataFunc;
      switch (type) {
        case 'users': endpoint = '/api/admin/users/lookup'; setDataFunc = setUserLookup; break;
        case 'courses': endpoint = '/api/admin/courses/lookup'; setDataFunc = setCourseLookup; break;
        case 'service-categories': endpoint = '/api/admin/service-categories/lookup'; setDataFunc = setServiceCategoryLookup; break;
        case 'service-sub-categories': endpoint = '/api/admin/service-sub-categories/lookup'; setDataFunc = setServiceSubCategoryLookup; break;
        default: return;
      }
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers, credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Failed to fetch ${type} lookup: ${errorData.message || response.status}`);
      }
      const data = await response.json(); setDataFunc(data);
    } catch (err: any) {
      console.error(`Error fetching ${type} lookup data:`, err);
      toast.error(err.message || `Failed to load ${type} options.`);
    }
  }, [getHeaders]);

  // Effects to trigger data fetches
  useEffect(() => {
    if (activeSection === 'overview') { fetchDashboardData(); }
  }, [activeSection, fetchDashboardData]);

  useEffect(() => {
    if (activeTab === 'management' && activeSection && activeSection !== 'analytics') {
      fetchSectionData(activeSection, currentPage, pageSize, searchTerm, selectedFilter);
    }
  }, [activeSection, currentPage, pageSize, searchTerm, selectedFilter, activeTab, fetchSectionData]);

  useEffect(() => {
    if (isModalOpen && (modalType === 'create' || modalType === 'edit')) {
      if (['assignments', 'enrollments', 'certificates', 'calendar', 'service-requests'].includes(activeSection)) {
        fetchLookupData('users');
        fetchLookupData('courses');
        fetchLookupData('service-sub-categories'); // For service requests
      }
      if (['service-sub-categories', 'service-offerings'].includes(activeSection)) {
        fetchLookupData('service-categories');
      }
    }
  }, [isModalOpen, modalType, activeSection, fetchLookupData]);


  // --- CRUD Operations ---
  const handleFormSubmit = async (type: 'create' | 'edit') => {
    setIsModalLoading(true); setError(null);
    try {
      const headers = getHeaders(); let endpoint = ''; let method = ''; let payload = { ...formData };

      // Specific adjustments for form data to match API
      if (activeSection === 'users') {
        if (type === 'edit' && !payload.password) delete payload.password;
        payload.is_active = payload.is_active ? 1 : 0;
        payload.email_verified = payload.email_verified ? 1 : 0;
      }
      if (activeSection === 'courses') {
        payload.is_active = payload.is_active ? 1 : 0;
        payload.price = parseFloat(payload.price);
        payload.duration = parseInt(payload.duration); // Use 'duration' (INT)
        // No instructor_name in the original schema, so we don't send it
      }
      if (activeSection === 'assignments') {
        payload.course_id = parseInt(payload.course_id);
        payload.max_points = parseInt(payload.max_points);
      }
      if (activeSection === 'enrollments') {
        payload.user_id = parseInt(payload.user_id);
        payload.course_id = parseInt(payload.course_id);
        payload.progress = parseFloat(payload.progress);
        if (payload.status !== 'completed') payload.completion_date = null;
      }
      if (activeSection === 'certificates') {
        payload.user_id = parseInt(payload.user_id);
        payload.course_id = parseInt(payload.course_id);
      }
      // Contact messages has no status in DB, frontend just 'marks' it resolved
      if (activeSection === 'contacts') { delete payload.status; }

      if (activeSection === 'calendar') { 
        // IMPORTANT: In a real app, `req.user.id` from backend auth is the current admin's ID.
        // For local dev, if not logged in, this might be undefined. Assign a default or ensure auth.
        payload.user_id = 1; // Assuming admin is user_id 1 for mock/dev purposes
      }

      if (activeSection === 'service-categories') { payload.is_active = payload.is_active ? 1 : 0; }
      if (activeSection === 'service-sub-categories') {
        payload.category_id = parseInt(payload.category_id);
        payload.base_price = parseFloat(payload.base_price);
        payload.is_active = payload.is_active ? 1 : 0;
      }
      if (activeSection === 'service-offerings') {
        payload.category_id = parseInt(payload.category_id); // 'service' table connects to category_id directly
        payload.price = parseFloat(payload.price);
        payload.popular = payload.popular ? 1 : 0;
        // No 'is_active' in the 'service' table
      }
      if (activeSection === 'service-requests') {
        payload.user_id = parseInt(payload.user_id); // User_id is NOT NULL in schema
        payload.subcategory_id = parseInt(payload.subcategory_id);
        delete payload.service; // Not stored directly
      }
      if (activeSection === 'internships') {
        payload.applications_count = parseInt(payload.applications_count);
        payload.spots_available = parseInt(payload.spots_available);
        // No is_active in original internship schema.
      }


      switch (activeSection) {
        case 'users': endpoint = `/api/admin/users`; break;
        case 'courses': endpoint = `/api/admin/courses`; break;
        case 'assignments': endpoint = `/api/admin/assignments`; break;
        case 'enrollments': endpoint = `/api/admin/enrollments`; break;
        case 'certificates': endpoint = `/api/admin/certificates`; break;
        case 'contacts': endpoint = `/api/admin/contact-messages`; break;
        case 'calendar': endpoint = `/api/admin/calendar-events`; break;
        case 'service-categories': endpoint = `/api/admin/service-categories`; break;
        case 'service-sub-categories': endpoint = `/api/admin/service-sub-categories`; break;
        case 'service-offerings': endpoint = `/api/admin/services`; break; // For 'service' table
        case 'service-requests': endpoint = `/api/admin/service-requests`; break;
        case 'internships': endpoint = `/api/admin/internships`; break;
        default: throw new Error('Invalid section for CRUD operation');
      }

      if (type === 'create') { method = 'POST'; } else { method = 'PUT'; endpoint += `/${selectedItemId}`; }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method, headers, body: JSON.stringify(payload), credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to ${type} item`);
      }

      toast.success(`${activeSection?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(' Offerings', '').replace(' Requests', '').replace('Categories', 'Category').replace('Sub Categories', 'Sub-Category')} ${type === 'create' ? 'created' : 'updated'} successfully!`);
      fetchSectionData(activeSection, currentPage, pageSize, searchTerm, selectedFilter);
      setIsModalOpen(false);

    } catch (err: any) {
      console.error(`Error ${type}ing ${activeSection}:`, err);
      toast.error(err.message || `Failed to ${type} item.`);
    } finally { setIsModalLoading(false); }
  };

  const handleDeleteItem = async () => {
    setIsModalLoading(true); setError(null);
    try {
      const headers = getHeaders(); let endpoint = '';

      switch (activeSection) {
        case 'users': endpoint = `/api/admin/users`; break;
        case 'courses': endpoint = `/api/admin/courses`; break;
        case 'assignments': endpoint = `/api/admin/assignments`; break;
        case 'enrollments': endpoint = `/api/admin/enrollments`; break;
        case 'certificates': endpoint = `/api/admin/certificates`; break;
        case 'contacts': endpoint = `/api/admin/contact-messages`; break;
        case 'calendar': endpoint = `/api/admin/calendar-events`; break;
        case 'service-categories': endpoint = `/api/admin/service-categories`; break;
        case 'service-sub-categories': endpoint = `/api/admin/service-sub-categories`; break;
        case 'service-offerings': endpoint = `/api/admin/services`; break; // For 'service' table
        case 'service-requests': endpoint = `/api/admin/service-requests`; break;
        case 'internships': endpoint = `/api/admin/internships`; break;
        default: throw new Error('Invalid section for delete operation');
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}/${selectedItemId}`, { method: 'DELETE', headers, credentials: 'include' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Failed to delete item');
      }

      toast.success(`${activeSection?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(' Offerings', '').replace(' Requests', '').replace('Categories', 'Category').replace('Sub Categories', 'Sub-Category')} deleted successfully!`);
      fetchSectionData(activeSection, currentPage, pageSize, searchTerm, selectedFilter);
      setIsModalOpen(false);

    } catch (err: any) {
      console.error(`Error deleting ${activeSection}:`, err);
      toast.error(err.message || `Failed to delete item.`);
    } finally { setIsModalLoading(false); }
  };


  // --- Navigation & View Handlers ---
  const handleManagementClick = useCallback((sectionId: string) => {
    setActiveTab('management');
    setActiveSection(sectionId);
    setViewMode('list');
    setSelectedItemId(null);
    setCurrentPage(1); setSearchTerm(''); setSelectedFilter('all');
    if (onViewChange) onViewChange(sectionId); // Notify parent Dashboard component
  }, [onViewChange]);

  const handleOverviewClick = useCallback(() => {
    setActiveTab('overview');
    setActiveSection('overview');
    setViewMode('list');
    setSelectedItemId(null);
    if (onViewChange) onViewChange('admin-dashboard');
  }, [onViewChange]);

  const handleAnalyticsClick = useCallback(() => {
    setActiveTab('overview');
    setActiveSection('analytics');
    setViewMode('analytics');
    setSelectedItemId(null);
    if (onViewChange) onViewChange('analytics');
  }, [onViewChange]);

  const handleItemClick = useCallback((itemId: number) => { setSelectedItemId(itemId); setViewMode('detail'); }, []);
  const handleBackToList = useCallback(() => { setViewMode('list'); setSelectedItemId(null); setFormData({}); }, []);

  const handleOpenModal = useCallback((type: 'create' | 'edit' | 'delete', itemId?: number) => {
    setModalType(type); setSelectedItemId(itemId || null);

    let initialFormData: any = {};
    if (itemId) {
      const currentItem = (
        (activeSection === 'users' && allUsers.find(u => u.id === itemId)) ||
        (activeSection === 'courses' && allCourses.find(c => c.id === itemId)) ||
        (activeSection === 'assignments' && allAssignments.find(a => a.id === itemId)) ||
        (activeSection === 'enrollments' && allEnrollments.find(e => e.id === itemId)) ||
        (activeSection === 'certificates' && allCertificates.find(c => c.id === itemId)) ||
        (activeSection === 'contacts' && allContactMessages.find(m => m.id === itemId)) ||
        (activeSection === 'calendar' && allCalendarEvents.find(e => e.id === itemId)) ||
        (activeSection === 'service-categories' && allServiceCategories.find(c => c.id === itemId)) ||
        (activeSection === 'service-sub-categories' && allServiceSubCategories.find(s => s.id === itemId)) ||
        (activeSection === 'service-offerings' && allServiceOfferings.find(s => s.id === itemId)) ||
        (activeSection === 'service-requests' && allServiceRequests.find(r => r.id === itemId)) ||
        (activeSection === 'internships' && allInternships.find(i => i.id === itemId))
      );
      if (currentItem) {
        initialFormData = { ...currentItem };
        if (initialFormData.due_date) initialFormData.due_date = initialFormData.due_date.split(' ')[0];
        if (initialFormData.issued_date) initialFormData.issued_date = initialFormData.issued_date.split(' ')[0];
        if (initialFormData.event_date) initialFormData.event_date = initialFormData.event_date.split(' ')[0];
        if (initialFormData.completion_date) initialFormData.completion_date = initialFormData.completion_date.split(' ')[0];
        if (initialFormData.posted_at) initialFormData.posted_at = initialFormData.posted_at.split(' ')[0]; // For internships

        // Convert tinyint(1) to boolean-like for select inputs
        if (typeof initialFormData.is_active === 'boolean') initialFormData.is_active = initialFormData.is_active ? "1" : "0";
        if (typeof initialFormData.email_verified === 'boolean') initialFormData.email_verified = initialFormData.email_verified ? "1" : "0";
        if (typeof initialFormData.popular === 'boolean') initialFormData.popular = initialFormData.popular ? "1" : "0";
        if (initialFormData.status) initialFormData.status = initialFormData.status.toLowerCase();
      }
    } else {
      // Default values for new items
      if (activeSection === 'users') initialFormData = { is_active: "1", email_verified: "0", account_type: 'student' };
      if (activeSection === 'courses') initialFormData = { is_active: "1", level: 'beginner', duration: 4, price: 0 }; // duration as INT
      if (activeSection === 'assignments') initialFormData = { max_points: 100 };
      if (activeSection === 'enrollments') initialFormData = { progress: 0, status: 'active' };
      if (activeSection === 'contacts') initialFormData = { /* no status field in DB */ }; // Frontend will show 'pending' based on recent
      if (activeSection === 'calendar') initialFormData = { event_type: 'custom', user_id: 1 };
      if (activeSection === 'service-categories') initialFormData = { is_active: "1" };
      if (activeSection === 'service-sub-categories') initialFormData = { is_active: "1", base_price: 0 };
      if (activeSection === 'service-offerings') initialFormData = { popular: "0", price: 0, category_id: serviceCategoryLookup[0]?.id }; // Default to first category
      if (activeSection === 'service-requests') initialFormData = { status: 'pending', contact_method: 'email', user_id: userLookup[0]?.id || 1, subcategory_id: serviceSubCategoryLookup[0]?.id }; // user_id is NOT NULL
      if (activeSection === 'internships') initialFormData = { applications_count: 0, spots_available: 1, type: 'Paid', level: 'Entry-level' };
    }

    setFormData(initialFormData);
    const sectionName = activeSection?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(' Offerings', '').replace(' Requests', '').replace('Categories', 'Category').replace('Sub Categories', 'Sub-Category') || '';
    setModalTitle(type === 'create' ? `Create New ${sectionName}` : type === 'edit' ? `Edit ${sectionName}` : `Delete ${sectionName}`);
    setIsModalOpen(true);
  }, [activeSection, allUsers, allCourses, allAssignments, allEnrollments, allCertificates, allContactMessages, allCalendarEvents, allServiceCategories, allServiceSubCategories, allServiceOfferings, allServiceRequests, allInternships, serviceCategoryLookup, serviceSubCategoryLookup, userLookup]);


  // --- Filtering & Pagination ---
  const handlePageChange = useCallback((page: number) => { setCurrentPage(page); }, []);
  const handlePageSizeChange = useCallback((size: number) => { setPageSize(size); setCurrentPage(1); }, []);
  const totalPages = useMemo(() => Math.ceil(totalItems / pageSize), [totalItems, pageSize]);

  const getFilteredData = useCallback((section: string) => {
    let data: any[] = [];
    switch (section) {
      case 'users': data = allUsers; break; case 'courses': data = allCourses; break; case 'assignments': data = allAssignments; break;
      case 'enrollments': data = allEnrollments; break; case 'certificates': data = allCertificates; break;
      case 'contacts': data = allContactMessages; break; case 'calendar': data = allCalendarEvents; break;
      case 'service-categories': data = allServiceCategories; break; case 'service-sub-categories': data = allServiceSubCategories; break;
      case 'service-offerings': data = allServiceOfferings; break; case 'service-requests': data = allServiceRequests; break;
      case 'internships': data = allInternships; break;
    }
    return data; // Search and filter handled by backend
  }, [allUsers, allCourses, allAssignments, allEnrollments, allCertificates, allContactMessages, allCalendarEvents, allServiceCategories, allServiceSubCategories, allServiceOfferings, allServiceRequests, allInternships]);


  // --- Render Functions ---
  const renderSectionContent = () => {
    if (activeSection === 'overview') { return renderOverviewTab(); }
    else if (activeSection === 'analytics') { return <AnalyticsPage headers={getHeaders()} />; }
    else { return viewMode === 'list' ? renderListView() : renderDetailView(); }
  };

  const renderOverviewTab = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={adminStats.totalUsers} icon={<Users size={20} />} color="from-blue-500 to-blue-400" />
        <StatCard title="Total Courses" value={adminStats.totalCourses} icon={<BookOpen size={20} />} color="from-green-500 to-green-400" />
        <StatCard title="Total Enrollments" value={adminStats.totalEnrollments} icon={<UserCheck size={20} />} color="from-purple-500 to-purple-400" />
        <StatCard title="Total Revenue" value={adminStats.totalRevenue} icon={<BarChart size={20} />} color="from-orange-500 to-orange-400" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Users</h2>
            <button onClick={() => handleManagementClick('users')} className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center">Manage <ChevronRight size={18} className="ml-1" /></button>
          </div>
          <div className="space-y-4">
            {recentUsers.length > 0 ? (recentUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div><p className="font-medium">{`${user.first_name} ${user.last_name}`}</p><p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p></div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">{user.account_type}</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.join_date}</p>
                </div>
              </div>
            ))) : (<p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent users</p>)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Enrollments</h2>
            <button onClick={() => handleManagementClick('enrollments')} className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center">Manage <ChevronRight size={18} className="ml-1" /></button>
          </div>
          <div className="space-y-4">
            {recentEnrollments.length > 0 ? (recentEnrollments.map(enrollment => (
              <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div><p className="font-medium">{enrollment.user_name}</p><p className="text-sm text-gray-600 dark:text-gray-400">{enrollment.course_name}</p></div>
                <div className="text-right"><StatusBadge status={enrollment.status} /><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{enrollment.date}</p></div>
              </div>
            ))) : (<p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent enrollments</p>)}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Service Requests</h2>
          <button onClick={() => handleManagementClick('service-requests')} className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center">Manage <ChevronRight size={18} className="ml-1" /></button>
        </div>
        <div className="space-y-4">
          {recentServiceRequests.length > 0 ? (recentServiceRequests.map(request => (
            <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div><p className="font-medium">{request.name}</p><p className="text-sm text-gray-600 dark:text-gray-400">{request.service}</p></div>
              <div className="text-right"><StatusBadge status={request.status} /><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{request.date}</p></div>
            </div>
          ))) : (<p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent service requests</p>)}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => { handleManagementClick('courses'); setTimeout(() => handleOpenModal('create'), 100); }} className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors flex flex-col items-center">
            <PlusCircle size={24} className="text-orange-500 mx-auto mb-2" /><p className="text-sm font-medium">Add Course</p></button>
          <button onClick={() => handleManagementClick('users')} className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors flex flex-col items-center">
            <Users size={24} className="text-orange-500 mx-auto mb-2" /><p className="text-sm font-medium">Manage Users</p></button>
          <button onClick={() => handleManagementClick('contacts')} className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors flex flex-col items-center">
            <Mail size={24} className="text-orange-500 mx-auto mb-2" /><p className="text-sm font-medium">View Messages</p></button>
          <button onClick={() => handleManagementClick('assignments')} className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors flex flex-col items-center">
            <HardHat size={24} className="text-orange-500 mx-auto mb-2" /><p className="text-sm font-medium">Assignments</p></button>
        </div>
      </div>
    </>
  );

  const renderListView = () => {
    const filteredData = getFilteredData(activeSection);
    const totalPagesCalculated = useMemo(() => Math.ceil(totalItems / pageSize), [totalItems, pageSize]);

    const getFilterOptions = () => {
      let options: { value: string; label: string }[] = [ { value: 'all', label: `All ${activeSection.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(' Offerings', '').replace(' Requests', '').replace('Categories', 'Category').replace('Sub Categories', 'Sub-Category')}` } ];
      switch (activeSection) {
        case 'users': options.push({ value: 'active', label: 'Active Users' }, { value: 'inactive', label: 'Inactive Users' }, { value: 'student', label: 'Students' }, { value: 'professional', label: 'Professionals' }, { value: 'business', label: 'Business' }, { value: 'agency', label: 'Agency' }, { value: 'admin', label: 'Admins' }); break;
        case 'courses': options.push({ value: 'active', label: 'Active Courses' }, { value: 'inactive', label: 'Inactive Courses' }, { value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }); break;
        case 'enrollments': options.push({ value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }); break;
        case 'service-requests': options.push({ value: 'pending', label: 'Pending' }, { value: 'in-process', label: 'In Process' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }); break;
        // Contact messages don't have a status filter in DB, but frontend can display conceptually
        case 'calendar': options.push({ value: 'custom', label: 'Custom' }, { value: 'webinar', label: 'Webinar' }, { value: 'workshop', label: 'Workshop' }, { value: 'meeting', label: 'Meeting' }, { value: 'deadline', label: 'Deadline' }); break;
        case 'assignments': courseLookup.forEach(course => options.push({ value: String(course.id), label: course.title })); break;
        case 'service-sub-categories': serviceCategoryLookup.forEach(cat => options.push({ value: String(cat.id), label: cat.name })); break;
        case 'service-offerings': serviceCategoryLookup.forEach(cat => options.push({ value: String(cat.id), label: cat.name })); break;
      }
      return options;
    };


    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold">{
            activeSection === 'service-categories' ? 'Service Categories' :
            activeSection === 'service-sub-categories' ? 'Service Sub-Categories' :
            activeSection === 'service-offerings' ? 'Service Offerings' :
            activeSection === 'service-requests' ? 'Service Requests' :
            activeSection.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Management'
          }</h2>

          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            {renderFilterDropdown(getFilterOptions())}
            {activeSection !== 'enrollments' && activeSection !== 'service-requests' && activeSection !== 'contacts' && (
              <button onClick={() => handleOpenModal('create')} className="flex items-center justify-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors">
                <Plus size={16} /><span>Add New</span>
              </button>
            )}
          </div>
        </div>
        {renderDataTableComponent(filteredData, totalPagesCalculated)}
      </div>
    );
  };

  const renderFilterDropdown = (options: { value: string; label: string }[]) => {
    return (
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none">
          {options.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
        </select>
      </div>
    );
  };

  const renderDataTableComponent = (data: any[], totalPages: number) => {
    switch (activeSection) {
      case 'users':
        return (<DataTable<DetailedUser> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Name', accessor: (user) => `${user.first_name} ${user.last_name}` }, { header: 'Email', accessor: 'email' }, { header: 'Account Type', accessor: 'account_type', className: 'capitalize' }, { header: 'Status', accessor: (user) => (<StatusBadge status={user.is_active ? 'Active' : 'Inactive'} />) }, { header: 'Join Date', accessor: 'created_at' } ]}
          onRowClick={(user) => handleItemClick(user.id)}
          actions={(user) => (<div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', user.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={16} className="text-blue-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', user.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      case 'courses':
        return (<DataTable<Course> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Title', accessor: 'title' }, { header: 'Duration', accessor: (course) => `${course.duration} weeks` }, { header: 'Price', accessor: (course) => `₹${course.price?.toLocaleString() || '0'}` }, { header: 'Difficulty', accessor: (course) => (<span className="capitalize">{course.level}</span>) }, { header: 'Status', accessor: (course) => (<StatusBadge status={course.is_active ? 'Active' : 'Inactive'} />) } ]}
          onRowClick={(course) => handleItemClick(course.id)}
          actions={(course) => (<div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', course.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={16} className="text-blue-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', course.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      case 'assignments':
        return (<DataTable<Assignment> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Title', accessor: 'title' }, { header: 'Course', accessor: 'course_title' }, { header: 'Due Date', accessor: 'due_date' }, { header: 'Max Points', accessor: (assignment) => assignment.max_points.toString() }, { header: 'Created', accessor: 'created_at' } ]}
          onRowClick={(assignment) => handleItemClick(assignment.id)}
          actions={(assignment) => (<div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', assignment.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={16} className="text-blue-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', assignment.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      case 'enrollments':
        return (<DataTable<DetailedEnrollment> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Student', accessor: 'user_name' }, { header: 'Course', accessor: 'course_name' }, { header: 'Progress', accessor: (enrollment) => (<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"><div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${enrollment.progress}%` }}></div></div>)}, { header: 'Status', accessor: (enrollment) => (<StatusBadge status={enrollment.status} />) }, { header: 'Enrollment Date', accessor: 'date' } ]}
          onRowClick={(enrollment) => handleItemClick(enrollment.id)}
          actions={(enrollment) => (<div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', enrollment.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={16} className="text-blue-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', enrollment.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      case 'certificates':
        return (<DataTable<Certificate> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Student', accessor: 'user_name' }, { header: 'Course', accessor: 'course_title' }, { header: 'Issued Date', accessor: 'issued_date' }, { header: 'Certificate', accessor: (cert) => (<a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>View Certificate</a>) } ]}
          onRowClick={(cert) => handleItemClick(cert.id)}
          actions={(cert) => (<div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); window.open(cert.certificate_url, '_blank'); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Download size={16} className="text-green-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', cert.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      case 'contacts':
        return (<DataTable<ContactMessage> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Name', accessor: (msg) => `${msg.first_name} ${msg.last_name}` }, { header: 'Email', accessor: 'email' }, { header: 'Message', accessor: (msg) => (<div className="max-w-xs truncate">{msg.message}</div>) }, { header: 'Date', accessor: 'created_at' },
          { header: 'Status', accessor: (msg) => (<StatusBadge status={msg.status || 'pending'} />) } // Conceptual status
          ]}
          onRowClick={(msg) => handleItemClick(msg.id)}
          actions={(msg) => (<div className="flex space-x-2">
            {/* Can't edit status in DB as column doesn't exist. Edit for other details. */}
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', msg.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={16} className="text-blue-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', msg.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      case 'calendar':
        return (<DataTable<CalendarEvent> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Title', accessor: 'title' }, { header: 'Description', accessor: (event) => (<div className="max-w-xs truncate">{event.description || 'No description'}</div>) }, { header: 'Date', accessor: 'event_date' }, { header: 'Time', accessor: (event) => event.event_time || 'All day' }, { header: 'Type', accessor: (event) => (<span className="capitalize">{event.event_type}</span>) } ]}
          onRowClick={(event) => handleItemClick(event.id)}
          actions={(event) => (<div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', event.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={16} className="text-blue-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', event.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      case 'service-categories':
        return (<DataTable<ServiceCategory> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Name', accessor: 'name' }, { header: 'Description', accessor: (cat) => (<div className="max-w-xs truncate">{cat.description || 'N/A'}</div>) }, { header: 'Icon', accessor: 'icon' }, { header: 'Status', accessor: (cat) => (<StatusBadge status={cat.is_active ? 'Active' : 'Inactive'} />) }, { header: 'Created', accessor: 'created_at' } ]}
          onRowClick={(cat) => handleItemClick(cat.id)}
          actions={(cat) => (<div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', cat.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={16} className="text-blue-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', cat.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      case 'service-sub-categories':
        return (<DataTable<ServiceSubCategory> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Name', accessor: 'name' }, { header: 'Category', accessor: 'category_name' }, { header: 'Base Price', accessor: (subcat) => `₹${subcat.base_price?.toLocaleString() || '0'}` }, { header: 'Status', accessor: (subcat) => (<StatusBadge status={subcat.is_active ? 'Active' : 'Inactive'} />) }, { header: 'Created', accessor: 'created_at' } ]}
          onRowClick={(subcat) => handleItemClick(subcat.id)}
          actions={(subcat) => (<div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', subcat.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={16} className="text-blue-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', subcat.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      case 'service-offerings':
        return (<DataTable<ServiceOffering> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Name', accessor: 'name' }, { header: 'Category', accessor: 'category_name' }, { header: 'Price', accessor: (service) => `₹${service.price?.toLocaleString() || '0'}` }, { header: 'Duration', accessor: 'duration' }, { header: 'Popular', accessor: (service) => (<StatusBadge status={service.popular ? 'Yes' : 'No'} />) } ]}
          onRowClick={(service) => handleItemClick(service.id)}
          actions={(service) => (<div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', service.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={16} className="text-blue-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', service.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      case 'service-requests':
        return (<DataTable<DetailedServiceRequest> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Client', accessor: 'name' }, { header: 'Service', accessor: 'service_name' }, { header: 'Email', accessor: 'email' }, { header: 'Date', accessor: 'date' }, { header: 'Status', accessor: (request) => (<StatusBadge status={request.status} />) } ]}
          onRowClick={(request) => handleItemClick(request.id)}
          actions={(request) => (<div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', request.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={16} className="text-blue-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', request.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      case 'internships':
        return (<DataTable<Internship> data={data} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} isLoading={loading}
          columns={[ { header: 'Title', accessor: 'title' }, { header: 'Company', accessor: 'company' }, { header: 'Location', accessor: 'location' }, { header: 'Duration', accessor: 'duration' }, { header: 'Type', accessor: 'type' }, { header: 'Level', accessor: 'level' } ]}
          onRowClick={(internship) => handleItemClick(internship.id)}
          actions={(internship) => (<div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', internship.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit size={16} className="text-blue-500" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', internship.id); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Trash2 size={16} className="text-red-500" /></button>
          </div>)}
        />);
      default: return <p>Select a management section to view data.</p>;
    }
  };


  const renderDetailView = () => {
    if (!selectedItemId) return null; let item: any; let content;
    switch (activeSection) {
      case 'users':
        item = allUsers.find(u => u.id === selectedItemId); if (!item) return <p>User not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">{`${item.first_name} ${item.last_name}`}</h3><p className="text-gray-600 dark:text-gray-400">{item.email}</p></div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal('edit', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Edit size={16} /><span>Edit</span></button>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Basic Information</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Account Type:</span><span className="font-medium capitalize">{item.account_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Phone:</span><span className="font-medium">{item.phone || 'Not provided'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Status:</span><StatusBadge status={item.is_active ? 'Active' : 'Inactive'} /></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Email Verified:</span><span className="font-medium">{item.email_verified ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Joined:</span><span className="font-medium">{item.created_at}</span></div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Additional Information</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Company:</span><span className="font-medium">{item.company || 'Not provided'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Website:</span><span className="font-medium">{item.website || 'Not provided'}</span></div>
              <div><span className="text-gray-600 dark:text-gray-400 block mb-1">Bio:</span><p className="font-medium whitespace-pre-line">{item.bio || 'N/A'}</p></div>
            </div></div>
          </div>
        </div>); break;

      case 'courses':
        item = allCourses.find(c => c.id === selectedItemId); if (!item) return <p>Course not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">{item.title}</h3><p className="text-gray-600 dark:text-gray-400">Category: {item.category}</p></div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal('edit', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Edit size={16} /><span>Edit</span></button>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Course Details</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Difficulty:</span><span className="font-medium capitalize">{item.level}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Duration:</span><span className="font-medium">{item.duration} weeks</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Price:</span><span className="font-medium">₹{item.price?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Status:</span><StatusBadge status={item.is_active ? 'Active' : 'Inactive'} /></div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Description</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.description}</p></div>
          </div>
          {(item.image_url || item.thumbnail_url) && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Course Image/Thumbnail</h4>
              <div className="w-full max-w-xs mx-auto">
                <img src={item.image_url || item.thumbnail_url} alt={item.title} className="w-full h-auto rounded-lg shadow-md" />
              </div>
            </div>
          )}
        </div>); break;

      case 'assignments':
        item = allAssignments.find(a => a.id === selectedItemId); if (!item) return <p>Assignment not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">{item.title}</h3><p className="text-gray-600 dark:text-gray-400">Course: {item.course_title}</p></div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal('edit', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Edit size={16} /><span>Edit</span></button>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Assignment Details</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Due Date:</span><span className="font-medium">{item.due_date || 'Not specified'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Max Points:</span><span className="font-medium">{item.max_points}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Created:</span><span className="font-medium">{item.created_at}</span></div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Description</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.description || 'No description provided'}</p></div>
          </div>
        </div>); break;

      case 'enrollments':
        item = allEnrollments.find(e => e.id === selectedItemId); if (!item) return <p>Enrollment not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">Enrollment Details</h3><p className="text-gray-600 dark:text-gray-400">{item.user_name} - {item.course_name}</p></div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal('edit', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Edit size={16} /><span>Edit</span></button>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Enrollment Information</h4><div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Status:</span><StatusBadge status={item.status} /></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Enrollment Date:</span><span className="font-medium">{item.date}</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Completion Date:</span><span className="font-medium">{item.completion_date || 'Not completed'}</span></div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">Progress:</p><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${item.progress}%` }}></div>
                </div><p className="text-right text-sm text-gray-600 dark:text-gray-400">{item.progress}%</p>
              </div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Associated Information</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Student ID:</span><span className="font-medium">{item.user_id}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Course ID:</span><span className="font-medium">{item.course_id}</span></div>
            </div></div>
          </div>
        </div>); break;

      case 'certificates':
        item = allCertificates.find(c => c.id === selectedItemId); if (!item) return <p>Certificate not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">Certificate Details</h3><p className="text-gray-600 dark:text-gray-400">{item.course_title} - {item.user_name}</p></div>
            <div className="flex gap-2">
              <a href={item.certificate_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600"><Download size={16} /><span>Download</span></a>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Certificate Information</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Student:</span><span className="font-medium">{item.user_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Course:</span><span className="font-medium">{item.course_title}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Issued Date:</span><span className="font-medium">{item.issued_date}</span></div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Certificate Preview</h4><div className="flex flex-col items-center">
              <a href={item.certificate_url} target="_blank" rel="noopener noreferrer" className="inline-block p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center justify-center w-48 h-48 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <Award size={64} className="text-orange-500" />
                </div><p className="mt-2 text-center text-sm text-blue-500">View Certificate</p></a>
            </div></div>
          </div>
        </div>); break;

      case 'contacts':
        item = allContactMessages.find(m => m.id === selectedItemId); if (!item) return <p>Message not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">Contact Message</h3><p className="text-gray-600 dark:text-gray-400">From: {item.first_name} {item.last_name}</p></div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal('edit', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Edit size={16} /><span>Edit Details</span></button>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Contact Information</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Name:</span><span className="font-medium">{item.first_name} {item.last_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Email:</span><span className="font-medium">{item.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Phone:</span><span className="font-medium">{item.phone || 'Not provided'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Company:</span><span className="font-medium">{item.company || 'Not provided'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Date:</span><span className="font-medium">{item.created_at}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Status:</span><StatusBadge status={item.status || 'pending'} /></div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Message</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.message}</p></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Response Actions</h4><div className="space-y-3">
              <a href={`mailto:${item.email}`} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"><Mail size={16} /><span>Reply via Email</span></a>
              {item.phone && (<a href={`tel:${item.phone}`} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"><Phone size={16} /><span>Call</span></a>)}
            </div>
          </div>
        </div>); break;

      case 'calendar':
        item = allCalendarEvents.find(e => e.id === selectedItemId); if (!item) return <p>Event not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">{item.title}</h3><p className="text-gray-600 dark:text-gray-400">{item.event_date} {item.event_time ? `at ${item.event_time}` : ''}</p></div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal('edit', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Edit size={16} /><span>Edit</span></button>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Event Details</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Type:</span><span className="font-medium capitalize">{item.event_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Date:</span><span className="font-medium">{item.event_date}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Time:</span><span className="font-medium">{item.event_time || 'All day'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Created:</span><span className="font-medium">{item.created_at}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Created By:</span><span className="font-medium">{item.user_name || 'N/A'}</span></div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Description</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.description || 'No description provided'}</p></div>
          </div>
        </div>); break;

      case 'service-categories':
        item = allServiceCategories.find(c => c.id === selectedItemId); if (!item) return <p>Service Category not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">{item.name}</h3></div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal('edit', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Edit size={16} /><span>Edit</span></button>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Category Details</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Status:</span><StatusBadge status={item.is_active ? 'Active' : 'Inactive'} /></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Icon:</span><span className="font-medium">{item.icon || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Created At:</span><span className="font-medium">{item.created_at}</span></div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Description</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.description || 'No description provided'}</p></div>
          </div>
        </div>); break;

      case 'service-sub-categories':
        item = allServiceSubCategories.find(s => s.id === selectedItemId); if (!item) return <p>Service Sub-Category not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">{item.name}</h3><p className="text-gray-600 dark:text-gray-400">Category: {item.category_name}</p></div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal('edit', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Edit size={16} /><span>Edit</span></button>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Sub-Category Details</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Base Price:</span><span className="font-medium">₹{item.base_price?.toLocaleString() || '0'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Status:</span><StatusBadge status={item.is_active ? 'Active' : 'Inactive'} /></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Created At:</span><span className="font-medium">{item.created_at}</span></div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Description</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.description || 'No description provided'}</p></div>
          </div>
        </div>); break;

      case 'service-offerings':
        item = allServiceOfferings.find(s => s.id === selectedItemId); if (!item) return <p>Service Offering not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">{item.name}</h3><p className="text-gray-600 dark:text-gray-400">Category: {item.category_name}</p></div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal('edit', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Edit size={16} /><span>Edit</span></button>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Service Details</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Price:</span><span className="font-medium">₹{item.price?.toLocaleString() || '0'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Duration:</span><span className="font-medium">{item.duration || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Rating:</span><span className="font-medium">{item.rating || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Reviews:</span><span className="font-medium">{item.reviews || '0'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Popular:</span><StatusBadge status={item.popular ? 'Yes' : 'No'} /></div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Description</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.description || 'No description provided'}</p></div>
          </div>
          {item.features && (<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Features</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.features}</p></div>)}
        </div>); break;

      case 'service-requests':
        item = allServiceRequests.find(r => r.id === selectedItemId); if (!item) return <p>Service request not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">Service Request</h3><p className="text-gray-600 dark:text-gray-400">{item.name} - {item.service_name}</p></div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal('edit', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Edit size={16} /><span>Update Status</span></button>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Client Information</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Name:</span><span className="font-medium">{item.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Email:</span><span className="font-medium">{item.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Phone:</span><span className="font-medium">{item.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Company:</span><span className="font-medium">{item.company || 'Not provided'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Website:</span><span className="font-medium">{item.website || 'Not provided'}</span></div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Request Details</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Service:</span><span className="font-medium">{item.service_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Budget:</span><span className="font-medium">{item.budget_range}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Timeline:</span><span className="font-medium">{item.timeline}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Date:</span><span className="font-medium">{item.date}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Status:</span><StatusBadge status={item.status} /></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Contact Method:</span><span className="font-medium capitalize">{item.contact_method}</span></div>
            </div></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Project Details</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line mb-4">{item.project_details}</p>
            {item.additional_requirements && (<><h5 className="font-medium mb-2">Additional Requirements</h5><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.additional_requirements}</p></>)}
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Contact Actions</h4><div className="space-y-3">
            <a href={`mailto:${item.email}`} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"><Mail size={16} /><span>Email Client</span></a>
            <a href={`tel:${item.phone}`} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"><Phone size={16} /><span>Call Client</span></a>
          </div></div>
        </div>); break;

      case 'internships':
        item = allInternships.find(i => i.id === selectedItemId); if (!item) return <p>Internship not found</p>;
        content = (<div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1"><h3 className="text-xl font-bold mb-1">{item.title}</h3><p className="text-gray-600 dark:text-gray-400">{item.company} - {item.location}</p></div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal('edit', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"><Edit size={16} /><span>Edit</span></button>
              <button onClick={() => handleOpenModal('delete', item!.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Internship Details</h4><div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Duration:</span><span className="font-medium">{item.duration}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Type:</span><span className="font-medium">{item.type}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Level:</span><span className="font-medium">{item.level}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Applications:</span><span className="font-medium">{item.applications_count}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Spots Available:</span><span className="font-medium">{item.spots_available}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Posted At:</span><span className="font-medium">{new Date(item.posted_at).toLocaleDateString()}</span></div>
            </div></div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Description</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.description}</p></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Requirements</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.requirements}</p></div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><h4 className="font-semibold mb-3">Benefits</h4><p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.benefits}</p></div>
        </div>); break;

      default: content = <p>Detail view not implemented for this section</p>;
    }

    return (
      <div className="space-y-6">
        <button onClick={handleBackToList} className="flex items-center text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
          <ChevronLeft size={16} className="mr-1" /><span>Back to list</span>
        </button>
        {content}
      </div>
    );
  };


  const renderModal = () => {
    if (!isModalOpen) return null;

    if (modalType === 'delete') {
      return (
        <Modal isOpen={isModalOpen} title={modalTitle} onClose={() => setIsModalOpen(false)} isLoading={isModalLoading}>
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" disabled={isModalLoading}>Cancel</button>
              <button onClick={handleDeleteItem} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isModalLoading}>Delete</button>
            </div>
          </div>
        </Modal>
      );
    }

    const modalFormFields = renderFormFields();
    // Basic validation: at least one field is filled if creating/editing
    const isFormFilled = Object.values(formData).some(value => value !== undefined && value !== null && value !== '');

    return (
      <Modal isOpen={isModalOpen} title={modalTitle} onClose={() => setIsModalOpen(false)} size="lg" isLoading={isModalLoading}>
        <div className="space-y-6">
          {modalFormFields}
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" disabled={isModalLoading}>Cancel</button>
            <button onClick={() => handleFormSubmit(modalType)} className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isModalLoading || !isFormFilled}>
              <Save size={16} /><span>{modalType === 'create' ? 'Create' : 'Update'}</span>
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  const renderFormFields = () => {
    const commonInputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:focus:ring-orange-500";
    const commonLabelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
      <div><label className={commonLabelClass}>{label}</label>{children}</div>);

    switch (activeSection) {
      case 'users':
        return (<>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First Name"><input type="text" value={formData.first_name || ''} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Last Name"><input type="text" value={formData.last_name || ''} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className={commonInputClass} /></Field>
          </div>
          <Field label="Email"><input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className={commonInputClass} /></Field>
          {modalType === 'create' && (<Field label="Password"><input type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={commonInputClass} /></Field>)}
          {modalType === 'edit' && (<Field label="New Password (Leave blank to keep current)"><input type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={commonInputClass} /></Field>)}
          <Field label="Phone"><input type="text" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={commonInputClass} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Account Type">
              <select value={formData.account_type || ''} onChange={(e) => setFormData({...formData, account_type: e.target.value})} className={commonInputClass}>
                <option value="">Select account type</option>
                <option value="student">Student</option>
                <option value="professional">Professional</option>
                <option value="business">Business</option>
                <option value="agency">Agency</option>
                {/* 'admin' type needs to be added to DB schema if used */}
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={formData.is_active !== undefined ? String(formData.is_active) : "1"} onChange={(e) => setFormData({...formData, is_active: e.target.value === "1"})} className={commonInputClass}>
                <option value="1">Active</option><option value="0">Inactive</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email Verified">
              <select value={formData.email_verified !== undefined ? String(formData.email_verified) : "0"} onChange={(e) => setFormData({...formData, email_verified: e.target.value === "1"})} className={commonInputClass}>
                <option value="1">Yes</option><option value="0">No</option>
              </select>
            </Field>
            <Field label="Company"><input type="text" value={formData.company || ''} onChange={(e) => setFormData({...formData, company: e.target.value})} className={commonInputClass} /></Field>
          </div>
          <Field label="Website"><input type="text" value={formData.website || ''} onChange={(e) => setFormData({...formData, website: e.target.value})} className={commonInputClass} /></Field>
          <Field label="Bio"><textarea value={formData.bio || ''} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={3} className={commonInputClass} /></Field>
        </>);

      case 'courses':
        return (<>
          <Field label="Course Title"><input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className={commonInputClass} /></Field>
          <Field label="Description"><textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} className={commonInputClass} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Category"><input type="text" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Difficulty Level">
              <select value={formData.level || ''} onChange={(e) => setFormData({...formData, level: e.target.value})} className={commonInputClass}>
                <option value="">Select difficulty</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>
            <Field label="Duration (Integer in database, e.g. 8 for 8 weeks)"><input type="number" min="1" value={formData.duration || ''} onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})} className={commonInputClass} /></Field> {/* Using 'duration' */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Price (₹)"><input type="number" min="0" step="0.01" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} className={commonInputClass} /></Field>
            <Field label="Status">
              <select value={formData.is_active !== undefined ? String(formData.is_active) : "1"} onChange={(e) => setFormData({...formData, is_active: e.target.value === "1"})} className={commonInputClass}>
                <option value="1">Active</option><option value="0">Inactive</option>
              </select>
            </Field>
          </div>
          <Field label="Image URL"><input type="text" value={formData.image_url || ''} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className={commonInputClass} placeholder="https://example.com/image.jpg" /></Field>
          <Field label="Thumbnail URL"><input type="text" value={formData.thumbnail_url || ''} onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})} className={commonInputClass} placeholder="https://example.com/thumbnail.jpg" /></Field>
        </>);

      case 'assignments':
        return (<>
          <Field label="Assignment Title"><input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className={commonInputClass} /></Field>
          <Field label="Course">
            <select value={formData.course_id || ''} onChange={(e) => setFormData({...formData, course_id: parseInt(e.target.value)})} className={commonInputClass}>
              <option value="">Select course</option>
              {courseLookup.map(course => (<option key={course.id} value={course.id}>{course.title}</option>))}
            </select>
          </Field>
          <Field label="Description"><textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} className={commonInputClass} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Due Date"><input type="date" value={formData.due_date || ''} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Max Points"><input type="number" min="0" value={formData.max_points || ''} onChange={(e) => setFormData({...formData, max_points: parseInt(e.target.value)})} className={commonInputClass} /></Field>
          </div>
        </>);

      case 'enrollments':
        return (<>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="User">
              <select value={formData.user_id || ''} onChange={(e) => setFormData({...formData, user_id: parseInt(e.target.value)})} className={commonInputClass}>
                <option value="">Select user</option>
                {userLookup.map(user => (<option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>))}
              </select>
            </Field>
            <Field label="Course">
              <select value={formData.course_id || ''} onChange={(e) => setFormData({...formData, course_id: parseInt(e.target.value)})} className={commonInputClass}>
                <option value="">Select course</option>
                {courseLookup.map(course => (<option key={course.id} value={course.id}>{course.title}</option>))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Status">
              <select value={formData.status || ''} onChange={(e) => setFormData({...formData, status: e.target.value})} className={commonInputClass}>
                <option value="">Select status</option>
                <option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
            </Field>
            <Field label="Progress (%)"><input type="number" min="0" max="100" value={formData.progress || ''} onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})} className={commonInputClass} /></Field>
          </div>
          {formData.status === 'completed' && (<Field label="Completion Date"><input type="date" value={formData.completion_date || ''} onChange={(e) => setFormData({...formData, completion_date: e.target.value})} className={commonInputClass} /></Field>)}
        </>);

      case 'certificates':
        return (<>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="User">
              <select value={formData.user_id || ''} onChange={(e) => setFormData({...formData, user_id: parseInt(e.target.value)})} className={commonInputClass}>
                <option value="">Select user</option>
                {userLookup.map(user => (<option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>))}
              </select>
            </Field>
            <Field label="Course">
              <select value={formData.course_id || ''} onChange={(e) => setFormData({...formData, course_id: parseInt(e.target.value)})} className={commonInputClass}>
                <option value="">Select course</option>
                {courseLookup.map(course => (<option key={course.id} value={course.id}>{course.title}</option>))}
              </select>
            </Field>
          </div>
          <Field label="Certificate URL"><input type="text" value={formData.certificate_url || ''} onChange={(e) => setFormData({...formData, certificate_url: e.target.value})} className={commonInputClass} placeholder="/certificates/example.pdf" /></Field>
          <Field label="Issued Date"><input type="date" value={formData.issued_date || ''} onChange={(e) => setFormData({...formData, issued_date: e.target.value})} className={commonInputClass} /></Field>
        </>);

      case 'contacts':
        return (<>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First Name"><input type="text" value={formData.first_name || ''} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Last Name"><input type="text" value={formData.last_name || ''} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className={commonInputClass} /></Field>
          </div>
          <Field label="Email"><input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className={commonInputClass} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Phone"><input type="text" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Company"><input type="text" value={formData.company || ''} onChange={(e) => setFormData({...formData, company: e.target.value})} className={commonInputClass} /></Field>
          </div>
          <Field label="Message"><textarea value={formData.message || ''} onChange={(e) => setFormData({...formData, message: e.target.value})} rows={4} className={commonInputClass} /></Field>
          {/* Note: Original DB schema has no 'status' column for contact_messages. This field is *not* sent to the API for updates. */}
          {modalType === 'edit' && <Field label="Conceptual Status"><p className="text-gray-500 dark:text-gray-400">Status for contact messages is not stored in the database. It is inferred from recent activity for display purposes.</p></Field>}
        </>);

      case 'calendar':
        return (<>
          <Field label="Event Title"><input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className={commonInputClass} /></Field>
          <Field label="Description"><textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className={commonInputClass} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Event Date"><input type="date" value={formData.event_date || ''} onChange={(e) => setFormData({...formData, event_date: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Event Time"><input type="time" value={formData.event_time || ''} onChange={(e) => setFormData({...formData, event_time: e.target.value})} className={commonInputClass} /></Field>
          </div>
          <Field label="Event Type">
            <select value={formData.event_type || 'custom'} onChange={(e) => setFormData({...formData, event_type: e.target.value})} className={commonInputClass}>
              <option value="custom">Custom</option><option value="webinar">Webinar</option><option value="workshop">Workshop</option><option value="meeting">Meeting</option><option value="deadline">Deadline</option>
            </select>
          </Field>
          <Field label="User (who owns this event)">
              <select value={formData.user_id || ''} onChange={(e) => setFormData({...formData, user_id: parseInt(e.target.value)})} className={commonInputClass}>
                <option value="">Select user</option>
                {userLookup.map(user => (<option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>))}
              </select>
            </Field>
        </>);

      case 'service-categories':
        return (<>
          <Field label="Category Name"><input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className={commonInputClass} /></Field>
          <Field label="Description"><textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className={commonInputClass} /></Field>
          <Field label="Icon Name (e.g., 'Code', 'Layers')"><input type="text" value={formData.icon || ''} onChange={(e) => setFormData({...formData, icon: e.target.value})} className={commonInputClass} /></Field>
          <Field label="Status">
            <select value={formData.is_active !== undefined ? String(formData.is_active) : "1"} onChange={(e) => setFormData({...formData, is_active: e.target.value === "1"})} className={commonInputClass}>
              <option value="1">Active</option><option value="0">Inactive</option>
            </select>
          </Field>
        </>);

      case 'service-sub-categories':
        return (<>
          <Field label="Sub-Category Name"><input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className={commonInputClass} /></Field>
          <Field label="Parent Category">
            <select value={formData.category_id || ''} onChange={(e) => setFormData({...formData, category_id: parseInt(e.target.value)})} className={commonInputClass}>
              <option value="">Select category</option>
              {serviceCategoryLookup.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </Field>
          <Field label="Description"><textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className={commonInputClass} /></Field>
          <Field label="Base Price (₹)"><input type="number" min="0" step="0.01" value={formData.base_price || ''} onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value)})} className={commonInputClass} /></Field>
          <Field label="Status">
            <select value={formData.is_active !== undefined ? String(formData.is_active) : "1"} onChange={(e) => setFormData({...formData, is_active: e.target.value === "1"})} className={commonInputClass}>
              <option value="1">Active</option><option value="0">Inactive</option>
            </select>
          </Field>
        </>);

      case 'service-offerings': // For the 'service' table
        return (<>
          <Field label="Service Name"><input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className={commonInputClass} /></Field>
          <Field label="Parent Category">
            <select value={formData.category_id || ''} onChange={(e) => setFormData({...formData, category_id: parseInt(e.target.value)})} className={commonInputClass}>
              <option value="">Select category</option>
              {serviceCategoryLookup.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </Field>
          <Field label="Description"><textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className={commonInputClass} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Price (₹)"><input type="number" min="0" step="0.01" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} className={commonInputClass} /></Field>
            <Field label="Duration (e.g., '1 week')"><input type="text" value={formData.duration || ''} onChange={(e) => setFormData({...formData, duration: e.target.value})} className={commonInputClass} /></Field>
          </div>
          <Field label="Features (JSON or comma-separated)"><textarea value={formData.features || ''} onChange={(e) => setFormData({...formData, features: e.target.value})} rows={3} className={commonInputClass} /></Field>
          <Field label="Popular?">
            <select value={formData.popular !== undefined ? String(formData.popular) : "0"} onChange={(e) => setFormData({...formData, popular: e.target.value === "1"})} className={commonInputClass}>
              <option value="1">Yes</option><option value="0">No</option>
            </select>
          </Field>
        </>);


      case 'service-requests':
        return (<>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name"><input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Sub-Category">
              <select value={formData.subcategory_id || ''} onChange={(e) => setFormData({...formData, subcategory_id: parseInt(e.target.value)})} className={commonInputClass}>
                <option value="">Select sub-category</option>
                {serviceSubCategoryLookup.map(subcat => (<option key={subcat.id} value={subcat.id}>{subcat.name}</option>))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email"><input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Phone"><input type="text" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={commonInputClass} /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company"><input type="text" value={formData.company || ''} onChange={(e) => setFormData({...formData, company: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Website"><input type="text" value={formData.website || ''} onChange={(e) => setFormData({...formData, website: e.target.value})} className={commonInputClass} /></Field>
          </div>
          <Field label="Project Details"><textarea value={formData.project_details || ''} onChange={(e) => setFormData({...formData, project_details: e.target.value})} rows={4} className={commonInputClass} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Budget Range"><input type="text" value={formData.budget_range || ''} onChange={(e) => setFormData({...formData, budget_range: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Timeline"><input type="text" value={formData.timeline || ''} onChange={(e) => setFormData({...formData, timeline: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Contact Method">
              <select value={formData.contact_method || ''} onChange={(e) => setFormData({...formData, contact_method: e.target.value})} className={commonInputClass}>
                <option value="email">Email</option><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option>
              </select>
            </Field>
          </div>
          <Field label="Additional Requirements"><textarea value={formData.additional_requirements || ''} onChange={(e) => setFormData({...formData, additional_requirements: e.target.value})} rows={3} className={commonInputClass} /></Field>
          <Field label="Status">
            <select value={formData.status || 'pending'} onChange={(e) => setFormData({...formData, status: e.target.value})} className={commonInputClass}>
              <option value="pending">Pending</option><option value="in-process">In Process</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
            </select>
          </Field>
          <Field label="User (who submitted this request)">
              <select value={formData.user_id || ''} onChange={(e) => setFormData({...formData, user_id: parseInt(e.target.value)})} className={commonInputClass}>
                <option value="">Select user</option>
                {userLookup.map(user => (<option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>))}
              </select>
            </Field>
        </>);

      case 'internships':
        return (<>
          <Field label="Internship Title"><input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className={commonInputClass} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company"><input type="text" value={formData.company || ''} onChange={(e) => setFormData({...formData, company: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Location"><input type="text" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} className={commonInputClass} /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Duration (e.g., '3 Months')"><input type="text" value={formData.duration || ''} onChange={(e) => setFormData({...formData, duration: e.target.value})} className={commonInputClass} /></Field>
            <Field label="Type (e.g., 'Paid', 'Unpaid')">
              <select value={formData.type || ''} onChange={(e) => setFormData({...formData, type: e.target.value})} className={commonInputClass}>
                <option value="Paid">Paid</option><option value="Unpaid">Unpaid</option><option value="Stipend">Stipend</option>
              </select>
            </Field>
            <Field label="Level (e.g., 'Entry-level')">
              <select value={formData.level || ''} onChange={(e) => setFormData({...formData, level: e.target.value})} className={commonInputClass}>
                <option value="Entry-level">Entry-level</option><option value="Mid-level">Mid-level</option><option value="Senior">Senior</option>
              </select>
            </Field>
          </div>
          <Field label="Description"><textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} className={commonInputClass} /></Field>
          <Field label="Requirements"><textarea value={formData.requirements || ''} onChange={(e) => setFormData({...formData, requirements: e.target.value})} rows={3} className={commonInputClass} /></Field>
          <Field label="Benefits"><textarea value={formData.benefits || ''} onChange={(e) => setFormData({...formData, benefits: e.target.value})} rows={3} className={commonInputClass} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Applications Count"><input type="number" min="0" value={formData.applications_count || ''} onChange={(e) => setFormData({...formData, applications_count: parseInt(e.target.value)})} className={commonInputClass} /></Field>
            <Field label="Spots Available"><input type="number" min="1" value={formData.spots_available || ''} onChange={(e) => setFormData({...formData, spots_available: parseInt(e.target.value)})} className={commonInputClass} /></Field>
          </div>
        </>);

      default: return <p>Form not implemented for this section</p>;
    }
  };

  const managementSections = [
    { id: 'users', title: 'User Management', icon: Users, color: 'blue' },
    { id: 'courses', title: 'Course Management', icon: BookOpen, color: 'green' },
    { id: 'assignments', title: 'Assignment Management', icon: HardHat, color: 'purple' },
    { id: 'enrollments', title: 'Enrollment Management', icon: UserCheck, color: 'indigo' },
    { id: 'certificates', title: 'Certificate Management', icon: Award, color: 'yellow' },
    { id: 'service-categories', title: 'Service Categories', icon: Code, color: 'cyan' },
    { id: 'service-sub-categories', title: 'Service Sub-Categories', icon: Layers, color: 'teal' },
    { id: 'service-offerings', title: 'Service Offerings', icon: Briefcase, color: 'pink' }, // 'service' table
    { id: 'service-requests', title: 'Service Requests', icon: MessageSquare, color: 'red' }, // 'service_request' table
    { id: 'internships', title: 'Internship Management', icon: GraduationCap, color: 'orange' },
    { id: 'contacts', title: 'Contact Messages', icon: Mail, color: 'gray' },
    { id: 'calendar', title: 'Calendar Events', icon: Calendar, color: 'lime' },
  ];

  if (loading && activeSection === 'overview') {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
      </div>
    );
  }

  if (error && activeSection === 'overview') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto mt-8">
        <div className="flex items-center mb-4">
          <AlertCircle className="text-red-500 mr-2" size={24} />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button onClick={fetchDashboardData} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete platform management at your fingertips
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={handleOverviewClick}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'overview'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={handleAnalyticsClick}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'analytics'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => {
              setActiveTab('management');
              if (activeSection === 'overview' || activeSection === 'analytics') setActiveSection('users');
              setViewMode('list');
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'management'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Management Tools
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && activeSection === 'overview' ? renderOverviewTab() : (
        activeSection === 'analytics' ? <AnalyticsPage headers={getHeaders()} /> : (
          /* Management Tools Tab */
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <div className="w-full md:w-64 space-y-2 flex-shrink-0">
              {managementSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleManagementClick(section.id)}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? `bg-${section.color}-50 text-${section.color}-700 dark:bg-${section.color}-900/20 dark:text-${section.color}-300`
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon size={20} className={`mr-3 ${activeSection === section.id ? `text-${section.color}-500` : ''}`} />
                    <span>{section.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              {renderSectionContent()}
            </div>
          </div>
        )
      )}

      {/* Modals */}
      {renderModal()}
    </div>
  );
};

export default AdminDashboard;