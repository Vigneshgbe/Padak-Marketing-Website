// src/pages/dashboard/Resources.tsx
import React from 'react';
import { FileText, Download, ExternalLink, BookOpen } from 'lucide-react';

const Resources: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Resources</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Access course materials, templates, and additional resources
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Course Materials */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <BookOpen size={24} className="text-blue-500 mr-3" />
            <h3 className="font-bold text-lg">Course Materials</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium">SEO Fundamentals Guide</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">PDF • 2.5 MB</p>
              </div>
              <button className="text-blue-500 hover:text-blue-600">
                <Download size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium">Keyword Research Template</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Excel • 1.2 MB</p>
              </div>
              <button className="text-blue-500 hover:text-blue-600">
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <FileText size={24} className="text-green-500 mr-3" />
            <h3 className="font-bold text-lg">Templates</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium">Content Calendar Template</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Google Sheets</p>
              </div>
              <button className="text-green-500 hover:text-green-600">
                <ExternalLink size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium">Social Media Audit Template</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Excel • 800 KB</p>
              </div>
              <button className="text-green-500 hover:text-green-600">
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tools & Links */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <ExternalLink size={24} className="text-purple-500 mr-3" />
            <h3 className="font-bold text-lg">Useful Tools</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium">Google Analytics</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Web analytics platform</p>
              <button className="text-purple-500 hover:text-purple-600 text-sm mt-2">
                Visit Tool →
              </button>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium">SEMrush</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">SEO & marketing toolkit</p>
              <button className="text-purple-500 hover:text-purple-600 text-sm mt-2">
                Visit Tool →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;