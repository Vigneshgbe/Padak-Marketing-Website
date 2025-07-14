import { useState } from "react";
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
  TrendingUp
} from "lucide-react";

const courses = [
  {
    id: 1,
    title: "Complete Digital Marketing Mastery",
    description: "Master all aspects of digital marketing from SEO to social media advertising",
    instructor: "Sarah Johnson",
    duration: "12 weeks",
    students: 1250,
    rating: 4.9,
    price: "₹24,999",
    level: "Beginner",
    category: "Digital Marketing",
    image: "🎯",
    lessons: 48,
    certificate: true
  },
  {
    id: 2,
    title: "Advanced SEO Optimization",
    description: "Advanced techniques for ranking higher in search engines",
    instructor: "Michael Chen",
    duration: "8 weeks",
    students: 890,
    rating: 4.8,
    price: "₹16,999",
    level: "Advanced",
    category: "SEO",
    image: "🔍",
    lessons: 32,
    certificate: true
  },
  {
    id: 3,
    title: "Social Media Marketing Pro",
    description: "Build and execute winning social media strategies",
    instructor: "Emily Davis",
    duration: "10 weeks",
    students: 2100,
    rating: 4.9,
    price: "₹20,999",
    level: "Intermediate",
    category: "Social Media",
    image: "📱",
    lessons: 40,
    certificate: true
  },
  {
    id: 4,
    title: "Google Ads Mastery",
    description: "Create profitable Google Ads campaigns that convert",
    instructor: "David Wilson",
    duration: "6 weeks",
    students: 670,
    rating: 4.7,
    price: "₹14,999",
    level: "Intermediate",
    category: "PPC",
    image: "💰",
    lessons: 24,
    certificate: true
  },
  {
    id: 5,
    title: "Content Marketing Strategy",
    description: "Develop content that engages and converts your audience",
    instructor: "Lisa Thompson",
    duration: "9 weeks",
    students: 1450,
    rating: 4.8,
    price: "₹18,999",
    level: "Beginner",
    category: "Content Marketing",
    image: "✍️",
    lessons: 36,
    certificate: true
  },
  {
    id: 6,
    title: "Email Marketing Automation",
    description: "Build automated email sequences that drive sales",
    instructor: "Robert Lee",
    duration: "7 weeks",
    students: 980,
    rating: 4.6,
    price: "₹12,999",
    level: "Intermediate",
    category: "Email Marketing",
    image: "📧",
    lessons: 28,
    certificate: true
  }
];

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
    const matchesLevel = levelFilter === "all" || course.level === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const categories = ["all", ...Array.from(new Set(courses.map(course => course.category)))];
  const levels = ["all", "Beginner", "Intermediate", "Advanced"];

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
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Learn from industry professionals and get hands-on experience with our 
              comprehensive digital marketing courses. Get certified and advance your career.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
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
                    <Badge variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                      {course.level}
                    </Badge>
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
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
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
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters to find more courses.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}