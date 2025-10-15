// src/pages/dashboard/admin/EnrollmentManagement.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Search, Filter, Save, X, Check, XCircle, Eye, Trash2, Download, ZoomIn } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';

interface EnrollmentRequest {
  id: string;
  user_id: string | null;
  course_id: string;
  course_name: string;
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
  status: string;
  is_guest: boolean;
  created_at: any;
}

interface Enrollment {
  id: string;
  user_id: string;
  user_name: string;
  course_id: string;
  course_name: string;
  progress: number;
  status: 'active' | 'completed' | 'dropped';
  enrollment_date: any;
  completion_date: any;
}

const EnrollmentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'enrollments'>('requests');
  
  // Enrollment Requests State
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // Enrollments State
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  
  // Image zoom state
  const [imageZoom, setImageZoom] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  // Common State
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchEnrollments();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        return new Date(dateValue.toDate()).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Handle Firestore Timestamp object with _seconds
      if (dateValue._seconds) {
        return new Date(dateValue._seconds * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Handle ISO string or regular Date
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  const handleImageZoom = (imageSrc: string) => {
    setZoomedImage(imageSrc);
    setImageZoom(true);
  };

  const fetchRequests = async () => {
    try {
      setRequestsLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/enrollment-requests', {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Enrollment requests:', data);
        setRequests(data);
      } else {
        throw new Error('Failed to fetch enrollment requests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setEnrollmentsLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/enrollments', {
        method: 'GET',
        headers: getAuthHeaders(),
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
      setEnrollmentsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this enrollment request?')) return;

    try {
      setSaving(true);
      const response = await fetch(`http://localhost:5000/api/admin/enrollment-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.userFound 
          ? 'Enrollment request approved and enrollment created successfully!' 
          : 'Enrollment request approved! Enrollment will be created when user registers with this email.');
        fetchRequests();
        fetchEnrollments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setSaving(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return;

    try {
      setSaving(true);
      const response = await fetch(`http://localhost:5000/api/admin/enrollment-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('Enrollment request rejected successfully!');
        fetchRequests();
      } else {
        throw new Error('Failed to reject request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this enrollment request?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/enrollment-requests/${requestId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        alert('Enrollment request deleted successfully!');
        fetchRequests();
      } else {
        throw new Error('Failed to delete request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete request');
    }
  };

  const handleViewRequest = (request: EnrollmentRequest) => {
    setSelectedRequest(request);
    setIsRequestModalOpen(true);
  };

  const handleEditEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsEnrollmentModalOpen(true);
  };

  const handleSaveEnrollment = async () => {
    if (!selectedEnrollment) return;

    try {
      setSaving(true);
      const response = await fetch(`http://localhost:5000/api/admin/enrollments/${selectedEnrollment.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          status: selectedEnrollment.status,
          progress: selectedEnrollment.progress,
          completion_date: selectedEnrollment.completion_date
        })
      });

      if (response.ok) {
        setIsEnrollmentModalOpen(false);
        fetchEnrollments();
      } else {
        throw new Error('Failed to update enrollment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update enrollment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enrollment?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/enrollments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        fetchEnrollments();
      } else {
        throw new Error('Failed to delete enrollment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete enrollment');
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (searchTerm && !`${request.full_name} ${request.email} ${request.course_name}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedFilter !== 'all' && request.status !== selectedFilter) {
      return false;
    }
    return true;
  });

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (searchTerm && !`${enrollment.user_name} ${enrollment.course_name}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
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
              placeholder="Search..."
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
              {activeTab === 'requests' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </>
              ) : (
                <>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Dropped</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Enrollment Requests ({requests.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'enrollments'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Active Enrollments ({enrollments.filter(e => e.status === 'active').length})
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <span className="text-red-500 mr-2">⚠️</span>
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error</h3>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchRequests();
              fetchEnrollments();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Enrollment Requests Tab */}
      {activeTab === 'requests' && (
        <>
          {requestsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <DataTable<EnrollmentRequest>
              data={filteredRequests}
              columns={[
                { header: 'Name', accessor: 'full_name' },
                { header: 'Email', accessor: 'email' },
                { header: 'Course', accessor: 'course_name' },
                { 
                  header: 'Type', 
                  accessor: (req) => (
                    <span className={`px-2 py-1 rounded-full text-xs ${req.is_guest ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'}`}>
                      {req.is_guest ? 'Guest' : 'User'}
                    </span>
                  )
                },
                {
                  header: 'Status',
                  accessor: (req) => <StatusBadge status={req.status} />
                },
                { 
                  header: 'Date', 
                  accessor: (req) => formatDate(req.created_at)
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
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveRequest(request.id);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Approve"
                        disabled={saving}
                      >
                        <Check size={16} className="text-green-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectRequest(request.id);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Reject"
                        disabled={saving}
                      >
                        <XCircle size={16} className="text-red-500" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRequest(request.id);
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              )}
            />
          )}
        </>
      )}

      {/* Active Enrollments Tab */}
      {activeTab === 'enrollments' && (
        <>
          {enrollmentsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <DataTable<Enrollment>
              data={filteredEnrollments}
              columns={[
                { header: 'Student', accessor: 'user_name' },
                { header: 'Course', accessor: 'course_name' },
                {
                  header: 'Progress',
                  accessor: (enrollment) => (
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{enrollment.progress}%</span>
                    </div>
                  )
                },
                {
                  header: 'Status',
                  accessor: (enrollment) => <StatusBadge status={enrollment.status} />
                },
                {
                  header: 'Enrolled',
                  accessor: (enrollment) => formatDate(enrollment.enrollment_date)
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
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              )}
            />
          )}
        </>
      )}

      {/* View Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        title="Enrollment Request Details"
        onClose={() => setIsRequestModalOpen(false)}
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedRequest.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedRequest.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedRequest.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedRequest.course_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                <p className="text-gray-900 dark:text-gray-100 uppercase">{selectedRequest.payment_method}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction ID</label>
                <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">{selectedRequest.transaction_id}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <p className="text-gray-900 dark:text-gray-100">{`${selectedRequest.address}, ${selectedRequest.city}, ${selectedRequest.state} - ${selectedRequest.pincode}`}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Payment Screenshot</label>
                {selectedRequest.payment_screenshot ? (
                  <div className="relative group">
                    <img 
                      src={`http://localhost:5000${selectedRequest.payment_screenshot}`} 
                      alt="Payment Proof"
                      className="w-full max-w-md h-auto rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-md cursor-pointer hover:shadow-xl transition-shadow"
                      onClick={() => handleImageZoom(`http://localhost:5000${selectedRequest.payment_screenshot}`)}
                      onLoad={(e) => {
                        console.log('✅ Image loaded successfully:', `http://localhost:5000${selectedRequest.payment_screenshot}`);
                      }}
                      onError={(e) => {
                        console.error('❌ Image load error:', `http://localhost:5000${selectedRequest.payment_screenshot}`);
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%23999"%3EImage not found%3C/text%3E%3Ctext x="50%25" y="60%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="12" fill="%23666"%3EPath: ' + selectedRequest.payment_screenshot + '%3C/text%3E%3C/svg%3E';
                      }}
                      crossOrigin="anonymous"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn size={20} className="text-white" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Click to enlarge | Path: {selectedRequest.payment_screenshot}
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-md h-48 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">No payment screenshot uploaded</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setIsRequestModalOpen(false);
                      handleApproveRequest(selectedRequest.id);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
                  >
                    <Check size={16} className="mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setIsRequestModalOpen(false);
                      handleRejectRequest(selectedRequest.id);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
                  >
                    <XCircle size={16} className="mr-2" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Image Zoom Modal */}
      {imageZoom && zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImageZoom(false)}
        >
          <button
            onClick={() => setImageZoom(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full"
          >
            <X size={24} />
          </button>
          <img 
            src={zoomedImage} 
            alt="Payment Proof (Zoomed)"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            Click outside to close
          </div>
        </div>
      )}

      {/* Edit Enrollment Modal */}
      <Modal
        isOpen={isEnrollmentModalOpen}
        title="Edit Enrollment"
        onClose={() => setIsEnrollmentModalOpen(false)}
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
                onClick={() => setIsEnrollmentModalOpen(false)}
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