// src/pages/dashboard/admin/CalendarManagement.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search, Filter, Save, AlertCircle } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import Modal from '../../../components/admin/Modal';
import { useNavigate } from 'react-router-dom';

interface CalendarEvent {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string;
  created_at: string;
  updated_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const CalendarManagement: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // ✅ FIX: Proper environment detection with multiple checks
  const getBaseURL = () => {
    // Priority 1: Check for environment variable (if using Vite)
    if (import.meta.env?.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }

    // Priority 2: Detect based on hostname
    const hostname = window.location.hostname;
    
    // If on Render production or any production domain
    if (hostname.includes('onrender.com') || hostname.includes('padak')) {
      return 'https://padak-backend.onrender.com';
    }
    
    // If on localhost or development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Check if running on a specific port
      const port = window.location.port;
      if (port === '8080' || port === '3000' || port === '5173') {
        // Frontend is on these ports, backend is likely on 5000
        return 'http://localhost:5000';
      }
    }

    // Default fallback to production
    return 'https://padak-backend.onrender.com';
  };

  // Get auth token with proper error handling
  const getAuthToken = () => {
    try {
      return localStorage.getItem('token') || localStorage.getItem('authToken');
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  };

  // Handle authentication errors
  const handleAuthError = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
    navigate('/login');
  };

  // ✅ FIX: Enhanced error handling for network failures
  const handleNetworkError = (error: any, context: string) => {
    console.error(`Network error in ${context}:`, error);
    
    // Check if it's a network/connection error
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const baseURL = getBaseURL();
      return `Unable to connect to the server at ${baseURL}. Please check:\n\n` +
             `• Is the backend server running?\n` +
             `• Are you using the correct API URL?\n` +
             `• Is your internet connection working?\n\n` +
             `Current API URL: ${baseURL}`;
    }
    
    // Other errors
    return error instanceof Error ? error.message : `An error occurred in ${context}`;
  };

  // ✅ FIX: Helper function to safely parse JSON responses
  const safeJsonParse = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    
    // Check if response is JSON
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        throw new Error('Invalid JSON response from server');
      }
    }
    
    // If not JSON, get text to see what was returned
    const text = await response.text();
    console.error('Non-JSON response received:', text.substring(0, 200));
    
    // Check if it's HTML (likely an error page)
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. This usually means the API endpoint doesn't exist or there's a server configuration issue.`);
    }
    
    throw new Error(`Unexpected response format (Status: ${response.status})`);
  };

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      if (!token) {
        handleAuthError();
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const baseURL = getBaseURL();
      const url = `${baseURL}/api/admin/calendar-events`;
      console.log('🔍 Fetching events from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (response.status === 401) {
        handleAuthError();
        return;
      }

      if (response.ok) {
        const data = await safeJsonParse(response);
        console.log('✅ Events fetched successfully:', data.length, 'events');
        setEvents(data);
        setError(null);
      } else {
        const errorData = await safeJsonParse(response);
        throw new Error(errorData.error || `Failed to fetch calendar events: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = handleNetworkError(err, 'fetch events');
      console.error('❌ Error fetching events:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        console.warn('No auth token available for fetching users');
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const baseURL = getBaseURL();
      const url = `${baseURL}/api/admin/users`;
      console.log('🔍 Fetching users from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('Users response status:', response.status);

      if (response.status === 401) {
        console.warn('Unauthorized access to users endpoint');
        return;
      }

      if (response.ok) {
        const data = await safeJsonParse(response);
        console.log('✅ Users fetched successfully:', data);
        
        // Handle both response formats: direct array or {users: [...]}
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && typeof data === 'object' && 'users' in data && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.error('Unexpected users data format:', data);
          setUsers([]);
        }
      } else {
        console.error('Failed to fetch users:', response.status);
        setUsers([]);
      }
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      // Don't set the main error state for users - it's optional
      setUsers([]);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalType('delete');
    setIsModalOpen(true);
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setModalType('create');
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (formData: any) => {
    try {
      setSaving(true);
      const token = getAuthToken();
      
      if (!token) {
        handleAuthError();
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const baseURL = getBaseURL();
      
      let url, method;
      if (modalType === 'create') {
        url = `${baseURL}/api/admin/calendar-events`;
        method = 'POST';
      } else {
        url = `${baseURL}/api/admin/calendar-events/${selectedEvent?.id}`;
        method = 'PUT';
      }

      console.log('💾 Saving event to:', url);

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData)
      });

      if (response.status === 401) {
        handleAuthError();
        return;
      }

      if (response.ok) {
        console.log('✅ Event saved successfully');
        setIsModalOpen(false);
        await fetchEvents();
      } else {
        const errorData = await safeJsonParse(response);
        throw new Error(errorData.error || 'Failed to save calendar event');
      }
    } catch (err) {
      const errorMessage = handleNetworkError(err, 'save event');
      console.error('❌ Error saving event:', err);
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;

    try {
      const token = getAuthToken();
      
      if (!token) {
        handleAuthError();
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const baseURL = getBaseURL();
      const url = `${baseURL}/api/admin/calendar-events/${selectedEvent.id}`;
      console.log('🗑️ Deleting event from:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (response.status === 401) {
        handleAuthError();
        return;
      }

      if (response.ok) {
        console.log('✅ Event deleted successfully');
        setIsModalOpen(false);
        await fetchEvents();
      } else {
        const errorData = await safeJsonParse(response);
        throw new Error(errorData.error || 'Failed to delete calendar event');
      }
    } catch (err) {
      const errorMessage = handleNetworkError(err, 'delete event');
      console.error('❌ Error deleting event:', err);
      setError(errorMessage);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formDataObj = Object.fromEntries(formData.entries());
    
    // Convert empty strings to null for optional fields
    const processedData = {
      user_id: formDataObj.user_id && formDataObj.user_id !== '' ? String(formDataObj.user_id) : null,
      title: formDataObj.title as string,
      description: formDataObj.description && formDataObj.description !== '' ? formDataObj.description as string : null,
      event_date: formDataObj.event_date as string,
      event_time: formDataObj.event_time && formDataObj.event_time !== '' ? formDataObj.event_time as string : null,
      event_type: formDataObj.event_type as string
    };

    console.log('Submitting event data:', processedData);
    handleSaveEvent(processedData);
  };

  const filteredEvents = events.filter((event: CalendarEvent) => {
    if (searchTerm && !`${event.title} ${event.description} ${event.event_type}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (selectedFilter !== 'all' && event.event_type !== selectedFilter) {
      return false;
    }
    
    return true;
  });

  const getUserName = (event: CalendarEvent) => {
    if (event.first_name && event.last_name) {
      return `${event.first_name} ${event.last_name}`;
    }
    return event.email || 'System Event';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Calendar Management</h2>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search events..."
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
              <option value="all">All Events</option>
              <option value="custom">Custom</option>
              <option value="webinar">Webinar</option>
              <option value="workshop">Workshop</option>
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>

          <button
            onClick={handleCreateEvent}
            className="flex items-center justify-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            <span>Add New</span>
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
          <div className="flex items-start mb-4">
            <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Connection Error</h3>
              <div className="text-red-600 dark:text-red-400 mb-4 whitespace-pre-line">
                {error}
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>💡 Quick Fix:</strong> If you're running locally, make sure your backend server is running on port 5000.
                  Run: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">npm start</code> or <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">node server.js</code>
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setError(null);
              fetchEvents();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<CalendarEvent>
          data={filteredEvents}
          columns={[
            { header: 'Title', accessor: 'title' },
            {
              header: 'User',
              accessor: (event) => getUserName(event)
            },
            {
              header: 'Description',
              accessor: (event) => (
                <div className="max-w-xs truncate">{event.description || 'No description'}</div>
              )
            },
            { 
              header: 'Date', 
              accessor: (event) => formatDate(event.event_date)
            },
            { 
              header: 'Time', 
              accessor: (event) => event.event_time || 'All day' 
            },
            {
              header: 'Type',
              accessor: (event) => (
                <span className="capitalize">{event.event_type}</span>
              )
            }
          ]}
          actions={(event) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEvent(event);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Edit event"
              >
                <Edit size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEvent(event);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Delete event"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          )}
        />
      )}

      {/* Edit/Create Event Modal */}
      <Modal
        isOpen={isModalOpen && (modalType === 'create' || modalType === 'edit')}
        title={modalType === 'create' ? 'Create New Event' : 'Edit Event'}
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                defaultValue={selectedEvent?.title || ''}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User (Optional)
              </label>
              <select
                name="user_id"
                defaultValue={selectedEvent?.user_id || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select a user (optional)</option>
                {users.length > 0 ? (
                  users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No users available</option>
                )}
              </select>
              {users.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Loading users...
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                defaultValue={selectedEvent?.description || ''}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  name="event_date"
                  defaultValue={selectedEvent?.event_date ? new Date(selectedEvent.event_date).toISOString().split('T')[0] : ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Time (Optional)
                </label>
                <input
                  type="time"
                  name="event_time"
                  defaultValue={selectedEvent?.event_time || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Type
              </label>
              <select
                name="event_type"
                defaultValue={selectedEvent?.event_type || 'custom'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="custom">Custom</option>
                <option value="webinar">Webinar</option>
                <option value="workshop">Workshop</option>
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {modalType === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {modalType === 'create' ? 'Create' : 'Update'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isModalOpen && modalType === 'delete'}
        title="Delete Event"
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete the event "{selectedEvent?.title}"? This action cannot be undone.</p>

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
    </div>
  );
};

export default CalendarManagement;