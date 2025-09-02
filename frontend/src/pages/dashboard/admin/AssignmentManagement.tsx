// src/pages/dashboard/admin/AssignmentManagement.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search, Filter } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import Modal from '../../../components/admin/Modal';
import { Assignment } from '../../../lib/admin-types';
import { useAdminData } from '../../../hooks/useAdminData';

interface Course {
  id: number;
  title: string;
}

interface AssignmentFormData {
  title: string;
  course_id: number;
  description: string;
  due_date: string;
  max_points: number;
}

const AssignmentManagement: React.FC = () => {
  const { data: assignments, loading, error, refetch } = useAdminData('/api/admin/assignments');
  const { data: courses } = useAdminData('/api/admin/courses');
  
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    course_id: 0,
    description: '',
    due_date: '',
    max_points: 100
  });

  // Reset form data when modal opens/closes
  useEffect(() => {
    if (isModalOpen) {
      if (modalType === 'edit' && selectedAssignment) {
        setFormData({
          title: selectedAssignment.title || '',
          course_id: selectedAssignment.course_id || 0,
          description: selectedAssignment.description || '',
          due_date: selectedAssignment.due_date || '',
          max_points: selectedAssignment.max_points || 100
        });
      } else if (modalType === 'create') {
        setFormData({
          title: '',
          course_id: 0,
          description: '',
          due_date: '',
          max_points: 100
        });
      }
    }
  }, [isModalOpen, modalType, selectedAssignment]);

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

  const handleFormChange = (field: keyof AssignmentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      alert('Assignment title is required');
      return false;
    }
    if (!formData.course_id) {
      alert('Please select a course');
      return false;
    }
    if (!formData.due_date) {
      alert('Due date is required');
      return false;
    }
    if (formData.max_points <= 0) {
      alert('Max points must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSaveAssignment = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = modalType === 'create' 
        ? '/api/admin/assignments'
        : `/api/admin/assignments/${selectedAssignment?.id}`;
      
      const method = modalType === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}` // Adjust based on your auth implementation
        },
        body: JSON.stringify({
          ...formData,
          // Ensure proper data types
          course_id: Number(formData.course_id),
          max_points: Number(formData.max_points)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save assignment');
      }

      const result = await response.json();
      console.log('Assignment saved successfully:', result);
      
      setIsModalOpen(false);
      await refetch();
      
      // Show success message
      alert(modalType === 'create' ? 'Assignment created successfully!' : 'Assignment updated successfully!');
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert(error instanceof Error ? error.message : 'Failed to save assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/assignments/${selectedAssignment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}` // Adjust based on your auth implementation
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete assignment');
      }

      console.log('Assignment deleted successfully');
      setIsModalOpen(false);
      await refetch();
      
      alert('Assignment deleted successfully!');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAssignments = assignments?.filter((assignment: Assignment) => {
    // Apply search filter
    if (searchTerm && !`${assignment.title} ${assignment.course_title || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply course filter
    if (selectedFilter !== 'all' && assignment.course_id.toString() !== selectedFilter) {
      return false;
    }
    
    return true;
  }) || [];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
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
              {courses?.map((course: Course) => (
                <option key={course.id} value={course.id.toString()}>
                  {course.title}
                </option>
              ))}
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
            { header: 'ID', accessor: 'id' },
            { header: 'Title', accessor: 'title' },
            { header: 'Course', accessor: 'course_title' },
            { 
              header: 'Due Date', 
              accessor: (assignment) => formatDate(assignment.due_date)
            },
            {
              header: 'Max Points',
              accessor: (assignment) => assignment.max_points?.toString() || '0'
            },
            { 
              header: 'Created', 
              accessor: (assignment) => formatDateTime(assignment.created_at)
            }
          ]}
          actions={(assignment) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditAssignment(assignment);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Edit Assignment"
              >
                <Edit size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteAssignment(assignment);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Delete Assignment"
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
              Assignment Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter assignment title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Course *
            </label>
            <select
              value={formData.course_id}
              onChange={(e) => handleFormChange('course_id', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value={0}>Select course</option>
              {courses?.map((course: Course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter assignment description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date *
              </label>
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => handleFormChange('due_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Points *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.max_points}
                onChange={(e) => handleFormChange('max_points', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter max points"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAssignment}
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
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
          <div className="flex items-center mb-4">
            <span className="text-red-500 mr-2">⚠️</span>
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the assignment "{selectedAssignment?.title}"? 
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Warning:</strong> This action cannot be undone. All related assignment submissions and grades will also be deleted.
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentManagement;