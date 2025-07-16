// src/pages/dashboard/Assignments.tsx
import React, { useState, useEffect } from 'react';
import { FileText, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Assignment } from '../../lib/types';
import { apiService } from '../../lib/api';

const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await apiService.get<Assignment[]>('/assignments/my-assignments');
        setAssignments(data);
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !assignment.submission;
    if (filter === 'submitted') return assignment.submission && assignment.submission.status === 'submitted';
    if (filter === 'graded') return assignment.submission && assignment.submission.status === 'graded';
    return true;
  });

  const getStatusIcon = (assignment: Assignment) => {
    if (!assignment.submission) {
      const isOverdue = new Date(assignment.dueDate) < new Date();
      return isOverdue ? <AlertCircle size={20} className="text-red-500" /> : <Clock size={20} className="text-yellow-500" />;
    }
    if (assignment.submission.status === 'graded') {
      return <CheckCircle size={20} className="text-green-500" />;
    }
    return <Clock size={20} className="text-blue-500" />;
  };

  const getStatusText = (assignment: Assignment) => {
    if (!assignment.submission) {
      const isOverdue = new Date(assignment.dueDate) < new Date();
      return isOverdue ? 'Overdue' : 'Pending';
    }
    if (assignment.submission.status === 'graded') {
      return `Graded (${assignment.submission.grade}/${assignment.maxPoints})`;
    }
    return 'Submitted';
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
          Track and submit your course assignments
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
        {filteredAssignments.map((assignment) => (
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
                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                </div>

                {assignment.submission?.feedback && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Feedback:</h4>
                    <p className="text-blue-700 dark:text-blue-400 text-sm">{assignment.submission.feedback}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center mb-2">
                  {getStatusIcon(assignment)}
                  <span className="ml-2 text-sm font-medium">{getStatusText(assignment)}</span>
                </div>
                
                {!assignment.submission && (
                  <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
                    Submit Assignment
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
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
    </div>
  );
};

export default Assignments;