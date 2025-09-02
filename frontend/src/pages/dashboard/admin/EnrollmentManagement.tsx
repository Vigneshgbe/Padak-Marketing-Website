// src/pages/dashboard/admin/EnrollmentManagement.tsx
import React, { useState } from 'react';
import { Edit, Search, Filter } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';
import { Enrollment } from '../../../lib/admin-types';
import { useAdminData } from '../../../hooks/useAdminData';

const EnrollmentManagement: React.FC = () => {
  const { data: enrollments, loading, error, refetch } = useAdminData('/api/admin/enrollments');
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleEditEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsModalOpen(true);
  };

  const filteredEnrollments = enrollments.filter((enrollment: Enrollment) => {
    // Apply search filter
    if (searchTerm && !`${enrollment.user_name} ${enrollment.course_name}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    if (selectedFilter !== 'all' && enrollment.status !== selectedFilter) {
      return false;
    }
    
    return true;
  });

  const handleSaveEnrollment = async () => {
    // Implementation for saving enrollment
    setIsModalOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Enrollment Management</h2>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search enrollments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <span className="text-red-500 mr-2">⚠️</span>
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Enrollments</h3>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<Enrollment>
          data={filteredEnrollments}
          columns={[
            { header: 'Student', accessor: 'user_name' },
            { header: 'Course', accessor: 'course_name' },
            {
              header: 'Progress',
              accessor: (enrollment) => (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${enrollment.progress}%` }}
                  ></div>
                </div>
              )
            },
            {
              header: 'Status',
              accessor: (enrollment) => (
                <StatusBadge status={enrollment.status} />
              )
            },
            { header: 'Enrollment Date', accessor: 'date' }
          ]}
          actions={(enrollment) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEnrollment(enrollment);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Edit size={16} className="text-blue-500" />
              </button>
            </div>
          )}
        />
      )}

      {/* Edit Enrollment Modal */}
      <Modal
        isOpen={isModalOpen}
        title="Edit Enrollment"
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                defaultValue={selectedEnrollment?.status || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                defaultValue={selectedEnrollment?.progress || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
          </div>

          {selectedEnrollment?.status === 'completed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Completion Date
              </label>
              <input
                type="date"
                defaultValue={selectedEnrollment?.completion_date || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEnrollment}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Update
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnrollmentManagement;