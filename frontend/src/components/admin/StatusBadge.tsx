// src/components/admin/StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  let baseClass = "inline-block px-2 py-1 text-xs rounded-full ";

  switch (status.toLowerCase()) {
    case 'active':
      baseClass += "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      break;
    case 'completed':
      baseClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      break;
    case 'pending':
      baseClass += "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      break;
    case 'in-process':
    case 'in-progress':
      baseClass += "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      break;
    case 'cancelled':
    case 'inactive':
      baseClass += "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      break;
    default:
      baseClass += "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }

  return (
    <span className={`${baseClass} ${className || ''}`}>
      {status}
    </span>
  );
};

export default StatusBadge;