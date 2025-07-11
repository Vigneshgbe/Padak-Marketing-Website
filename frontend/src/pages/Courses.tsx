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
    price: "$299",
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
    price: "$199",
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
    price: "$249",
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
    price: "$179",
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
    price: "$229",
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
    price: "$159",
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
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Master Digital Marketing with{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
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
                <SelectTrigger className="w-full md:w-48">
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
      </section>

      {/* Courses Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{course.image}</div>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>By {course.instructor}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
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
                    <div className="text-2xl font-bold text-primary">{course.price}</div>
                    <Button className="group">
                      <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Enroll Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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