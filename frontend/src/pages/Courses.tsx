import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from "@/lib/api";
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
  LogIn
} from "lucide-react";

const fetchCourses = async () => {
  try {
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

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const coursesData = await fetchCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = (course) => {
    // Store selected course in sessionStorage for after login
    sessionStorage.setItem('selectedCourse', JSON.stringify({
      id: course.id,
      title: course.title,
      price: course.price
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
                      onClick={() => handleEnrollment(course)}
                      className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                    >
                      <LogIn className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
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
              Create Account
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}