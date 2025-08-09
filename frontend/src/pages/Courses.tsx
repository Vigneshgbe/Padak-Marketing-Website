import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Clock, 
  Users, 
  Star, 
  Search,
  Filter,
  BookOpen,
  Award,
  TrendingUp,
  RefreshCw,
  ShoppingCart
} from "lucide-react";

const API_BASE = '/api';

const fetchCourses = async () => {
  try {
    const response = await fetch(`${API_BASE}/courses`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch courses. Server response:', errorText);
      throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`);
    }
    const courses = await response.json();
    
    return courses.map(course => ({
      ...course,
      instructor: course.instructorName || 'Unknown Instructor',
      duration: course.durationWeeks ? `${course.durationWeeks} weeks` : 'TBD',
      students: Math.floor(Math.random() * 2000) + 500,
      rating: (Math.random() * 0.5 + 4.5).toFixed(1),
      lessons: course.durationWeeks ? course.durationWeeks * 4 : 0,
      certificate: true,
      image: course.thumbnail || '📘',
      // Ensure level is properly formatted
      level: course.difficultyLevel ? 
        course.difficultyLevel.charAt(0).toUpperCase() + course.difficultyLevel.slice(1).toLowerCase() : 
        'Beginner'
    }));
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const coursesData = await fetchCourses();
      // Fix: MySQL returns 1/0 for boolean, not true/false
      // The backend already filters by is_active = true in the SQL query
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = (course) => {
    setSelectedCourse(course);
    setShowCheckout(true);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      (course.title && course.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
    const matchesLevel = levelFilter === "all" || course.level === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Get unique categories from courses
  const categories = ["all", ...Array.from(new Set(courses.map(course => course.category).filter(Boolean)))];
  const levels = ["all", "Beginner", "Intermediate", "Advanced"];

  // Checkout Component
  if (showCheckout && selectedCourse) {
    return <CheckoutPage course={selectedCourse} onBack={() => setShowCheckout(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading courses...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Master Digital Marketing with{" "}
              <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                Expert-Led Courses
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Learn from industry professionals and get hands-on experience with our 
              comprehensive digital marketing courses. Get certified and advance your career.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <TrendingUp className="w-4 h-4" />
              <span>{courses.length} courses available</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses, instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48 border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-48 border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level === "all" ? "All Levels" : level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={loadCourses}
                className="border-orange-200 hover:bg-orange-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </section>

      {/* Courses Grid */}
      <section className="py-20 bg-gradient-to-br from-orange-50/30 via-background to-orange-100/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-background/90 backdrop-blur-sm hover:bg-white relative overflow-hidden">
                {/* Orange accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl hover:scale-110 hover:rotate-3 transition-all duration-300 cursor-pointer">
                      {course.image}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                        {course.level}
                      </Badge>
                      <Badge variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs">
                        {course.category}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-orange-600 transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>By {course.instructor}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-orange-500 fill-current" />
                      <span>{course.rating}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span>{course.lessons} lessons</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{course.students} students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span>Certificate</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-2xl font-bold text-orange-600">{course.price}</div>
                    <Button 
                      onClick={() => handleEnrollment(course)}
                      className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Enroll Now
                    </Button>
                  </div>
                </CardContent>
                
                {/* Subtle background pattern */}
                <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-orange-400/5 rounded-full blur-xl group-hover:bg-orange-400/10 transition-all duration-300"></div>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {courses.length === 0 
                  ? "No courses are available at the moment. Please check back later."
                  : "Try adjusting your search terms or filters to find more courses."}
              </p>
              <Button 
                onClick={loadCourses}
                variant="outline" 
                className="border-orange-200 hover:bg-orange-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Courses
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Checkout Page Component (keeping your existing implementation)
function CheckoutPage({ course, onBack }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'upi',
    paymentScreenshot: null,
    transactionId: '',
    courseId: course.id,
    courseName: course.title,
    coursePrice: course.price,
    instructor: course.instructor
  });
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentPreview, setPaymentPreview] = useState(null);

  // Validation function
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Phone number should be 10 digits';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
      else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Pincode should be 6 digits';
    }
    
    if (step === 2) {
      if (!formData.paymentScreenshot) newErrors.paymentScreenshot = 'Payment screenshot is required';
      if (!formData.transactionId.trim()) newErrors.transactionId = 'Transaction ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Append all form data
      formDataToSend.append('courseId', formData.courseId);
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('pincode', formData.pincode);
      formDataToSend.append('paymentMethod', formData.paymentMethod);
      formDataToSend.append('transactionId', formData.transactionId);
      formDataToSend.append('paymentScreenshot', formData.paymentScreenshot);
      
      // Get JWT token from storage
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/enroll-request`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formDataToSend
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }
      
      setShowThankYou(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert(error.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, paymentScreenshot: 'Only image files are allowed.' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit as per backend
        setErrors(prev => ({ ...prev, paymentScreenshot: 'File size exceeds 5MB limit.' }));
        return;
      }

      setFormData(prev => ({ ...prev, paymentScreenshot: file }));
      
      const previewUrl = URL.createObjectURL(file);
      setPaymentPreview(previewUrl);
      
      if (errors.paymentScreenshot) {
        setErrors(prev => ({ ...prev, paymentScreenshot: '' }));
      }
    }
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (paymentPreview) {
        URL.revokeObjectURL(paymentPreview);
      }
    };
  }, [paymentPreview]);

  if (showThankYou) {
    return <ThankYouPage course={course} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-background to-orange-100/20">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mb-6 border-orange-200 hover:bg-orange-50"
        >
          ← Back to Courses
        </Button>

        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-orange-600 bg-orange-50' : 'border-gray-300'}`}>
                  1
                </div>
                <span className="font-medium">Course & User Details</span>
              </div>
              <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-orange-600 bg-orange-50' : 'border-gray-300'}`}>
                  2
                </div>
                <span className="font-medium">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8 border-0 bg-white shadow-lg">
                <CardHeader className="pb-4">
                  <div className="text-center">
                    <div className="text-6xl mb-4">{course.image}</div>
                    <CardTitle className="text-xl text-center">{course.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Instructor:</span>
                      <span className="font-medium">{course.instructor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{course.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Level:</span>
                      <Badge variant="outline" className="border-orange-200 text-orange-600">
                        {course.level}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lessons:</span>
                      <span className="font-medium">{course.lessons}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Certificate:</span>
                      <Award className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount:</span>
                      <span className="text-2xl font-bold text-orange-600">{course.price}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Content */}
            <div className="lg:col-span-2">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {currentStep === 1 ? 'Personal Information' : 'Payment Details'}
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1 
                      ? 'Please provide your details to complete the enrollment'
                      : 'Complete your payment to secure your spot in the course'
                    }
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Full Name *</label>
                          <Input
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            placeholder="Enter your full name"
                            className={errors.fullName ? 'border-red-500' : 'border-orange-200 focus:border-orange-500'}
                          />
                          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Email *</label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Enter your email"
                            className={errors.email ? 'border-red-500' : 'border-orange-200 focus:border-orange-500'}
                          />
                          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone Number *</label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Enter your phone number"
                          className={errors.phone ? 'border-red-500' : 'border-orange-200 focus:border-orange-500'}
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Address *</label>
                        <Input
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Enter your complete address"
                          className={errors.address ? 'border-red-500' : 'border-orange-200 focus:border-orange-500'}
                        />
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">City *</label>
                          <Input
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="City"
                            className={errors.city ? 'border-red-500' : 'border-orange-200 focus:border-orange-500'}
                          />
                          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">State *</label>
                          <Input
                            value={formData.state}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            placeholder="State"
                            className={errors.state ? 'border-red-500' : 'border-orange-200 focus:border-orange-500'}
                          />
                          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Pincode *</label>
                          <Input
                            value={formData.pincode}
                            onChange={(e) => handleInputChange('pincode', e.target.value)}
                            placeholder="Pincode"
                            maxLength="6"
                            className={errors.pincode ? 'border-red-500' : 'border-orange-200 focus:border-orange-500'}
                          />
                          {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-6">
                        <Button 
                          onClick={handleNext}
                          className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500"
                        >
                          Continue to Payment
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center p-6 bg-orange-50 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Scan & Pay</h3>
                        <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
                          <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-lg">
                            <div className="text-center">
                              <div className="text-4xl mb-2">📱</div>
                              <p className="text-sm text-gray-600">QR Code</p>
                              <p className="text-xs text-gray-500 mt-1">Pay {course.price}</p>
                            </div>
                          </div>
                          </div>
                        <p className="text-sm text-gray-600 mt-4">
                          Scan this QR code with any UPI app to pay {course.price}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Upload Payment Screenshot *</label>
                        <div className="border-2 border-dashed border-orange-200 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="payment-screenshot"
                          />
                          <label htmlFor="payment-screenshot" className="cursor-pointer">
                            {paymentPreview ? (
                              <div className="flex flex-col items-center">
                                <img 
                                  src={paymentPreview} 
                                  alt="Payment preview" 
                                  className="h-32 w-auto object-contain mb-2 rounded-md"
                                />
                                <p className="text-sm text-gray-600">
                                  {formData.paymentScreenshot ? formData.paymentScreenshot.name : 'No file selected'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Click to change
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="text-gray-400 mb-2">
                                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Click to upload payment screenshot
                                </p>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG, GIF, WEBP up to 5MB</p>
                              </>
                            )}
                          </label>
                        </div>
                        {errors.paymentScreenshot && <p className="text-red-500 text-sm mt-1">{errors.paymentScreenshot}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Transaction ID *</label>
                        <Input
                          value={formData.transactionId}
                          onChange={(e) => handleInputChange('transactionId', e.target.value)}
                          placeholder="Enter transaction ID from payment app"
                          className={errors.transactionId ? 'border-red-500' : 'border-orange-200 focus:border-orange-500'}
                        />
                        {errors.transactionId && <p className="text-red-500 text-sm mt-1">{errors.transactionId}</p>}
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="text-blue-500 mt-0.5">ℹ️</div>
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Payment Instructions:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>Scan the QR code with any UPI app (PhonePe, Paytm, GPay, etc.)</li>
                              <li>Complete the payment of {course.price}</li>
                              <li>Take a screenshot of the successful payment</li>
                              <li>Upload the screenshot and enter the transaction ID</li>
                              <li>Your enrollment will be processed within 24 hours</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between pt-6">
                        <Button 
                          variant="outline" 
                          onClick={() => setCurrentStep(1)}
                          className="border-orange-200 hover:bg-orange-50"
                        >
                          Back
                        </Button>
                        <Button 
                          onClick={handleSubmit}
                          disabled={loading}
                          className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Complete Enrollment'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

// Thank You Page Component
function ThankYouPage({ course }) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-background to-orange-100/20">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Animation */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-green-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Thank You! 🎉
            </h1>
            <p className="text-xl text-gray-600">
              Your enrollment request has been submitted successfully!
            </p>
          </div>

          {/* Course Details */}
          <Card className="mb-8 border-0 bg-white shadow-lg">
            <CardHeader>
              <div className="text-4xl mb-2">{course.image}</div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <CardDescription>by {course.instructor}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="font-semibold text-orange-600">Duration</div>
                  <div>{course.duration}</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-600">Lessons</div>
                  <div>{course.lessons}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="mb-8 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">📋</div>
                <div className="text-left">
                  <h3 className="font-semibold text-blue-900 mb-2">Important Note:</h3>
                  <p className="text-blue-800 text-sm leading-relaxed mb-4">
                    Your submission and details will be updated in our dashboard within 24 hours. 
                    Once verified, you'll receive access to your personalized dashboard where you can 
                    track your progress, access course materials, and connect with instructors.
                  </p>
                  <div className="bg-white/60 p-3 rounded-lg">
                    <p className="text-blue-700 text-sm font-medium">
                      Please login and check your personalized dashboard for updates!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button 
              onClick={() => setShowLoginDialog(true)}
              size="lg"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white py-3"
            >
              Access Your Dashboard
            </Button>
            
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/courses'}
                className="border-orange-200 hover:bg-orange-50"
              >
                Browse More Courses
              </Button>
            </div>
          </div>

          {/* What's Next */}
          <div className="mt-12 text-left">
            <h3 className="text-lg font-semibold mb-4 text-center">What happens next?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl mb-2">⏰</div>
                <div className="font-medium text-sm">Verification</div>
                <div className="text-xs text-gray-600 mt-1">Payment verified within 24 hours</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl mb-2">📧</div>
                <div className="font-medium text-sm">Email Confirmation</div>
                <div className="text-xs text-gray-600 mt-1">Welcome email with login details</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl mb-2">🚀</div>
                <div className="font-medium text-sm">Start Learning</div>
                <div className="text-xs text-gray-600 mt-1">Access course materials & begin</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Dialog */}
      {showLoginDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold">Access Dashboard</h3>
              <p className="text-gray-600 text-sm mt-2">
                Please login to access your personalized learning dashboard
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500"
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                Login to Dashboard
              </Button>
              
              <div className="text-center">
                <span className="text-sm text-gray-600">Don't have an account? </span>
                <button 
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                  onClick={() => {
                    window.location.href = '/signup';
                  }}
                >
                  Sign up here
                </button>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowLoginDialog(false)}
              className="w-full mt-4 border-gray-200"
            >
              Close
            </Button>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}
                          