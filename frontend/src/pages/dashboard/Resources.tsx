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
  PenTool,
  Search,
  MessageSquare,
  Calendar,
  Star,
  Award,
  BookmarkPlus
} from 'lucide-react';

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

const Resources: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materials');

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
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const resourcesData = await response.json();
      setResources(resourcesData);
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
      const statsData = await response.json();
      setUserStats(statsData);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultResources = (): Resource[] => {
    const allResources: Resource[] = [
      // Student Resources
      {
        id: 1,
        title: "Digital Marketing Fundamentals",
        description: "Complete beginner's guide to digital marketing",
        type: "pdf",
        size: "3.2 MB",
        category: "Course Materials",
        icon: <BookOpen size={18} />,
        buttonColor: "blue",
        allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin']
      },
      {
        id: 2,
        title: "SEO Checklist Template",
        description: "Step-by-step SEO optimization checklist",
        type: "excel",
        size: "1.5 MB",
        category: "Templates",
        icon: <Search size={18} />,
        buttonColor: "green",
        allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin']
      },
      {
        id: 3,
        title: "Content Calendar Template",
        description: "Monthly content planning spreadsheet",
        type: "template",
        size: "2.1 MB",
        category: "Templates",
        icon: <Calendar size={18} />,
        buttonColor: "green",
        allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin']
      },
      
      // Professional Resources
      {
        id: 4,
        title: "Advanced Analytics Guide",
        description: "Deep dive into Google Analytics 4",
        type: "pdf",
        size: "4.8 MB",
        category: "Professional Tools",
        icon: <BarChart3 size={18} />,
        buttonColor: "purple",
        allowedAccountTypes: ['professional', 'business', 'agency', 'admin'],
        isPremium: true
      },
      {
        id: 5,
        title: "Client Reporting Template",
        description: "Professional client performance reports",
        type: "excel",
        size: "2.3 MB",
        category: "Templates",
        icon: <FileText size={18} />,
        buttonColor: "green",
        allowedAccountTypes: ['professional', 'business', 'agency', 'admin'],
        isPremium: true
      },
      
      // Business Resources
      {
        id: 6,
        title: "Marketing Strategy Framework",
        description: "Complete business marketing strategy guide",
        type: "pdf",
        size: "6.1 MB",
        category: "Business Tools",
        icon: <Target size={18} />,
        buttonColor: "orange",
        allowedAccountTypes: ['business', 'agency', 'admin'],
        isPremium: true
      },
      {
        id: 7,
        title: "ROI Calculator Template",
        description: "Marketing ROI calculation spreadsheet",
        type: "excel",
        size: "1.8 MB",
        category: "Templates",
        icon: <TrendingUp size={18} />,
        buttonColor: "green",
        allowedAccountTypes: ['business', 'agency', 'admin'],
        isPremium: true
      },
      
      // Agency Resources
      {
        id: 8,
        title: "Multi-Client Dashboard",
        description: "Agency client management system",
        type: "template",
        size: "5.2 MB",
        category: "Agency Tools",
        icon: <Users size={18} />,
        buttonColor: "red",
        allowedAccountTypes: ['agency', 'admin'],
        isPremium: true
      },
      {
        id: 9,
        title: "White Label Reports",
        description: "Customizable client report templates",
        type: "template",
        size: "3.7 MB",
        category: "Agency Tools",
        icon: <Award size={18} />,
        buttonColor: "red",
        allowedAccountTypes: ['agency', 'admin'],
        isPremium: true
      },
      
      // Tools (All Users)
      {
        id: 10,
        title: "Google Analytics",
        description: "Web analytics platform",
        type: "tool",
        url: "https://analytics.google.com",
        category: "External Tools",
        icon: <ExternalLink size={18} />,
        buttonColor: "purple",
        allowedAccountTypes: ['student', 'professional', 'business', 'agency', 'admin']
      },
      {
        id: 11,
        title: "SEMrush",
        description: "SEO & marketing toolkit",
        type: "tool",
        url: "https://semrush.com",
        category: "External Tools",
        icon: <ExternalLink size={18} />,
        buttonColor: "purple",
        allowedAccountTypes: ['professional', 'business', 'agency', 'admin']
      }
    ];

    return allResources.filter(resource => 
      user ? resource.allowedAccountTypes.includes(user.account_type) : true
    );
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

  const handleDownload = async (resourceId: number, title: string) => {
    try {
      const response = await fetch(`/api/resources/${resourceId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
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
          <div key={resource.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className={`text-${resource.buttonColor}-500 mr-3`}>
                {resource.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{resource.title}</h3>
                {resource.isPremium && (
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full mt-1">
                    Premium
                  </span>
                )}
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

            <div className="flex justify-end">
              {resource.type === 'tool' && resource.url ? (
                <button
                  onClick={() => handleExternalLink(resource.url!)}
                  className={`flex items-center space-x-2 px-4 py-2 bg-${resource.buttonColor}-500 text-white rounded-lg hover:bg-${resource.buttonColor}-600 transition-colors`}
                >
                  <ExternalLink size={16} />
                  <span>Visit Tool</span>
                </button>
              ) : (
                <button
                  onClick={() => handleDownload(resource.id, resource.title)}
                  className={`flex items-center space-x-2 px-4 py-2 bg-${resource.buttonColor}-500 text-white rounded-lg hover:bg-${resource.buttonColor}-600 transition-colors`}
                >
                  <Download size={16} />
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;