// src/components/dashboard/services/ServiceSubcategoryCard.tsx
import React from 'react';
import { ServiceSubcategory } from '../../../lib/types';

interface ServiceSubcategoryCardProps {
  subcategory: ServiceSubcategory;
  onSelect: (subcategory: ServiceSubcategory) => void;
}

const ServiceSubcategoryCard: React.FC<ServiceSubcategoryCardProps> = ({ subcategory, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(subcategory)}
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all cursor-pointer bg-white dark:bg-gray-800"
    >
      <h4 className="font-medium mb-2">{subcategory.name}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{subcategory.description}</p>
      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
        Starting from ₹{subcategory.base_price.toLocaleString()}
      </p>
    </div>
  );
};

export default ServiceSubcategoryCard;