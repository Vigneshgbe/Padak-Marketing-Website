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
  FileText
} from 'lucide-react';
import StatCard from '../common/StatCard';
import { User, UserStats } from '../../../lib/types';

interface AgencyDashboardProps {
  user: User;
  stats: UserStats;
}

interface ServiceRequest {
  id: number;
  serviceName: string;
  serviceType: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  requestDate: string;
  description: string;
  budget: number;
  deadline: string;
  assignedTo?: string;
}

interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  rating: number;
  reviews: number;
  features: string[];
  popular: boolean;
}

interface ClientMetrics {
  totalRequests: number;
  activeProjects: number;
  completedProjects: number;
  totalSpent: number;
  myRequests: ServiceRequest[];
}

const AgencyDashboard: React.FC<AgencyDashboardProps> = ({ user, stats }) => {
  const [clientMetrics, setClientMetrics] = useState<ClientMetrics>({
    totalRequests: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalSpent: 0,
    myRequests: []
  });
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'my-requests' | 'calendar' | 'resources' | 'settings'>('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const services: Service[] = [
    {
      id: 1,
      name: "SEO Optimization",
      category: "SEO",
      description: "Complete SEO audit and optimization for better search rankings",
      price: 15000,
      duration: "2-3 weeks",
      rating: 4.8,
      reviews: 124,
      features: ["Keyword Research", "On-page SEO", "Technical SEO", "Monthly Reports"],
      popular: true
    },
    {
      id: 2,
      name: "Social Media Management",
      category: "Social Media",
      description: "Comprehensive social media marketing and content creation",
      price: 12000,
      duration: "Monthly",
      rating: 4.9,
      reviews: 89,
      features: ["Content Creation", "Daily Posting", "Community Management", "Analytics"],
      popular: true
    },
    {
      id: 3,
      name: "Content Marketing",
      category: "Content",
      description: "Professional blog posts, articles, and content strategy",
      price: 8000,
      duration: "Monthly",
      rating: 4.7,
      reviews: 156,
      features: ["Blog Writing", "Content Strategy", "SEO Optimization", "Publishing"],
      popular: false
    },
    {
      id: 4,
      name: "PPC Advertising",
      category: "Advertising",
      description: "Google Ads and Facebook Ads campaign management",
      price: 20000,
      duration: "Monthly",
      rating: 4.6,
      reviews: 92,
      features: ["Campaign Setup", "Keyword Research", "Ad Creation", "Performance Tracking"],
      popular: true
    },
    {
      id: 5,
      name: "Email Marketing",
      category: "Email",
      description: "Automated email campaigns and newsletter management",
      price: 5000,
      duration: "Monthly",
      rating: 4.5,
      reviews: 67,
      features: ["Email Templates", "Automation", "List Management", "Analytics"],
      popular: false
    },
    {
      id: 6,
      name: "Website Development",
      category: "Development",
      description: "Responsive website design and development",
      price: 25000,
      duration: "3-4 weeks",
      rating: 4.9,
      reviews: 78,
      features: ["Responsive Design", "SEO Friendly", "Fast Loading", "Mobile Optimized"],
      popular: false
    }
  ];

  useEffect(() => {
    fetchClientMetrics();
  }, []);

  const fetchClientMetrics = async () => {
    try {
      setLoading(true);
      
      // Mock client data
      const mockRequests: ServiceRequest[] = [
        {
          id: 1,
          serviceName: "SEO Optimization",
          serviceType: "SEO",
          status: "in-progress",
          requestDate: "2024-01-15",
          description: "Complete SEO audit and optimization for my e-commerce website",
          budget: 15000,
          deadline: "2024-02-15",
          assignedTo: "John Doe"
        },
        {
          id: 2,
          serviceName: "Social Media Management",
          serviceType: "Social Media",
          status: "completed",
          requestDate: "2024-01-10",
          description: "3-month social media campaign",
          budget: 36000,
          deadline: "2024-04-10",
          assignedTo: "Jane Smith"
        },
        {
          id: 3,
          serviceName: "Content Marketing",
          serviceType: "Content",
          status: "pending",
          requestDate: "2024-01-18",
          description: "Blog content creation for my business",
          budget: 8000,
          deadline: "2024-02-18",
        }
      ];

      setClientMetrics({
        totalRequests: mockRequests.length,
        activeProjects: mockRequests.filter(req => req.status === 'in-progress').length,
        completedProjects: mockRequests.filter(req => req.status === 'completed').length,
        totalSpent: mockRequests.filter(req => req.status === 'completed').reduce((sum, req) => sum + req.budget, 0),
        myRequests: mockRequests
      });
    } catch (error) {
      console.error('Error fetching client metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = async (service: Service, requestData: any) => {
    try {
      const newRequest: ServiceRequest = {
        id: Date.now(),
        serviceName: service.name,
        serviceType: service.category,
        status: 'pending',
        requestDate: new Date().toISOString(),
        description: requestData.description,
        budget: service.price,
        deadline: requestData.deadline,
      };

      setClientMetrics(prev => ({
        ...prev,
        myRequests: [...prev.myRequests, newRequest],
        totalRequests: prev.totalRequests + 1
      }));

      setShowRequestModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error creating service request:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    console.log('Logging out...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredServices = services.filter(service => {
    const matchesFilter = serviceFilter === 'all' || service.category === serviceFilter;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <option value="SEO">SEO</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Content">Content</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Email">Email</option>
                  <option value="Development">Development</option>
                </select>
              </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredServices.map((service) => (
                <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                    {service.popular && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
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
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{service.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{service.duration}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedService(service);
                        setShowRequestModal(true);
                      }}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                    >
                      Request Service
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'my-requests' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">My Service Requests</h2>
            <div className="space-y-4">
              {clientMetrics.myRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{request.serviceName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.serviceType}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{request.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Budget:</span>
                      <p className="font-medium">₹{request.budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Deadline:</span>
                      <p className="font-medium">{new Date(request.deadline).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Request Date:</span>
                      <p className="font-medium">{new Date(request.requestDate).toLocaleDateString()}</p>
                    </div>
                    {request.assignedTo && (
                      <div>
                        <span className="text-gray-500">Assigned To:</span>
                        <p className="font-medium">{request.assignedTo}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Calendar & Scheduling</h2>
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Calendar component will show project timelines and deadlines</p>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Resources & Documents</h2>
            <div className="text-center py-12">
              <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Access project files, reports, and documentation</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Account Settings</h2>
            <div className="text-center py-12">
              <Settings size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and notifications</p>
            </div>
          </div>
        )}
      </div>

      {/* Request Service Modal */}
      {showRequestModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Request {selectedService.name}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleRequestService(selectedService, {
                description: formData.get('description'),
                deadline: formData.get('deadline')
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Description</label>
                  <textarea
                    name="description"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                    placeholder="Describe your project requirements..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Service Price: <span className="font-semibold">₹{selectedService.price.toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedService(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyDashboard;