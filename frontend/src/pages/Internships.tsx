import React, { useState, useEffect } from "react";
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
  Building,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Helper function for date formatting - handles Firestore Timestamps and various date formats
const formatDateForDisplay = (dateValue: any): string => {
  if (!dateValue) return 'N/A';
  
  try {
    // Handle Firestore Timestamp objects (most common from backend)
    if (dateValue._seconds || dateValue.seconds) {
      const seconds = dateValue._seconds || dateValue.seconds;
      const date = new Date(seconds * 1000);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    // Handle ISO string format
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    // Fallback for custom "DD Mon YYYY" format
    const customParts = String(dateValue).match(/(\d{2}) (\w{3}) (\d{4})/);
    if (customParts) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = monthNames.findIndex(m => m === customParts[2]);
      if (monthIndex !== -1) {
        const isoDateCandidate = `${customParts[3]}-${(monthIndex + 1).toString().padStart(2, '0')}-${customParts[1]}`;
        const reParsedDate = new Date(isoDateCandidate);
        if (!isNaN(reParsedDate.getTime())) {
          return reParsedDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        }
      }
    }
    
    return String(dateValue);
  } catch (error) {
    console.error('Error formatting date:', error, dateValue);
    return 'Invalid Date';
  }
};

// Define Internship interface
interface Internship {
  id: number;
  title: string;
  company: string;
  location: string;
  duration: string;
  type: string;
  level: string;
  description: string;
  requirements: string[];
  benefits: string[];
  posted_at: any; // Can be Firestore Timestamp, ISO string, or Date object
  applications_count: number;
  spots_available: number;
}

// Define Internship Submission form data structure
interface InternshipApplicationFormData {
  full_name: string;
  email: string;
  phone: string;
  resume_url: string;
  cover_letter: string;
}

// Utility function to get authentication data from localStorage
const getAuthData = () => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  if (token && userString) {
    try {
      const user = JSON.parse(userString);
      return { token, user };
    } catch (e) {
      console.error("Error parsing user data from localStorage:", e);
      return null;
    }
  }
  return null;
};

const Internships: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [applicationFormData, setApplicationFormData] = useState<InternshipApplicationFormData>({
    full_name: '',
    email: '',
    phone: '',
    resume_url: '',
    cover_letter: ''
  });
  const [applicationStatus, setApplicationStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [applicationMessage, setApplicationMessage] = useState<string>('');

  const navigate = useNavigate();
  const authData = getAuthData();

  useEffect(() => {
    const fetchInternships = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:5000/api/internships');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }
        const data: Internship[] = await response.json();
        setInternships(data);
      } catch (err: any) {
        setError("Failed to fetch internships: " + err.message);
        console.error("Fetch internships error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, []);

  useEffect(() => {
    if (isApplyModalOpen && authData?.user) {
      setApplicationFormData(prev => ({
        ...prev,
        full_name: authData.user.name || '',
        email: authData.user.email || ''
      }));
    } else if (!isApplyModalOpen) {
      setApplicationFormData({ full_name: '', email: '', phone: '', resume_url: '', cover_letter: '' });
      setApplicationStatus('idle');
      setApplicationMessage('');
    }
  }, [isApplyModalOpen, authData]);

  const handleApplyClick = (internship: Internship) => {
    if (!authData) {
      navigate('/login');
      return;
    }
    setSelectedInternship(internship);
    setIsApplyModalOpen(true);
  };

  const handleApplicationFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApplicationFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInternship || !authData?.token) {
      setApplicationStatus('error');
      setApplicationMessage('Authentication or internship details missing.');
      return;
    }

    setApplicationStatus('submitting');
    setApplicationMessage('');

    try {
      const response = await fetch(`http://localhost:5000/api/internships/${selectedInternship.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify(applicationFormData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.statusText}`);
      }

      setApplicationStatus('success');
      setApplicationMessage(result.message || 'Application submitted successfully!');

      setInternships(prevInternships =>
        prevInternships.map(int =>
          int.id === selectedInternship.id
            ? {
                ...int,
                applications_count: int.applications_count + 1,
                spots_available: Math.max(0, int.spots_available - 1)
              }
            : int
        )
      );

    } catch (err: any) {
      setApplicationStatus('error');
      setApplicationMessage(err.message || 'An unexpected error occurred during submission.');
      console.error("Application submission error:", err);
    }
  };

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === "all" ||
                           (locationFilter === "remote" && internship.location.toLowerCase() === "remote") ||
                           (locationFilter === "onsite" && internship.location.toLowerCase() !== "remote");
    const matchesType = typeFilter === "all" || internship.type.toLowerCase() === typeFilter;
    const matchesLevel = levelFilter === "all" || internship.level.toLowerCase() === levelFilter.toLowerCase();

    return matchesSearch && matchesLocation && matchesType && matchesLevel;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

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
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </section>

      <section className="py-20 flex-grow bg-gradient-to-br from-orange-50/30 via-background to-orange-100/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading internships...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-red-600">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">Retry Loading</Button>
            </div>
          )}

          {!loading && !error && filteredInternships.length > 0 ? (
            <div className="space-y-6">
              {filteredInternships.map((internship) => (
                <Card key={internship.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-background/90 backdrop-blur-sm hover:bg-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <CardTitle className="text-xl group-hover:text-orange-600 transition-colors">
                            {internship.title}
                          </CardTitle>
                          <Badge variant={internship.type.toLowerCase() === "paid" ? "default" : "secondary"}
                                 className={internship.type.toLowerCase() === "paid" ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0" : "border-orange-200 text-orange-600 hover:bg-orange-50"}>
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
                      <Button
                        onClick={() => handleApplyClick(internship)}
                        disabled={internship.spots_available <= 0}
                        className="md:self-start bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {internship.spots_available <= 0 ? "No Spots Left" : "Apply Now"}
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
                            <span className="text-sm font-medium">{internship.applications_count}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Available Spots</span>
                          <div className="flex items-center space-x-1">
                            <Award className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">{internship.spots_available}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Posted</span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">{formatDateForDisplay(internship.posted_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-orange-400/5 rounded-full blur-xl group-hover:bg-orange-400/10 transition-all duration-300"></div>
                </Card>
              ))}
            </div>
          ) : !loading && !error && (
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

      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Apply for {selectedInternship?.title}</DialogTitle>
            <DialogDescription>
              Fill out the form below to submit your application for the internship at {selectedInternship?.company}.
            </DialogDescription>
          </DialogHeader>
          {applicationStatus === 'success' ? (
            <div className="text-center text-green-600 py-4">
              <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="font-semibold text-lg">{applicationMessage}</p>
              <DialogClose asChild>
                <Button className="mt-4 bg-green-500 hover:bg-green-600">Done</Button>
              </DialogClose>
            </div>
          ) : applicationStatus === 'error' ? (
            <div className="text-center text-red-600 py-4">
              <X className="w-12 h-12 mx-auto mb-3 text-red-500" />
              <p className="font-semibold text-lg">{applicationMessage}</p>
              <Button onClick={() => setApplicationStatus('idle')} className="mt-4">Try Again</Button>
            </div>
          ) : (
            <form onSubmit={handleApplicationSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={applicationFormData.full_name}
                  onChange={handleApplicationFormChange}
                  required
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={applicationFormData.email}
                  onChange={handleApplicationFormChange}
                  required
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={applicationFormData.phone}
                  onChange={handleApplicationFormChange}
                  className="col-span-3"
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resume_url" className="text-right">
                  Resume Link
                </Label>
                <Input
                  id="resume_url"
                  name="resume_url"
                  type="url"
                  value={applicationFormData.resume_url}
                  onChange={handleApplicationFormChange}
                  required
                  placeholder="e.g., Google Drive, Dropbox, personal site link"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cover_letter" className="text-right">
                  Cover Letter
                </Label>
                <Textarea
                  id="cover_letter"
                  name="cover_letter"
                  value={applicationFormData.cover_letter}
                  onChange={handleApplicationFormChange}
                  placeholder="Tell us why you're a good fit for this internship. (Optional)"
                  className="col-span-3"
                />
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={applicationStatus === 'submitting'}
                        className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg">
                  {applicationStatus === 'submitting' ? 'Submitting...' : 'Submit Application'}
                </Button>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Internships;