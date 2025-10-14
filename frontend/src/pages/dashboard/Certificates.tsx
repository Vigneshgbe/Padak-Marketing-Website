// src/pages/dashboard/Certificates.tsx
import React, { useState, useEffect } from 'react';
import { Award, Download, Share2, ExternalLink, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Certificate {
  id: string | number;
  userId: string | number;
  courseId: string;
  certificateUrl: string;
  issuedDate: string;
  course: {
    id: string;
    title: string;
    description: string;
    instructorName: string;
    category: string;
    difficultyLevel: string;
  };
  enrollment: {
    completionDate: string;
    finalGrade?: number;
    status: string;
  };
}

const Certificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
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

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        setError('Please log in to view your certificates');
        setLoading(false);
        return;
      }

      console.log('🏆 Fetching certificates...');

      const response = await fetch(`${API_BASE}/certificates/my-certificates`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please log in again.');
        }
        throw new Error(`Failed to fetch certificates: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Certificates fetched:', data);

      // Validate data structure
      const validCertificates = Array.isArray(data) 
        ? data.filter(cert => cert && cert.course && cert.enrollment)
        : [];

      setCertificates(validCertificates);

    } catch (error) {
      console.error('❌ Failed to fetch certificates:', error);
      setError(error instanceof Error ? error.message : 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId: string | number, courseTitle: string) => {
    try {
      console.log('📥 Downloading certificate:', certificateId);

      const response = await fetch(`${API_BASE}/certificates/${certificateId}/download`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const data = await response.json();
      
      // For now, just show a message
      alert('Certificate download feature is coming soon! Your certificate will be available for download shortly.');
      
      // In production, you would handle the PDF blob here:
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const link = document.createElement('a');
      // link.href = url;
      // link.download = `${courseTitle.replace(/\s+/g, '_')}_Certificate.pdf`;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      // window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to download certificate:', error);
      alert('Failed to download certificate. Please try again.');
    }
  };

  const handleShare = async (certificate: Certificate) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${certificate.course.title} Certificate`,
          text: `I've completed ${certificate.course.title} and earned a certificate!`,
          url: certificate.certificateUrl
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(certificate.certificateUrl);
        alert('Certificate URL copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        alert('Sharing not supported on this browser');
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getDifficultyColor = (level: string) => {
    const normalizedLevel = (level || '').toLowerCase();
    switch (normalizedLevel) {
      case 'beginner':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Certificates</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and download your earned certificates
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your certificates...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Certificates</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and download your earned certificates
          </p>
        </div>
        <div className="text-center py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
            <Award size={64} className="mx-auto text-red-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">Error Loading Certificates</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button 
              onClick={fetchCertificates}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center mx-auto"
            >
              <RefreshCw size={16} className="mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Certificates</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and download your earned certificates
          </p>
        </div>
        <button
          onClick={fetchCertificates}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
          title="Refresh certificates"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </button>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <Award size={24} className="text-orange-500 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{certificate.course?.title || 'Untitled Course'}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getDifficultyColor(certificate.course?.difficultyLevel)}`}>
                    {certificate.course?.difficultyLevel || 'Beginner'}
                  </span>
                </div>
              </div>
              
              <div className="mb-4 space-y-2">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  <span className="font-medium">Instructor:</span> {certificate.course?.instructorName || 'N/A'}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  <span className="font-medium">Category:</span> {certificate.course?.category || 'General'}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  <span className="font-medium">Completed:</span> {formatDate(certificate.enrollment?.completionDate)}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  <span className="font-medium">Issued:</span> {formatDate(certificate.issuedDate)}
                </p>
                {certificate.enrollment?.finalGrade && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    <span className="font-medium">Final Grade:</span> {certificate.enrollment.finalGrade}%
                  </p>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleDownload(certificate.id, certificate.course?.title || 'Certificate')}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
                >
                  <Download size={16} className="mr-2" />
                  Download
                </button>
                <button 
                  onClick={() => handleShare(certificate)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Share Certificate"
                >
                  <Share2 size={16} />
                </button>
                {certificate.certificateUrl && (
                  <button 
                    onClick={() => window.open(certificate.certificateUrl, '_blank')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="View Certificate"
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Award size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No certificates yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Complete courses to earn certificates
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard/courses'}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            View My Courses
          </button>
        </div>
      )}
    </div>
  );
};

export default Certificates;