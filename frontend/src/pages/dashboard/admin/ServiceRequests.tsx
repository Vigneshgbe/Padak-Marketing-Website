// src/pages/dashboard/admin/ServiceRequests.tsx
import React, { useState } from 'react';
import { Edit, Mail, Phone, Search, Filter } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';
import { DetailedServiceRequest } from '../../../lib/admin-types';
import { useAdminData } from '../../../hooks/useAdminData';

const ServiceRequests: React.FC = () => {
  const { data: requests, loading, error, refetch } = useAdminData('/api/admin/service-requests');
  const [selectedRequest, setSelectedRequest] = useState<DetailedServiceRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [statusForm, setStatusForm] = useState({ status: 'pending' });

 const handleEditRequest = (request: DetailedServiceRequest) => {
  setSelectedRequest(request);
  setStatusForm({ status: request.status });
  setIsModalOpen(true);
};

  const filteredRequests = requests.filter((request: DetailedServiceRequest) => {
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

  const handleSaveRequest = async () => {
    // Implementation for saving request
    setIsModalOpen(false);
    refetch();
  };

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
            <select value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option> {/* Changed from in-process */}
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
            onClick={() => refetch()}
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
            }
          ]}
          actions={(request) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditRequest(request);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Edit size={16} className="text-blue-500" />
              </button>
            </div>
          )}
        />
      )}

      {/* Edit Request Modal */}
      <Modal
        isOpen={isModalOpen}
        title="Update Service Request"
        onClose={() => setIsModalOpen(false)}
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client Name
              </label>
              <input
                type="text"
                defaultValue={selectedRequest?.name || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service
              </label>
              <input
                type="text"
                defaultValue={selectedRequest?.service || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
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
                defaultValue={selectedRequest?.email || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="text"
                defaultValue={selectedRequest?.phone || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
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
                defaultValue={selectedRequest?.company || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website
              </label>
              <input
                type="text"
                defaultValue={selectedRequest?.website || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Details
            </label>
            <textarea
              defaultValue={selectedRequest?.project_details || ''}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              disabled
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget Range
              </label>
              <input
                type="text"
                defaultValue={selectedRequest?.budget_range || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timeline
              </label>
              <input
                type="text"
                defaultValue={selectedRequest?.timeline || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Method
              </label>
              <input
                type="text"
                defaultValue={selectedRequest?.contact_method || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>
          </div>

          {selectedRequest?.additional_requirements && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Requirements
              </label>
              <textarea
                defaultValue={selectedRequest.additional_requirements}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              defaultValue={selectedRequest?.status || 'pending'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <option value="pending">Pending</option>
              <option value="in-process">In Process</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRequest}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Update
            </button>
          </div>
        </div>
      </Modal>

      {/* Contact Actions */}
      {selectedRequest && (
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