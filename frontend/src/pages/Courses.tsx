import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Users, 
  Star, 
  Search,
  Filter,
  BookOpen,
  Award,
  TrendingUp,
  RefreshCw,
  LogIn,
  UserPlus,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const API_BASE = 'https://localhost:5000';

const fetchCourses = async () => {
  try {
    // Call GET /api/courses endpoint from server.js
    const courses = await apiService.get('/courses');
    
    return courses.map(course => ({
      ...course,
      instructor: course.instructorName || 'Padak Instructor',
      duration: course.durationWeeks ? `${course.durationWeeks} weeks` : 'TBD',
      students: Math.floor(Math.random() * 2000) + 500,
      rating: (Math.random() * 0.5 + 4.5).toFixed(1),
      lessons: course.durationWeeks ? course.durationWeeks * 4 : 0,
      certificate: true,
      image: course.thumbnail || '📘',
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollmentType, setEnrollmentType] = useState("login"); // "login" or "guest"
  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const coursesData = await fetchCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load courses. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollClick = (course) => {
    setSelectedCourse(course);
    
    if (isAuthenticated) {
      // If authenticated, directly enroll
      handleDirectEnrollment(course);
    } else {
      // If not authenticated, show enrollment options dialog
      setShowEnrollDialog(true);
      setEnrollmentType("login");
      setGuestForm({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    }
  };

  const handleDirectEnrollment = async (course) => {
    try {
      // Call POST /api/courses/enroll endpoint from server.js (line 2938-2976)
      const response = await apiService.post('/courses/enroll', {
        courseId: course.id
      });

      toast({
        title: "Success!",
        description: "You have been enrolled in the course successfully.",
        variant: "success",
      });

      // Redirect to dashboard or my courses page
      setTimeout(() => {
        window.location.href = '/dashboard/my-courses';
      }, 1500);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      
      if (error.message?.includes('Already enrolled')) {
        toast({
          variant: "destructive",
          title: "Already Enrolled",
          description: "You are already enrolled in this course.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Enrollment Failed",
          description: error.message || "Failed to enroll in course. Please try again.",
        });
      }
    }
  };

  const handleGuestEnrollmentRequest = async () => {
    // Validate guest form
    if (!guestForm.name || !guestForm.email) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please provide your name and email.",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestForm.email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please provide a valid email address.",
      });
      return;
    }

    setSubmittingRequest(true);
    try {
      // Call POST /api/courses/:courseId/enroll-request endpoint from server.js (line 3394-3467)
      await apiService.post(`/courses/${selectedCourse.id}/enroll-request`, {
        name: guestForm.name,
        email: guestForm.email,
        phone: guestForm.phone || null,
        message: guestForm.message || null
      });

      toast({
        title: "Request Submitted!",
        description: "Your enrollment request has been submitted. We'll contact you via email once approved.",
        duration: 5000,
      });

      setShowEnrollDialog(false);
      setGuestForm({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } catch (error) {
      console.error('Error submitting enrollment request:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit enrollment request. Please try again.",
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleLoginRedirect = () => {
    // Store selected course in sessionStorage for after login
    sessionStorage.setItem('selectedCourse', JSON.stringify({
      id: selectedCourse.id,
      title: selectedCourse.title,
      price: selectedCourse.price
    }));
    
    // Redirect to login page
    window.location.href = '/login';
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

  const categories = ["all", ...Array.from(new Set(courses.map(course => course.category).filter(Boolean)))];
  const levels = ["all", "Beginner", "Intermediate", "Advanced"];

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

          {/* Courses Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map(course => (
              <Card 
                key={course.id} 
                className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-orange-300/50 relative overflow-hidden"
              >
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
                  <CardDescription className="text-base leading-relaxed line-clamp-3">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="truncate">By {course.instructor}</span>
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
                      onClick={() => handleEnrollClick(course)}
                      className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                    >
                      {isAuthenticated ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          Enroll Now
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          Enroll Now
                        </>
                      )}
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

      {/* Why Choose Our Courses Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Courses?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get the best learning experience with our industry-leading courses
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 bg-gradient-to-br from-orange-50 to-white shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Certified Instructors</h3>
                <p className="text-sm text-muted-foreground">
                  Learn from industry experts with years of real-world experience
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-white shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Hands-On Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Practice with real projects and build your portfolio
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-gradient-to-br from-green-50 to-white shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Career Support</h3>
                <p className="text-sm text-muted-foreground">
                  Get placement assistance and career guidance
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-400 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of students who have transformed their careers with our courses
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated && (
              <>
                <Button 
                  size="lg"
                  onClick={() => window.location.href = '/login'}
                  className="bg-white text-orange-600 hover:bg-gray-100 shadow-lg"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Login to Enroll
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => window.location.href = '/signup'}
                  className="border-2 border-white text-white hover:bg-white/10"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </Button>
              </>
            )}
            {isAuthenticated && (
              <Button 
                size="lg"
                onClick={() => window.location.href = '/dashboard/my-courses'}
                className="bg-white text-orange-600 hover:bg-gray-100 shadow-lg"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                View My Courses
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Enrollment Dialog for Non-Authenticated Users */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
              Enroll in {selectedCourse?.title}
            </DialogTitle>
            <DialogDescription className="text-base">
              Choose how you'd like to proceed with your enrollment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Enrollment Type Selector */}
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  enrollmentType === "login" 
                    ? "border-2 border-orange-500 bg-orange-50/50" 
                    : "border-2 hover:border-orange-200"
                }`}
                onClick={() => setEnrollmentType("login")}
              >
                <CardContent className="pt-6 text-center">
                  <LogIn className={`w-8 h-8 mx-auto mb-2 ${
                    enrollmentType === "login" ? "text-orange-500" : "text-gray-400"
                  }`} />
                  <h3 className="font-semibold mb-1">Login</h3>
                  <p className="text-xs text-muted-foreground">
                    Have an account? Login to enroll
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  enrollmentType === "guest" 
                    ? "border-2 border-orange-500 bg-orange-50/50" 
                    : "border-2 hover:border-orange-200"
                }`}
                onClick={() => setEnrollmentType("guest")}
              >
                <CardContent className="pt-6 text-center">
                  <UserPlus className={`w-8 h-8 mx-auto mb-2 ${
                    enrollmentType === "guest" ? "text-orange-500" : "text-gray-400"
                  }`} />
                  <h3 className="font-semibold mb-1">Guest Request</h3>
                  <p className="text-xs text-muted-foreground">
                    Request enrollment without account
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Login Option Content */}
            {enrollmentType === "login" && (
              <div className="space-y-4 p-4 bg-orange-50/30 rounded-lg border border-orange-200">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Instant Access</p>
                    <p className="text-xs text-muted-foreground">Get immediate access to course materials</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Track Progress</p>
                    <p className="text-xs text-muted-foreground">Monitor your learning journey</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Earn Certificates</p>
                    <p className="text-xs text-muted-foreground">Get recognized for your achievements</p>
                  </div>
                </div>
              </div>
            )}

            {/* Guest Request Form */}
            {enrollmentType === "guest" && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Submit your request and we'll contact you via email once approved. You can create an account later to access the course.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="guest-name">Full Name *</Label>
                    <Input
                      id="guest-name"
                      placeholder="Enter your full name"
                      value={guestForm.name}
                      onChange={(e) => setGuestForm({...guestForm, name: e.target.value})}
                      className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guest-email">Email Address *</Label>
                    <Input
                      id="guest-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm({...guestForm, email: e.target.value})}
                      className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guest-phone">Phone Number (Optional)</Label>
                    <Input
                      id="guest-phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
                      className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guest-message">Message (Optional)</Label>
                    <Textarea
                      id="guest-message"
                      placeholder="Tell us why you're interested in this course..."
                      value={guestForm.message}
                      onChange={(e) => setGuestForm({...guestForm, message: e.target.value})}
                      className="border-orange-200 focus:border-orange-500 focus:ring-orange-500 min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEnrollDialog(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            {enrollmentType === "login" ? (
              <Button
                onClick={handleLoginRedirect}
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Continue to Login
              </Button>
            ) : (
              <Button
                onClick={handleGuestEnrollmentRequest}
                disabled={submittingRequest}
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
              >
                {submittingRequest ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};