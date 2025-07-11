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
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Launch Your Career with{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
                  className="pl-10"
                />
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
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
                <SelectTrigger>
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
                <SelectTrigger>
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
      </section>

      {/* Internships Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {filteredInternships.map((internship) => (
              <Card key={internship.id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {internship.title}
                        </CardTitle>
                        <Badge variant={internship.type === "Paid" ? "default" : "secondary"}>
                          {internship.type}
                        </Badge>
                        <Badge variant="outline">{internship.level}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Building className="w-4 h-4" />
                          <span>{internship.company}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{internship.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{internship.duration}</span>
                        </div>
                      </div>
                    </div>
                    <Button className="md:self-start">
                      Apply Now
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    {internship.description}
                  </CardDescription>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Requirements</h4>
                      <ul className="space-y-1">
                        {internship.requirements.map((req, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Benefits</h4>
                      <ul className="space-y-1">
                        {internship.benefits.map((benefit, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full mr-2"></div>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Applications</span>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{internship.applications}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Available Spots</span>
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{internship.spots}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Posted</span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{internship.posted}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInternships.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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