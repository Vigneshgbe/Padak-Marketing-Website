// src/pages/dashboard/admin/ServiceRequests.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Mail, Phone, Search, Filter, Trash2, Eye, Save, X } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';
import { ServiceRequest } from '../../../lib/admin-types';

interface DetailedServiceRequest extends ServiceRequest {
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  project_details?: string;
  budget_range?: string;
  timeline?: string;
  contact_method?: string;
  additional_requirements?: string;
  created_at?: string;
  subcategory_id?: number;
  user_id?: number;
  user_first_name?: string;
  user_last_name?: string;
  user_account_type?: string;
}

const ServiceRequests: React.FC = () => {
  const [requests, setRequests] = useState<DetailedServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<DetailedServiceRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    status: 'pending',
    project_details: '',
    budget_range: '',
    timeline: '',
    additional_requirements: ''
  });

  // Fetch service requests from API
  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Use hardcoded base URL
      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/service-requests`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle both array and object responses
        if (Array.isArray(data)) {
          setRequests(data);
        } else if (data.requests && Array.isArray(data.requests)) {
          setRequests(data.requests);
        } else {
          // Fallback to mock data if API response is unexpected
          setRequests([
            {
              id: 1,
              name: 'John Doe',
              service: 'SEO Optimization',
              date: '15 Jan 2023',
              status: 'pending',
              email: 'john@example.com',
              phone: '+1234567890',
              company: 'ABC Corp',
              project_details: 'Need SEO for e-commerce website',
              budget_range: '₹50,000 - ₹1,00,000',
              timeline: '1-2 months',
              contact_method: 'email',
              user_id: 101,
              user_first_name: 'John',
              user_last_name: 'Doe',
              user_account_type: 'professional'
            },
            {
              id: 2,
              name: 'Jane Smith',
              service: 'Social Media Marketing',
              date: '20 Jan 2023',
              status: 'in-progress',
              email: 'jane@example.com',
              phone: '+0987654321',
              company: 'XYZ Ltd',
              project_details: 'Social media campaign for product launch',
              budget_range: '₹1,00,000 - ₹2,00,000',
              timeline: '3 months',
              contact_method: 'phone',
              user_id: 102,
              user_first_name: 'Jane',
              user_last_name: 'Smith',
              user_account_type: 'business'
            }
          ]);
        }
      } else {
        throw new Error('Failed to fetch service requests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching service requests:', err);
      
      // Fallback to mock data on error
      setRequests([
        {
          id: 1,
          name: 'John Doe',
          service: 'SEO Optimization',
          date: '15 Jan 2023',
          status: 'pending',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'ABC Corp',
          project_details: 'Need SEO for e-commerce website',
          budget_range: '₹50,000 - ₹1,00,000',
          timeline: '1-2 months',
          contact_method: 'email',
          user_id: 101,
          user_first_name: 'John',
          user_last_name: 'Doe',
          user_account_type: 'professional'
        },
        {
          id: 2,
          name: 'Jane Smith',
          service: 'Social Media Marketing',
          date: '20 Jan 2023',
          status: 'in-progress',
          email: 'jane@example.com',
          phone: '+0987654321',
          company: 'XYZ Ltd',
          project_details: 'Social media campaign for product launch',
          budget_range: '₹1,00,000 - ₹2,00,000',
          timeline: '3 months',
          contact_method: 'phone',
          user_id: 102,
          user_first_name: 'Jane',
          user_last_name: 'Smith',
          user_account_type: 'business'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const handleEditRequest = (request: DetailedServiceRequest) => {
    setSelectedRequest(request);
    setEditForm({
      status: request.status || 'pending',
      project_details: request.project_details || '',
      budget_range: request.budget_range || '',
      timeline: request.timeline || '',
      additional_requirements: request.additional_requirements || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleViewRequest = (request: DetailedServiceRequest) => {
    setSelectedRequest(request);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (request: DetailedServiceRequest) => {
    setSelectedRequest(request);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRequest) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/service-requests/${selectedRequest.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        setRequests(requests.filter(req => req.id !== selectedRequest.id));
        setIsDeleteModalOpen(false);
        setSelectedRequest(null);
      } else {
        throw new Error('Failed to delete service request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
      console.error('Error deleting service request:', err);
    }
  };

  const handleSaveRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/service-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editForm),
        credentials: 'include'
      });

      if (response.ok) {
        // Update the request in the local state
        setRequests(requests.map(req => 
          req.id === selectedRequest.id ? { 
            ...req, 
            status: editForm.status,
            project_details: editForm.project_details,
            budget_range: editForm.budget_range,
            timeline: editForm.timeline,
            additional_requirements: editForm.additional_requirements
          } : req
        ));
        setIsModalOpen(false);
        setSelectedRequest(null);
        setIsEditing(false);
      } else {
        throw new Error('Failed to update service request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating');
      console.error('Error updating service request:', err);
    }
  };

  const handleCancelEdit = () => {
    if (selectedRequest) {
      setEditForm({
        status: selectedRequest.status || 'pending',
        project_details: selectedRequest.project_details || '',
        budget_range: selectedRequest.budget_range || '',
        timeline: selectedRequest.timeline || '',
        additional_requirements: selectedRequest.additional_requirements || ''
      });
    }
    setIsEditing(false);
  };

  const filteredRequests = requests.filter((request) => {
    // Apply search filter
    if (searchTerm && !`${request.name} ${request.service} ${request.email}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Apply status filter
    if (selectedFilter !== 'all' && request.status !== selectedFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Service Requests</h2>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search requests..."
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
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
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
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Requests</h3>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchServiceRequests}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<DetailedServiceRequest>
          data={filteredRequests}
          columns={[
            { header: 'Client', accessor: 'name' },
            { header: 'Service', accessor: 'service' },
            { header: 'Date', accessor: 'date' },
            {
              header: 'Status',
              accessor: (request) => (
                <StatusBadge status={request.status} />
              )
            },
            {
              header: 'User Account',
              accessor: (request) => (
                request.user_id ? 
                  `${request.user_first_name || ''} ${request.user_last_name || ''} (${request.user_account_type || 'N/A'})` : 
                  'Guest'
              )
            }
          ]}
          actions={(request) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewRequest(request);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="View details"
              >
                <Eye size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditRequest(request);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Edit request"
              >
                <Edit size={16} className="text-green-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRequest(request);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Delete request"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          )}
        />
      )}

      {/* View/Edit Request Modal */}
      <Modal
        isOpen={isModalOpen}
        title={selectedRequest ? `${isEditing ? 'Edit' : 'View'} Service Request` : 'Service Request'}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequest(null);
          setIsEditing(false);
        }}
        size="xl"
      >
        {selectedRequest && (
          <div className="space-y-4">
            {/* User Account Information */}
            {selectedRequest.user_id && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">User Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={`${selectedRequest.user_first_name || ''} ${selectedRequest.user_last_name || ''}`}
                      className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Account Type
                    </label>
                    <input
                      type="text"
                      value={selectedRequest.user_account_type || 'N/A'}
                      className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  defaultValue={selectedRequest.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service
                </label>
                <input
                  type="text"
                  defaultValue={selectedRequest.service || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={selectedRequest.email || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  defaultValue={selectedRequest.phone || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  defaultValue={selectedRequest.company || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  defaultValue={selectedRequest.website || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Details
              </label>
              <textarea
                value={isEditing ? editForm.project_details : selectedRequest.project_details || ''}
                onChange={(e) => isEditing && setEditForm({...editForm, project_details: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                disabled={!isEditing}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Budget Range
                </label>
                <input
                  type="text"
                  value={isEditing ? editForm.budget_range : selectedRequest.budget_range || ''}
                  onChange={(e) => isEditing && setEditForm({...editForm, budget_range: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timeline
                </label>
                <input
                  type="text"
                  value={isEditing ? editForm.timeline : selectedRequest.timeline || ''}
                  onChange={(e) => isEditing && setEditForm({...editForm, timeline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Method
                </label>
                <input
                  type="text"
                  defaultValue={selectedRequest.contact_method || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                  disabled
                />
              </div>
            </div>

            {selectedRequest.additional_requirements && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Requirements
                </label>
                <textarea
                  value={isEditing ? editForm.additional_requirements : selectedRequest.additional_requirements}
                  onChange={(e) => isEditing && setEditForm({...editForm, additional_requirements: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700"
                  disabled={!isEditing}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={isEditing ? editForm.status : selectedRequest.status || 'pending'}
                onChange={(e) => isEditing && setEditForm({...editForm, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={!isEditing}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <X size={16} className="mr-1" /> Cancel
                  </button>
                  <button
                    onClick={handleSaveRequest}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center"
                  >
                    <Save size={16} className="mr-1" /> Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleEditRequest(selectedRequest)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center"
                  >
                    <Edit size={16} className="mr-1" /> Edit
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        title="Confirm Deletion"
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedRequest(null);
        }}
        size="md"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this service request? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedRequest(null);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Contact Actions */}
      {selectedRequest && selectedRequest.email && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Contact Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href={`mailto:${selectedRequest.email}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Mail size={20} />
              <span>Email Client</span>
            </a>
            {selectedRequest.phone && (
              <a
                href={`tel:${selectedRequest.phone}`}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                <Phone size={20} />
                <span>Call Client</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequests;