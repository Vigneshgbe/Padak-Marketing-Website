// src/components/dashboard/services/ServiceRequestForm.tsx
import React, { useState } from 'react';
import { ChevronLeft, Mail } from 'lucide-react';
import { ServiceSubcategory, ServiceCategory, User } from '../../../lib/types';
import { apiService } from '../../../lib/api';
import { useToast } from '../../../hooks/use-toast';

interface ServiceRequestFormProps {
  service: ServiceSubcategory;
  category: ServiceCategory;
  onBack: () => void;
  user: User;
}

const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({ 
  service, 
  category, 
  onBack, 
  user 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: `${user.first_name} ${user.last_name}`,
    email: user.email,
    phone: user.phone || '',
    company: user.company || '',
    website: user.website || '',
    projectDetails: '',
    budgetRange: '',
    timeline: '',
    contactMethod: 'email' as 'email' | 'phone' | 'whatsapp',
    additionalRequirements: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiService.post('/services/requests', {
        subcategoryId: service.id,
        ...formData
      });

      toast({
        title: "Success",
        description: "Service request submitted successfully! Our team will contact you within 24 hours.",
      });

      onBack();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit service request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex items-center mb-4">
        <button 
          onClick={onBack}
          className="flex items-center text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 mr-4"
        >
          <ChevronLeft size={20} className="mr-1" /> Back
        </button>
        <h2 className="text-xl font-bold">Request Service: {service.name}</h2>
      </div>
      
      <div className="mb-4 p-4 bg-orange-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Category: {category.name} - {category.description}
        </p>
        <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold mt-1">
          Starting from ₹{service.base_price.toLocaleString()}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Company/Organization</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Website URL</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Project Details *</label>
          <textarea
            name="projectDetails"
            value={formData.projectDetails}
            onChange={handleChange}
            required
            rows={4}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="Describe your project, goals, and requirements..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Budget Range *</label>
            <select
              name="budgetRange"
              value={formData.budgetRange}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">Select budget range</option>
              <option value="<100">Less than ₹100</option>
              <option value="100-1k">₹100 - ₹1,000</option>
              <option value="1k-10k">₹1,000 - ₹10,000</option>
              <option value="10k-50k">₹10,000 - ₹50,000</option>
              <option value=">50k">More than ₹50,000</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Timeline *</label>
            <select
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">Select timeline</option>
              <option value="ASAP">ASAP</option>
              <option value="1-2 weeks">1-2 weeks</option>
              <option value="1 month">1 month</option>
              <option value="2-3 months">2-3 months</option>
              <option value="3+ months">3+ months</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Preferred Contact Method *</label>
          <div className="flex space-x-4">
            {['email', 'phone', 'whatsapp'].map(method => (
              <label key={method} className="flex items-center">
                <input
                  type="radio"
                  name="contactMethod"
                  value={method}
                  checked={formData.contactMethod === method}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="capitalize">{method}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Additional Requirements</label>
          <textarea
            name="additionalRequirements"
            value={formData.additionalRequirements}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="Any specific requirements or questions?"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center disabled:opacity-50"
          >
            <Mail size={18} className="mr-2" />
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceRequestForm;