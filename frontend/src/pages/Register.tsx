import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle, X } from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  accountType: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  accountType?: string;
  agreeToTerms?: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

const ToastNotification = ({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 transform translate-x-0 max-w-md ${
      toast.type === 'success' 
        ? 'bg-green-500/90 text-white border border-green-400' 
        : 'bg-red-500/90 text-white border border-red-400'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accountType: "",
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, type, message };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
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
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Account Type validation
    if (!formData.accountType) {
      newErrors.accountType = "Please select an account type";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors[0]; // Show first error
      }
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Send registration data to backend
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword, // ✅ ADD THIS LINE
          accountType: formData.accountType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('Registration successful:', data);
      showToast('success', 'Registration successful! Redirecting to login...');
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      showToast('error', `Registration failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleTermsClick = () => {
    window.location.href = '/Terms';
  };

  const handlePrivacyClick = () => {
    window.location.href = '/Policy';
  };

  const handleSignInClick = () => {
    window.location.href = '/login';
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: "", color: "" };
    
    const errors = validatePassword(password);
    
    if (errors.length === 0) {
      return { strength: "Strong", color: "text-green-600" };
    } else if (errors.length <= 2) {
      return { strength: "Medium", color: "text-yellow-600" };
    } else {
      return { strength: "Weak", color: "text-red-600" };
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <>
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <ToastNotification 
          key={toast.id} 
          toast={toast} 
          onClose={removeToast} 
        />
      ))}
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-orange-300/5 rounded-full blur-xl animate-pulse delay-500"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-orange-400/8 rounded-full blur-lg animate-pulse delay-300"></div>
      
      <Card className="w-full max-w-md relative z-10 bg-background/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        {/* Orange accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400"></div>
        
        <CardHeader className="space-y-1">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="mr-2 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-white-500 to-white-400 rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                <img 
                  src="https://github.com/Sweety-Vigneshg/Padak-Marketing-Website/blob/main/frontend/src/assets/padak_p.png?raw=true" 
                  alt="Padak Logo" 
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const nextSibling = target.parentNode?.querySelector('span') as HTMLSpanElement;
                    if (target && nextSibling) {
                      target.style.display = 'none';
                      nextSibling.style.display = 'block';
                    }
                  }}
                />
                <span className="text-white font-bold text-lg" style={{ display: 'none' }}>P</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                Padak
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">Create an account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Join Padak to access exclusive courses and internship opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  className={`border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300 ${
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
                <Label htmlFor="lastName" className="text-foreground">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  className={`border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300 ${
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
              <Label htmlFor="email" className="text-foreground">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className={`border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300 ${
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
              <Label htmlFor="phone" className="text-foreground">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                className={`border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300 ${
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
              <Label htmlFor="accountType" className="text-foreground">
                Account Type <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value) => handleInputChange('accountType', value)}>
                <SelectTrigger className={`border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300 ${
                  errors.accountType ? 'border-red-500 focus:border-red-500' : ''
                }`}>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="business">Business Owner</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
              {errors.accountType && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="w-3 h-3" />
                  {errors.accountType}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className={`border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300 pr-10 ${
                    errors.password ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formData.password && passwordStrength.strength && (
                <div className={`text-sm ${passwordStrength.color}`}>
                  Password strength: {passwordStrength.strength}
                </div>
              )}
              {errors.password && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  className={`border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300 pr-10 ${
                    errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => 
                    handleInputChange('agreeToTerms', !!checked)
                  }
                  required
                  className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 mt-1"
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <button 
                    type="button"
                    onClick={handleTermsClick}
                    className="text-orange-600 hover:text-orange-700 hover:underline transition-colors font-medium"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button 
                    type="button"
                    onClick={handlePrivacyClick}
                    className="text-orange-600 hover:text-orange-700 hover:underline transition-colors font-medium"
                  >
                    Privacy Policy
                  </button>{" "}
                  <span className="text-red-500">*</span>
                </Label>
              </div>
              {errors.agreeToTerms && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="w-3 h-3" />
                  {errors.agreeToTerms}
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button 
                type="button"
                onClick={handleSignInClick}
                className="text-orange-600 hover:text-orange-700 hover:underline transition-colors font-medium"
              >
                Sign in
              </button>
            </div>
          </div>
        </CardContent>
        
        {/* Subtle background pattern */}
        <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-orange-400/5 rounded-full blur-xl"></div>
      </Card>
      </div>
    </>
  );
}