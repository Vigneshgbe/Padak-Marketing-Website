// src/pages/dashboard/admin/InternshipManagement.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search, Filter, Save, X } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';

interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  type: string;
  level: string;
  description: string;
  requirements: string[];
  benefits: string[];
  posted_at: string;
  applications_count: number;
  spots_available: number;
}

const InternshipManagement: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
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
      const response = await fetch(`${baseURL}/api/admin/internships`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setInternships(data);
      } else {
        throw new Error('Failed to fetch internships');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInternship = (internship: Internship) => {
    setSelectedInternship(internship);
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleDeleteInternship = (internship: Internship) => {
    setSelectedInternship(internship);
    setModalType('delete');
    setIsModalOpen(true);
  };

  const handleCreateInternship = () => {
    setSelectedInternship(null);
    setModalType('create');
    setIsModalOpen(true);
  };

  const handleSaveInternship = async (formData: any) => {
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
        ? `${baseURL}/api/admin/internships`
        : `${baseURL}/api/admin/internships/${selectedInternship?.id}`;

      const method = modalType === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchInternships();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save internship');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save internship');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInternship) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/internships/${selectedInternship.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchInternships();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete internship');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete internship');
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formDataObj = Object.fromEntries(formData.entries());
    
    // Convert requirements and benefits from textarea to array
    const requirements = (formDataObj.requirements as string).split('\n').filter(r => r.trim());
    const benefits = (formDataObj.benefits as string).split('\n').filter(b => b.trim());
    
    const processedData = {
      ...formDataObj,
      requirements: JSON.stringify(requirements),
      benefits: JSON.stringify(benefits),
      spots_available: parseInt(formDataObj.spots_available as string),
      applications_count: modalType === 'create' ? 0 : selectedInternship?.applications_count || 0
    };

    handleSaveInternship(processedData);
  };

  const filteredInternships = internships.filter((internship: Internship) => {
    if (searchTerm && !`${internship.title} ${internship.company} ${internship.location}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'paid' && internship.type.toLowerCase() !== 'paid') return false;
      if (selectedFilter === 'unpaid' && internship.type.toLowerCase() !== 'unpaid') return false;
      if (selectedFilter === 'entry level' && internship.level.toLowerCase() !== 'entry level') return false;
      if (selectedFilter === 'intermediate' && internship.level.toLowerCase() !== 'intermediate') return false;
      if (selectedFilter === 'advanced' && internship.level.toLowerCase() !== 'advanced') return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Internship Management</h2>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search internships..."
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
              <option value="all">All Internships</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="entry level">Entry Level</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <button
            onClick={handleCreateInternship}
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
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Internships</h3>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchInternships}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<Internship>
          data={filteredInternships}
          columns={[
            { header: 'Title', accessor: 'title' },
            { header: 'Company', accessor: 'company' },
            { header: 'Location', accessor: 'location' },
            {
              header: 'Type',
              accessor: (internship) => (
                <span className="capitalize">{internship.type}</span>
              )
            },
            {
              header: 'Level',
              accessor: (internship) => (
                <span className="capitalize">{internship.level}</span>
              )
            },
            {
              header: 'Applications',
              accessor: (internship) => `${internship.applications_count}/${internship.spots_available}`
            }
          ]}
          actions={(internship) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditInternship(internship);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Edit internship"
              >
                <Edit size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteInternship(internship);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Delete internship"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          )}
        />
      )}

      {/* Edit/Create Internship Modal */}
      <Modal
        isOpen={isModalOpen && (modalType === 'create' || modalType === 'edit')}
        title={modalType === 'create' ? 'Create New Internship' : 'Edit Internship'}
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                defaultValue={selectedInternship?.title || ''}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  name="company"
                  defaultValue={selectedInternship?.company || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  defaultValue={selectedInternship?.location || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                defaultValue={selectedInternship?.description || ''}
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration *
                </label>
                <input
                  type="text"
                  name="duration"
                  placeholder="e.g., 3 months"
                  defaultValue={selectedInternship?.duration || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type *
                </label>
                <select
                  name="type"
                  defaultValue={selectedInternship?.type || 'Paid'}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Level *
                </label>
                <select
                  name="level"
                  defaultValue={selectedInternship?.level || 'Entry Level'}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Available Spots *
              </label>
              <input
                type="number"
                name="spots_available"
                min="0"
                defaultValue={selectedInternship?.spots_available || ''}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Requirements (one per line) *
              </label>
              <textarea
                name="requirements"
                defaultValue={selectedInternship?.requirements?.join('\n') || ''}
                rows={5}
                required
                placeholder="Knowledge of Python&#10;Good communication skills&#10;Team player"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Benefits (one per line) *
              </label>
              <textarea
                name="benefits"
                defaultValue={selectedInternship?.benefits?.join('\n') || ''}
                rows={5}
                required
                placeholder="Certificate of completion&#10;Mentorship from industry experts&#10;Flexible working hours"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
        title="Delete Internship"
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete the internship "{selectedInternship?.title}" at {selectedInternship?.company}? This action cannot be undone.</p>

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

export default InternshipManagement;