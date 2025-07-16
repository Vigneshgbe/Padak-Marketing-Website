// src/pages/dashboard/Services.tsx
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiService.get<ServiceCategory[]>('/services/categories');
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch service categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Only show services for professional, business, and agency users
  if (!user || !['professional', 'business', 'agency'].includes(user.accountType)) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">Services Not Available</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Service requests are only available for Professional, Business, and Agency accounts.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
            // src/pages/dashboard/Services.tsx (continued)
            className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 mr-4"
          >
            ← Back to Categories
          </button>
          <h2 className="text-xl font-bold">Select a Service in {selectedCategory.name}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedCategory.subcategories.map(subcategory => (
            <ServiceSubcategoryCard 
              key={subcategory.id} 
              subcategory={subcategory} 
              onSelect={setSelectedSubcategory} 
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Request Digital Marketing Services</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select a service category to get started with your project
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <ServiceCategoryCard 
            key={category.id} 
            service={category} 
            onSelect={setSelectedCategory} 
          />
        ))}
      </div>
    </div>
  );
};

export default Services;