import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, UserCheck, BarChart, PlusCircle, MessageSquare,
  GraduationCap, ChevronRight, AlertCircle, Settings, FileText,
  Calendar, Award, Briefcase, Mail, Edit, Trash2, Eye, X, Search,
  Filter, ArrowUpDown, Check, ChevronLeft, Save, Plus, Download, Phone
} from 'lucide-react';
import StatCard from '../common/StatCard';
import { DashboardStats } from '../../../lib/types';

// Interfaces for data types
interface RecentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_type: string;
  created_at: string;
}

interface User extends RecentUser {
  phone?: string;
  company?: string;
  website?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at?: string;
}

interface RecentEnrollment {
  id: number;
  user_name: string;
  course_name: string;
  date: string;
  status: string;
}

interface Enrollment extends RecentEnrollment {
  user_id: number;
  course_id: number;
  progress: number;
  completion_date?: string;
}

interface ServiceRequest {
  id: number;
  name: string;
  service: string;
  date: string;
  status: string;
}

interface DetailedServiceRequest extends ServiceRequest {
  email: string;
  phone: string;
  company?: string;
  website?: string;
  project_details: string;
  budget_range: string;
  timeline: string;
  contact_method: string;
  additional_requirements?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor_name: string;
  duration_weeks: number;
  difficulty_level: string;
  category: string;
  price: number;
  thumbnail?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface Assignment {
  id: number;
  course_id: number;
  course_title: string;
  title: string;
  description?: string;
  due_date?: string;
  max_points: number;
  created_at: string;
}

interface Certificate {
  id: number;
  user_id: number;
  user_name: string;
  course_id: number;
  course_title: string;
  certificate_url: string;
  issued_date: string;
}

interface ContactMessage {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  created_at: string;
  status?: string;
}

interface CalendarEvent {
  id: number;
  user_id: number;
  user_name?: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  event_type: string;
  created_at: string;
}

// Modal component for forms
interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};

// Component for data tables
interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
  }[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
}

function DataTable<T extends { id: number }>({ data, columns, onRowClick, actions }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column, i) => (
              <th
                key={i}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item) => (
            <tr
              key={item.id}
              className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((column, i) => {
                const cellContent = typeof column.accessor === 'function'
                  ? column.accessor(item)
                  : item[column.accessor as keyof T];

                return (
                  <td
                    key={i}
                    className={`px-4 py-3 whitespace-nowrap ${column.className || ''}`}
                  >
                    {cellContent as React.ReactNode}
                  </td>
                );
              })}
              {actions && (
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div onClick={(e) => e.stopPropagation()}>
                    {actions(item)}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Component for action buttons
interface ActionButtonProps {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, className, children }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${className}`}
    >
      {children}
    </button>
  );
};

// Status badge component
interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  let baseClass = "inline-block px-2 py-1 text-xs rounded-full ";

  switch (status.toLowerCase()) {
    case 'active':
      baseClass += "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      break;
    case 'completed':
      baseClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      break;
    case 'pending':
      baseClass += "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      break;
    case 'in-process':
    case 'in-progress':
      baseClass += "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      break;
    case 'cancelled':
    case 'inactive':
      baseClass += "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      break;
    default:
      baseClass += "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }

  return (
    <span className={`${baseClass} ${className || ''}`}>
      {status}
    </span>
  );
};

// Main AdminDashboard component
const AdminDashboard: React.FC = () => {
  // State for dashboard overview
  const [adminStats, setAdminStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalRevenue: "₹0",
    pendingContacts: 0,
    pendingServiceRequests: 0
  });

  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation and management state
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [modalTitle, setModalTitle] = useState('');

  // Management data state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allCourses, setCourses] = useState<Course[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [allAssignments, setAssignments] = useState<Assignment[]>([]);
  const [allCertificates, setCertificates] = useState<Certificate[]>([]);
  const [allServiceRequests, setAllServiceRequests] = useState<DetailedServiceRequest[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeSection) {
      fetchSectionData(activeSection);
    }
  }, [activeSection]);

  const getAuthToken = () => {
    // Check multiple possible storage locations and keys
    const token = localStorage.getItem('token') ||
                 localStorage.getItem('authToken') ||
                 localStorage.getItem('accessToken') ||
                 sessionStorage.getItem('token') ||
                 sessionStorage.getItem('authToken');

    // Also check if token is stored as part of user object
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
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();

      if (!token) {
        console.warn('No token found, attempting to fetch without authentication');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';

      // Fetch all data in parallel
      const fetchPromises = [
        fetch(`${baseURL}/api/admin/dashboard-stats`, {
          method: 'GET',
          headers,
          credentials: 'include'
        }),
        fetch(`${baseURL}/api/admin/recent-users`, {
          method: 'GET',
          headers,
          credentials: 'include'
        }),
        fetch(`${baseURL}/api/admin/recent-enrollments`, {
          method: 'GET',
          headers,
          credentials: 'include'
        }),
        fetch(`${baseURL}/api/admin/service-requests`, {
          method: 'GET',
          headers,
          credentials: 'include'
        })
      ];

      const [statsRes, usersRes, enrollmentsRes, requestsRes] = await Promise.all(fetchPromises);

      // Check responses
      const responses = [
        { name: 'stats', res: statsRes },
        { name: 'users', res: usersRes },
        { name: 'enrollments', res: enrollmentsRes },
        { name: 'requests', res: requestsRes }
      ];

      for (const { name, res } of responses) {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Authentication failed. Please login again.');
          }
          const errorData = await res.text();
          console.error(`${name} error:`, errorData);
          throw new Error(`Failed to fetch ${name}: ${res.status}`);
        }
      }

      // Parse all responses
      const [statsData, usersData, enrollmentsData, requestsData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        enrollmentsRes.json(),
        requestsRes.json()
      ]);

      // Format revenue with Indian currency
      const formattedRevenue = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(statsData.totalRevenue || 0);

      setAdminStats({
        totalUsers: statsData.totalUsers || 0,
        totalCourses: statsData.totalCourses || 0,
        totalEnrollments: statsData.totalEnrollments || 0,
        totalRevenue: formattedRevenue,
        pendingContacts: statsData.pendingContacts || 0,
        pendingServiceRequests: statsData.pendingServiceRequests || 0
      });

      setRecentUsers(usersData || []);
      setRecentEnrollments(enrollmentsData || []);
      setServiceRequests(requestsData || []);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionData = async (section: string) => {
    try {
      setLoading(true);

      const token = getAuthToken();

      if (!token) {
        console.warn('No token found, attempting to fetch without authentication');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      let endpoint = '';

      switch (section) {
        case 'users':
          endpoint = '/api/admin/users';
          break;
        case 'courses':
          endpoint = '/api/admin/courses';
          break;
        case 'assignments':
          endpoint = '/api/admin/assignments';
          break;
        case 'enrollments':
          endpoint = '/api/admin/enrollments';
          break;
        case 'certificates':
          endpoint = '/api/admin/certificates';
          break;
        case 'services':
          endpoint = '/api/admin/service-categories';
          break;
        case 'contacts':
          endpoint = '/api/admin/contact-messages';
          break;
        case 'calendar':
          endpoint = '/api/admin/calendar-events';
          break;
        case 'service-requests':
          endpoint = '/api/admin/service-requests';
          break;
        default:
          throw new Error(`Unknown section: ${section}`);
      }

      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        // In development, if the endpoint isn't implemented yet, use mock data
        console.warn(`Failed to fetch ${section} data, using mock data instead`);
        populateMockData(section);
        setLoading(false);
        return;
      }

      const data = await response.json();

      switch (section) {
        case 'users':
          setAllUsers(data);
          break;
        case 'courses':
          setCourses(data);
          break;
        case 'assignments':
          setAssignments(data);
          break;
        case 'enrollments':
          setAllEnrollments(data);
          break;
        case 'certificates':
          setCertificates(data);
          break;
        case 'services':
          // Handle services data
          break;
        case 'contacts':
          setContactMessages(data);
          break;
        case 'calendar':
          setCalendarEvents(data);
          break;
        case 'service-requests':
          setAllServiceRequests(data);
          break;
      }

    } catch (err: any) {
      console.error(`Error fetching ${section} data:`, err);
      // Use mock data for development
      populateMockData(section);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to set mock data during development
  const populateMockData = (section: string) => {
    switch (section) {
      case 'users':
        setAllUsers([
          ...recentUsers.map(user => ({
            ...user,
            phone: '+91 9876543210',
            is_active: true,
            email_verified: true,
            created_at: user.created_at,
            updated_at: user.created_at
          }))
        ]);
        break;
      case 'courses':
        setCourses([
          {
            id: 1,
            title: 'Digital Marketing Fundamentals',
            description: 'Learn the basics of digital marketing',
            instructor_name: 'John Doe',
            duration_weeks: 8,
            difficulty_level: 'beginner',
            category: 'Marketing',
            price: 4999,
            thumbnail: 'course1.jpg',
            is_active: true,
            created_at: '15 Jun 2025',
            updated_at: '15 Jun 2025'
          },
          {
            id: 2,
            title: 'Advanced SEO Techniques',
            description: 'Master advanced SEO strategies',
            instructor_name: 'Jane Smith',
            duration_weeks: 6,
            difficulty_level: 'advanced',
            category: 'SEO',
            price: 6999,
            thumbnail: 'course2.jpg',
            is_active: true,
            created_at: '10 Jun 2025',
            updated_at: '10 Jun 2025'
          },
          {
            id: 3,
            title: 'Social Media Marketing',
            description: 'Comprehensive guide to social media marketing',
            instructor_name: 'Mike Johnson',
            duration_weeks: 4,
            difficulty_level: 'intermediate',
            category: 'Social Media',
            price: 3999,
            thumbnail: 'course3.jpg',
            is_active: true,
            created_at: '05 Jun 2025',
            updated_at: '05 Jun 2025'
          }
        ]);
        break;
      case 'assignments':
        setAssignments([
          {
            id: 1,
            course_id: 1,
            course_title: 'Digital Marketing Fundamentals',
            title: 'Create a Marketing Plan',
            description: 'Develop a comprehensive marketing plan for a fictional business',
            due_date: '30 Jul 2025',
            max_points: 100,
            created_at: '15 Jun 2025'
          },
          {
            id: 2,
            course_id: 1,
            course_title: 'Digital Marketing Fundamentals',
            title: 'Social Media Strategy',
            description: 'Create a social media strategy for a small business',
            due_date: '15 Aug 2025',
            max_points: 100,
            created_at: '16 Jun 2025'
          },
          {
            id: 3,
            course_id: 2,
            course_title: 'Advanced SEO Techniques',
            title: 'SEO Audit',
            description: 'Perform an SEO audit on a website of your choice',
            due_date: '20 Jul 2025',
            max_points: 100,
            created_at: '11 Jun 2025'
          }
        ]);
        break;
      case 'enrollments':
        setAllEnrollments([
          ...recentEnrollments.map((enrollment, index) => ({
            ...enrollment,
            user_id: index + 1,
            course_id: index + 1,
            progress: Math.floor(Math.random() * 100),
            completion_date: enrollment.status === 'completed' ? '01 Aug 2025' : undefined
          }))
        ]);
        break;
      case 'certificates':
        setCertificates([
          {
            id: 1,
            user_id: 1,
            user_name: 'John Doe',
            course_id: 1,
            course_title: 'Digital Marketing Fundamentals',
            certificate_url: '/certificates/cert1.pdf',
            issued_date: '05 Jul 2025'
          },
          {
            id: 2,
            user_id: 2,
            user_name: 'Jane Smith',
            course_id: 2,
            course_title: 'Advanced SEO Techniques',
            certificate_url: '/certificates/cert2.pdf',
            issued_date: '10 Jul 2025'
          }
        ]);
        break;
      case 'contacts':
        setContactMessages([
          {
            id: 1,
            first_name: 'Alex',
            last_name: 'Johnson',
            email: 'alex@example.com',
            phone: '+91 9876543210',
            company: 'Tech Solutions',
            message: 'I would like to discuss a potential project',
            created_at: '15 Jul 2025',
            status: 'pending'
          },
          {
            id: 2,
            first_name: 'Sarah',
            last_name: 'Williams',
            email: 'sarah@example.com',
            phone: '+91 9876543211',
            message: 'Interested in your digital marketing services',
            created_at: '14 Jul 2025',
            status: 'pending'
          }
        ]);
        break;
      case 'calendar':
        setCalendarEvents([
          {
            id: 1,
            user_id: 1,
            user_name: 'Admin',
            title: 'Marketing Webinar',
            description: 'Introduction to digital marketing strategies',
            event_date: '25 Jul 2025',
            event_time: '14:00',
            event_type: 'webinar',
            created_at: '10 Jul 2025'
          },
          {
            id: 2,
            user_id: 1,
            user_name: 'Admin',
            title: 'SEO Workshop',
            description: 'Hands-on workshop for SEO optimization',
            event_date: '28 Jul 2025',
            event_time: '10:00',
            event_type: 'workshop',
            created_at: '11 Jul 2025'
          }
        ]);
        break;
      case 'service-requests':
        setAllServiceRequests([
          ...serviceRequests.map((request, index) => ({
            ...request,
            email: `client${index + 1}@example.com`,
            phone: `+91 987654321${index}`,
            company: `Company ${index + 1}`,
            project_details: 'Need help with digital marketing strategy',
            budget_range: '₹10,000 - ₹20,000',
            timeline: '1-2 months',
            contact_method: 'email',
            additional_requirements: 'Would like weekly progress reports'
          }))
        ]);
        break;
    }
  };

  // Create/Update/Delete operations
  const handleCreateItem = async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      let endpoint = '';

      switch (activeSection) {
        case 'users':
          endpoint = '/api/admin/users';
          break;
        case 'courses':
          endpoint = '/api/admin/courses';
          break;
        case 'assignments':
          endpoint = '/api/admin/assignments';
          break;
        case 'certificates':
          endpoint = '/api/admin/certificates';
          break;
        case 'contacts':
          endpoint = '/api/admin/contact-messages';
          break;
        case 'calendar':
          endpoint = '/api/admin/calendar-events';
          break;
        case 'service-requests':
          endpoint = '/api/admin/service-requests';
          break;
      }

      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to create item');
      }

      // Refresh the data
      fetchSectionData(activeSection!);

      // Close the modal
      setIsModalOpen(false);

    } catch (err: any) {
      console.error(`Error creating ${activeSection}:`, err);
      alert(`Failed to create: ${err.message}`);

      // For development, mock successful creation
      if (process.env.NODE_ENV === 'development') {
        fetchSectionData(activeSection!);
        setIsModalOpen(false);
      }
    }
  };

  const handleUpdateItem = async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      let endpoint = '';

      switch (activeSection) {
        case 'users':
          endpoint = `/api/admin/users/${selectedItemId}`;
          break;
        case 'courses':
          endpoint = `/api/admin/courses/${selectedItemId}`;
          break;
        case 'assignments':
          endpoint = `/api/admin/assignments/${selectedItemId}`;
          break;
        case 'certificates':
          endpoint = `/api/admin/certificates/${selectedItemId}`;
          break;
        case 'contacts':
          endpoint = `/api/admin/contact-messages/${selectedItemId}`;
          break;
        case 'calendar':
          endpoint = `/api/admin/calendar-events/${selectedItemId}`;
          break;
        case 'service-requests':
          endpoint = `/api/admin/service-requests/${selectedItemId}`;
          break;
      }

      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update item');
      }

      // Refresh the data
      fetchSectionData(activeSection!);

      // Close the modal
      setIsModalOpen(false);

    } catch (err: any) {
      console.error(`Error updating ${activeSection}:`, err);
      alert(`Failed to update: ${err.message}`);

      // For development, mock successful update
      if (process.env.NODE_ENV === 'development') {
        fetchSectionData(activeSection!);
        setIsModalOpen(false);
      }
    }
  };

  const handleDeleteItem = async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      let endpoint = '';

      switch (activeSection) {
        case 'users':
          endpoint = `/api/admin/users/${selectedItemId}`;
          break;
        case 'courses':
          endpoint = `/api/admin/courses/${selectedItemId}`;
          break;
        case 'assignments':
          endpoint = `/api/admin/assignments/${selectedItemId}`;
          break;
        case 'certificates':
          endpoint = `/api/admin/certificates/${selectedItemId}`;
          break;
        case 'contacts':
          endpoint = `/api/admin/contact-messages/${selectedItemId}`;
          break;
        case 'calendar':
          endpoint = `/api/admin/calendar-events/${selectedItemId}`;
          break;
        case 'service-requests':
          endpoint = `/api/admin/service-requests/${selectedItemId}`;
          break;
      }

      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete item');
      }

      // Refresh the data
      fetchSectionData(activeSection!);

      // Close the modal
      setIsModalOpen(false);

    } catch (err: any) {
      console.error(`Error deleting ${activeSection}:`, err);
      alert(`Failed to delete: ${err.message}`);

      // For development, mock successful deletion
      if (process.env.NODE_ENV === 'development') {
        fetchSectionData(activeSection!);
        setIsModalOpen(false);
      }
    }
  };

  // Navigation handlers
  const handleManagementClick = (sectionId: string) => {
    setActiveTab('management');
    setActiveSection(sectionId);
    setViewMode('list');
    setSelectedItemId(null);
  };

  const handleItemClick = (itemId: number) => {
    setSelectedItemId(itemId);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedItemId(null);
  };

  const handleOpenModal = (type: 'create' | 'edit' | 'delete', itemId?: number) => {
    setModalType(type);

    if (itemId) {
      setSelectedItemId(itemId);

      // Populate form data for editing
      let itemData;
      switch (activeSection) {
        case 'users':
          itemData = allUsers.find(u => u.id === itemId);
          break;
        case 'courses':
          itemData = allCourses.find(c => c.id === itemId);
          break;
        case 'assignments':
          itemData = allAssignments.find(a => a.id === itemId);
          break;
        case 'certificates':
          itemData = allCertificates.find(c => c.id === itemId);
          break;
        case 'contacts':
          itemData = contactMessages.find(m => m.id === itemId);
          break;
        case 'calendar':
          itemData = calendarEvents.find(e => e.id === itemId);
          break;
        case 'service-requests':
          itemData = allServiceRequests.find(r => r.id === itemId);
          break;
      }

      if (itemData) {
        setFormData(itemData || {});
      }
    } else {
      // Reset form data for create
      setFormData({});
    }

    // Set modal title
    switch (type) {
      case 'create':
        setModalTitle(`Create New ${activeSection?.slice(0, -1)}`);
        break;
      case 'edit':
        setModalTitle(`Edit ${activeSection?.slice(0, -1)}`);
        break;
      case 'delete':
        setModalTitle(`Delete ${activeSection?.slice(0, -1)}`);
        break;
    }

    setIsModalOpen(true);
  };

  const handleRetry = () => {
    fetchDashboardData();
  };

  // Filtering and search
  const getFilteredData = (section: string) => {
    let data: any[] = [];

    switch (section) {
      case 'users':
        data = allUsers;
        break;
      case 'courses':
        data = allCourses;
        break;
      case 'assignments':
        data = allAssignments;
        break;
      case 'enrollments':
        data = allEnrollments;
        break;
      case 'certificates':
        data = allCertificates;
        break;
      case 'contacts':
        data = contactMessages;
        break;
      case 'calendar':
        data = calendarEvents;
        break;
      case 'service-requests':
        data = allServiceRequests;
        break;
    }

    // Apply search
    if (searchTerm) {
      data = data.filter(item => {
        // Search through all string properties
        return Object.values(item).some(value =>
          typeof value === 'string' &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply filters
    if (selectedFilter !== 'all') {
      switch (section) {
        case 'users':
          if (selectedFilter === 'active') {
            data = data.filter(user => user.is_active);
          } else if (selectedFilter === 'inactive') {
            data = data.filter(user => !user.is_active);
          } else {
            data = data.filter(user => user.account_type === selectedFilter);
          }
          break;
        case 'courses':
          if (selectedFilter === 'active') {
            data = data.filter(course => course.is_active);
          } else if (selectedFilter === 'inactive') {
            data = data.filter(course => !course.is_active);
          } else {
            data = data.filter(course => course.difficulty_level === selectedFilter);
          }
          break;
        case 'assignments':
          // Filter by course_id or other relevant field
          data = data.filter(assignment => assignment.course_id.toString() === selectedFilter);
          break;
        case 'enrollments':
          data = data.filter(enrollment => enrollment.status === selectedFilter);
          break;
        case 'service-requests':
          data = data.filter(request => request.status === selectedFilter);
          break;
      }
    }

    return data;
  };

  // Render section content
  const renderSectionContent = () => {
    if (!activeSection) return null;

    if (viewMode === 'list') {
      return renderListView();
    } else {
      return renderDetailView();
    }
  };

  const renderListView = () => {
    const filteredData = getFilteredData(activeSection!);

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold">{managementSections.find(s => s.id === activeSection)?.title}</h2>

          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {renderFilterDropdown()}

            <button
              onClick={() => handleOpenModal('create')}
              className="flex items-center justify-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              <Plus size={16} />
              <span>Add New</span>
            </button>
          </div>
        </div>

        {renderDataTable()}
      </div>
    );
  };

  const renderFilterDropdown = () => {
    let options: { value: string; label: string }[] = [
      { value: 'all', label: 'All' }
    ];

    switch (activeSection) {
      case 'users':
        options = [
          { value: 'all', label: 'All Users' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'student', label: 'Students' },
          { value: 'professional', label: 'Professionals' },
          { value: 'business', label: 'Business' },
          { value: 'agency', label: 'Agency' }
        ];
        break;
      case 'courses':
        options = [
          { value: 'all', label: 'All Courses' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'beginner', label: 'Beginner' },
          { value: 'intermediate', label: 'Intermediate' },
          { value: 'advanced', label: 'Advanced' }
        ];
        break;
      case 'enrollments':
        options = [
          { value: 'all', label: 'All Enrollments' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
        break;
      case 'service-requests':
        options = [
          { value: 'all', label: 'All Requests' },
          { value: 'pending', label: 'Pending' },
          { value: 'in-process', label: 'In Process' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
        break;
    }

    return (
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderDataTable = () => {
    const filteredData = getFilteredData(activeSection!);

    switch (activeSection) {
      case 'users':
        return (
          <DataTable<User>
            data={filteredData}
            columns={[
              { header: 'Name', accessor: (user) => `${user.first_name} ${user.last_name}` },
              { header: 'Email', accessor: 'email' },
              { header: 'Account Type', accessor: 'account_type' },
              {
                header: 'Status',
                accessor: (user) => (
                  <StatusBadge status={user.is_active ? 'Active' : 'Inactive'} />
                )
              },
              { header: 'Join Date', accessor: 'created_at' }
            ]}
            onRowClick={(user) => handleItemClick(user.id)}
            actions={(user) => (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('edit', user.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Edit size={16} className="text-blue-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('delete', user.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            )}
          />
        );
      case 'courses':
        return (
          <DataTable<Course>
            data={filteredData}
            columns={[
              { header: 'Title', accessor: 'title' },
              { header: 'Instructor', accessor: 'instructor_name' },
              {
                header: 'Price',
                accessor: (course) => `₹${course.price.toLocaleString()}`
              },
              {
                header: 'Difficulty',
                accessor: (course) => (
                  <span className="capitalize">{course.difficulty_level}</span>
                )
              },
              {
                header: 'Status',
                accessor: (course) => (
                  <StatusBadge status={course.is_active ? 'Active' : 'Inactive'} />
                )
              }
            ]}
            onRowClick={(course) => handleItemClick(course.id)}
            actions={(course) => (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('edit', course.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Edit size={16} className="text-blue-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('delete', course.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            )}
          />
        );
      case 'assignments':
        return (
          <DataTable<Assignment>
            data={filteredData}
            columns={[
              { header: 'Title', accessor: 'title' },
              { header: 'Course', accessor: 'course_title' },
              { header: 'Due Date', accessor: 'due_date' },
              {
                header: 'Max Points',
                accessor: (assignment) => assignment.max_points.toString()
              },
              { header: 'Created', accessor: 'created_at' }
            ]}
            onRowClick={(assignment) => handleItemClick(assignment.id)}
            actions={(assignment) => (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('edit', assignment.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Edit size={16} className="text-blue-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('delete', assignment.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            )}
          />
        );
      case 'enrollments':
        return (
          <DataTable<Enrollment>
            data={filteredData}
            columns={[
              { header: 'Student', accessor: 'user_name' },
              { header: 'Course', accessor: 'course_name' },
              {
                header: 'Progress',
                accessor: (enrollment) => (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>
                )
              },
              {
                header: 'Status',
                accessor: (enrollment) => (
                  <StatusBadge status={enrollment.status} />
                )
              },
              { header: 'Enrollment Date', accessor: 'date' }
            ]}
            onRowClick={(enrollment) => handleItemClick(enrollment.id)}
            actions={(enrollment) => (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('edit', enrollment.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Edit size={16} className="text-blue-500" />
                </button>
              </div>
            )}
          />
        );
      case 'certificates':
        return (
          <DataTable<Certificate>
            data={filteredData}
            columns={[
              { header: 'Student', accessor: 'user_name' },
              { header: 'Course', accessor: 'course_title' },
              { header: 'Issued Date', accessor: 'issued_date' },
              {
                header: 'Certificate',
                accessor: (cert) => (
                  <a
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Certificate
                  </a>
                )
              }
            ]}
            onRowClick={(cert) => handleItemClick(cert.id)}
            actions={(cert) => (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(cert.certificate_url, '_blank');
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Download size={16} className="text-green-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('delete', cert.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            )}
          />
        );
      case 'contacts':
        return (
          <DataTable<ContactMessage>
            data={filteredData}
            columns={[
              { header: 'Name', accessor: (msg) => `${msg.first_name} ${msg.last_name}` },
              { header: 'Email', accessor: 'email' },
              {
                header: 'Message',
                accessor: (msg) => (
                  <div className="max-w-xs truncate">{msg.message}</div>
                )
              },
              { header: 'Date', accessor: 'created_at' },
              {
                header: 'Status',
                accessor: (msg) => (
                  <StatusBadge status={msg.status || 'pending'} />
                )
              }
            ]}
            onRowClick={(msg) => handleItemClick(msg.id)}
            actions={(msg) => (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('edit', msg.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Edit size={16} className="text-blue-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('delete', msg.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            )}
          />
        );
      case 'calendar':
        return (
          <DataTable<CalendarEvent>
            data={filteredData}
            columns={[
              { header: 'Title', accessor: 'title' },
              {
                header: 'Description',
                accessor: (event) => (
                  <div className="max-w-xs truncate">{event.description || 'No description'}</div>
                )
              },
              { header: 'Date', accessor: 'event_date' },
              { header: 'Time', accessor: (event) => event.event_time || 'All day' },
              {
                header: 'Type',
                accessor: (event) => (
                  <span className="capitalize">{event.event_type}</span>
                )
              }
            ]}
            onRowClick={(event) => handleItemClick(event.id)}
            actions={(event) => (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('edit', event.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Edit size={16} className="text-blue-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('delete', event.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            )}
          />
        );
      case 'service-requests':
        return (
          <DataTable<ServiceRequest>
            data={filteredData}
            columns={[
              { header: 'Client', accessor: 'name' },
              { header: 'Service', accessor: 'service' },
              { header: 'Date', accessor: 'date' },
              {
                header: 'Status',
                accessor: (request) => (
                  <StatusBadge status={request.status} />
                )
              }
            ]}
            onRowClick={(request) => handleItemClick(request.id)}
            actions={(request) => (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('edit', request.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Edit size={16} className="text-blue-500" />
                </button>
              </div>
            )}
          />
        );
      default:
        return <p>Select a management section</p>;
    }
  };

  const renderDetailView = () => {
    if (!selectedItemId) return null;

    let item;
    let content;

    switch (activeSection) {
      case 'users':
        item = allUsers.find(u => u.id === selectedItemId);
        if (!item) return <p>User not found</p>;

        content = (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{`${item.first_name} ${item.last_name}`}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.email}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal('edit', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleOpenModal('delete', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Basic Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Account Type:</span>
                    <span className="font-medium">{item.account_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="font-medium">{item.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <StatusBadge status={item.is_active ? 'Active' : 'Inactive'} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email Verified:</span>
                    <span className="font-medium">{item.email_verified ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Joined:</span>
                    <span className="font-medium">{item.created_at}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Additional Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Company:</span>
                    <span className="font-medium">{item.company || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Website:</span>
                    <span className="font-medium">{item.website || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        break;

      case 'courses':
        item = allCourses.find(c => c.id === selectedItemId);
        if (!item) return <p>Course not found</p>;

        content = (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">Instructor: {item.instructor_name}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal('edit', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleOpenModal('delete', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Course Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                    <span className="font-medium capitalize">{item.difficulty_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium">{item.duration_weeks} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Price:</span>
                    <span className="font-medium">₹{item.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <StatusBadge status={item.is_active ? 'Active' : 'Inactive'} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Description</h4>
                <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
            </div>

            {item.thumbnail && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Course Thumbnail</h4>
                <div className="w-full max-w-xs mx-auto">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              </div>
            )}
          </div>
        );
        break;

      case 'assignments':
        item = allAssignments.find(a => a.id === selectedItemId);
        if (!item) return <p>Assignment not found</p>;

        content = (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">Course: {item.course_title}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal('edit', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleOpenModal('delete', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Assignment Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
                    <span className="font-medium">{item.due_date || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Max Points:</span>
                    <span className="font-medium">{item.max_points}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="font-medium">{item.created_at}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Description</h4>
                <p className="text-gray-600 dark:text-gray-400">{item.description || 'No description provided'}</p>
              </div>
            </div>
          </div>
        );
        break;

      case 'enrollments':
        item = allEnrollments.find(e => e.id === selectedItemId);
        if (!item) return <p>Enrollment not found</p>;

        content = (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Enrollment Details</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.user_name} - {item.course_name}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal('edit', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Enrollment Information</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Enrollment Date:</span>
                      <span className="font-medium">{item.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Completion Date:</span>
                      <span className="font-medium">{item.completion_date || 'Not completed'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-gray-600 dark:text-gray-400">Progress:</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm text-gray-600 dark:text-gray-400">{item.progress}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Associated Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Student ID:</span>
                    <span className="font-medium">{item.user_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Course ID:</span>
                    <span className="font-medium">{item.course_id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        break;

      case 'certificates':
        item = allCertificates.find(c => c.id === selectedItemId);
        if (!item) return <p>Certificate not found</p>;

        content = (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Certificate Details</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.course_title} - {item.user_name}
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href={item.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  <Download size={16} />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => handleOpenModal('delete', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Certificate Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Student:</span>
                    <span className="font-medium">{item.user_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Course:</span>
                    <span className="font-medium">{item.course_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Issued Date:</span>
                    <span className="font-medium">{item.issued_date}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Certificate Preview</h4>
                <div className="flex flex-col items-center">
                  <a
                    href={item.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-center w-48 h-48 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                      <Award size={64} className="text-orange-500" />
                    </div>
                    <p className="mt-2 text-center text-sm text-blue-500">View Certificate</p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
        break;

      case 'contacts':
        item = contactMessages.find(m => m.id === selectedItemId);
        if (!item) return <p>Message not found</p>;

        content = (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Contact Message</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  From: {item.first_name} {item.last_name}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal('edit', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Edit size={16} />
                  <span>Edit Status</span>
                </button>
                <button
                  onClick={() => handleOpenModal('delete', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium">{item.first_name} {item.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium">{item.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="font-medium">{item.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Company:</span>
                    <span className="font-medium">{item.company || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="font-medium">{item.created_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <StatusBadge status={item.status || 'pending'} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Message</h4>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.message}</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Response Actions</h4>
              <div className="space-y-3">
                <a
                  href={`mailto:${item.email}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Mail size={16} />
                  <span>Reply via Email</span>
                </a>
                {item.phone && (
                  <a
                    href={`tel:${item.phone}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    <Phone size={16} />
                    <span>Call</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        );
        break;

      case 'calendar':
        item = calendarEvents.find(e => e.id === selectedItemId);
        if (!item) return <p>Event not found</p>;

        content = (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.event_date} {item.event_time ? `at ${item.event_time}` : ''}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal('edit', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleOpenModal('delete', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Event Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-medium capitalize">{item.event_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="font-medium">{item.event_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time:</span>
                    <span className="font-medium">{item.event_time || 'All day'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="font-medium">{item.created_at}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Description</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>
        );
        break;

      case 'service-requests':
        item = allServiceRequests.find(r => r.id === selectedItemId);
        if (!item) return <p>Service request not found</p>;

        content = (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Service Request</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.name} - {item.service}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal('edit', item!.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Edit size={16} />
                  <span>Update Status</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Client Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium">{item.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="font-medium">{item.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Company:</span>
                    <span className="font-medium">{item.company || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Website:</span>
                    <span className="font-medium">{item.website || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Request Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Service:</span>
                    <span className="font-medium">{item.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                    <span className="font-medium">{item.budget_range}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Timeline:</span>
                    <span className="font-medium">{item.timeline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="font-medium">{item.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Contact Method:</span>
                    <span className="font-medium capitalize">{item.contact_method}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Project Details</h4>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line mb-4">
                {item.project_details}
              </p>

              {item.additional_requirements && (
                <>
                  <h5 className="font-medium mb-2">Additional Requirements</h5>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {item.additional_requirements}
                  </p>
                </>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Contact Actions</h4>
              <div className="space-y-3">
                <a
                  href={`mailto:${item.email}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Mail size={16} />
                  <span>Email Client</span>
                </a>
                <a
                  href={`tel:${item.phone}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  <Phone size={16} />
                  <span>Call Client</span>
                </a>
              </div>
            </div>
          </div>
        );
        break;

      default:
        content = <p>Detail view not implemented for this section</p>;
    }

    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToList}
          className="flex items-center text-blue-500 hover:text-blue-600"
        >
          <ChevronLeft size={16} className="mr-1" />
          <span>Back to list</span>
        </button>

        {content}
      </div>
    );
  };

  // Render modals
  const renderModal = () => {
    if (!isModalOpen) return null;

    if (modalType === 'delete') {
      return (
        <Modal isOpen={isModalOpen} title={modalTitle} onClose={() => setIsModalOpen(false)}>
          <div className="space-y-4">
            <p>Are you sure you want to delete this item? This action cannot be undone.</p>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    // Create or Edit modals
    return (
      <Modal
        isOpen={isModalOpen}
        title={modalTitle}
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <div className="space-y-6">
          {renderFormFields()}

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={modalType === 'create' ? handleCreateItem : handleUpdateItem}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center gap-1"
            >
              <Save size={16} />
              <span>{modalType === 'create' ? 'Create' : 'Update'}</span>
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Form fields based on section
  const renderFormFields = () => {
    switch (activeSection) {
      case 'users':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Type
                </label>
                <select
                  value={formData.account_type || ''}
                  onChange={(e) => setFormData({...formData, account_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="">Select account type</option>
                  <option value="student">Student</option>
                  <option value="professional">Professional</option>
                  <option value="business">Business</option>
                  <option value="agency">Agency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.is_active !== undefined ? (formData.is_active ? "1" : "0") : ''}
                  onChange={(e) => setFormData({...formData, is_active: e.target.value === "1"})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <input
                type="text"
                value={formData.company || ''}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website
              </label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
          </>
        );

      case 'courses':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course Title
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instructor Name
              </label>
              <input
                type="text"
                value={formData.instructor_name || ''}
                onChange={(e) => setFormData({...formData, instructor_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty_level || ''}
                  onChange={(e) => setFormData({...formData, difficulty_level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="">Select difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (Weeks)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_weeks || ''}
                  onChange={(e) => setFormData({...formData, duration_weeks: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.is_active !== undefined ? (formData.is_active ? "1" : "0") : ''}
                  onChange={(e) => setFormData({...formData, is_active: e.target.value === "1"})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Thumbnail URL
              </label>
              <input
                type="text"
                value={formData.thumbnail || ''}
                onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </>
        );

      case 'assignments':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assignment Title
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course
              </label>
              <select
                value={formData.course_id || ''}
                onChange={(e) => setFormData({...formData, course_id: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                <option value="">Select course</option>
                {allCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Points
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.max_points || ''}
                  onChange={(e) => setFormData({...formData, max_points: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>
          </>
        );

      case 'enrollments':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User
                </label>
                <select
                  value={formData.user_id || ''}
                  onChange={(e) => setFormData({...formData, user_id: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="">Select user</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course
                </label>
                <select
                  value={formData.course_id || ''}
                  onChange={(e) => setFormData({...formData, course_id: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="">Select course</option>
                  {allCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || ''}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="">Select status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress || ''}
                  onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>

            {formData.status === 'completed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Completion Date
                </label>
                <input
                  type="date"
                  value={formData.completion_date || ''}
                  onChange={(e) => setFormData({...formData, completion_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            )}
          </>
        );

      case 'certificates':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User
                </label>
                <select
                  value={formData.user_id || ''}
                  onChange={(e) => setFormData({...formData, user_id: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="">Select user</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course
                </label>
                <select
                  value={formData.course_id || ''}
                  onChange={(e) => setFormData({...formData, course_id: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="">Select course</option>
                  {allCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Certificate URL
              </label>
              <input
                type="text"
                value={formData.certificate_url || ''}
                onChange={(e) => setFormData({...formData, certificate_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                placeholder="/certificates/example.pdf"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Issued Date
              </label>
              <input
                type="date"
                value={formData.issued_date ? formData.issued_date.split(' ')[0] : ''}
                onChange={(e) => setFormData({...formData, issued_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
          </>
        );

      case 'contacts':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message
              </label>
              <textarea
                value={formData.message || ''}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status || 'pending'}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </>
        );

      case 'calendar':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Title
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={formData.event_date || ''}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Time
                </label>
                <input
                  type="time"
                  value={formData.event_time || ''}
                  onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Type
              </label>
              <select
                value={formData.event_type || 'custom'}
                onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                <option value="custom">Custom</option>
                <option value="webinar">Webinar</option>
                <option value="workshop">Workshop</option>
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
          </>
        );

      case 'service-requests':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status || ''}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="in-process">In Process</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service
                </label>
                <input
                  type="text"
                  value={formData.service || ''}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Details
              </label>
              <textarea
                value={formData.project_details || ''}
                onChange={(e) => setFormData({...formData, project_details: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Budget Range
                </label>
                <input
                  type="text"
                  value={formData.budget_range || ''}
                  onChange={(e) => setFormData({...formData, budget_range: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timeline
                </label>
                <input
                  type="text"
                  value={formData.timeline || ''}
                  onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Method
                </label>
                <select
                  value={formData.contact_method || ''}
                  onChange={(e) => setFormData({...formData, contact_method: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Requirements
              </label>
              <textarea
                value={formData.additional_requirements || ''}
                onChange={(e) => setFormData({...formData, additional_requirements: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
          </>
        );

      default:
        return <p>Form not implemented for this section</p>;
    }
  };

  // Main rendering logic
  const managementSections = [
    { id: 'users', title: 'User Management', icon: Users, color: 'blue' },
    { id: 'courses', title: 'Course Management', icon: BookOpen, color: 'green' },
    { id: 'assignments', title: 'Assignment Management', icon: FileText, color: 'purple' },
    { id: 'enrollments', title: 'Enrollment Management', icon: UserCheck, color: 'indigo' },
    { id: 'certificates', title: 'Certificate Management', icon: Award, color: 'yellow' },
    { id: 'services', title: 'Service Management', icon: Briefcase, color: 'pink' },
    { id: 'contacts', title: 'Contact Messages', icon: Mail, color: 'red' },
    { id: 'calendar', title: 'Calendar Events', icon: Calendar, color: 'teal' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
      </div>
    );
  }

  if (error && activeTab === 'overview') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto mt-8">
        <div className="flex items-center mb-4">
          <AlertCircle className="text-red-500 mr-2" size={24} />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
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
            onClick={() => {
              setActiveTab('overview');
              setActiveSection(null);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('management');
              if (!activeSection) setActiveSection('users');
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

      {activeTab === 'overview' ? (
        <>
          {/* Admin Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Users"
              value={adminStats.totalUsers!}
              icon={<Users size={20} />}
              color="from-blue-500 to-blue-400"
            />
            <StatCard
              title="Total Courses"
              value={adminStats.totalCourses!}
              icon={<BookOpen size={20} />}
              color="from-green-500 to-green-400"
            />
            <StatCard
              title="Total Enrollments"
              value={adminStats.totalEnrollments!}
              icon={<UserCheck size={20} />}
              color="from-purple-500 to-purple-400"
            />
            <StatCard
              title="Total Revenue"
              value={adminStats.totalRevenue!}
              icon={<BarChart size={20} />}
              color="from-orange-500 to-orange-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Users */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Recent Users</h2>
                <button
                  onClick={() => handleManagementClick('users')}
                  className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
                >
                  Manage <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
              <div className="space-y-4">
                {recentUsers.length > 0 ? (
                  recentUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium">{`${user.first_name} ${user.last_name}`}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                          {user.account_type}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.created_at}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent users</p>
                )}
              </div>
            </div>

            {/* Recent Enrollments */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Recent Enrollments</h2>
                <button
                  onClick={() => handleManagementClick('enrollments')}
                  className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
                >
                  Manage <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
              <div className="space-y-4">
                {recentEnrollments.length > 0 ? (
                  recentEnrollments.map(enrollment => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium">{enrollment.user_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{enrollment.course_name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          enrollment.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : enrollment.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}>
                          {enrollment.status}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{enrollment.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent enrollments</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Requests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Service Requests</h2>
              <button
                onClick={() => handleManagementClick('service-requests')}
                className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
              >
                Manage <ChevronRight size={18} className="ml-1" />
              </button>
            </div>
            <div className="space-y-4">
              {serviceRequests.length > 0 ? (
                serviceRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium">{request.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.service}</p>
                      </div>
                <div className="text-right">
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : request.status === 'in-process'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {request.status}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{request.date}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No service requests</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              handleManagementClick('courses');
              setTimeout(() => handleOpenModal('create'), 100);
            }}
            className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors"
          >
            <PlusCircle size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Add Course</p>
          </button>
          <button
            onClick={() => handleManagementClick('users')}
            className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors"
          >
            <Users size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Manage Users</p>
          </button>
          <button
            onClick={() => handleManagementClick('contacts')}
            className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors"
          >
            <MessageSquare size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">View Messages</p>
          </button>
          <button
            onClick={() => handleManagementClick('assignments')}
            className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors"
          >
            <GraduationCap size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Assignments</p>
          </button>
        </div>
      </div>
    </>
  ) : (
    /* Management Tools Tab */
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full md:w-64 space-y-2">
        {managementSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setViewMode('list');
                setSelectedItemId(null);
              }}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                activeSection === section.id
                  ? `bg-${section.color}-50 text-${section.color}-700 dark:bg-${section.color}-900/20 dark:text-${section.color}-300`
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={20} className={`mr-3 ${activeSection === section.id ? `text-${section.color}-500` : ''}`} />
              <span>{section.title}</span>
            </button>
          );
        })

        }

        {/* Additional button for Service Requests */}
        <button
          onClick={() => {
            setActiveSection('service-requests');
            setViewMode('list');
            setSelectedItemId(null);
          }}
          className={`w-full flex items-center p-3 rounded-lg transition-colors ${
            activeSection === 'service-requests'
              ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <MessageSquare size={20} className={`mr-3 ${activeSection === 'service-requests' ? 'text-yellow-500' : ''}`} />
          <span>Service Requests</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        {renderSectionContent()}
      </div>
    </div>
  )}

  {/* Modals */}
  {renderModal()}
</div>
); };

export default AdminDashboard;