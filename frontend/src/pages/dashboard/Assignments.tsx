// src/pages/dashboard/Assignments.tsx
import React, { useState, useEffect } from 'react';
import { FileText, Calendar, CheckCircle, Clock, AlertCircle, Upload, Download, Eye } from 'lucide-react';
import { apiService } from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/dateHelpers';

// Types based on your database schema
interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  created_at: string;
  course: {
    id: string;
    title: string;
    category: string;
  };
  submission?: {
    id: string;
    content: string;
    file_path: string;
    submitted_at: string;
    grade: number;
    feedback: string;
    status: 'submitted' | 'graded' | 'returned';
  };
}

interface User {
  id: string;
  account_type: string;
  [key: string]: any;
}

const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [submissionModal, setSubmissionModal] = useState<{ show: boolean; assignmentId: string | null }>({
    show: false,
    assignmentId: null
  });
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        const userData = await apiService.get<User>('/auth/me');
        setUser(userData);
        
        let assignmentsData: Assignment[] = [];
        
        if (userData.account_type === 'student' || userData.account_type === 'professional') {
          assignmentsData = await apiService.get<Assignment[]>('/assignments/my-assignments');
        } else if (userData.account_type === 'admin') {
          assignmentsData = await apiService.get<Assignment[]>('/assignments/all');
        } else {
          assignmentsData = await apiService.get<Assignment[]>('/assignments/my-assignments');
        }
        
        setAssignments(assignmentsData);
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        alert('Failed to load assignments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !assignment.submission;
    if (filter === 'submitted') return assignment.submission && assignment.submission.status === 'submitted';
    if (filter === 'graded') return assignment.submission && assignment.submission.status === 'graded';
    return true;
  });

  const getStatusInfo = (assignment: Assignment) => {
    if (!assignment.submission) {
      const isOverdue = new Date(assignment.due_date) < new Date();
      return {
        icon: isOverdue ? <AlertCircle size={20} className="text-red-500" /> : <Clock size={20} className="text-yellow-500" />,
        text: isOverdue ? 'Overdue' : 'Pending',
        color: isOverdue ? 'text-red-500' : 'text-yellow-500'
      };
    }
    if (assignment.submission.status === 'graded') {
      return {
        icon: <CheckCircle size={20} className="text-green-500" />,
        text: `Graded (${assignment.submission.grade}/${assignment.max_points})`,
        color: 'text-green-500'
      };
    }
    return {
      icon: <Clock size={20} className="text-blue-500" />,
      text: 'Submitted',
      color: 'text-blue-500'
    };
  };

  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!submissionContent.trim() && !submissionFile) {
      alert('Please provide either text content or upload a file');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assignment_id', assignmentId);
      formData.append('content', submissionContent);
      
      if (submissionFile) {
        formData.append('file', submissionFile);
      }

      const baseURL = `${import.meta.env.VITE_API_URL}/api`;
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      const response = await fetch(`${baseURL}/assignments/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || `Server error: ${response.status}`);
      }

      const updatedAssignments = await apiService.get<Assignment[]>('/assignments/my-assignments');
      setAssignments(updatedAssignments);

      alert(result.message || 'Assignment submitted successfully!');

      setSubmissionModal({ show: false, assignmentId: null });
      setSubmissionContent('');
      setSubmissionFile(null);
      
    } catch (error: any) {
      console.error('❌ Failed to submit assignment:', error);
      alert(error.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmissionModal = (assignmentId: string) => {
    setSubmissionModal({ show: true, assignmentId });
  };

  const closeSubmissionModal = () => {
    setSubmissionModal({ show: false, assignmentId: null });
    setSubmissionContent('');
    setSubmissionFile(null);
  };

  const downloadSubmission = async (submissionId: string, fileName: string) => {
    try {
      const baseURL = `${import.meta.env.VITE_API_URL}/api`;
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/assignments/download-submission/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download submission:', error);
      alert('Failed to download submission file.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.account_type === 'admin' ? 'Manage all assignments' : 'Track and submit your course assignments'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'graded', label: 'Graded' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredAssignments.map((assignment) => {
          const statusInfo = getStatusInfo(assignment);
          return (
            <div key={assignment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <FileText size={20} className="text-orange-500 mr-2" />
                    <h3 className="font-bold text-lg">{assignment.title}</h3>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {assignment.description}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="mr-4">Course: {assignment.course.title}</span>
                    <Calendar size={16} className="mr-1" />
                    <span>Due: {formatDate(assignment.due_date)}</span>
                    <span className="ml-4">Max Points: {assignment.max_points}</span>
                  </div>

                  {assignment.submission?.feedback && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Feedback:</h4>
                      <p className="text-blue-700 dark:text-blue-400 text-sm">{assignment.submission.feedback}</p>
                    </div>
                  )}

                  {assignment.submission && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Submitted: {formatDateTime(assignment.submission.submitted_at)}
                        </span>
                        {assignment.submission.file_path && (
                          <button
                            onClick={() => downloadSubmission(assignment.submission!.id, assignment.submission!.file_path)}
                            className="flex items-center text-sm text-orange-500 hover:text-orange-600"
                          >
                            <Download size={16} className="mr-1" />
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="flex items-center mb-2">
                    {statusInfo.icon}
                    <span className={`ml-2 text-sm font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
                  </div>
                  
                  {!assignment.submission && user?.account_type !== 'admin' && (
                    <button
                      onClick={() => openSubmissionModal(assignment.id)}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center"
                    >
                      <Upload size={16} className="mr-1" />
                      Submit Assignment
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <FileText size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No assignments found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all' ? 'You have no assignments yet' : `No ${filter} assignments`}
          </p>
        </div>
      )}

      {/* Submission Modal */}
      {submissionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Submit Assignment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder="Enter your assignment content..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">File Upload (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeSubmissionModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (submissionModal.assignmentId) {
                    handleSubmitAssignment(submissionModal.assignmentId);
                  }
                }}
                disabled={submitting}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;