import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Trash2, Search, Filter, DollarSign } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';

interface EnrollmentRequest {
  id: string;
  user_id: string | null;
  course_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: string;
  transaction_id: string;
  payment_screenshot: string;
  status: 'pending' | 'approved' | 'rejected';
  is_guest: boolean;
  created_at: any;
  course_title: string;
  course_price: number;
  user_account_email: string | null;
}

const EnrollmentRequestsManagement: React.FC = () => {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const baseURL = 'http://localhost:5000';
      
      const url = statusFilter !== 'all' 
        ? `${baseURL}/api/admin/enrollment-requests?status=${statusFilter}`
        : `${baseURL}/api/admin/enrollment-requests`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        throw new Error('Failed to fetch enrollment requests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this enrollment request?')) return;

    try {
      setProcessing(true);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const baseURL = 'http://localhost:5000';
      
      const response = await fetch(`${baseURL}/api/admin/enrollment-requests/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message + (result.linkedToUser ? '\n(Linked to existing user account)' : '\n(Guest enrollment created)'));
        fetchRequests();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve request');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const baseURL = 'http://localhost:5000';
      
      const response = await fetch(`${baseURL}/api/admin/enrollment-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason })
      });

      if (response.ok) {
        alert('Enrollment request rejected successfully');
        setIsRejectModalOpen(false);
        setRejectReason('');
        fetchRequests();
      } else {
        throw new Error('Failed to reject request');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enrollment request? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const baseURL = 'http://localhost:5000';
      
      const response = await fetch(`${baseURL}/api/admin/enrollment-requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        alert('Enrollment request deleted successfully');
        fetchRequests();
      } else {
        throw new Error('Failed to delete request');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete request');
    }
  };

  const handleViewDetails = (request: EnrollmentRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const handleRejectClick = (request: EnrollmentRequest) => {
    setSelectedRequest(request);
    setIsRejectModalOpen(true);
  };

  const filteredRequests = requests.filter((request) => {
    const searchString = `${request.full_name} ${request.email} ${request.course_title}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Enrollment Requests</h2>
          <p className="text-gray-600 dark:text-gray-400">Review and approve course enrollment requests</p>
        </div>

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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
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
            onClick={fetchRequests}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending</h3>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Approved</h3>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Rejected</h3>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {requests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
          </div>

          <DataTable<EnrollmentRequest>
            data={filteredRequests}
            columns={[
              { header: 'Name', accessor: 'full_name' },
              { header: 'Email', accessor: 'email' },
              { 
                header: 'Course', 
                accessor: (req) => (
                  <div>
                    <div className="font-medium">{req.course_title}</div>
                    <div className="text-sm text-gray-500">₹{req.course_price}</div>
                  </div>
                )
              },
              { 
                header: 'Type', 
                accessor: (req) => (
                  <span className={`px-2 py-1 rounded text-xs ${req.is_guest ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {req.is_guest ? 'Guest' : 'User'}
                  </span>
                )
              },
              { 
                header: 'Payment', 
                accessor: (req) => (
                  <div>
                    <div className="text-sm">{req.payment_method}</div>
                    <div className="text-xs text-gray-500">{req.transaction_id}</div>
                  </div>
                )
              },
              {
                header: 'Status',
                accessor: (req) => <StatusBadge status={req.status} />
              },
              { 
                header: 'Date', 
                accessor: (req) => new Date(req.created_at?.toDate?.() || req.created_at).toLocaleDateString() 
              }
            ]}
            actions={(request) => (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(request);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="View details"
                >
                  <Eye size={16} className="text-blue-500" />
                </button>
                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(request.id);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Approve"
                      disabled={processing}
                    >
                      <CheckCircle size={16} className="text-green-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectClick(request);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Reject"
                      disabled={processing}
                    >
                      <XCircle size={16} className="text-red-500" />
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(request.id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Delete"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            )}
          />
        </>
      )}

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        title="Enrollment Request Details"
        onClose={() => setIsViewModalOpen(false)}
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <p className="text-gray-900 dark:text-white">{selectedRequest.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white">{selectedRequest.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <p className="text-gray-900 dark:text-white">{selectedRequest.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course
                </label>
                <p className="text-gray-900 dark:text-white">{selectedRequest.course_title}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <p className="text-gray-900 dark:text-white">
                {selectedRequest.address}, {selectedRequest.city}, {selectedRequest.state} - {selectedRequest.pincode}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <p className="text-gray-900 dark:text-white">{selectedRequest.payment_method}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transaction ID
                </label>
                <p className="text-gray-900 dark:text-white font-mono text-sm">{selectedRequest.transaction_id}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Screenshot
              </label>
              <img 
                src={`http://localhost:5000${selectedRequest.payment_screenshot}`}
                alt="Payment Screenshot"
                className="w-full max-h-96 object-contain border rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleRejectClick(selectedRequest);
                    }}
                    className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleApprove(selectedRequest.id);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Approve
                  </button>
                </>
              )}
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        title="Reject Enrollment Request"
        onClose={() => setIsRejectModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Please provide a reason for rejecting this enrollment request:
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
            >
              {processing ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnrollmentRequestsManagement;