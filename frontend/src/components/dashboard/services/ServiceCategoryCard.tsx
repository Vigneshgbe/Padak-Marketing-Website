// src/components/dashboard/services/ServiceCategoryCard.tsx
import React from 'react';
import { ServiceCategory } from '../../../lib/types';
import * as Icons from 'lucide-react';

interface ServiceCategoryCardProps {
  category: ServiceCategory; // ✅ Changed from 'service' to 'category'
  onSelect: (category: ServiceCategory) => void; // ✅ Changed parameter name
}

const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({ category, onSelect }) => {
  // ✅ Safety check for undefined category
  if (!category) {
    console.error('ServiceCategoryCard received undefined category');
    return null;
  }

  // ✅ Get icon component safely
  const IconComponent = category.icon && (Icons as any)[category.icon] 
    ? (Icons as any)[category.icon] 
    : Icons.Package;

  // ✅ Safety check for subcategories
  const subcategories = category.subcategories || [];

  return (
    <div 
      onClick={() => onSelect(category)}
      className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all hover:border-orange-300 dark:hover:border-orange-600 cursor-pointer bg-white dark:bg-gray-800"
    >
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20 mr-3">
          <IconComponent className="w-6 h-6 text-orange-500" />
        </div>
        <h3 className="font-bold text-lg">{category.name || 'Unnamed Category'}</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
        {category.description || 'No description available'}
      </p>
      <div className="flex flex-wrap gap-2">
        {subcategories.slice(0, 3).map(sub => (
          <span key={sub.id} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
            {sub.name || 'Service'}
          </span>
        ))}
        {subcategories.length > 3 && (
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
            +{subcategories.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
};

export default ServiceCategoryCard;