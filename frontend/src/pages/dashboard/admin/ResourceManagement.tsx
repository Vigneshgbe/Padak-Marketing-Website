// src/pages/dashboard/admin/ResourceManagement.tsx
import React, { useState, useEffect } from 'react';
import { Trash2, PlusCircle, Edit3, Search, Download } from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import Modal from '../../../components/admin/Modal';

// Types
interface ResourceFormData {
  title: string;
  description: string;
  type: string;
  size?: string;
  url?: string;
  category: string;
  icon: string;
  button_color: string;
  allowed_account_types: string[];
  is_premium: boolean;
  price?: number;
}

const ICON_OPTIONS = [
  'BookOpen', 'Search', 'Calendar', 'BarChart3', 'FileText', 'Target', 
  'TrendingUp', 'Users', 'Award', 'ExternalLink', 'Globe', 'PenTool'
];

const ACCOUNT_TYPES = [
  { value: 'student', label: 'Student' },
  { value: 'professional', label: 'Professional' },
  { value: 'business', label: 'Business' },
  { value: 'agency', label: 'Agency' },
  { value: 'admin', label: 'Admin' }
];

const ResourceManagement: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<ResourceFormData>({
    title: '',
    description: '',
    type: 'pdf',
    size: '',
    url: '',
    category: 'Course Materials',
    icon: 'BookOpen',
    button_color: 'blue',
    allowed_account_types: [],
    is_premium: false,
    price: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const baseURL = 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/resources`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setResources(data);
      } else {
        throw new Error('Failed to fetch resources');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = (resource: any) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const handleEditResource = (resource: any) => {
    setSelectedResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      size: resource.size || '',
      url: resource.url || '',
      category: resource.category,
      icon: resource.icon || 'BookOpen',
      button_color: resource.button_color || 'blue',
      allowed_account_types: resource.allowed_account_types || [],
      is_premium: resource.is_premium || false,
      price: resource.price || undefined
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateResource = () => {
    setSelectedResource(null);
    setFormData({
      title: '',
      description: '',
      type: 'pdf',
      size: '',
      url: '',
      category: 'Course Materials',
      icon: 'BookOpen',
      button_color: 'blue',
      allowed_account_types: [],
      is_premium: false,
      price: undefined
    });
    setIsCreateModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === 'checkbox') {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          allowed_account_types: [...prev.allowed_account_types, value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          allowed_account_types: prev.allowed_account_types.filter(v => v !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'is_premium' ? checked : value
      }));
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const baseURL = 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/admin/resources/${selectedResource?.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchResources();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete resource');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const baseURL = 'http://localhost:5000';
      const url = selectedResource
        ? `${baseURL}/api/admin/resources/${selectedResource.id}`
        : `${baseURL}/api/admin/resources`;

      const method = selectedResource ? 'PUT' : 'POST';

      const bodyData = {
        ...formData,
        price: formData.is_premium && formData.price ? Number(formData.price) : undefined
      };

      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        fetchResources();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save resource');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredResources = resources.filter((resource: any) => {
    if (searchTerm && !`${resource.title} ${resource.category}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen size={16} />;
      case 'Search': return <Search size={16} />;
      case 'Calendar': return <Calendar size={16} />;
      case 'BarChart3': return <BarChart3 size={16} />;
      case 'FileText': return <FileText size={16} />;
      case 'Target': return <Target size={16} />;
      case 'TrendingUp': return <TrendingUp size={16} />;
      case 'Users': return <Users size={16} />;
      case 'Award': return <Award size={16} />;
      case 'ExternalLink': return <ExternalLink size={16} />;
      case 'Globe': return <Globe size={16} />;
      case 'PenTool': return <PenTool size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Resource Management</h2>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={handleCreateResource}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            <PlusCircle size={16} />
            Add Resource
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
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error Loading Resources</h3>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchResources}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<any>
          data={filteredResources}
          columns={[
            { header: 'Title', accessor: 'title' },
            { header: 'Category', accessor: 'category' },
            { header: 'Type', accessor: 'type' },
            {
              header: 'Account Types',
              accessor: (res) => res.allowed_account_types.join(', ')
            },
            {
              header: 'Premium',
              accessor: (res) => res.is_premium ? '✅ Yes' : '❌ No'
            },
            {
              header: 'Price',
              accessor: (res) => res.price ? `$${res.price}` : '-'
            }
          ]}
          actions={(res) => (
            <div className="flex space-x-2">
              {res.url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(res.url, '_blank');
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Visit Link"
                >
                  <ExternalLink size={16} className="text-blue-500" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditResource(res);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Edit resource"
              >
                <Edit3 size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteResource(res);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Delete resource"
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
        title="Delete Resource"
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete <strong>{selectedResource?.title}</strong>? This action cannot be undone.</p>

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

      {/* Create/Edit Resource Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        title={selectedResource ? "Edit Resource" : "Add New Resource"}
        onClose={() => setIsCreateModalOpen(false)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              required
              rows={3}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                required
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="template">Template</option>
                <option value="tool">Tool (External Link)</option>
                <option value="video">Video</option>
                <option value="guide">Guide</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                required
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Size (e.g., "3.2 MB")</label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleFormChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Button Color</label>
              <select
                name="button_color"
                value={formData.button_color}
                onChange={handleFormChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="purple">Purple</option>
                <option value="orange">Orange</option>
                <option value="red">Red</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Icon</label>
            <select
              name="icon"
              value={formData.icon}
              onChange={handleFormChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              {ICON_OPTIONS.map(icon => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </div>

          {formData.type === 'tool' && (
            <div>
              <label className="block text-sm font-medium mb-1">External URL</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleFormChange}
                placeholder="https://example.com"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Allowed Account Types</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {ACCOUNT_TYPES.map(type => (
                <label key={type.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="allowed_account_types"
                    value={type.value}
                    checked={formData.allowed_account_types.includes(type.value)}
                    onChange={handleFormChange}
                    className="rounded"
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_premium"
              checked={formData.is_premium}
              onChange={handleFormChange}
              id="is_premium"
              className="rounded"
            />
            <label htmlFor="is_premium" className="text-sm font-medium">This is a Premium Resource</label>
          </div>

          {formData.is_premium && (
            <div>
              <label className="block text-sm font-medium mb-1">Price (for Pay-Per-Resource)</label>
              <input
                type="number"
                name="price"
                value={formData.price || ''}
                onChange={handleFormChange}
                placeholder="9.99"
                step="0.01"
                min="0"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank if included in Premium Plan only.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (selectedResource ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ResourceManagement;