// src/components/dashboard/services/ServiceSubcategoryCard.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ServiceSubcategory {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
}

interface ServiceSubcategoryCardProps {
  subcategory: ServiceSubcategory;
  onSelect: (subcategory: ServiceSubcategory) => void;
}

const ServiceSubcategoryCard: React.FC<ServiceSubcategoryCardProps> = ({ subcategory, onSelect }) => {
  // ✅ Safety check for undefined subcategory
  if (!subcategory) {
    console.error('ServiceSubcategoryCard received undefined subcategory');
    return null;
  }

  // ✅ Safe price formatting with fallback
  const formatPrice = (price: any) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice === 0) {
      return 'Contact for pricing';
    }
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  return (
    <div 
      onClick={() => onSelect(subcategory)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer p-6 border-2 border-transparent hover:border-orange-500"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {subcategory.name || 'Unnamed Service'}
        </h3>
        <ArrowRight className="w-5 h-5 text-orange-500" />
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
        {subcategory.description || 'No description available'}
      </p>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">Starting from</span>
        <span className="text-lg font-bold text-orange-500">
          {formatPrice(subcategory.basePrice)}
        </span>
      </div>
    </div>
  );
};

export default ServiceSubcategoryCard;