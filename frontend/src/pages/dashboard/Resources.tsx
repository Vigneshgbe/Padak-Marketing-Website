import React, { useState, useEffect } from 'react';
import {
  FileText, Download, ExternalLink, BookOpen, Search,
  MessageSquare, Calendar, Star, Award, Info, Users
} from 'lucide-react';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  account_type: 'student' | 'professional' | 'business' | 'agency' | 'admin';
}

interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'pdf' | 'excel' | 'template' | 'tool' | 'video' | 'guide';
  size?: string;
  url?: string;
  category: string;
  icon_name: string;
  button_color: string;
  allowed_account_types: string[];
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

const iconMap: { [key: string]: React.ElementType } = {
  FileText, Download, ExternalLink, BookOpen, Users, Search,
  MessageSquare, Calendar, Star, Award, Info
};

const buttonColorClasses: { [key: string]: string } = {
  blue: 'bg-blue-500 hover:bg-blue-600',
  green: 'bg-green-500 hover:bg-green-600',
  purple: 'bg-purple-500 hover:bg-purple-600',
  orange: 'bg-orange-500 hover:bg-orange-600',
  red: 'bg-red-500 hover:bg-red-600',
  gray: 'bg-gray-500 hover:bg-gray-600',
};

const Resources: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchResources();
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

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/profile', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch user data');
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/resources', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch resources');
      const resourcesData = await response.json();
      setResources(resourcesData);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (resource: Resource) => {
    // Check if resource is premium
    if (resource.is_premium) {
      alert(`This is a premium resource. Upgrade your account to access "${resource.title}".`);
      return;
    }

    // Handle tool resources (external links)
    if (resource.type === 'tool' && resource.url) {
      window.open(resource.url, '_blank');
      return;
    }

    // Handle downloadable resources
    try {
      const response = await fetch(`http://localhost:5000/api/resources/${resource.id}/download`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resource.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download resource:', response.statusText);
        alert('Failed to download resource. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      alert('Error downloading resource. Please try again.');
    }
  };

  const filteredResources = resources
    .filter(resource => {
      // Filter by tab
      if (activeTab === 'free' && resource.is_premium) return false;
      if (activeTab === 'premium' && !resource.is_premium) return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          resource.title.toLowerCase().includes(searchLower) ||
          resource.description.toLowerCase().includes(searchLower) ||
          resource.category.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Resources</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Access course materials, templates, and tools for your {user?.account_type} account
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All Resources
          </button>
          <button
            onClick={() => setActiveTab('free')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'free' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Free
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'premium' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Premium
          </button>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(resource => {
            const IconComponent = iconMap[resource.icon_name] || FileText;
            
            return (
              <div key={resource.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className={`text-${resource.button_color}-500 mr-3`}>
                    <IconComponent size={20} />
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
                      {resource.is_premium && (
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

                <div className="flex justify-between items-center">
                  {resource.is_premium ? (
                    <div className="text-yellow-600 dark:text-yellow-400 font-medium">
                      $9.99
                    </div>
                  ) : (
                    <div className="text-green-600 dark:text-green-400 font-medium">
                      Free
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleAction(resource)}
                    className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors ${buttonColorClasses[resource.button_color] || buttonColorClasses.blue}`}
                  >
                    {resource.type === 'tool' && resource.url ? <ExternalLink size={16} /> : <Download size={16} />}
                    <span>{resource.type === 'tool' && resource.url ? 'Visit Tool' : resource.is_premium ? 'Purchase' : 'Download'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Info size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No resources found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'Try a different search term' : 'Check back later for new resources'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Resources;