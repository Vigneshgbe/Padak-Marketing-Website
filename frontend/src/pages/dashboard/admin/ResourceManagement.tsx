// src/pages/dashboard/admin/ResourceManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Trash2, Download, Search, PlusCircle, Edit3, FileText, BookOpen, Users, Building,
  GraduationCap, Shield, Briefcase, Globe, TrendingUp, Target, BarChart3, PenTool,
  MessageSquare, Calendar, Star, Award, BookmarkPlus, Info, ExternalLink
} from 'lucide-react';
import DataTable from '../../../components/admin/DataTable';
import Modal from '../../../components/admin/Modal';

// This map allows converting an icon name string to its Lucide React component
const LucideIconsMap: { [key: string]: React.ElementType } = {
  FileText, Download, ExternalLink, BookOpen, Users, Building, GraduationCap,
  Shield, Briefcase, Globe, TrendingUp, Target, BarChart3, PenTool, Search,
  MessageSquare, Calendar, Star, Award, BookmarkPlus, Info
};

// Available resource types for dropdown
const resourceTypes = ['pdf', 'excel', 'template', 'tool', 'video', 'guide'];
// Available categories for dropdown
const resourceCategories = [
  'Course Materials', 'Templates', 'Professional Tools', 'Business Tools',
  'Agency Tools', 'External Tools', 'General Guides'
];
// Available button colors for dropdown (matching Tailwind convention)
const buttonColors = ['blue', 'green', 'purple', 'orange', 'red', 'gray'];
// Available account types for multi-select
const accountTypes = ['student', 'professional', 'business', 'agency', 'admin'];
// Available Lucide icon names for dropdown (keys from LucideIconsMap)
const lucideIconNames = Object.keys(LucideIconsMap).sort();

interface AdminResource {
  id: number;
  title: string;
  description: string;
  type: 'pdf' | 'excel' | 'template' | 'tool' | 'video' | 'guide';
  size?: string;
  url?: string;
  category: string;
  icon_name: string;
  button_color: string;
  allowed_account_types: string[];
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

interface ResourceFormData {
  title: string;
  description: string;
  type: 'pdf' | 'excel' | 'template' | 'tool' | 'video' | 'guide';
  size: string;
  url: string;
  category: string;
  icon_name: string;
  button_color: string;
  allowed_account_types: string[];
  is_premium: boolean;
}

const ResourceManagement: React.FC = () => {
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<AdminResource | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateEditModalOpen, setIsCreateEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<ResourceFormData>({
    title: '',
    description: '',
    type: 'pdf',
    size: '',
    url: '',
    category: 'Course Materials',
    icon_name: 'FileText',
    button_color: 'blue',
    allowed_account_types: [],
    is_premium: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchResources();
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

  const baseURL = `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000';

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseURL}/api/admin/resources`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setResources(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch resources');
      }
    } catch (err) {
      console.error('Failed to fetch resources:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching resources.');
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = (resource: AdminResource) => {
    setSelectedResource(resource);
    setIsDeleteModalOpen(true);
  };

  const handleEditResource = (resource: AdminResource) => {
    setSelectedResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      size: resource.size || '',
      url: resource.url || '',
      category: resource.category,
      icon_name: resource.icon_name,
      button_color: resource.button_color,
      allowed_account_types: resource.allowed_account_types,
      is_premium: resource.is_premium,
    });
    setIsCreateEditModalOpen(true);
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
      icon_name: 'FileText',
      button_color: 'blue',
      allowed_account_types: [],
      is_premium: false,
    });
    setIsCreateEditModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked, options } = e.target as HTMLInputElement & HTMLSelectElement;

    if (name === 'allowed_account_types') {
      const selectedOptions = Array.from(options)
        .filter(option => option.selected)
        .map(option => option.value);
      setFormData(prev => ({ ...prev, [name]: selectedOptions }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedResource) return;

    try {
      const response = await fetch(`${baseURL}/api/admin/resources/${selectedResource.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        setIsDeleteModalOpen(false);
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
      const url = selectedResource
        ? `${baseURL}/api/admin/resources/${selectedResource.id}`
        : `${baseURL}/api/admin/resources`;

      const method = selectedResource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsCreateEditModalOpen(false);
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

  const filteredResources = resources.filter((resource: AdminResource) => {
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        resource.title.toLowerCase().includes(lowerSearchTerm) ||
        resource.category.toLowerCase().includes(lowerSearchTerm) ||
        resource.type.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return true;
  });

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
            Add New Resource
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
        <DataTable<AdminResource>
          data={filteredResources}
          columns={[
            {
              header: 'Icon',
              accessor: (resource) => {
                const IconComponent = LucideIconsMap[resource.icon_name];
                return IconComponent ? <IconComponent size={20} className={`text-${resource.button_color}-500`} /> : <FileText size={20} />;
              }
            },
            { header: 'Title', accessor: 'title' },
            { header: 'Category', accessor: 'category' },
            { header: 'Type', accessor: 'type' },
            {
              header: 'Premium',
              accessor: (resource) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  resource.is_premium
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {resource.is_premium ? 'Yes' : 'No'}
                </span>
              )
            },
            {
              header: 'Allowed Account Types',
              accessor: (resource) => (
                <div className="flex flex-wrap gap-1">
                  {resource.allowed_account_types.map(type => (
                    <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs capitalize">
                      {type}
                    </span>
                  ))}
                </div>
              )
            }
          ]}
          actions={(resource) => (
            <div className="flex space-x-2">
              {resource.url && (resource.type === 'tool' || resource.type === 'pdf') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(resource.url, '_blank');
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title={resource.type === 'tool' ? 'Visit Tool' : 'View/Download Resource'}
                >
                  {resource.type === 'tool' ? <ExternalLink size={16} className="text-purple-500" /> : <Download size={16} className="text-green-500" />}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditResource(resource);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Edit resource"
              >
                <Edit3 size={16} className="text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteResource(resource);
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
        isOpen={isDeleteModalOpen}
        title="Delete Resource"
        onClose={() => setIsDeleteModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete the resource: <strong>{selectedResource?.title}</strong>? This action cannot be undone.</p>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
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
        isOpen={isCreateEditModalOpen}
        title={selectedResource ? "Edit Resource" : "Add New Resource"}
        onClose={() => setIsCreateEditModalOpen(false)}
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
            ></textarea>
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
                {resourceTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                required
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                {resourceCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Size (e.g., 3.2 MB)</label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleFormChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL (for tools/external files)</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleFormChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="https://example.com/resource.pdf (Optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Icon Name (Lucide)</label>
              <select
                name="icon_name"
                value={formData.icon_name}
                onChange={handleFormChange}
                required
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                {lucideIconNames.map(iconName => (
                  <option key={iconName} value={iconName}>
                    {iconName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Button Color (Tailwind)</label>
              <select
                name="button_color"
                value={formData.button_color}
                onChange={handleFormChange}
                required
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                {buttonColors.map(color => (
                  <option key={color} value={color}>
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Allowed Account Types</label>
            <select
              name="allowed_account_types"
              value={formData.allowed_account_types}
              onChange={handleFormChange}
              multiple
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 h-28"
            >
              {accountTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_premium"
              checked={formData.is_premium}
              onChange={handleFormChange}
              className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="is_premium" className="ml-2 block text-sm font-medium">Is Premium Resource?</label>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setIsCreateEditModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (selectedResource ? 'Update Resource' : 'Add Resource')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ResourceManagement;