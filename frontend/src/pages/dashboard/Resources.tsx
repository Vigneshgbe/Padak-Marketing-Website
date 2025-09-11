import React, { useState, useEffect } from 'react';
import {
  FileText, Download, ExternalLink, BookOpen, Users, Building, GraduationCap,
  Shield, Briefcase, Globe, TrendingUp, Target, BarChart3, PenTool, Search,
  MessageSquare, Calendar, Star, Award, BookmarkPlus, Info
} from 'lucide-react';
import PremiumAccessModal from '../../components/PremiumAccessModal'; // Import the new modal

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_type: 'student' | 'professional' | 'business' | 'agency' | 'admin';
  company?: string;
  website?: string;
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
  iconName: string; // Added for better mapping in admin later
  buttonColor: string;
  allowedAccountTypes: string[];
  isPremium?: boolean;
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

// Map for dynamic Tailwind classes (Crucial for buttonColor)
const buttonColorClasses: { [key: string]: string } = {
  blue: 'bg-blue-500 hover:bg-blue-600',
  green: 'bg-green-500 hover:bg-green-600',
  purple: 'bg-purple-500 hover:bg-purple-600',
  orange: 'bg-orange-500 hover:bg-orange-600',
  red: 'bg-red-500 hover:bg-red-600',
  gray: 'bg-gray-500 hover:bg-gray-600',
};

const iconMap: { [key: string]: React.ElementType } = {
  FileText, Download, ExternalLink, BookOpen, Users, Building, GraduationCap,
  Shield, Briefcase, Globe, TrendingUp, Target, BarChart3, PenTool, Search,
  MessageSquare, Calendar, Star, Award, BookmarkPlus, Info
};

const Resources: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materials');

  // State for premium access modal
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedPremiumResource, setSelectedPremiumResource] = useState<Resource | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchResources();
    fetchCourses();
    fetchUserStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user data');
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback or error state
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch resources');
      const resourcesData = await response.json();
      setResources(resourcesData.map((res: any) => ({
        ...res,
        // Ensure icon is correctly mapped from a string name from the backend
        icon: iconMap[res.iconName || 'FileText'] ? React.createElement(iconMap[res.iconName || 'FileText']) : <FileText size={18} />
      })));
    } catch (error) {
      console.error('Error fetching resources:', error);
      // Fallback to default resources if API fails
      setResources(getDefaultResources());
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses/enrolled', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      const coursesData = await response.json();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user stats');
      const statsData = await response.json();
      setUserStats(statsData);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Default resources for fallback or initial setup.
  // Note: iconName added to facilitate admin management later.
  const getDefaultResources = (): Resource[] => {
    const allResources: Resource[] = [
      // Student Resources
      {
        id: 1, title: "Digital Marketing Fundamentals", description: "Complete beginner's guide to digital marketing", type: "pdf", size: "3.2 MB", category: "Course Materials", icon: <BookOpen size={18} />, iconName: "BookOpen", buttonColor: "blue", allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin']
      },
      {
        id: 2, title: "SEO Checklist Template", description: "Step-by-step SEO optimization checklist", type: "excel", size: "1.5 MB", category: "Templates", icon: <Search size={18} />, iconName: "Search", buttonColor: "green", allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin']
      },
      {
        id: 3, title: "Content Calendar Template", description: "Monthly content planning spreadsheet", type: "template", size: "2.1 MB", category: "Templates", icon: <Calendar size={18} />, iconName: "Calendar", buttonColor: "green", allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin']
      },

      // Professional Resources
      {
        id: 4, title: "Advanced Analytics Guide", description: "Deep dive into Google Analytics 4", type: "pdf", size: "4.8 MB", category: "Professional Tools", icon: <BarChart3 size={18} />, iconName: "BarChart3", buttonColor: "purple", allowedAccountTypes: ['professional', 'business', 'agency', 'admin'], isPremium: true
      },
      {
        id: 5, title: "Client Reporting Template", description: "Professional client performance reports", type: "excel", size: "2.3 MB", category: "Templates", icon: <FileText size={18} />, iconName: "FileText", buttonColor: "green", allowedAccountTypes: ['professional', 'business', 'agency', 'admin'], isPremium: true
      },

      // Business Resources
      {
        id: 6, title: "Marketing Strategy Framework", description: "Complete business marketing strategy guide", type: "pdf", size: "6.1 MB", category: "Business Tools", icon: <Target size={18} />, iconName: "Target", buttonColor: "orange", allowedAccountTypes: ['business', 'agency', 'admin'], isPremium: true
      },
      {
        id: 7, title: "ROI Calculator Template", description: "Marketing ROI calculation spreadsheet", type: "excel", size: "1.8 MB", category: "Templates", icon: <TrendingUp size={18} />, iconName: "TrendingUp", buttonColor: "green", allowedAccountTypes: ['business', 'agency', 'admin'], isPremium: true
      },

      // Agency Resources
      {
        id: 8, title: "Multi-Client Dashboard", description: "Agency client management system", type: "template", size: "5.2 MB", category: "Agency Tools", icon: <Users size={18} />, iconName: "Users", buttonColor: "red", allowedAccountTypes: ['agency', 'admin'], isPremium: true
      },
      {
        id: 9, title: "White Label Reports", description: "Customizable client report templates", type: "template", size: "3.7 MB", category: "Agency Tools", icon: <Award size={18} />, iconName: "Award", buttonColor: "red", allowedAccountTypes: ['agency', 'admin'], isPremium: true
      },

      // Tools (All Users)
      {
        id: 10, title: "Google Analytics", description: "Web analytics platform", type: "tool", url: "https://analytics.google.com", category: "External Tools", icon: <ExternalLink size={18} />, iconName: "ExternalLink", buttonColor: "purple", allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin']
      },
      {
        id: 11, title: "SEMrush", description: "SEO & marketing toolkit", type: "tool", url: "https://semrush.com", category: "External Tools", icon: <ExternalLink size={18} />, iconName: "ExternalLink", buttonColor: "purple", allowedAccountTypes: ['professional', 'business', 'agency', 'admin']
      }
    ];

    return allResources.filter(resource =>
      user ? resource.allowedAccountTypes.includes(user.account_type) : true // Default to showing all if user not loaded
    ).map(res => ({
      ...res,
      icon: iconMap[res.iconName] ? React.createElement(iconMap[res.iconName]) : <FileText size={18} />
    }));
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

  const handleAction = async (resource: Resource) => {
    // Determine if the user has "premium access" based on account type
    // This is a simplified check: only 'student' users are considered non-premium by default.
    const userHasPremiumAccess = user && ['professional', 'business', 'agency', 'admin'].includes(user.account_type);

    if (resource.isPremium && !userHasPremiumAccess) {
      setSelectedPremiumResource(resource);
      setShowPremiumModal(true);
      return;
    }

    // Proceed with download/external link if not premium, or if user has premium access
    if (resource.type === 'tool' && resource.url) {
      window.open(resource.url, '_blank');
    } else {
      try {
        const response = await fetch(`/api/resources/${resource.id}/download`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = resource.title;
          document.body.appendChild(a); // Append to body to make it clickable in all browsers
          a.click();
          document.body.removeChild(a); // Clean up
          window.URL.revokeObjectURL(url);
        } else {
          console.error('Failed to download resource:', response.statusText);
          alert('Failed to download resource. Please try again.');
        }
      } catch (error) {
        console.error('Error downloading resource:', error);
        alert('Error downloading resource. Please try again.');
      }
    }
  };

  // Premium Modal Handlers
  const handlePurchaseSingleResource = (resourceTitle: string) => {
    alert(`Mock: Initiating payment for "${resourceTitle}" ($9.99). After successful payment, download would proceed.`);
    // In a real app: call payment gateway, then on success, trigger download for this specific resource.
    setShowPremiumModal(false);
    setSelectedPremiumResource(null);
  };

  const handleUpgradeToPremiumPlan = () => {
    alert('Mock: Initiating payment for Premium Plan ($49.99/month). After successful payment, all premium resources would be unlocked.');
    // In a real app: call payment gateway, then on success, update user's subscription status in backend.
    // Maybe update user state here: setUser(prev => prev ? {...prev, account_type: 'professional'} : null);
    setShowPremiumModal(false);
    setSelectedPremiumResource(null);
  };

  const handleFreePlanSelected = () => {
    setShowPremiumModal(false);
    setSelectedPremiumResource(null);
  };


  const filteredResources = resources.filter(resource => {
    if (activeTab === 'materials') return resource.category === 'Course Materials';
    if (activeTab === 'templates') return resource.category === 'Templates';
    if (activeTab === 'tools') return resource.category.includes('Tools'); // 'Professional Tools', 'Business Tools', 'Agency Tools', 'External Tools'
    if (activeTab === 'all') return true;
    return true;
  });

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
        <div className="flex items-center justify-between flex-wrap gap-4">
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
                <p className="text-sm text-gray-500 capitalize">{user.account_type}</p>
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
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-500'
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
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(resource => (
            <div key={resource.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className={`text-${resource.buttonColor}-500 mr-3`}>
                  {resource.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{resource.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
                      {resource.category}
                    </span>
                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full capitalize">
                      {resource.type}
                    </span>
                    {resource.isPremium && (
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs font-medium rounded-full">
                        Premium
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">File Size: {resource.size}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleAction(resource)}
                  className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors ${buttonColorClasses[resource.buttonColor] || buttonColorClasses.gray}`}
                >
                  {resource.type === 'tool' && resource.url ? <ExternalLink size={16} /> : <Download size={16} />}
                  <span>{resource.type === 'tool' && resource.url ? 'Visit Tool' : 'Download'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Info size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No resources available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Check back later or try a different tab.
          </p>
        </div>
      )}

      {/* My Courses Section */}
      {courses.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">My Enrolled Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <div key={course.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-lg">{course.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                    course.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    course.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {course.difficulty_level}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{course.category}</p>
                {course.progress !== undefined && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                )}
                <span className="block text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {course.progress !== undefined ? `${course.progress}% Completed` : 'Not started'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Premium Access Modal */}
      {selectedPremiumResource && (
        <PremiumAccessModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          resourceTitle={selectedPremiumResource.title}
          onPurchaseSingle={handlePurchaseSingleResource}
          onUpgradeToPremium={handleUpgradeToPremiumPlan}
          onFreePlanSelected={handleFreePlanSelected}
        />
      )}
    </div>
  );
};

export default Resources;