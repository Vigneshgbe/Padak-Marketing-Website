// src/pages/dashboard/Resources.tsx
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  BookOpen, 
  Users, 
  Building, 
  GraduationCap,
  Shield,
  Briefcase,
  Globe,
  TrendingUp,
  Target,
  BarChart3,
  Search,
  Calendar,
  Star,
  Award,
  X,
  CreditCard,
  Lock,
  Check,
  Crown
} from 'lucide-react';
import Modal from '../../components/Modal';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_type: 'student' | 'professional' | 'business' | 'agency' | 'admin';
  company?: string;
  website?: string;
  subscription_plan: 'free' | 'premium' | 'enterprise';
}

interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'pdf' | 'excel' | 'template' | 'tool' | 'video' | 'guide';
  size?: string;
  url?: string;
  category: string;
  icon: React.ReactNode;
  buttonColor: string;
  allowedAccountTypes: string[];
  isPremium?: boolean;
  price?: number;
  detailedDescription?: string;
  requirements?: string[];
  lastUpdated?: string;
  author?: string;
  rating?: number;
  tags?: string[];
}

interface Course {
  id: number;
  title: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  progress?: number;
  isEnrolled?: boolean;
}

interface UserStats {
  courses_enrolled: number;
  courses_completed: number;
  certificates_earned: number;
  learning_streak: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  isPopular?: boolean;
}

const Resources: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materials');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showResourceDetail, setShowResourceDetail] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchResources();
    fetchCourses();
    fetchUserStats();
  }, []);

  const fetchUserData = async () => {
    try {
      // Simulated API call
      setTimeout(() => {
        setUser({
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          account_type: "student",
          subscription_plan: "free"
        });
      }, 500);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchResources = async () => {
    try {
      // Simulated API call
      setTimeout(() => {
        setResources(getDefaultResources());
      }, 800);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources(getDefaultResources());
    }
  };

  const fetchCourses = async () => {
    try {
      // Simulated API call
      setTimeout(() => {
        setCourses([
          {
            id: 1,
            title: "Digital Marketing Fundamentals",
            category: "Marketing",
            difficulty_level: "beginner",
            progress: 65,
            isEnrolled: true
          },
          {
            id: 2,
            title: "Advanced SEO Strategies",
            category: "SEO",
            difficulty_level: "intermediate",
            progress: 30,
            isEnrolled: true
          }
        ]);
      }, 700);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Simulated API call
      setTimeout(() => {
        setUserStats({
          courses_enrolled: 5,
          courses_completed: 2,
          certificates_earned: 2,
          learning_streak: 12
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setLoading(false);
    }
  };

  const getDefaultResources = (): Resource[] => {
    return [
      // Student Resources
      {
        id: 1,
        title: "Digital Marketing Fundamentals",
        description: "Complete beginner's guide to digital marketing",
        detailedDescription: "This comprehensive guide covers all aspects of digital marketing from SEO to social media marketing. Perfect for beginners looking to start a career in digital marketing.",
        type: "pdf",
        size: "3.2 MB",
        category: "Course Materials",
        icon: <BookOpen size={18} />,
        buttonColor: "blue",
        allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin'],
        requirements: ["Basic computer skills", "Internet connection"],
        lastUpdated: "2023-10-15",
        author: "Jane Smith",
        rating: 4.8,
        tags: ["Marketing", "Beginner", "Guide"]
      },
      {
        id: 2,
        title: "SEO Checklist Template",
        description: "Step-by-step SEO optimization checklist",
        detailedDescription: "A detailed checklist that helps you optimize websites for search engines. Includes on-page, technical, and off-page SEO factors.",
        type: "excel",
        size: "1.5 MB",
        category: "Templates",
        icon: <Search size={18} />,
        buttonColor: "green",
        allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin'],
        isPremium: true,
        price: 19.99,
        requirements: ["Microsoft Excel or similar"],
        lastUpdated: "2023-11-05",
        author: "SEO Experts Team",
        rating: 4.9,
        tags: ["SEO", "Template", "Checklist"]
      },
      // ... other resources (same as before but with additional details)
    ];
  };

  const getAccountTypeIcon = (accountType: string) => {
    switch (accountType) {
      case 'student': return <GraduationCap size={20} />;
      case 'professional': return <Briefcase size={20} />;
      case 'business': return <Building size={20} />;
      case 'agency': return <Users size={20} />;
      case 'admin': return <Shield size={20} />;
      default: return <Users size={20} />;
    }
  };

  const getAccountTypeColor = (accountType: string) => {
    switch (accountType) {
      case 'student': return 'text-blue-500';
      case 'professional': return 'text-green-500';
      case 'business': return 'text-purple-500';
      case 'agency': return 'text-red-500';
      case 'admin': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const handleDownload = async (resource: Resource) => {
    if (resource.isPremium && user?.subscription_plan === 'free') {
      setSelectedResource(resource);
      setShowPlanModal(true);
      return;
    }
    
    try {
      // Download logic here
      console.log(`Downloading ${resource.title}`);
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  const handleResourceClick = (resource: Resource) => {
    setSelectedResource(resource);
    setShowResourceDetail(true);
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const filteredResources = resources.filter(resource => {
    if (activeTab === 'materials') return resource.category === 'Course Materials';
    if (activeTab === 'templates') return resource.category === 'Templates';
    if (activeTab === 'tools') return resource.category.includes('Tools');
    return true;
  });

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free Plan',
      price: 0,
      period: 'forever',
      features: [
        'Access to basic resources',
        'Limited templates',
        'Community support',
        '5 downloads per month'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 19.99,
      period: 'month',
      features: [
        'All premium resources',
        'Unlimited templates',
        'Priority support',
        'Advanced tools access',
        'Unlimited downloads'
      ],
      isPopular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 49.99,
      period: 'month',
      features: [
        'All premium features',
        'White-label resources',
        'Team management',
        'Custom resource creation',
        'Dedicated account manager'
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Resources</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Access course materials, templates, and tools for your {user?.account_type} account
            </p>
          </div>
          {user && (
            <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm">
              <div className={getAccountTypeColor(user.account_type)}>
                {getAccountTypeIcon(user.account_type)}
              </div>
              <div>
                <p className="font-medium">{user.first_name} {user.last_name}</p>
                <p className="text-sm text-gray-500 capitalize">{user.account_type} • {user.subscription_plan}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Stats */}
      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled</p>
                <p className="text-2xl font-bold text-blue-500">{userStats.courses_enrolled}</p>
              </div>
              <BookOpen className="text-blue-500" size={24} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-500">{userStats.courses_completed}</p>
              </div>
              <GraduationCap className="text-green-500" size={24} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Certificates</p>
                <p className="text-2xl font-bold text-purple-500">{userStats.certificates_earned}</p>
              </div>
              <Award className="text-purple-500" size={24} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Streak</p>
                <p className="text-2xl font-bold text-orange-500">{userStats.learning_streak}</p>
              </div>
              <Star className="text-orange-500" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'materials', label: 'Course Materials', icon: <BookOpen size={16} /> },
              { key: 'templates', label: 'Templates', icon: <FileText size={16} /> },
              { key: 'tools', label: 'Tools', icon: <ExternalLink size={16} /> },
              { key: 'all', label: 'All Resources', icon: <Globe size={16} /> }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map(resource => (
          <div 
            key={resource.id} 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleResourceClick(resource)}
          >
            <div className="flex items-center mb-4">
              <div className={`text-${resource.buttonColor}-500 mr-3`}>
                {resource.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{resource.title}</h3>
                <div className="flex items-center mt-1">
                  {resource.isPremium && (
                    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full mr-2">
                      Premium
                    </span>
                  )}
                  {resource.rating && (
                    <span className="text-xs text-gray-500 flex items-center">
                      <Star size={12} className="fill-yellow-400 text-yellow-400 mr-1" />
                      {resource.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {resource.description}
              </p>
              {resource.size && (
                <p className="text-xs text-gray-500">{resource.type.toUpperCase()} • {resource.size}</p>
              )}
            </div>

            <div className="flex justify-between items-center">
              {resource.isPremium && user?.subscription_plan === 'free' ? (
                <span className="text-sm font-medium text-amber-600 flex items-center">
                  <Lock size={14} className="mr-1" />
                  Premium Resource
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  {resource.isPremium ? 'Included in your plan' : 'Free access'}
                </span>
              )}
              
              {resource.type === 'tool' && resource.url ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExternalLink(resource.url!);
                  }}
                  className={`flex items-center space-x-1 px-3 py-1.5 bg-${resource.buttonColor}-500 text-white rounded-lg hover:bg-${resource.buttonColor}-600 transition-colors text-sm`}
                >
                  <ExternalLink size={14} />
                  <span>Visit</span>
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(resource);
                  }}
                  className={`flex items-center space-x-1 px-3 py-1.5 bg-${resource.buttonColor}-500 text-white rounded-lg hover:bg-${resource.buttonColor}-600 transition-colors text-sm`}
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* My Courses Section */}
      {courses.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">My Enrolled Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <div key={course.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{course.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    course.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                    course.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {course.difficulty_level}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{course.category}</p>
                {course.progress !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                )}
                {course.progress !== undefined && (
                  <p className="text-xs text-gray-500 text-right">{course.progress}% complete</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Detail Modal */}
      <Modal
        isOpen={showResourceDetail}
        onClose={() => setShowResourceDetail(false)}
        title={selectedResource?.title || ''}
        size="lg"
      >
        {selectedResource && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`text-${selectedResource.buttonColor}-500 mr-2`}>
                  {selectedResource.icon}
                </div>
                <span className="text-sm text-gray-500 capitalize">{selectedResource.type}</span>
              </div>
              {selectedResource.isPremium && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Premium
                </span>
              )}
            </div>

            <p className="text-gray-600">{selectedResource.detailedDescription}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {selectedResource.author && (
                <div>
                  <span className="font-medium">Author:</span>
                  <p className="text-gray-600">{selectedResource.author}</p>
                </div>
              )}
              {selectedResource.lastUpdated && (
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <p className="text-gray-600">{new Date(selectedResource.lastUpdated).toLocaleDateString()}</p>
                </div>
              )}
              {selectedResource.size && (
                <div>
                  <span className="font-medium">File Size:</span>
                  <p className="text-gray-600">{selectedResource.size}</p>
                </div>
              )}
              {selectedResource.rating && (
                <div>
                  <span className="font-medium">Rating:</span>
                  <p className="text-gray-600 flex items-center">
                    <Star size={14} className="fill-yellow-400 text-yellow-400 mr-1" />
                    {selectedResource.rating}
                  </p>
                </div>
              )}
            </div>

            {selectedResource.requirements && selectedResource.requirements.length > 0 && (
              <div>
                <span className="font-medium">Requirements:</span>
                <ul className="list-disc list-inside text-gray-600 mt-1">
                  {selectedResource.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedResource.tags && selectedResource.tags.length > 0 && (
              <div>
                <span className="font-medium">Tags:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedResource.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              {selectedResource.type === 'tool' && selectedResource.url ? (
                <button
                  onClick={() => handleExternalLink(selectedResource.url!)}
                  className={`flex items-center space-x-2 px-4 py-2 bg-${selectedResource.buttonColor}-500 text-white rounded-lg hover:bg-${selectedResource.buttonColor}-600 transition-colors`}
                >
                  <ExternalLink size={16} />
                  <span>Visit Tool</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleDownload(selectedResource);
                    setShowResourceDetail(false);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 bg-${selectedResource.buttonColor}-500 text-white rounded-lg hover:bg-${selectedResource.buttonColor}-600 transition-colors`}
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Plan Selection Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="Upgrade Your Plan"
        size="xl"
      >
        {selectedResource && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Upgrade to access <span className="text-blue-600">{selectedResource.title}</span>
              </h3>
              <p className="text-gray-500 mt-2">
                This premium resource requires a subscription plan
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                    plan.isPopular
                      ? 'border-blue-500 ring-2 ring-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h4 className="text-lg font-semibold">{plan.name}</h4>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-500">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check size={16} className="text-green-500 mr-2" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full mt-4 py-2 rounded-md font-medium ${
                      plan.id === 'free'
                        ? 'bg-gray-200 text-gray-800'
                        : plan.isPopular
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    {plan.id === 'free' ? 'Current Plan' : 'Upgrade Now'}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Need help deciding?</h4>
              <p className="text-sm text-gray-600">
                Contact our support team to find the best plan for your needs.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Resources;