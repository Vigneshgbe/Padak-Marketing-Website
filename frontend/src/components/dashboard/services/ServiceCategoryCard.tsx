// src/components/dashboard/services/ServiceCategoryCard.tsx
import React from 'react';
import { ServiceCategory } from '../../../lib/types';

interface ServiceCategoryCardProps {
  service: ServiceCategory;
  onSelect: (service: ServiceCategory) => void;
}

const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({ service, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(service)}
      className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all hover:border-orange-300 dark:hover:border-orange-600 cursor-pointer bg-white dark:bg-gray-800"
    >
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 mr-3">
          {/* Icon would be rendered based on service.icon */}
          <div className="w-6 h-6 bg-orange-500 rounded"></div>
        </div>
        <h3 className="font-bold text-lg">{service.name}</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{service.description}</p>
      <div className="flex flex-wrap gap-2">
        {service.subcategories.slice(0, 3).map(sub => (
          <span key={sub.id} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
            {sub.name}
          </span>
        ))}
        {service.subcategories.length > 3 && (
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
            +{service.subcategories.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
};

export default ServiceCategoryCard;