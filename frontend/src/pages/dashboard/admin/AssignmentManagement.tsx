// src/pages/dashboard/admin/AssignmentManagement.tsx
import React, { useState } from 'react';
import { Edit, Trash2, Plus, Search, Filter } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import Modal from '../../../components/admin/Modal';
import { Assignment } from '../../../lib/admin-types';
import { useAdminData } from '../../../hooks/useAdminData';

const AssignmentManagement: React.FC = () => {
  const { data: assignments, loading, error, refetch } = useAdminData('/api/admin/assignments');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleDeleteAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setModalType('delete');
    setIsModalOpen(true);
  };

  const handleCreateAssignment = () => {
    setSelectedAssignment(null);
    setModalType('create');
    setIsModalOpen(true);
  };

  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    // Apply search filter
    if (searchTerm && !`${assignment.title} ${assignment.course_title}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply course filter
    if (selectedFilter !== 'all' && assignment.course_id.toString() !== selectedFilter) {
      return false;
    }
    
    return true;
  });

  const handleSaveAssignment = async () => {
    // Implementation for saving assignment
    setIsModalOpen(false);
    refetch();
  };

  const handleDeleteConfirm = async () => {
    // Implementation for deleting assignment
    setIsModalOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Assignment Management</h2>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search assignments..."
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
              <option value="all">All Courses</option>
              {/* This would be populated with actual course options */}
              <option value="1">Digital Marketing Fundamentals</option>
              <option value="2">Advanced SEO Techniques</option>
            </select>
          </div>

          <button
            onClick={handleCreateAssignment}
            className="flex items-center justify-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            <span>Add New</span>
          </button>
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
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Assignments</h3>
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
        <DataTable<Assignment>
          data={filteredAssignments}
          columns={[
            { header: 'Title', accessor: 'title' },
            { header: 'Course', accessor: 'course_title' },
            { header: 'Due Date', accessor: 'due_date' },
            {
              header: 'Max Points',
              accessor: (assignment) => assignment.max_points.toString()
            },
            { header: 'Created', accessor: 'created_at' }
          ]}
          actions={(assignment) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditAssignment(assignment);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Edit size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteAssignment(assignment);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          )}
        />
      )}

      {/* Edit/Create Assignment Modal */}
      <Modal
        isOpen={isModalOpen && (modalType === 'create' || modalType === 'edit')}
        title={modalType === 'create' ? 'Create New Assignment' : 'Edit Assignment'}
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assignment Title
            </label>
            <input
              type="text"
              defaultValue={selectedAssignment?.title || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Course
            </label>
            <select
              defaultValue={selectedAssignment?.course_id || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <option value="">Select course</option>
              <option value="1">Digital Marketing Fundamentals</option>
              <option value="2">Advanced SEO Techniques</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              defaultValue={selectedAssignment?.description || ''}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                defaultValue={selectedAssignment?.due_date || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Points
              </label>
              <input
                type="number"
                min="0"
                defaultValue={selectedAssignment?.max_points || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAssignment}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              {modalType === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isModalOpen && modalType === 'delete'}
        title="Delete Assignment"
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete the assignment "{selectedAssignment?.title}"? This action cannot be undone.</p>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentManagement;