// src/components/dashboard/role-specific/AgencyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Target, 
  MessageSquare, 
  Clock, 
  Calendar,
  Settings,
  Moon,
  Sun,
  LogOut,
  FolderOpen,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Star,
  ArrowRight,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  Building
} from 'lucide-react';
import StatCard from '../common/StatCard';
import { User, UserStats } from '../../../lib/types';
import { useAuth } from '../../../hooks/use-auth';

interface AgencyDashboardProps {
  user: User;
  stats: UserStats;
}

// Service interface matching the backend response
interface Service {
  id: string;
  name: string;
  category_id: string;
  categoryName: string;
  description: string;
  price: number;
  duration: string;
  rating: number;
  reviews: number;
  features: string[];
  popular: boolean;
}

// Service Request interface matching backend
interface ServiceRequest {
  id: number;
  userId: number;
  categoryId: string;
  categoryName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  requestDate: string;
  projectDetails: string;
  budgetRange: string;
  timeline: string;
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  website?: string;
  contactMethod: string;
  additionalRequirements?: string;
}

const AgencyDashboard: React.FC<AgencyDashboardProps> = ({ user, stats }) => {
  const { token, isAuthenticated } = useAuth();
  
  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  
  // Service Requests state
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  
  // UI state
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'my-requests' | 'calendar' | 'resources' | 'settings'>('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Request submission state
  const [requestSubmissionStatus, setRequestSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [requestSubmissionMessage, setRequestSubmissionMessage] = useState<string>('');

  // Pagination state
  const [currentPageServices, setCurrentPageServices] = useState(1);
  const itemsPerPageServices = 6;

  // ✅ Fetch Services from API
  useEffect(() => {
    const fetchServices = async () => {
      if (!isAuthenticated || !token) {
        setServicesLoading(false);
        return;
      }
      
      setServicesLoading(true);
      setServicesError(null);
      
      try {
        const response = await fetch(`https://localhost:5000/api/services`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data: Service[] = await response.json();
        setServices(data);
      } catch (err: any) {
        console.error("Failed to fetch services:", err);
        setServicesError("Failed to load services. Please try again later.");
      } finally {
        setServicesLoading(false);
      }
    };
    
    fetchServices();
  }, [token, isAuthenticated]);

  // ✅ Fetch Service Requests from API
  useEffect(() => {
    const fetchServiceRequests = async () => {
      if (!isAuthenticated || !user?.id || !token) {
        setRequestsLoading(false);
        return;
      }
      
      setRequestsLoading(true);
      setRequestsError(null);
      
      try {
        const response = await fetch(`https://localhost:5000/api/users/${user.id}/service-requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data: ServiceRequest[] = await response.json();
        setServiceRequests(data);
      } catch (err: any) {
        console.error("Failed to fetch service requests:", err);
        setRequestsError("Failed to load your service requests. Please try again later.");
      } finally {
        setRequestsLoading(false);
      }
    };
    
    fetchServiceRequests();
  }, [user?.id, token, isAuthenticated]);

  // ✅ Handle Service Request Submission
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
        categoryId: selectedService.category_id,
        ...requestData
      };

      const response = await fetch(`https://localhost:5000/api/service-requests`, {
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

      // Add to local state
      const newRequest: ServiceRequest = {
        id: result.id || Date.now(),
        userId: user.id,
        categoryId: selectedService.category_id,
        categoryName: selectedService.categoryName,
        status: 'pending',
        requestDate: new Date().toISOString(),
        ...requestData
      };
      
      setServiceRequests(prev => [newRequest, ...prev]);
      setRequestSubmissionStatus('success');
      setRequestSubmissionMessage(result.message || 'Service request submitted successfully!');
      
      // Switch to my-requests tab after 1.5 seconds
      setTimeout(() => {
        setShowRequestModal(false);
        setSelectedService(null);
        setActiveTab('my-requests');
        setRequestSubmissionStatus('idle');
      }, 1500);
      
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-800';
      case 'in-progress': return 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-800';
      case 'completed': return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-800';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-800';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700';
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Filter and paginate services
  const filteredServices = services.filter(service => {
    const matchesFilter = serviceFilter === 'all' || service.categoryName === serviceFilter;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const indexOfLastService = currentPageServices * itemsPerPageServices;
  const indexOfFirstService = indexOfLastService - itemsPerPageServices;
  const paginatedServices = filteredServices.slice(indexOfFirstService, indexOfLastService);
  const totalPagesServices = Math.ceil(filteredServices.length / itemsPerPageServices);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPageServices(1);
  }, [serviceFilter, searchQuery]);

  // Combined loading state
  const initialLoading = servicesLoading || requestsLoading;

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="ml-3 text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
            Grow your agency with our comprehensive digital marketing services.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'services' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('services')}
          >
            Available Services
          </button>
          <button
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'my-requests' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('my-requests')}
          >
            My Requests ({serviceRequests.length})
          </button>
        </div>

        {activeTab === 'services' && (
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
                  {Array.from(new Set(services.map(s => s.categoryName))).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Services Grid */}
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
              ) : paginatedServices.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-orange-400" />
                  <p>No services found matching your criteria.</p>
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
                      {Array.isArray(service.features) && service.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{service.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{service.duration}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedService(service);
                          setShowRequestModal(true);
                          setRequestSubmissionStatus('idle');
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

            {/* Pagination */}
            {filteredServices.length > itemsPerPageServices && (
              <div className="flex justify-center items-center space-x-2 mt-4 mb-8">
                <button
                  onClick={() => setCurrentPageServices(prev => Math.max(prev - 1, 1))}
                  disabled={currentPageServices === 1}
                  className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                {Array.from({ length: totalPagesServices }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPageServices(page)}
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
                  onClick={() => setCurrentPageServices(prev => Math.min(prev + 1, totalPagesServices))}
                  disabled={currentPageServices === totalPagesServices}
                  className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'my-requests' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
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
            ) : serviceRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Mail className="w-10 h-10 mx-auto mb-3 text-orange-400" />
                <p>You haven't submitted any service requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{request.categoryName}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      <strong>Project Details:</strong> {request.projectDetails}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Budget Range:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{request.budgetRange}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Timeline:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{request.timeline}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Request Date:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{formatDateForDisplay(request.requestDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Contact:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{request.fullName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Service Modal */}
      {showRequestModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full flex flex-col" style={{ maxHeight: '90vh' }}>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Redirecting to your requests...</p>
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
                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-grow px-6 py-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Category: <span className="font-semibold text-gray-900 dark:text-white">{selectedService.categoryName}</span>
                      </p>
                      <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold mt-1">
                        Starting from ₹{selectedService.price.toLocaleString()}
                      </p>
                    </div>

                    <h4 className="text-md font-semibold text-gray-900 dark:text-white">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Full Name *</label>
                        <input type="text" name="fullName" required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          defaultValue={`${user.firstName} ${user.lastName}`.trim()}
                          disabled={requestSubmissionStatus === 'submitting'} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <input type="email" name="email" required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          defaultValue={user.email}
                          disabled={requestSubmissionStatus === 'submitting'} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number *</label>
                      <input type="tel" name="phone" required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="+91 9876543210"
                        disabled={requestSubmissionStatus === 'submitting'} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Company (Optional)</label>
                        <input type="text" name="company"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={requestSubmissionStatus === 'submitting'} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Website (Optional)</label>
                        <input type="url" name="website"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={requestSubmissionStatus === 'submitting'} />
                      </div>
                    </div>

                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mt-4">Project Details</h4>
                    <div>
                      <label className="block text-sm font-medium mb-1">Project Description *</label>
                      <textarea name="projectDetails" required rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Describe your project..."
                        disabled={requestSubmissionStatus === 'submitting'} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Budget Range *</label>
                        <select name="budgetRange" required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={requestSubmissionStatus === 'submitting'}>
                          <option value="">Select budget</option>
                          <option value="<5k">Less than ₹5,000</option>
                          <option value="5k-10k">₹5,000 - ₹10,000</option>
                          <option value="10k-25k">₹10,000 - ₹25,000</option>
                          <option value="25k-50k">₹25,000 - ₹50,000</option>
                          <option value="50k-100k">₹50,000 - ₹1,00,000</option>
                          <option value=">100k">More than ₹1,00,000</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Timeline *</label>
                        <select name="timeline" required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={requestSubmissionStatus === 'submitting'}>
                          <option value="">Select timeline</option>
                          <option value="ASAP">ASAP</option>
                          <option value="1-2 weeks">1-2 weeks</option>
                          <option value="1 month">1 month</option>
                          <option value="2-3 months">2-3 months</option>
                          <option value="3+ months">3+ months</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Method *</label>
                      <select name="contactMethod" required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={requestSubmissionStatus === 'submitting'}>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Additional Requirements</label>
                      <textarea name="additionalRequirements" rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={requestSubmissionStatus === 'submitting'} />
                    </div>
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-3">
                    <button type="button"
                      onClick={() => { setShowRequestModal(false); setSelectedService(null); }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                      disabled={requestSubmissionStatus === 'submitting'}>
                      Cancel
                    </button>
                    <button type="submit"
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center"
                      disabled={requestSubmissionStatus === 'submitting'}>
                      {requestSubmissionStatus === 'submitting' ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
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

export default AgencyDashboard;