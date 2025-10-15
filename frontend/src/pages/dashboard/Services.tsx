// src/pages/dashboard/Services.tsx - IMPROVED VERSION
import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { ServiceCategory } from '../../lib/types';
import { apiService } from '../../lib/api';
import ServiceCategoryCard from '../../components/dashboard/services/ServiceCategoryCard';
import ServiceSubcategoryCard from '../../components/dashboard/services/ServiceSubcategoryCard';
import ServiceRequestForm from '../../components/dashboard/services/ServiceRequestForm';

const Services: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching service categories...');
      
      const data = await apiService.get<ServiceCategory[]>('/services/categories');
      console.log('Received categories:', data);
      
      setCategories(data || []);
    } catch (error: any) {
      console.error('Failed to fetch service categories:', error);
      setError(error.message || 'Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Only show services for professional, business, and agency users
  if (!user || !['professional', 'business', 'agency'].includes(user.accountType)) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Services Not Available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Service requests are only available for Professional, Business, and Agency accounts.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            Your current account type: <span className="font-medium capitalize">{user?.accountType}</span>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">Error Loading Services</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchCategories}
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Services Available</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Service categories are currently being set up. Please check back soon.
          </p>
          <button
            onClick={fetchCategories}
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (selectedSubcategory) {
    return (
      <ServiceRequestForm 
        service={selectedSubcategory} 
        category={selectedCategory!}
        onBack={() => setSelectedSubcategory(null)}
        user={user}
      />
    );
  }

  if (selectedCategory) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <button 
            onClick={() => setSelectedCategory(null)}
            className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 mr-4 flex items-center"
          >
            ← Back to Categories
          </button>
          <h2 className="text-xl font-bold">Select a Service in {selectedCategory.name}</h2>
        </div>
        
        {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedCategory.subcategories.map(subcategory => (
              <ServiceSubcategoryCard 
                key={subcategory.id} 
                subcategory={subcategory} 
                onSelect={setSelectedSubcategory} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No services available in this category yet.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Request Digital Marketing Services</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Select a service category to get started with your project
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <ServiceCategoryCard 
            key={category.id} 
            category={category} 
            onSelect={setSelectedCategory} 
          />
        ))}
      </div>
    </div>
  );
};

export default Services;