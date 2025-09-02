// src/pages/dashboard/admin/CourseManagement.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search, Filter, Save, X, Upload } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';
import { Course } from '../../../lib/admin-types';

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
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
      } else {
        throw new Error('Failed to fetch courses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleDeleteCourse = (course: Course) => {
    setSelectedCourse(course);
    setModalType('delete');
    setIsModalOpen(true);
  };

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setModalType('create');
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (formData: any) => {
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
      const url = modalType === 'create' 
        ? `${baseURL}/api/admin/courses`
        : `${baseURL}/api/admin/courses/${selectedCourse?.id}`;

      const method = modalType === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // If there's a thumbnail file, upload it separately
        if (thumbnailFile && selectedCourse?.id) {
          await uploadThumbnail(selectedCourse.id, thumbnailFile);
        }
        
        setIsModalOpen(false);
        setThumbnailFile(null);
        fetchCourses(); // Refresh the data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save course');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const uploadThumbnail = async (courseId: number, file: File) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('thumbnail', file);

      const response = await fetch(`http://localhost:5000/api/admin/courses/${courseId}/thumbnail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload thumbnail');
      }
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCourse) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/courses/${selectedCourse.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchCourses(); // Refresh the data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete course');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formDataObj = Object.fromEntries(formData.entries());
    
    // Convert string values to appropriate types
    const processedData = {
      ...formDataObj,
      duration_weeks: parseInt(formDataObj.duration_weeks as string),
      price: parseFloat(formDataObj.price as string),
      is_active: formDataObj.is_active === '1'
    };

    handleSaveCourse(processedData);
  };

  const filteredCourses = courses.filter((course: Course) => {
    // Apply search filter
    if (searchTerm && !`${course.title} ${course.instructor_name} ${course.category}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'active' && !course.is_active) return false;
      if (selectedFilter === 'inactive' && course.is_active) return false;
      if (selectedFilter !== 'active' && selectedFilter !== 'inactive' && course.difficulty_level !== selectedFilter) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Course Management</h2>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search courses..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <button
            onClick={handleCreateCourse}
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
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Courses</h3>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchCourses}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<Course>
          data={filteredCourses}
          columns={[
            { header: 'Title', accessor: 'title' },
            { header: 'Instructor', accessor: 'instructor_name' },
            {
              header: 'Price',
              accessor: (course) => `₹${course.price?.toLocaleString() || '0'}`
            },
            {
              header: 'Difficulty',
              accessor: (course) => (
                <span className="capitalize">{course.difficulty_level}</span>
              )
            },
            {
              header: 'Status',
              accessor: (course) => (
                <StatusBadge status={course.is_active ? 'Active' : 'Inactive'} />
              )
            }
          ]}
          actions={(course) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCourse(course);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Edit course"
              >
                <Edit size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCourse(course);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Delete course"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          )}
        />
      )}

      {/* Edit/Create Course Modal */}
      <Modal
        isOpen={isModalOpen && (modalType === 'create' || modalType === 'edit')}
        title={modalType === 'create' ? 'Create New Course' : 'Edit Course'}
        onClose={() => {
          setIsModalOpen(false);
          setThumbnailFile(null);
        }}
        size="lg"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                defaultValue={selectedCourse?.title || ''}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instructor Name *
              </label>
              <input
                type="text"
                name="instructor_name"
                defaultValue={selectedCourse?.instructor_name || ''}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                defaultValue={selectedCourse?.description || ''}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  defaultValue={selectedCourse?.category || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Difficulty Level *
                </label>
                <select
                  name="difficulty_level"
                  defaultValue={selectedCourse?.difficulty_level || 'beginner'}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (Weeks) *
                </label>
                <input
                  type="number"
                  name="duration_weeks"
                  min="1"
                  defaultValue={selectedCourse?.duration_weeks || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  defaultValue={selectedCourse?.price || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="is_active"
                  defaultValue={selectedCourse?.is_active ? "1" : "0"}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Thumbnail
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <Upload size={16} />
                    <span>{thumbnailFile ? thumbnailFile.name : 'Choose thumbnail'}</span>
                  </div>
                </label>
              </div>
              {selectedCourse?.thumbnail && !thumbnailFile && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Current thumbnail:</p>
                  <img 
                    src={selectedCourse.thumbnail} 
                    alt="Course thumbnail" 
                    className="h-20 object-cover rounded mt-1"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setThumbnailFile(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {modalType === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {modalType === 'create' ? 'Create' : 'Update'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isModalOpen && modalType === 'delete'}
        title="Delete Course"
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete the course "{selectedCourse?.title}"? This action cannot be undone.</p>

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

export default CourseManagement;