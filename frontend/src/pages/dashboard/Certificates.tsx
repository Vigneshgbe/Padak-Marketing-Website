// src/pages/dashboard/Certificates.tsx
import React from 'react';
import { Award, Download, Share2 } from 'lucide-react';

const Certificates: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Certificates</h1>
        // src/pages/dashboard/Certificates.tsx (continued)
        <p className="text-gray-600 dark:text-gray-400">
          View and download your earned certificates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sample certificate - replace with actual data */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center mb-4">
            <Award size={24} className="text-orange-500 mr-3" />
            <h3 className="font-bold text-lg">SEO Fundamentals</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Completed on: December 1, 2024
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Grade: A (95/100)
          </p>
          <div className="flex space-x-2">
            <button className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center">
              <Download size={16} className="mr-2" />
              Download
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="text-center py-12">
        <Award size={64} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No certificates yet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Complete courses to earn certificates
        </p>
      </div>
    </div>
  );
};

export default Certificates;