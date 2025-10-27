// src/pages/dashboard/Internship.tsx
import React, { useState, useEffect, useCallback } from "react";
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
  Mail,
  FileText,
  AlertCircle,
  Check,
  X,
  Link as LinkIcon, // Renamed to avoid conflict if react-router-dom's Link is used
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Helper function for date formatting
const formatDateForDisplay = (dateString?: string | Date) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    const isoDateMatch = String(dateString).match(/(\d{4})-(\d{2})-(\d{2})T/);
    if (isoDateMatch) {
      const parsedDate = new Date(`${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}`);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    const customParts = String(dateString).match(/(\d{2}) (\w{3}) (\d{4})/);
    if (customParts) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = monthNames.findIndex(m => m === customParts[2]);
      if (monthIndex !== -1) {
        const isoDateCandidate = `${customParts[3]}-${(monthIndex + 1).toString().padStart(2, '0')}-${customParts[1]}`;
        const reParsedDate = new Date(isoDateCandidate);
        if (!isNaN(reParsedDate.getTime())) {
          return reParsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
    }
    return String(dateString);
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Define Internship interface matching your database schema
interface Internship {
  id: number;
  title: string;
  company: string;
  location: string;
  duration: string;
  type: string; // "Paid" or "Unpaid"
  level: string; // "Entry Level", "Intermediate", "Advanced"
  description: string;
  requirements: string[]; // Stored as JSON string in DB, parsed to array here
  benefits: string[]; // Stored as JSON string in DB, parsed to array here
  posted_at: string; // Assuming DATETIME from DB
  applications_count: number;
  spots_available: number;
}

// Interface for a user's specific internship application (from backend JOIN)
interface UserInternshipApplication {
  submission_id: number;
  submitted_at: string;
  status: string; // 'Pending', 'Reviewed', 'Accepted', 'Rejected'
  full_name: string;
  email: string;
  phone?: string;
  resume_url: string;
  cover_letter?: string;

  internship_id: number;
  title: string;
  company: string;
  location: string;
  duration: string;
  type: string;
  level: string;
  description: string;
  requirements: string[];
  benefits: string[];
  internship_posted_at: string;
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

// Function to determine badge style based on application status
const getStatusBadgeStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80";
    case 'reviewed':
      return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100/80";
    case 'accepted':
      return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80";
    case 'rejected':
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100/80";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100/80";
  }
};


export default function InternshipContent() { // This component is named InternshipContent
  const [allInternships, setAllInternships] = useState<Internship[]>([]);
  const [userApplications, setUserApplications] = useState<UserInternshipApplication[]>([]);
  const [loadingAllInternships, setLoadingAllInternships] = useState(true);
  const [loadingUserApplications, setLoadingUserApplications] = useState(true);
  const [errorAllInternships, setErrorAllInternships] = useState<string | null>(null);
  const [errorUserApplications, setErrorUserApplications] = useState<string | null>(null);

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

  // --- Fetch All Internships ---
  const fetchAllInternships = useCallback(async () => {
    setLoadingAllInternships(true);
    setErrorAllInternships(null);
    try {
      const response = await fetch(`http://localhost:5000/api/internships`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
      }
      const data: Internship[] = await response.json();
      setAllInternships(data);
    } catch (err: any) {
      setErrorAllInternships("Failed to fetch internships: " + err.message);
      console.error("Fetch all internships error:", err);
    } finally {
      setLoadingAllInternships(false);
    }
  }, []); // No dependencies, runs once on mount

  // --- Fetch User's Applications ---
  const fetchUserApplications = useCallback(async () => {
    setLoadingUserApplications(true);
    setErrorUserApplications(null);

    if (!authData || !authData.token) {
      // If not authenticated, do not attempt to fetch user-specific data
      setErrorUserApplications("You must be logged in to view your applications.");
      setLoadingUserApplications(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/user/internship-applications`, {
        headers: { 'Authorization': `Bearer ${authData.token}` }
      });

      if (!response.ok) {
        // Handle specific auth errors if needed, e.g., redirect to login
        if (response.status === 401 || response.status === 403) {
            setErrorUserApplications("Authentication failed or session expired. Please log in again.");
            // Optionally, clear local storage and redirect to login:
            // localStorage.clear();
            // navigate('/login');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
      }

      const data: UserInternshipApplication[] = await response.json();
      setUserApplications(data);
    } catch (err: any) {
      setErrorUserApplications("Failed to fetch your applications: " + err.message);
      console.error("Fetch user applications error:", err);
    } finally {
      setLoadingUserApplications(false);
    }
  }, [authData]); // Re-run if authData changes (e.g., after a login/logout)


  // Initial data fetches on component mount
  useEffect(() => {
    fetchAllInternships();
    fetchUserApplications();
  }, [fetchAllInternships, fetchUserApplications]); // Depend on memoized fetch functions

  // Pre-fill Application Form Effect
  useEffect(() => {
    if (isApplyModalOpen && authData?.user) {
      setApplicationFormData(prev => ({
        ...prev,
        full_name: authData.user.name || '',
        email: authData.user.email || ''
      }));
    } else if (!isApplyModalOpen) {
      // Reset form data and status when modal closes
      setApplicationFormData({ full_name: '', email: '', phone: '', resume_url: '', cover_letter: '' });
      setApplicationStatus('idle');
      setApplicationMessage('');
    }
  }, [isApplyModalOpen, authData]);

  // Handle Apply Button Click
  const handleApplyClick = (internship: Internship) => {
    if (!authData) {
      // If not logged in, redirect to login page
      navigate('/login');
      return;
    }
    setSelectedInternship(internship);
    setIsApplyModalOpen(true); // Open the application modal
  };

  // Handle Application Form Input Changes
  const handleApplicationFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApplicationFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Application Form Submission
  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInternship || !authData?.token) {
      setApplicationStatus('error');
      setApplicationMessage('Authentication or internship details missing.');
      return;
    }
    if (!applicationFormData.full_name || !applicationFormData.email || !applicationFormData.resume_url) {
      setApplicationStatus('error');
      setApplicationMessage('Full Name, Email, and Resume Link are required.');
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

      // Optimistically update allInternships display and refresh user applications
      setAllInternships(prevInternships =>
        prevInternships.map(int =>
          int.id === selectedInternship.id
            ? { ...int, applications_count: int.applications_count + 1, spots_available: Math.max(0, int.spots_available - 1) }
            : int
        )
      );
      fetchUserApplications(); // Re-fetch user's applications to show the new one immediately

    } catch (err: any) {
      setApplicationStatus('error');
      setApplicationMessage(err.message || 'An unexpected error occurred during submission.');
      console.error("Application submission error:", err);
    }
  };

  // Filtering Logic for All Internships
  const filteredInternships = allInternships.filter(internship => {
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

  // Function to check if a specific internship has been applied for by the user
  const isApplied = (internshipId: number) => {
    return userApplications.some(app => app.internship_id === internshipId);
  };

  return (
    // Removed min-h-screen and flex-col, removed Header/Footer
    <div className="flex-grow"> {/* This div acts as the main content area for the dashboard section */}

      <main className="container mx-auto px-4 py-8"> {/* Adjusted padding for embedding */}
        <h1 className="text-3xl lg:text-4xl font-bold mb-6">Internship Hub</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Manage your applications and discover new opportunities.
        </p>

        {/* My Applications Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">My Applications</h2>
          {loadingUserApplications && (
            <Card className="min-h-[150px] flex items-center justify-center border-0 shadow-sm bg-background/80">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
                <p className="text-muted-foreground text-sm">Loading your applications...</p>
              </div>
            </Card>
          )}

          {errorUserApplications && (
            <Card className="min-h-[150px] flex flex-col items-center justify-center border-red-200 bg-red-50/50 shadow-sm">
              <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
              <p className="text-red-600 text-center px-4 mb-3 text-sm">{errorUserApplications}</p>
              <Button onClick={fetchUserApplications} variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                Retry
              </Button>
            </Card>
          )}

          {!loadingUserApplications && !errorUserApplications && userApplications.length === 0 ? (
            <Card className="min-h-[150px] flex flex-col items-center justify-center border-0 shadow-sm bg-background/80">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">No applications found</h3>
              <p className="text-muted-foreground text-sm">You haven't applied for any internships yet.</p>
            </Card>
          ) : !loadingUserApplications && !errorUserApplications && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userApplications.map((app) => (
                <Card key={app.submission_id} className="relative hover:shadow-lg transition-shadow duration-200">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{app.title}</CardTitle>
                      <Badge className={`px-2 py-0.5 text-xs font-semibold ${getStatusBadgeStyle(app.status)}`}>
                        {app.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">at {app.company}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span>{app.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span>{app.duration}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <Badge variant={app.type.toLowerCase() === "paid" ? "default" : "secondary"}
                               className={app.type.toLowerCase() === "paid" ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0" : "border-orange-200 text-orange-600 hover:bg-orange-50"}>
                          {app.type}
                        </Badge>
                        <Badge variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                          {app.level}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-2">{app.description.substring(0, 100)}{app.description.length > 100 ? '...' : ''}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3"/> Applied: {formatDateForDisplay(app.submitted_at)}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                            <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-orange-500 hover:text-orange-600">
                                <LinkIcon className="w-4 h-4 mr-1" /> Resume
                            </a>
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Browse All Internships Section */}
        <section className="py-8"> {/* Adjusted padding for embedding */}
          <h2 className="text-2xl font-bold mb-4">Browse All Internships</h2>

          {/* Search and Filters */}
          <div className="max-w-4xl mb-8">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
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
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
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
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
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

          {loadingAllInternships && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading available internships...</p>
            </div>
          )}

          {errorAllInternships && (
            <div className="text-center py-12 text-red-600">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>{errorAllInternships}</p>
              <Button onClick={fetchAllInternships} className="mt-4">Retry Loading</Button>
            </div>
          )}

          {!loadingAllInternships && !errorAllInternships && filteredInternships.length > 0 ? (
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
                        disabled={internship.spots_available <= 0 || isApplied(internship.id)}
                        className="md:self-start bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isApplied(internship.id) ? "Applied" :
                         internship.spots_available <= 0 ? "No Spots Left" : "Apply Now"}
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

                  {/* Subtle background pattern */}
                  <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-orange-400/5 rounded-full blur-xl group-hover:bg-orange-400/10 transition-all duration-300"></div>
                </Card>
              ))}
            </div>
          ) : !loadingAllInternships && !errorAllInternships && (
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
        </section>
      </main>

      {/* Internship Application Modal */}
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