// src/pages/dashboard/Certificates.tsx
import React, { useState, useEffect } from 'react';
import { Award, Download, Share2, ExternalLink } from 'lucide-react';
import { apiService } from '../../lib/api';

interface Certificate {
  id: number;
  userId: number;
  courseId: number;
  certificateUrl: string;
  issuedDate: string;
  course: {
    id: number;
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
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.get<Certificate[]>('/certificates/my-certificates');
        
        // Filter out any certificates with missing course or enrollment data
        const validCertificates = Array.isArray(data) 
          ? data.filter(cert => cert && cert.course && cert.enrollment)
          : [];
        
        setCertificates(validCertificates);
      } catch (error) {
        console.error('Failed to fetch certificates:', error);
        setError('Failed to load certificates. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const handleDownload = async (certificateId: number, courseTitle: string) => {
    try {
      const response = await apiService.get(`/certificates/${certificateId}/download`, {
        responseType: 'blob'
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${courseTitle.replace(/\s+/g, '_')}_Certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download certificate:', error);
      alert('Failed to download certificate. Please try other options.');
    }
  };

  const handleShare = async (certificate: Certificate) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${certificate.course?.title || 'Certificate'} Certificate`,
          text: `I've completed ${certificate.course?.title || 'a course'} and earned a certificate!`,
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
      }
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
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

  const getDifficultyColor = (level: string | undefined) => {
    if (!level) return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    
    switch (level.toLowerCase()) {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
          <Award size={64} className="mx-auto text-red-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-red-600">Error Loading Certificates</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Certificates</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and download your earned certificates
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <Award size={24} className="text-orange-500 mr-3" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">
                    {certificate.course?.title || 'Untitled Course'}
                  </h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getDifficultyColor(certificate.course?.difficultyLevel)}`}>
                    {certificate.course?.difficultyLevel || 'Beginner'}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  <span className="font-medium">Instructor:</span> {certificate.course?.instructorName || 'N/A'}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  <span className="font-medium">Category:</span> {certificate.course?.category || 'General'}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  <span className="font-medium">Completed:</span> {formatDate(certificate.enrollment?.completionDate)}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  <span className="font-medium">Issued:</span> {formatDate(certificate.issuedDate)}
                </p>
                {certificate.enrollment?.finalGrade && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    <span className="font-medium">Final Grade:</span> {certificate.enrollment.finalGrade}%
                  </p>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleDownload(certificate.id, certificate.course?.title || 'Certificate')}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center"
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
          <p className="text-gray-600 dark:text-gray-400">
            Complete courses to earn certificates
          </p>
        </div>
      )}
    </div>
  );
};

export default Certificates;