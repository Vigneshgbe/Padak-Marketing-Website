import React from 'react';
import { X, Lock, DollarSign, CreditCard, Award } from 'lucide-react';

interface PremiumAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle: string;
  onPurchaseSingle: (resourceTitle: string) => void;
  onUpgradeToPremium: () => void;
  onFreePlanSelected: () => void;
}

const PremiumAccessModal: React.FC<PremiumAccessModalProps> = ({
  isOpen,
  onClose,
  resourceTitle,
  onPurchaseSingle,
  onUpgradeToPremium,
  onFreePlanSelected,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <Lock size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access {resourceTitle}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This is a premium resource. Upgrade your plan or purchase it separately to gain access.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Option 1: Continue with Free Plan */}
          <button
            onClick={onFreePlanSelected}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={24} className="text-gray-500 mb-2" />
            <span className="font-semibold text-lg">Continue with Free Plan</span>
            <span className="text-sm text-gray-500 text-center">Access free resources only</span>
          </button>

          {/* Option 2: Purchase This Resource */}
          <button
            onClick={() => onPurchaseSingle(resourceTitle)}
            className="flex flex-col items-center justify-center p-4 border border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            <DollarSign size={24} className="mb-2" />
            <span className="font-semibold text-lg">Purchase This Resource</span>
            <span className="text-sm text-center">Get immediate access to just this file for $9.99</span>
          </button>

          {/* Option 3: Upgrade to Premium Plan */}
          <button
            onClick={onUpgradeToPremium}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-md"
          >
            <Award size={24} className="mb-2" />
            <span className="font-semibold text-lg">Upgrade to Premium Plan</span>
            <span className="text-sm text-center">Unlock all premium resources & features for $49.99/month</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumAccessModal;