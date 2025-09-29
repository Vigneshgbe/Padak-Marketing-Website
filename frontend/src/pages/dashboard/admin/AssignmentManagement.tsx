// src/pages/dashboard/admin/AssignmentManagement.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search, Filter, Save, X, AlertCircle } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import Modal from '../../../components/admin/Modal';

interface Assignment {
  id: number;
  course_id: number;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  created_at: string;
  course_title?: string;
}

interface Course {
  id: number;
  title: string;
}

const AssignmentManagement: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state for controlled inputs
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formMaxPoints, setFormMaxPoints] = useState('100');

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/assignments`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assignments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/courses`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setModalType('edit');
    setFormError(null);
    // Pre-fill form
    setFormTitle(assignment.title);
    setFormDescription(assignment.description || '');
    setFormCourseId(assignment.course_id.toString());
    setFormDueDate(formatDateForInput(assignment.due_date));
    setFormMaxPoints(assignment.max_points.toString());
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
    setFormError(null);
    // Reset form
    setFormTitle('');
    setFormDescription('');
    setFormCourseId('');
    setFormDueDate('');
    setFormMaxPoints('100');
    setIsModalOpen(true);
  };

  const handleSaveAssignment = async () => {
    try {
      setSaving(true);
      setFormError(null);

      // Detailed validation with specific error messages
      if (!formTitle || formTitle.trim() === '') {
        setFormError('Assignment title is required');
        setSaving(false);
        return;
      }

      if (!formCourseId || formCourseId === '') {
        setFormError('Please select a course');
        setSaving(false);
        return;
      }

      if (!formDueDate || formDueDate === '') {
        setFormError('Due date is required');
        setSaving(false);
        return;
      }

      if (!formMaxPoints || formMaxPoints === '' || isNaN(Number(formMaxPoints))) {
        setFormError('Max points must be a valid number');
        setSaving(false);
        return;
      }

      const maxPointsNum = parseInt(formMaxPoints);
      if (maxPointsNum < 1 || maxPointsNum > 1000) {
        setFormError('Max points must be between 1 and 1000');
        setSaving(false);
        return;
      }

      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = 'http://localhost:5000';
      const url = modalType === 'create' 
        ? `${baseURL}/api/admin/assignments`
        : `${baseURL}/api/admin/assignments/${selectedAssignment?.id}`;

      const method = modalType === 'create' ? 'POST' : 'PUT';

      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        course_id: formCourseId,
        due_date: formDueDate,
        max_points: maxPointsNum
      };

      console.log('Submitting assignment:', payload);

      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormError(null);
        fetchAssignments(); // Refresh the data
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to save assignment');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssignment) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/assignments/${selectedAssignment.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchAssignments(); // Refresh the data
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to delete assignment');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete assignment');
    } finally {
      setSaving(false);
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    // Apply search filter
    if (searchTerm && !`${assignment.title} ${assignment.course_title || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply course filter
    if (selectedFilter !== 'all' && assignment.course_id.toString() !== selectedFilter) {
      return false;
    }
    
    return true;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
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
              {courses.map((course) => (
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
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Assignments</h3>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchAssignments}
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
            { 
              header: 'Due Date', 
              accessor: (assignment) => formatDate(assignment.due_date)
            },
            {
              header: 'Max Points',
              accessor: (assignment) => assignment.max_points.toString()
            },
            { 
              header: 'Created', 
              accessor: (assignment) => formatDate(assignment.created_at)
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
                title="Edit assignment"
              >
                <Edit size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteAssignment(assignment);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Delete assignment"
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
        onClose={() => {
          setIsModalOpen(false);
          setFormError(null);
        }}
        size="lg"
      >
        <div>
          {/* Required Fields Notice */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                  Please fill in all fields marked with an asterisk (*).
                </h4>
              </div>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="text-red-500 mr-2 flex-shrink-0" size={18} />
                <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assignment Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Final Project, Midterm Exam"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                value={formCourseId}
                onChange={(e) => setFormCourseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              {courses.length === 0 && (
                <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                  No courses available. Please create a course first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Provide assignment details, requirements, and instructions..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Points <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formMaxPoints}
                  onChange={(e) => setFormMaxPoints(e.target.value)}
                  min="1"
                  max="1000"
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignment}
                disabled={saving}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {modalType === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {modalType === 'create' ? 'Create Assignment' : 'Update Assignment'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isModalOpen && modalType === 'delete'}
        title="Delete Assignment"
        onClose={() => {
          setIsModalOpen(false);
          setFormError(null);
        }}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                  Warning
                </h4>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  This action cannot be undone. The assignment will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="text-red-500 mr-2 flex-shrink-0" size={18} />
                <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
              </div>
            </div>
          )}

          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the assignment <span className="font-semibold">"{selectedAssignment?.title}"</span>?
          </p>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setFormError(null);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={saving}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete Assignment
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentManagement;