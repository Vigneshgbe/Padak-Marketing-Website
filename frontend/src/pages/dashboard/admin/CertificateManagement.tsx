// src/pages/dashboard/admin/CertificateManagement.tsx
import React, { useState, useEffect } from 'react';
import { Trash2, Download, Search, PlusCircle, Edit3 } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import Modal from '../../../components/admin/Modal';
import { Certificate, User, Course } from '../../../lib/admin-types';

interface CertificateFormData {
  userId: string;
  courseId: string;
  certificateUrl: string;
}

const CertificateManagement: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CertificateFormData>({
    userId: '',
    courseId: '',
    certificateUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCertificates();
    fetchUsers();
    fetchCourses();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/certificates`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCertificates(data);
      } else {
        throw new Error('Failed to fetch certificates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/users`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
      }
      else {
        console.error('Failed to fetch users');
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
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

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/courses`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch courses');
        setCourses([]);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setCourses([]);
    }
  };

  const handleDeleteCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setIsModalOpen(true);
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setFormData({
      userId: certificate.userId,
      courseId: certificate.courseId,
      certificateUrl: certificate.certificateUrl || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateCertificate = () => {
    setSelectedCertificate(null);
    setFormData({ userId: '', courseId: '', certificateUrl: '' });
    setIsCreateModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/certificates/${selectedCertificate?.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchCertificates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete certificate');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete certificate');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.courseId) {
      setError('Please select both a student and a course');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';
      const url = selectedCertificate
        ? `${baseURL}/api/certificates/${selectedCertificate.id}`
        : `${baseURL}/api/certificates`;

      const method = selectedCertificate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        setFormData({ userId: '', courseId: '', certificateUrl: '' });
        fetchCertificates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save certificate');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save certificate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCertificates = certificates.filter((certificate: Certificate) => {
    if (searchTerm && !`${certificate.user.firstName} ${certificate.user.lastName} ${certificate.course.title}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Certificate Management</h2>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={handleCreateCertificate}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            <PlusCircle size={16} />
            Issue Certificate
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
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error</h3>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchCertificates();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<Certificate>
          data={filteredCertificates}
          columns={[
            {
              header: 'Student',
              accessor: (cert) => `${cert.user.firstName} ${cert.user.lastName}`
            },
            { header: 'Course', accessor: 'course.title' },
            {
              header: 'Issued Date',
              accessor: (cert) => new Date(cert.issuedDate).toLocaleDateString()
            },
            {
              header: 'Certificate',
              accessor: (cert) => cert.certificateUrl ? (
                <a
                  href={cert.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Certificate
                </a>
              ) : (
                <span className="text-gray-500">No URL</span>
              )
            }
          ]}
          actions={(cert) => (
            <div className="flex space-x-2">
              {cert.certificateUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(cert.certificateUrl, '_blank');
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Download size={16} className="text-green-500" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCertificate(cert);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Edit certificate"
              >
                <Edit3 size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCertificate(cert);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Delete certificate"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          )}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        title="Delete Certificate"
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete the certificate for {selectedCertificate?.user.firstName} {selectedCertificate?.user.lastName} - {selectedCertificate?.course.title}? This action cannot be undone.</p>

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

      {/* Create/Edit Certificate Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        title={selectedCertificate ? "Edit Certificate" : "Issue New Certificate"}
        onClose={() => {
          setIsCreateModalOpen(false);
          setError(null);
          setFormData({ userId: '', courseId: '', certificateUrl: '' });
        }}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Student *</label>
            <select
              name="userId"
              value={formData.userId}
              onChange={handleFormChange}
              required
              disabled={selectedCertificate !== null}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a student</option>
              {Array.isArray(users) && users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Course *</label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleFormChange}
              required
              disabled={selectedCertificate !== null}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a course</option>
              {Array.isArray(courses) && courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Certificate URL</label>
            <input
              type="url"
              name="certificateUrl"
              value={formData.certificateUrl}
              onChange={handleFormChange}
              placeholder="https://example.com/certificate.pdf"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional: Enter a URL to an existing certificate</p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setError(null);
                setFormData({ userId: '', courseId: '', certificateUrl: '' });
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.userId || !formData.courseId}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : (selectedCertificate ? 'Update Certificate' : 'Issue Certificate')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CertificateManagement;