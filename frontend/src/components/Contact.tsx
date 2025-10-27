import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
  general?: string;
}

export const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const contactInfo = [
    {
      icon: MapPin,
      title: "Office Location",
      details: ["Ratmalana, Colombo, Sri Lanka", "Tamil Nadu, India"]
    },
    {
      icon: Phone,
      title: "Phone Number",
      details: ["+94 774433757", "Whatsapp Available"]
    },
    {
      icon: Mail,
      title: "Email Address",
      details: ["padak.service@gmail.com"]
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: ["Mon - Fri : 9:00 AM - 6:00 PM", "Sat : 10:00 AM - 4:00 PM"]
    }
  ];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) return true; // Phone is optional
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 1) {
      newErrors.lastName = "Last name must be at least 1 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation (optional but if provided should be valid)
    if (formData.phone.trim() && !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error when user types
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }

    // Clear submit status when user starts typing
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSubmitStatus('idle');

    try {
      console.log('Sending request to backend...');
      
      const requestData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || '',
        company: formData.company.trim() || '',
        message: formData.message.trim()
      };

      console.log('Request data:', requestData);

      const response = await fetch(`https://localhost:5000/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
          console.log('Response data:', data);
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          throw new Error('Invalid response format from server');
        }
      } else {
        // Handle non-JSON responses
        const textResponse = await response.text();
        console.log('Non-JSON response:', textResponse);
        
        if (response.ok) {
          // If the response is successful but not JSON, assume it worked
          data = { message: 'Contact form submitted successfully' };
        } else {
          throw new Error(`Server error: ${response.status} - ${textResponse}`);
        }
      }

      if (!response.ok) {
        console.error('Response not ok:', response.status, data);
        
        if (response.status === 400) {
          setErrors({ general: data?.error || 'Invalid contact data' });
        } else if (response.status === 500) {
          setErrors({ general: 'Server error. Please try again later.' });
        } else if (response.status === 404) {
          setErrors({ general: 'Contact endpoint not found. Please check if the server is running.' });
        } else {
          setErrors({ general: data?.error || `Server error: ${response.status}` });
        }
        setSubmitStatus('error');
        return;
      }

      console.log('Contact form submitted successfully:', data);
      setSubmitStatus('success');
      
      // Clear form on success
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        message: ''
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);

    } catch (error) {
      console.error('Contact form submission error:', error);
      
      let errorMessage = 'Failed to submit contact form. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.name === 'NetworkError') {
          errorMessage = 'Unable to connect to server. Please check if the server is running on API_URL';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS error. Please check server configuration.';
        } else if (error.message.includes('JSON')) {
          errorMessage = 'Server response error. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors({ general: errorMessage });
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          {/* <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MessageSquare className="w-4 h-4" />
            Contact Us
          </div> */}
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Let's Start Your{" "}
            <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
              Success Story
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ready to transform your digital presence? Contact us today for a free consultation 
            and discover how we can help grow your business.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400"></div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-400 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                Send Us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Success Message */}
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Thank you! Your message has been sent successfully. We'll get back to you soon.
                    </span>
                  </div>
                </div>
              )}

              {/* General Error Message */}
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{errors.general}</span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="firstName" 
                      name="firstName"
                      placeholder="John" 
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required 
                      disabled={isSubmitting}
                      className={`border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-colors ${
                        errors.firstName ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {errors.firstName && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="w-3 h-3" />
                        {errors.firstName}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="lastName" 
                      name="lastName"
                      placeholder="Doe" 
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required 
                      disabled={isSubmitting}
                      className={`border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-colors ${
                        errors.lastName ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                    {errors.lastName && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="w-3 h-3" />
                        {errors.lastName}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder="john@example.com" 
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required 
                    disabled={isSubmitting}
                    className={`border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-colors ${
                      errors.email ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.email && (
                    <div className="flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    name="phone"
                    type="tel" 
                    placeholder="+1 (555) 123-4567" 
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={isSubmitting}
                    className={`border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-colors ${
                      errors.phone ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.phone && (
                    <div className="flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input 
                    id="company" 
                    name="company"
                    placeholder="Your Company Name" 
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    disabled={isSubmitting}
                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea 
                    id="message" 
                    name="message"
                    placeholder="Tell us about your project and how we can help..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    disabled={isSubmitting}
                    className={`border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-colors resize-none ${
                      errors.message ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.message && (
                    <div className="flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle className="w-3 h-3" />
                      {errors.message}
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={handleSubmit}
                  type="button" 
                  size="lg" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                  <Send className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
            {/* Decorative element */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl"></div>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Get in Touch</h3>
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <Card 
                    key={index} 
                    className="border-0 bg-white/80 backdrop-blur-sm p-4 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <info.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 group-hover:text-orange-600 transition-colors">
                          {info.title}
                        </h4>
                        {info.details.map((detail, detailIndex) => (
                          <p key={detailIndex} className="text-muted-foreground">
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Map Placeholder */}
            <Card className="overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-400/10"></div>
                <div className="text-center relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <MapPin className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Find Us</h3>
                  <p className="text-muted-foreground">
                    Located in the heart of the business district
                  </p>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-4 left-4 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl"></div>
              </div>
            </Card>
          </div>
        </div>

        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-20 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>
    </section>
  );
};