import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search, Filter, Key } from 'lucide-react';

/**
 * User Management Component - Fixed for port 5000 backend
 * 
 * Backend: http://localhost:5000
 * Frontend: http://localhost:8080 (or 3000)
 */

// ⚙️ CONFIGURATION - Change this for production
const API_BASE_URL = 'http://localhost:5000';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  account_type: string;
  is_active: boolean;
  company?: string;
  website?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

// Simple StatusBadge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-1 text-xs rounded-full ${
    status === 'Active' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }`}>
    {status}
  </span>
);

// Simple Modal component
const Modal: React.FC<{
  isOpen: boolean;
  title: string;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}> = ({ isOpen, title, onClose, size = 'md', children }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl ${sizeClasses[size]} w-full`}>
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

// Simple DataTable component
const DataTable: React.FC<{
  data: User[];
  columns: Array<{ header: string; accessor: string | ((user: User) => any) }>;
  actions: (user: User) => React.ReactNode;
}> = ({ data, columns, actions }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {col.header}
            </th>
          ))}
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {data.map((user) => (
          <tr key={user.id}>
            {columns.map((col, idx) => (
              <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {typeof col.accessor === 'function' ? col.accessor(user) : user[col.accessor as keyof User]}
              </td>
            ))}
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              {actions(user)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete' | 'password'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedAccountType, setSelectedAccountType] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    accountType: 'student' as 'student' | 'professional' | 'business' | 'agency' | 'admin',
    isActive: true,
    company: '',
    website: '',
    bio: ''
  });

  const getAuthToken = (): string | null => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           sessionStorage.getItem('token') ||
           null;
  };

  const getAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.error('⚠️ No authentication token found');
    }

    return headers;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching users from:', `${API_BASE_URL}/api/admin/users`);

      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Users data received:', data);

      if (data.success === false) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        accountType: 'student',
        isActive: true,
        company: '',
        website: '',
        bio: ''
      });
      setFormErrors({});
      setSelectedUser(null);
    }
  }, [isModalOpen]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      accountType: user.account_type as any,
      isActive: user.is_active ?? true,
      company: user.company || '',
      website: user.website || '',
      bio: user.bio || ''
    });
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setModalType('delete');
    setIsModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      accountType: user.account_type as any,
      isActive: user.is_active ?? true,
      company: user.company || '',
      website: user.website || '',
      bio: user.bio || ''
    });
    setModalType('password');
    setIsModalOpen(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      accountType: 'student',
      isActive: true,
      company: '',
      website: '',
      bio: ''
    });
    setModalType('create');
    setIsModalOpen(true);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 6) errors.push("Password must be at least 6 characters long");
    if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Password must contain at least one special character");
    return errors;
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: "", color: "", feedback: [] };
    const errors = validatePassword(password);
    if (errors.length === 0) {
      return { strength: "Strong", color: "text-green-600 dark:text-green-400", feedback: ["Password meets all requirements"] };
    } else if (errors.length <= 2) {
      return { strength: "Medium", color: "text-yellow-600 dark:text-yellow-400", feedback: errors };
    } else {
      return { strength: "Weak", color: "text-red-600 dark:text-red-400", feedback: errors };
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Please enter a valid email';
    
    if ((modalType === 'create' || modalType === 'password') && !formData.password) {
      errors.password = 'Password is required';
    }
    
    if ((modalType === 'create' || modalType === 'password') && formData.password) {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) errors.password = passwordErrors[0];
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    alert(`${type.toUpperCase()}: ${message}`);
  };

  const handleSaveUser = async () => {
    if (!validateForm()) {
      showToast('Please fix the form errors', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let url, method, body;

      if (modalType === 'create') {
        url = `${API_BASE_URL}/api/admin/users`;
        method = 'POST';
        body = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          accountType: formData.accountType,
          isActive: formData.isActive,
          company: formData.company.trim(),
          website: formData.website.trim(),
          bio: formData.bio.trim()
        };
      } else if (modalType === 'edit' && selectedUser) {
        url = `${API_BASE_URL}/api/admin/users/${selectedUser.id}`;
        method = 'PUT';
        body = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          accountType: formData.accountType,
          isActive: formData.isActive,
          company: formData.company.trim(),
          website: formData.website.trim(),
          bio: formData.bio.trim()
        };
      } else if (modalType === 'password' && selectedUser) {
        url = `${API_BASE_URL}/api/admin/users/${selectedUser.id}/password`;
        method = 'PUT';
        body = { password: formData.password };
      } else {
        throw new Error('Invalid operation');
      }

      console.log('🔄 Making request to:', url);
      console.log('📤 Request method:', method);

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(body)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ Success response:', result);

      if (!result.success) {
        throw new Error(result.error || 'Operation failed');
      }

      setIsModalOpen(false);
      await fetchUsers();
      
      const successMessage = modalType === 'create' ? 'User created successfully' : 
                           modalType === 'password' ? 'Password reset successfully' : 
                           'User updated successfully';
      showToast(successMessage, 'success');
      
    } catch (error) {
      console.error(`❌ Error ${modalType} user:`, error);
      showToast(error instanceof Error ? error.message : 'An unexpected error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    
    try {
      console.log('🗑️ Deleting user:', selectedUser.id);

      const response = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      console.log('📥 Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
      }
      
      const result = await response.json();
      console.log('✅ Delete success:', result);

      setIsModalOpen(false);
      await fetchUsers();
      
      showToast('User deleted successfully', 'success');
      
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      showToast(error instanceof Error ? error.message : 'An unexpected error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchText = `${user.first_name || ''} ${user.last_name || ''} ${user.email || ''}`.toLowerCase();
    if (searchTerm && !searchText.includes(searchTerm.toLowerCase())) return false;
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'active' && !user.is_active) return false;
      if (selectedFilter === 'inactive' && user.is_active) return false;
    }
    if (selectedAccountType !== 'all' && user.account_type !== selectedAccountType) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={selectedAccountType}
            onChange={(e) => setSelectedAccountType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="student">Student</option>
            <option value="professional">Professional</option>
            <option value="business">Business</option>
            <option value="admin">Admin</option>
          </select>

          <button
            onClick={handleCreateUser}
            className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            disabled={isSubmitting}
          >
            <Plus size={16} />
            Add New
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
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Error Loading Users</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<User>
          data={filteredUsers}
          columns={[
            { header: 'Name', accessor: (user) => `${user.first_name} ${user.last_name}` },
            { header: 'Email', accessor: 'email' },
            { header: 'Account Type', accessor: (user) => user.account_type?.toUpperCase() || 'STUDENT' },
            { header: 'Status', accessor: (user) => <StatusBadge status={user.is_active ? 'Active' : 'Inactive'} /> },
            { header: 'Join Date', accessor: (user) => formatDate(user.created_at) }
          ]}
          actions={(user) => (
            <div className="flex space-x-2">
              <button onClick={() => handleEditUser(user)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Edit">
                <Edit size={16} className="text-blue-500" />
              </button>
              <button onClick={() => handleResetPassword(user)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Reset Password">
                <Key size={16} className="text-green-500" />
              </button>
              <button onClick={() => handleDeleteUser(user)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Delete">
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          )}
        />
      )}

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen && (modalType === 'create' || modalType === 'edit')}
        title={modalType === 'create' ? 'Create New User' : 'Edit User'}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isSubmitting}
              />
              {formErrors.firstName && <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isSubmitting}
              />
              {formErrors.lastName && <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSubmitting}
            />
            {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
          </div>

          {modalType === 'create' && (
            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isSubmitting}
              />
              {formData.password && <p className={`text-sm mt-1 ${passwordStrength.color}`}>{passwordStrength.strength}</p>}
              {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              {isSubmitting ? 'Saving...' : modalType === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isModalOpen && modalType === 'password'}
        title="Reset Password"
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p>Reset password for <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong></p>
          <div>
            <label className="block text-sm font-medium mb-1">New Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSubmitting}
            />
            {formData.password && <p className={`text-sm mt-1 ${passwordStrength.color}`}>{passwordStrength.strength}</p>}
            {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 border rounded-md">Cancel</button>
            <button onClick={handleSaveUser} disabled={isSubmitting} className="px-4 py-2 bg-orange-500 text-white rounded-md">
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isModalOpen && modalType === 'delete'}
        title="Delete User"
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p>Delete user <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-yellow-800 text-sm">⚠️ This will deactivate the user account.</p>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 border rounded-md">Cancel</button>
            <button onClick={handleDeleteConfirm} disabled={isSubmitting} className="px-4 py-2 bg-red-500 text-white rounded-md">
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;