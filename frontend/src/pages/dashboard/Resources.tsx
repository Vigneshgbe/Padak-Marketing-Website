import React, { useState, useEffect } from 'react';
import {
  FileText, Download, ExternalLink, BookOpen, Search,
  MessageSquare, Calendar, Star, Award, Info, Users,
  X, Check, Crown, Zap, CreditCard, Lock, Unlock
} from 'lucide-react';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  account_type: 'student' | 'professional' | 'business' | 'agency' | 'admin';
  subscription_plan?: 'free' | 'premium' | 'enterprise';
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
  price?: number; // Individual resource price
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
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [purchasedResources, setPurchasedResources] = useState<number[]>([]);

  useEffect(() => {
    fetchUserData();
    fetchResources();
    // Load purchased resources from localStorage
    const purchased = JSON.parse(localStorage.getItem('purchasedResources') || '[]');
    setPurchasedResources(purchased);
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

  const handleResourceClick = (resource: Resource) => {
    setSelectedResource(resource);
    
    // If resource is free or user has already purchased it, proceed directly
    if (!resource.is_premium || purchasedResources.includes(resource.id) || user?.subscription_plan === 'premium') {
      handleAction(resource);
      return;
    }
    
    // For premium resources, show plan selection modal
    setShowPlanModal(true);
  };

  const handleAction = async (resource: Resource) => {
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
        // Show toast notification here instead of alert
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      // Show toast notification here instead of alert
    }
  };

  const handlePlanSelection = (plan: 'free' | 'individual' | 'premium') => {
    if (!selectedResource) return;
    
    switch (plan) {
      case 'free':
        // User continues with free plan - only free resources
        setShowPlanModal(false);
        break;
        
      case 'individual':
        // Process individual purchase
        handleIndividualPurchase();
        break;
        
      case 'premium':
        // Process premium subscription
        handlePremiumSubscription();
        break;
    }
  };

  const handleIndividualPurchase = () => {
    if (!selectedResource) return;
    
    // Mock payment processing
    // In a real app, this would integrate with a payment gateway
    const newPurchasedResources = [...purchasedResources, selectedResource.id];
    setPurchasedResources(newPurchasedResources);
    localStorage.setItem('purchasedResources', JSON.stringify(newPurchasedResources));
    
    // Download the resource after purchase
    handleAction(selectedResource);
    setShowPlanModal(false);
    
    // Show success message (would be a toast in real app)
    console.log(`Purchased "${selectedResource.title}" for $${selectedResource.price || 9.99}`);
  };

  const handlePremiumSubscription = () => {
    // Mock subscription processing
    // In a real app, this would integrate with a payment gateway
    if (user) {
      setUser({ ...user, subscription_plan: 'premium' });
    }
    
    // Download the resource after subscription
    if (selectedResource) {
      handleAction(selectedResource);
    }
    setShowPlanModal(false);
    
    // Show success message (would be a toast in real app)
    console.log("Subscribed to Premium Plan for $49.99/month");
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
        
        {user?.subscription_plan === 'premium' && (
          <div className="mt-4 flex items-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 rounded-lg">
            <Crown size={20} className="mr-2" />
            <span>You have a Premium Subscription - Access all resources!</span>
          </div>
        )}
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
            const hasAccess = !resource.is_premium || 
                             purchasedResources.includes(resource.id) || 
                             user?.subscription_plan === 'premium';
            
            return (
              <div 
                key={resource.id} 
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow cursor-pointer ${
                  hasAccess ? 'border-blue-500' : 'border-gray-300'
                }`}
                onClick={() => handleResourceClick(resource)}
              >
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
                          {hasAccess ? 'Unlocked' : 'Premium'}
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
                    <div className={`font-medium ${hasAccess ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {hasAccess ? 'Available' : `$${resource.price || 9.99}`}
                    </div>
                  ) : (
                    <div className="text-green-600 dark:text-green-400 font-medium">
                      Free
                    </div>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResourceClick(resource);
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      hasAccess 
                        ? `${buttonColorClasses[resource.button_color] || buttonColorClasses.blue} text-white`
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {resource.type === 'tool' && resource.url ? (
                      <ExternalLink size={16} />
                    ) : hasAccess ? (
                      <Download size={16} />
                    ) : (
                      <Lock size={16} />
                    )}
                    <span>
                      {resource.type === 'tool' && resource.url ? 'Visit Tool' : 
                       hasAccess ? 'Download' : 'Get Access'}
                    </span>
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

      {/* Plan Selection Modal */}
      {showPlanModal && selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Access Resource</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">{selectedResource.title}</h4>
              <p className="text-gray-600 dark:text-gray-400">{selectedResource.description}</p>
            </div>
            
            <div className="space-y-4">
              {/* Free Plan */}
              <div 
                className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => handlePlanSelection('free')}
              >
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Zap size={16} className="text-blue-600" />
                  </div>
                  <h4 className="font-semibold">Free Plan</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Continue with free access to basic resources only
                </p>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">$0</span>
                  <span className="text-sm text-gray-500 ml-1">/ forever</span>
                </div>
              </div>
              
              {/* Individual Purchase */}
              <div 
                className="border rounded-lg p-4 cursor-pointer hover:border-purple-500 transition-colors"
                onClick={() => handlePlanSelection('individual')}
              >
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <CreditCard size={16} className="text-purple-600" />
                  </div>
                  <h4 className="font-semibold">Individual Purchase</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Buy just this resource for one-time use
                </p>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">${selectedResource.price || 9.99}</span>
                  <span className="text-sm text-gray-500 ml-1">/ one-time</span>
                </div>
              </div>
              
              {/* Premium Plan */}
              <div 
                className="border rounded-lg p-4 cursor-pointer hover:border-yellow-500 transition-colors"
                onClick={() => handlePlanSelection('premium')}
              >
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <Crown size={16} className="text-yellow-600" />
                  </div>
                  <h4 className="font-semibold">Premium Plan</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Unlimited access to all premium resources
                </p>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">$49.99</span>
                  <span className="text-sm text-gray-500 ml-1">/ month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;