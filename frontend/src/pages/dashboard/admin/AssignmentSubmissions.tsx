import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  User, 
  BookOpen,
  Calendar,
  Award,
  MessageSquare,
  Filter,
  Search,
  X
} from 'lucide-react';
import { apiService } from '../../../lib/api';

// Types
interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  content: string;
  file_path: string | null;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'returned';
  grade: number | null;
  feedback: string | null;
  // Populated fields
  assignment_title: string;
  assignment_max_points: number;
  course_title: string;
  course_category: string;
  student_name: string;
  student_email: string;
}

interface GradeModalData {
  show: boolean;
  submission: Submission | null;
}

const AssignmentSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all');
  const [gradeModal, setGradeModal] = useState<GradeModalData>({ show: false, submission: null });
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch all submissions
  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Filter submissions based on search and status
  useEffect(() => {
    let filtered = [...submissions];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.student_name.toLowerCase().includes(term) ||
        s.student_email.toLowerCase().includes(term) ||
        s.assignment_title.toLowerCase().includes(term) ||
        s.course_title.toLowerCase().includes(term)
      );
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      // Get all submissions
      const submissionsData = await apiService.get<any[]>('/admin/assignment-submissions');
      
      // Format submissions
      const formatted: Submission[] = submissionsData.map(sub => ({
        id: sub.id,
        assignment_id: sub.assignment_id,
        user_id: sub.user_id,
        content: sub.content || '',
        file_path: sub.file_path || null,
        submitted_at: sub.submitted_at,
        status: sub.status || 'submitted',
        grade: sub.grade ?? null,
        feedback: sub.feedback || null,
        assignment_title: sub.assignment_title || 'Unknown Assignment',
        assignment_max_points: sub.assignment_max_points || 100,
        course_title: sub.course_title || 'Unknown Course',
        course_category: sub.course_category || 'General',
        student_name: sub.student_name || 'Unknown Student',
        student_email: sub.student_email || ''
      }));

      setSubmissions(formatted);
    } catch (error: any) {
      console.error('Failed to fetch submissions:', error);
      alert('Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openGradeModal = (submission: Submission) => {
    setGradeModal({ show: true, submission });
    setGradeForm({
      grade: submission.grade?.toString() || '',
      feedback: submission.feedback || ''
    });
  };

  const closeGradeModal = () => {
    setGradeModal({ show: false, submission: null });
    setGradeForm({ grade: '', feedback: '' });
  };

  const handleGradeSubmission = async () => {
    if (!gradeModal.submission) return;

    const gradeValue = parseInt(gradeForm.grade);
    
    // Validation
    if (isNaN(gradeValue)) {
      alert('Please enter a valid grade');
      return;
    }

    if (gradeValue < 0 || gradeValue > gradeModal.submission.assignment_max_points) {
      alert(`Grade must be between 0 and ${gradeModal.submission.assignment_max_points}`);
      return;
    }

    setSubmitting(true);
    try {
      await apiService.put(`/admin/grade-submission/${gradeModal.submission.id}`, {
        grade: gradeValue,
        feedback: gradeForm.feedback.trim()
      });

      alert('Submission graded successfully!');
      
      // Refresh submissions
      await fetchSubmissions();
      
      closeGradeModal();
    } catch (error: any) {
      console.error('Failed to grade submission:', error);
      alert(error.message || 'Failed to grade submission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSubmission = async (submissionId: string, fileName: string) => {
    try {
      const response = await fetch(`https://localhost:5000/api/assignments/download-submission/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}`
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
      alert('Failed to download file. Please try again.');
    }
  };

  const getStatusBadge = (status: string, grade: number | null, maxPoints: number) => {
    if (status === 'graded') {
      const percentage = grade ? (grade / maxPoints) * 100 : 0;
      let colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      
      if (percentage < 50) {
        colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      } else if (percentage < 75) {
        colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      }
      
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass} flex items-center`}>
          <CheckCircle size={14} className="mr-1" />
          Graded ({grade}/{maxPoints})
        </span>
      );
    }
    
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center">
        <Clock size={14} className="mr-1" />
        Pending Review
      </span>
    );
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'submitted').length,
    graded: submissions.filter(s => s.status === 'graded').length,
    avgGrade: submissions.filter(s => s.grade !== null).length > 0
      ? Math.round(
          submissions
            .filter(s => s.grade !== null)
            .reduce((sum, s) => sum + (s.grade || 0), 0) / 
          submissions.filter(s => s.grade !== null).length
        )
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assignment Submissions</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and grade student assignment submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Submissions</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <FileText size={40} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Pending Review</p>
              <p className="text-3xl font-bold mt-1 text-yellow-500">{stats.pending}</p>
            </div>
            <Clock size={40} className="text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Graded</p>
              <p className="text-3xl font-bold mt-1 text-green-500">{stats.graded}</p>
            </div>
            <CheckCircle size={40} className="text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Average Grade</p>
              <p className="text-3xl font-bold mt-1 text-orange-500">{stats.avgGrade}%</p>
            </div>
            <Award size={40} className="text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by student, assignment, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700"
            >
              <option value="all">All Status</option>
              <option value="submitted">Pending Review</option>
              <option value="graded">Graded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.map((submission) => (
          <div key={submission.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 flex items-center">
                    <FileText size={20} className="text-orange-500 mr-2" />
                    {submission.assignment_title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center">
                      <BookOpen size={16} className="mr-1" />
                      {submission.course_title}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {submission.course_category}
                    </span>
                  </div>
                </div>
                {getStatusBadge(submission.status, submission.grade, submission.assignment_max_points)}
              </div>

              {/* Student Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User size={20} className="text-gray-400 mr-2" />
                    <div>
                      <p className="font-semibold">{submission.student_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{submission.student_email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="text-sm font-medium flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submission Content */}
              {submission.content && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Submission Content:</p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
                  </div>
                </div>
              )}

              {/* Feedback (if graded) */}
              {submission.feedback && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                    <MessageSquare size={16} className="mr-1" />
                    Your Feedback:
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{submission.feedback}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  {submission.file_path && (
                    <button
                      onClick={() => downloadSubmission(submission.id, submission.file_path!)}
                      className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      <Download size={16} className="mr-2" />
                      Download File
                    </button>
                  )}
                </div>

                <button
                  onClick={() => openGradeModal(submission)}
                  className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  <Edit size={16} className="mr-2" />
                  {submission.status === 'graded' ? 'Update Grade' : 'Grade Submission'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSubmissions.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <FileText size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No submissions found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No assignment submissions yet'}
          </p>
        </div>
      )}

      {/* Grade Modal */}
      {gradeModal.show && gradeModal.submission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Grade Submission</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {gradeModal.submission.assignment_title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Student: {gradeModal.submission.student_name}
                  </p>
                </div>
                <button
                  onClick={closeGradeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Submission Preview */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Submission Content:</p>
                <p className="text-sm whitespace-pre-wrap mb-3">{gradeModal.submission.content}</p>
                {gradeModal.submission.file_path && (
                  <button
                    onClick={() => downloadSubmission(gradeModal.submission!.id, gradeModal.submission!.file_path!)}
                    className="flex items-center text-sm text-blue-500 hover:text-blue-600"
                  >
                    <Download size={16} className="mr-1" />
                    Download Attached File
                  </button>
                )}
              </div>

              {/* Grading Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Grade (out of {gradeModal.submission.assignment_max_points})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={gradeModal.submission.assignment_max_points}
                    value={gradeForm.grade}
                    onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                    placeholder="Enter grade..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    placeholder="Provide feedback to the student..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700"
                    rows={6}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeGradeModal}
                  disabled={submitting}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGradeSubmission}
                  disabled={submitting}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Save Grade
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmissions;