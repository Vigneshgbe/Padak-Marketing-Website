import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Briefcase, 
  Clock, 
  MapPin, 
  Calendar,
  Search,
  Filter,
  Users,
  Award,
  TrendingUp,
  Building
} from "lucide-react";

const internships = [
  {
    id: 1,
    title: "Digital Marketing Intern",
    company: "TechCorp Solutions",
    location: "Remote",
    duration: "3 months",
    type: "Paid",
    level: "Entry Level",
    description: "Join our marketing team to learn SEO, content marketing, and social media management",
    requirements: ["Basic marketing knowledge", "Social media familiarity", "English proficiency"],
    benefits: ["Mentorship program", "Certificate completion", "Potential full-time offer"],
    posted: "2 days ago",
    applications: 45,
    spots: 5
  },
  {
    id: 2,
    title: "SEO Analytics Intern",
    company: "Digital Dynamics",
    location: "New York, NY",
    duration: "4 months",
    type: "Paid",
    level: "Intermediate",
    description: "Work with our SEO team to analyze website performance and optimize content strategies",
    requirements: ["Google Analytics knowledge", "Excel skills", "SEO basics"],
    benefits: ["Hands-on experience", "Industry certifications", "Network opportunities"],
    posted: "1 week ago",
    applications: 32,
    spots: 3
  },
  {
    id: 3,
    title: "Social Media Content Intern",
    company: "Creative Agency Pro",
    location: "Remote",
    duration: "6 months",
    type: "Unpaid",
    level: "Entry Level",
    description: "Create engaging content for social media platforms and assist with campaign management",
    requirements: ["Creative mindset", "Design tools knowledge", "Social media experience"],
    benefits: ["Portfolio development", "Industry exposure", "Recommendation letter"],
    posted: "3 days ago",
    applications: 67,
    spots: 4
  },
  {
    id: 4,
    title: "PPC Campaign Intern",
    company: "AdMax Solutions",
    location: "San Francisco, CA",
    duration: "3 months",
    type: "Paid",
    level: "Intermediate",
    description: "Support PPC specialists in managing Google Ads and Facebook advertising campaigns",
    requirements: ["Google Ads basics", "Data analysis skills", "Marketing education"],
    benefits: ["Google Ads certification", "Real campaign experience", "Mentorship"],
    posted: "5 days ago",
    applications: 28,
    spots: 2
  },
  {
    id: 5,
    title: "Email Marketing Intern",
    company: "MarketFlow Inc",
    location: "Remote",
    duration: "4 months",
    type: "Paid",
    level: "Entry Level",
    description: "Assist in creating email campaigns, automation sequences, and performance analysis",
    requirements: ["Writing skills", "Attention to detail", "Basic HTML knowledge"],
    benefits: ["Email marketing certification", "Tool access", "Performance bonus"],
    posted: "1 day ago",
    applications: 23,
    spots: 3
  },
  {
    id: 6,
    title: "Content Strategy Intern",
    company: "BrandBuilder Co",
    location: "Chicago, IL",
    duration: "5 months",
    type: "Paid",
    level: "Intermediate",
    description: "Help develop content strategies and create blog posts, whitepapers, and case studies",
    requirements: ["Strong writing skills", "Research abilities", "Content marketing knowledge"],
    benefits: ["Published bylines", "Strategy experience", "Professional network"],
    posted: "4 days ago",
    applications: 41,
    spots: 2
  }
];

export default function Internships() {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === "all" || 
                           (locationFilter === "remote" && internship.location === "Remote") ||
                           (locationFilter === "onsite" && internship.location !== "Remote");
    const matchesType = typeFilter === "all" || internship.type.toLowerCase() === typeFilter;
    const matchesLevel = levelFilter === "all" || internship.level === levelFilter;
    
    return matchesSearch && matchesLocation && matchesType && matchesLevel;
  });

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Launch Your Career with{" "}
              <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                Digital Marketing Internships
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Gain real-world experience with top companies in the digital marketing industry. 
              Build your portfolio, expand your network, and kickstart your career.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search internships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Entry Level">Entry Level</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </section>

      {/* Internships Grid */}
      <section className="py-20 bg-gradient-to-br from-orange-50/30 via-background to-orange-100/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {filteredInternships.map((internship) => (
              <Card key={internship.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-background/90 backdrop-blur-sm hover:bg-white relative overflow-hidden">
                {/* Orange accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <CardTitle className="text-xl group-hover:text-orange-600 transition-colors">
                          {internship.title}
                        </CardTitle>
                        <Badge variant={internship.type === "Paid" ? "default" : "secondary"} 
                               className={internship.type === "Paid" ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0" : "border-orange-200 text-orange-600 hover:bg-orange-50"}>
                          {internship.type}
                        </Badge>
                        <Badge variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                          {internship.level}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Building className="w-4 h-4 text-orange-500" />
                          <span>{internship.company}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <span>{internship.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span>{internship.duration}</span>
                        </div>
                      </div>
                    </div>
                    <Button className="md:self-start bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      Apply Now
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <CardDescription className="text-base mb-6 leading-relaxed">
                    {internship.description}
                  </CardDescription>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-orange-600">Requirements</h4>
                      <ul className="space-y-2">
                        {internship.requirements.map((req, index) => (
                          <li key={index} className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex items-center">
                            <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full mr-3 flex-shrink-0"></div>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 text-orange-600">Benefits</h4>
                      <ul className="space-y-2">
                        {internship.benefits.map((benefit, index) => (
                          <li key={index} className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex items-center">
                            <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full mr-3 flex-shrink-0"></div>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Applications</span>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium">{internship.applications}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Available Spots</span>
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium">{internship.spots}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Posted</span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium">{internship.posted}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                {/* Subtle background pattern */}
                <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-orange-400/5 rounded-full blur-xl group-hover:bg-orange-400/10 transition-all duration-300"></div>
              </Card>
            ))}
          </div>

          {filteredInternships.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No internships found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters to find more opportunities.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}