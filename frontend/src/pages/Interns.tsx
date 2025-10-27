import React, { useState, useEffect, useCallback } from "react";
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
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../hooks/use-auth";

// Helper function for date formatting - handles Firestore Timestamps
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

const Interns: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

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
  const { user, token, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchInternships = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://padak-backend.onrender.com/api/internships`);
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
    if (isApplyModalOpen) {
      if (user) {
        setApplicationFormData(prev => ({
          ...prev,
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email || ''
        }));
      }
    } else {
      setApplicationFormData({ full_name: '', email: '', phone: '', resume_url: '', cover_letter: '' });
      setApplicationStatus('idle');
      setApplicationMessage('');
    }
  }, [isApplyModalOpen, user]);

  const handleApplyClick = useCallback((internship: Internship) => {
    setSelectedInternship(internship);
    setIsApplyModalOpen(true);
    console.log("handleApplyClick: Opening application modal for internship ID:", internship.id);
  }, []);

  const handleApplicationFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApplicationFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInternship || !isAuthenticated || !user || !user.id || !token) {
      setApplicationStatus('error');
      setApplicationMessage('You must be logged in to submit an application. Please log in first.');
      console.error("handleApplicationSubmit: Submission failed: User not fully authenticated or user ID/token missing.", { selectedInternship, isAuthenticated, user, token });
      return;
    }

    setApplicationStatus('submitting');
    setApplicationMessage('');

    try {
      const submissionPayload = {
        internship_id: selectedInternship.id,
        user_id: user.id,
        full_name: applicationFormData.full_name,
        email: applicationFormData.email,
        phone: applicationFormData.phone,
        resume_url: applicationFormData.resume_url,
        cover_letter: applicationFormData.cover_letter
      };

      console.log("handleApplicationSubmit: Submitting application with payload:", submissionPayload);

      const response = await fetch(`https://padak-backend.onrender.com/api/internships/${selectedInternship.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("handleApplicationSubmit: Server responded with an error:", result);
        throw new Error(result.message || `Server error: ${response.status} - ${response.statusText}`);
      }

      setApplicationStatus('success');
      setApplicationMessage(result.message || 'Application submitted successfully!');
      console.log("handleApplicationSubmit: Application submitted successfully:", result);

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
      setApplicationMessage(err.message || 'An unexpected error occurred during submission. Check console for details.');
      console.error("handleApplicationSubmit: Application submission caught an error:", err);
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

  const totalPages = Math.ceil(filteredInternships.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInternships = filteredInternships.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationFilter, typeFilter, levelFilter]);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderPaginationButtons = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - Math.floor(maxPagesToShow / 2);
        endPage = currentPage + Math.floor(maxPagesToShow / 2);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          onClick={() => paginate(i)}
          variant={currentPage === i ? "default" : "outline"}
          className={currentPage === i ? "bg-orange-500 hover:bg-orange-600 text-white" : "border-orange-200 text-orange-600 hover:bg-orange-50"}
        >
          {i}
        </Button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <section className="py-20 flex-grow bg-gradient-to-br from-orange-50/30 via-background to-orange-100/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading internships...</p>
            </div>
          )}

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

          {error && (
            <div className="text-center py-12 text-red-600">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">Retry Loading</Button>
            </div>
          )}

          {!loading && !error && (
            <>
              {currentInternships.length > 0 ? (
                <div className="space-y-6">
                  {currentInternships.map((internship) => (
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

                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <Button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                      </Button>
                      {renderPaginationButtons()}
                      <Button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
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
            </>
          )}
        </div>
      </section>

      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Apply for {selectedInternship?.title}</DialogTitle>
            <DialogDescription>
              {isAuthenticated
                ? `Fill out the form below to submit your application for the internship at ${selectedInternship?.company}.`
                : "You need to be logged in to apply for an internship."
              }
            </DialogDescription>
          </DialogHeader>

          {!isAuthenticated ? (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
              <p className="text-lg font-semibold mb-4">Please log in to submit your application.</p>
              <Button onClick={() => {
                setIsApplyModalOpen(false);
                navigate('/login');
              }} className="bg-orange-500 hover:bg-orange-600 text-white">
                Go to Login
              </Button>
              <DialogClose asChild>
                <Button variant="outline" className="ml-2">Cancel</Button>
              </DialogClose>
            </div>
          ) : applicationStatus === 'success' ? (
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
                <Label htmlFor="full_name" className="text-right">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={applicationFormData.full_name}
                  onChange={handleApplicationFormChange}
                  required
                  className="col-span-3"
                  disabled={applicationStatus === 'submitting'}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={applicationFormData.email}
                  onChange={handleApplicationFormChange}
                  required
                  className="col-span-3"
                  disabled={applicationStatus === 'submitting'}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={applicationFormData.phone}
                  onChange={handleApplicationFormChange}
                  className="col-span-3"
                  placeholder="Optional"
                  disabled={applicationStatus === 'submitting'}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resume_url" className="text-right">Resume Link</Label>
                <Input
                  id="resume_url"
                  name="resume_url"
                  type="url"
                  value={applicationFormData.resume_url}
                  onChange={handleApplicationFormChange}
                  required
                  placeholder="e.g., Google Drive, Dropbox, personal site link"
                  className="col-span-3"
                  disabled={applicationStatus === 'submitting'}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cover_letter" className="text-right">Cover Letter</Label>
                <Textarea
                  id="cover_letter"
                  name="cover_letter"
                  value={applicationFormData.cover_letter}
                  onChange={handleApplicationFormChange}
                  placeholder="Tell us why you're a good fit for this internship. (Optional)"
                  className="col-span-3"
                  disabled={applicationStatus === 'submitting'}
                />
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={applicationStatus === 'submitting'}
                        className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg">
                  {applicationStatus === 'submitting' ? 'Submitting...' : 'Submit Application'}
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" disabled={applicationStatus === 'submitting'}>Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Interns;