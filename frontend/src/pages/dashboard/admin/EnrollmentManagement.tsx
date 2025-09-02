// src/pages/dashboard/admin/EnrollmentManagement.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Search, Filter, Save, X } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';
import { Enrollment } from '../../../lib/admin-types';

const EnrollmentManagement: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
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
      const response = await fetch(`${baseURL}/api/admin/enrollments`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollments(data);
      } else {
        throw new Error('Failed to fetch enrollments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsModalOpen(true);
  };

  const handleSaveEnrollment = async () => {
    if (!selectedEnrollment) return;

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
      const response = await fetch(`${baseURL}/api/admin/enrollments/${selectedEnrollment.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          status: selectedEnrollment.status,
          progress: selectedEnrollment.progress,
          completion_date: selectedEnrollment.completion_date
        })
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchEnrollments(); // Refresh the data
      } else {
        throw new Error('Failed to update enrollment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update enrollment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEnrollment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this enrollment?')) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/enrollments/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        fetchEnrollments(); // Refresh the data
      } else {
        throw new Error('Failed to delete enrollment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete enrollment');
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
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
              <option value="dropped">Dropped</option>
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
            onClick={fetchEnrollments}
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
                  <span className="text-xs ml-2">{enrollment.progress}%</span>
                </div>
              )
            },
            {
              header: 'Status',
              accessor: (enrollment) => (
                <StatusBadge status={enrollment.status} />
              )
            },
            { 
              header: 'Enrollment Date', 
              accessor: (enrollment) => new Date(enrollment.enrollment_date).toLocaleDateString() 
            },
            { 
              header: 'Completion Date', 
              accessor: (enrollment) => enrollment.completion_date 
                ? new Date(enrollment.completion_date).toLocaleDateString() 
                : 'N/A' 
            }
          ]}
          actions={(enrollment) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEnrollment(enrollment);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Edit enrollment"
              >
                <Edit size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEnrollment(enrollment.id);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Delete enrollment"
              >
                <X size={16} className="text-red-500" />
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
        {selectedEnrollment && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={selectedEnrollment.status}
                  onChange={(e) => setSelectedEnrollment({
                    ...selectedEnrollment,
                    status: e.target.value as 'active' | 'completed' | 'dropped'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Dropped</option>
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
                  value={selectedEnrollment.progress}
                  onChange={(e) => setSelectedEnrollment({
                    ...selectedEnrollment,
                    progress: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            {selectedEnrollment.status === 'completed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Completion Date
                </label>
                <input
                  type="date"
                  value={selectedEnrollment.completion_date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedEnrollment({
                    ...selectedEnrollment,
                    completion_date: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEnrollment}
                disabled={saving}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Update
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnrollmentManagement;