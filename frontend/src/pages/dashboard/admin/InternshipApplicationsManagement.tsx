// src/pages/dashboard/admin/InternshipApplicationsManagement.tsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, ExternalLink, Mail, Phone, FileText, Calendar, Building, User } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';

interface InternshipApplication {
  id: string;
  internship_id: string;
  internship_title: string;
  internship_company: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  resume_url: string;
  cover_letter?: string;
  status: string;
  submitted_at: string;
}

const InternshipApplicationsManagement: React.FC = () => {
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<InternshipApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
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
      const response = await fetch(`${baseURL}/api/admin/internships/applications`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        throw new Error('Failed to fetch applications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = (application: InternshipApplication) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/internships/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
        
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApplications = applications.filter((app: InternshipApplication) => {
    if (searchTerm && !`${app.full_name} ${app.email} ${app.internship_title} ${app.internship_company}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (statusFilter !== 'all' && app.status.toLowerCase() !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status.toLowerCase() === 'pending').length,
    reviewed: applications.filter(a => a.status.toLowerCase() === 'reviewed').length,
    accepted: applications.filter(a => a.status.toLowerCase() === 'accepted').length,
    rejected: applications.filter(a => a.status.toLowerCase() === 'rejected').length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Internship Applications</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and review all internship applications
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          <div className="text-2xl font-bold">{statusCounts.all}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm text-yellow-700 dark:text-yellow-400">Pending</div>
          <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{statusCounts.pending}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-700 dark:text-blue-400">Reviewed</div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{statusCounts.reviewed}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-700 dark:text-green-400">Accepted</div>
          <div className="text-2xl font-bold text-green-800 dark:text-green-300">{statusCounts.accepted}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-700 dark:text-red-400">Rejected</div>
          <div className="text-2xl font-bold text-red-800 dark:text-red-300">{statusCounts.rejected}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, internship..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none min-w-[150px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
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
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Applications</h3>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchApplications}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<InternshipApplication>
          data={filteredApplications}
          columns={[
            { 
              header: 'Applicant', 
              accessor: (app) => (
                <div>
                  <div className="font-medium">{app.full_name}</div>
                  <div className="text-sm text-gray-500">{app.email}</div>
                </div>
              )
            },
            { 
              header: 'Internship', 
              accessor: (app) => (
                <div>
                  <div className="font-medium">{app.internship_title}</div>
                  <div className="text-sm text-gray-500">{app.internship_company}</div>
                </div>
              )
            },
            {
              header: 'Applied On',
              accessor: (app) => (
                <span className="text-sm">{formatDate(app.submitted_at)}</span>
              )
            },
            {
              header: 'Status',
              accessor: (app) => (
                <StatusBadge 
                  status={app.status.charAt(0).toUpperCase() + app.status.slice(1)} 
                />
              )
            }
          ]}
          actions={(app) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewApplication(app);
                }}
                className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                title="View details"
              >
                View
              </button>
            </div>
          )}
        />
      )}

      {/* Application Details Modal */}
      <Modal
        isOpen={isModalOpen}
        title="Application Details"
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        {selectedApplication && (
          <div className="space-y-6">
            {/* Applicant Information */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <User className="mr-2" size={18} />
                Applicant Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Full Name</label>
                  <p className="font-medium">{selectedApplication.full_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                  <p className="font-medium flex items-center">
                    <Mail size={14} className="mr-2" />
                    <a href={`mailto:${selectedApplication.email}`} className="text-orange-500 hover:underline">
                      {selectedApplication.email}
                    </a>
                  </p>
                </div>
                {selectedApplication.phone && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                    <p className="font-medium flex items-center">
                      <Phone size={14} className="mr-2" />
                      {selectedApplication.phone}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Applied On</label>
                  <p className="font-medium flex items-center">
                    <Calendar size={14} className="mr-2" />
                    {formatDate(selectedApplication.submitted_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Internship Information */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <Building className="mr-2" size={18} />
                Internship Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Position</label>
                  <p className="font-medium">{selectedApplication.internship_title}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Company</label>
                  <p className="font-medium">{selectedApplication.internship_company}</p>
                </div>
              </div>
            </div>

            {/* Resume */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Resume</label>
              <a
                href={selectedApplication.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              >
                <ExternalLink size={16} className="mr-2" />
                View Resume
              </a>
            </div>

            {/* Cover Letter */}
            {selectedApplication.cover_letter && (
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-2">
                  <FileText size={14} className="mr-1" />
                  Cover Letter
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-48 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                </div>
              </div>
            )}

            {/* Status Update */}
            <div className="border-t pt-4">
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Update Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedApplication.id, 'pending')}
                  disabled={updating || selectedApplication.status === 'pending'}
                  className={`px-4 py-2 rounded transition-colors ${
                    selectedApplication.status === 'pending'
                      ? 'bg-yellow-500 text-white cursor-default'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  } disabled:opacity-50`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApplication.id, 'reviewed')}
                  disabled={updating || selectedApplication.status === 'reviewed'}
                  className={`px-4 py-2 rounded transition-colors ${
                    selectedApplication.status === 'reviewed'
                      ? 'bg-blue-500 text-white cursor-default'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  } disabled:opacity-50`}
                >
                  Reviewed
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApplication.id, 'accepted')}
                  disabled={updating || selectedApplication.status === 'accepted'}
                  className={`px-4 py-2 rounded transition-colors ${
                    selectedApplication.status === 'accepted'
                      ? 'bg-green-500 text-white cursor-default'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  } disabled:opacity-50`}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApplication.id, 'rejected')}
                  disabled={updating || selectedApplication.status === 'rejected'}
                  className={`px-4 py-2 rounded transition-colors ${
                    selectedApplication.status === 'rejected'
                      ? 'bg-red-500 text-white cursor-default'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  } disabled:opacity-50`}
                >
                  Reject
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InternshipApplicationsManagement;