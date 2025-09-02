// src/components/admin/ActionButton.tsx
import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, className, children }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${className}`}
    >
      {children}
    </button>
  );
};

export default ActionButton;