// src/pages/dashboard/admin/ContactManagement.tsx
import React, { useState } from 'react';
import { Edit, Trash2, Mail, Phone, Search, Filter } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';
import { ContactMessage } from '../../../lib/admin-types';
import { useAdminData } from '../../../hooks/useAdminData';

const ContactManagement: React.FC = () => {
  const { data: contacts, loading, error, refetch } = useAdminData('/api/admin/contact-messages');
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'edit' | 'delete'>('edit');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleEditContact = (contact: ContactMessage) => {
    setSelectedContact(contact);
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleDeleteContact = (contact: ContactMessage) => {
    setSelectedContact(contact);
    setModalType('delete');
    setIsModalOpen(true);
  };

  const filteredContacts = contacts.filter((contact: ContactMessage) => {
    // Apply search filter
    if (searchTerm && !`${contact.first_name} ${contact.last_name} ${contact.email} ${contact.message}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    if (selectedFilter !== 'all' && contact.status !== selectedFilter) {
      return false;
    }
    
    return true;
  });

  const handleSaveContact = async () => {
    // Implementation for saving contact
    setIsModalOpen(false);
    refetch();
  };

  const handleDeleteConfirm = async () => {
    // Implementation for deleting contact
    setIsModalOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Contact Messages</h2>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search messages..."
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
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
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
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Messages</h3>
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
        <DataTable<ContactMessage>
          data={filteredContacts}
          columns={[
            { header: 'Name', accessor: (contact) => `${contact.first_name} ${contact.last_name}` },
            { header: 'Email', accessor: 'email' },
            {
              header: 'Message',
              accessor: (contact) => (
                <div className="max-w-xs truncate">{contact.message}</div>
              )
            },
            { header: 'Date', accessor: 'created_at' },
            {
              header: 'Status',
              accessor: (contact) => (
                <StatusBadge status={contact.status || 'pending'} />
              )
            }
          ]}
          actions={(contact) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditContact(contact);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Edit size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteContact(contact);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          )}
        />
      )}

      {/* Edit Contact Modal */}
      <Modal
        isOpen={isModalOpen && modalType === 'edit'}
        title="Update Contact Message"
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                defaultValue={selectedContact?.first_name || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                defaultValue={selectedContact?.last_name || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              defaultValue={selectedContact?.email || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              disabled
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="text"
                defaultValue={selectedContact?.phone || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <input
                type="text"
                defaultValue={selectedContact?.company || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              defaultValue={selectedContact?.message || ''}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              defaultValue={selectedContact?.status || 'pending'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
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
              onClick={handleSaveContact}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Update
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isModalOpen && modalType === 'delete'}
        title="Delete Contact Message"
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete the message from {selectedContact?.first_name} {selectedContact?.last_name}? This action cannot be undone.</p>

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

      {/* Contact Actions */}
      {selectedContact && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Contact Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href={`mailto:${selectedContact.email}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Mail size={20} />
              <span>Reply via Email</span>
            </a>
            {selectedContact.phone && (
              <a
                href={`tel:${selectedContact.phone}`}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                <Phone size={20} />
                <span>Call Contact</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement;