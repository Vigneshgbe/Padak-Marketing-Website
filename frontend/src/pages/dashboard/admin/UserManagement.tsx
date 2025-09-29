// src/pages/dashboard/admin/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search, Filter, Key } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';
import { User } from '../../../lib/admin-types';
import { useAdminData } from '../../../hooks/useAdminData';
import { toast } from 'react-hot-toast';

const UserManagement: React.FC = () => {
  const { data: usersData, loading, error, refetch } = useAdminData('/api/admin/users');
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

  const users = usersData?.users || [];

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
      accountType: user.account_type as 'student' | 'professional' | 'business' | 'agency' | 'admin',
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
      accountType: user.account_type as 'student' | 'professional' | 'business' | 'agency' | 'admin',
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
    
    if (password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    
    return errors;
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: "", color: "" };
    
    const errors = validatePassword(password);
    
    if (errors.length === 0) {
      return { strength: "Strong", color: "text-green-600 dark:text-green-400" };
    } else if (errors.length <= 2) {
      return { strength: "Medium", color: "text-yellow-600 dark:text-yellow-400" };
    } else {
      return { strength: "Weak", color: "text-red-600 dark:text-red-400" };
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if ((modalType === 'create' || modalType === 'password') && !formData.password) {
      errors.password = 'Password is required';
    }
    
    if ((modalType === 'create' || modalType === 'password') && formData.password) {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        errors.password = passwordErrors[0];
      }
    }
    
    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.website && formData.website.trim() && !/^https?:\/\/.+\..+/.test(formData.website)) {
      errors.website = 'Please enter a valid website URL (include http:// or https://)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const filteredUsers = users.filter((user: User) => {
    const searchText = `${user.first_name || ''} ${user.last_name || ''} ${user.email || ''}`.toLowerCase();
    if (searchTerm && !searchText.includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'active' && !user.is_active) return false;
      if (selectedFilter === 'inactive' && user.is_active) return false;
    }
    
    if (selectedAccountType !== 'all' && user.account_type !== selectedAccountType) {
      return false;
    }
    
    return true;
  });

  const getAuthToken = (): string | null => {
    // Check multiple possible token storage locations
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('adminToken') ||
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
      console.error('No authentication token found');
    }

    return headers;
  };

  const handleSaveUser = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const baseURL = window.location.origin;
      let url, method, body;

      if (modalType === 'create') {
        url = `${baseURL}/api/admin/users`;
        method = 'POST';
        body = JSON.stringify({
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
        });
      } else if (modalType === 'edit' && selectedUser) {
        url = `${baseURL}/api/admin/users/${selectedUser.id}`;
        method = 'PUT';
        body = JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          accountType: formData.accountType,
          isActive: formData.isActive,
          company: formData.company.trim(),
          website: formData.website.trim(),
          bio: formData.bio.trim()
        });
      } else if (modalType === 'password' && selectedUser) {
        url = `${baseURL}/api/admin/users/${selectedUser.id}/password`;
        method = 'PUT';
        body = JSON.stringify({
          password: formData.password
        });
      } else {
        throw new Error('Invalid modal type');
      }

      console.log('Making request to:', url);
      console.log('Request method:', method);
      console.log('Request body:', body);

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Failed to ${modalType} user`;
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('JSON error response:', errorData);
        } else {
          const textError = await response.text();
          console.error('Non-JSON error response:', textError);
          errorMessage = `Server error (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Success response:', result);

      setIsModalOpen(false);
      await refetch();
      
      toast.success(`User ${modalType === 'create' ? 'created' : modalType === 'password' ? 'password reset' : 'updated'} successfully`);
      
    } catch (error) {
      console.error(`Error ${modalType === 'create' ? 'creating' : modalType === 'password' ? 'resetting password' : 'updating'} user:`, error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const baseURL = window.location.origin;
      
      console.log('Deleting user:', selectedUser.id);

      const response = await fetch(`${baseURL}/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to delete user';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('JSON error response:', errorData);
        } else {
          const textError = await response.text();
          console.error('Non-JSON error response:', textError);
          errorMessage = `Server error (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Delete success:', result);

      setIsModalOpen(false);
      await refetch();
      
      toast.success('User deleted successfully');
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const capitalizeAccountType = (type: string) => {
    if (!type) return 'Student';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">User Management</h2>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users..."
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
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={selectedAccountType}
              onChange={(e) => setSelectedAccountType(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
            >
              <option value="all">All Types</option>
              <option value="student">Student</option>
              <option value="professional">Professional</option>
              <option value="business">Business</option>
              <option value="agency">Agency</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            onClick={handleCreateUser}
            className="flex items-center justify-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
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
          <div className="flex items-center mb-4">
            <span className="text-red-500 mr-2">⚠️</span>
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Users</h3>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<User>
          data={filteredUsers}
          columns={[
            { 
              header: 'Name', 
              accessor: (user) => `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'
            },
            { header: 'Email', accessor: 'email' },
            { 
              header: 'Account Type', 
              accessor: (user) => capitalizeAccountType(user.account_type || 'student')
            },
            {
              header: 'Status',
              accessor: (user) => (
                <StatusBadge status={user.is_active ? 'Active' : 'Inactive'} />
              )
            },
            { 
              header: 'Join Date', 
              accessor: (user) => formatDate(user.created_at)
            }
          ]}
          actions={(user) => (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditUser(user);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Edit User"
                disabled={isSubmitting}
              >
                <Edit size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetPassword(user);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reset Password"
                disabled={isSubmitting}
              >
                <Key size={16} className="text-green-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteUser(user);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete User"
                disabled={isSubmitting}
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          )}
        />
      )}

      {/* Edit/Create User Modal */}
      <Modal
        isOpen={isModalOpen && (modalType === 'create' || modalType === 'edit')}
        title={modalType === 'create' ? 'Create New User' : 'Edit User'}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 ${
                  formErrors.firstName 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter first name"
                disabled={isSubmitting}
              />
              {formErrors.firstName && (
                <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 ${
                  formErrors.lastName 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter last name"
                disabled={isSubmitting}
              />
              {formErrors.lastName && (
                <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 ${
                formErrors.email 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 ${
                formErrors.phone 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter phone number"
              disabled={isSubmitting}
            />
            {formErrors.phone && (
              <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
            )}
          </div>

          {modalType === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 ${
                  formErrors.password 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Must include uppercase, lowercase, number, special character"
                disabled={isSubmitting}
              />
              {formData.password && passwordStrength.strength && (
                <div className={`text-sm mt-1 ${passwordStrength.color}`}>
                  Password strength: {passwordStrength.strength}
                </div>
              )}
              {formErrors.password && (
                <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Requirements: 6+ characters, uppercase, lowercase, number, special character
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Type
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => handleInputChange('accountType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                disabled={isSubmitting}
              >
                <option value="student">Student</option>
                <option value="professional">Professional</option>
                <option value="business">Business</option>
                <option value="agency">Agency</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.isActive ? "1" : "0"}
                onChange={(e) => handleInputChange('isActive', e.target.value === "1")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                disabled={isSubmitting}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              placeholder="Enter company name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 ${
                formErrors.website 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="https://example.com"
              disabled={isSubmitting}
            />
            {formErrors.website && (
              <p className="text-red-500 text-sm mt-1">{formErrors.website}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              placeholder="Enter user bio"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {modalType === 'create' ? 'Create' : 'Update'}
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
          <p className="text-gray-700 dark:text-gray-300">
            Reset password for <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 ${
                formErrors.password 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Must include uppercase, lowercase, number, special character"
              disabled={isSubmitting}
            />
            {formData.password && passwordStrength.strength && (
              <div className={`text-sm mt-1 ${passwordStrength.color}`}>
                Password strength: {passwordStrength.strength}
              </div>
            )}
            {formErrors.password && (
              <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Requirements: 6+ characters, uppercase, lowercase, number, special character
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Reset Password
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isModalOpen && modalType === 'delete'}
        title="Delete User"
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete user <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>? 
            This action will deactivate the account.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              ⚠️ This will deactivate the user account. The user will no longer be able to log in.
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;