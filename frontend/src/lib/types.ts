// src/lib/types.ts
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  account_type: 'student' | 'professional' | 'business' | 'agency' | 'admin';
  profile_image?: string;
  company?: string;
  website?: string;
  bio?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  last_login?: string;
  updated_at: string;
}

// Assignment interface matching your database
export interface Assignment {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  due_date: string;
  max_points: number;
  created_at: string;
  course?: Course;
  submission?: AssignmentSubmission;
}

// Assignment submission interface matching your database
export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  content?: string;
  file_path?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
  assignment?: Assignment;
  user?: User;
}

// Enrollment interface matching your database
export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  progress: number;
  enrollment_date: string;
  completion_date?: string;
  status: 'active' | 'completed' | 'dropped';
  user?: User;
  course?: Course;
}

// Certificate interface matching your database
export interface Certificate {
  id: number;
  user_id: number;
  course_id: number;
  issued_date: string;
  user?: User;
  course?: Course;
}

// Service category interface matching your database
export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  subcategories?: ServiceSubcategory[];
}

// Service subcategory interface matching your database
export interface ServiceSubcategory {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  base_price?: number;
  is_active: boolean;
  created_at: string;
  category?: ServiceCategory;
}

// Service request interface matching your database
export interface ServiceRequest {
  id: number;
  user_id: number;
  subcategory_id: number;
  full_name: string;
  email: string;
  phone: string;
  company?: string;
  website?: string;
  project_details: string;
  budget_range: string;
  timeline: string;
  contact_method: 'email' | 'phone' | 'whatsapp';
  additional_requirements?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  user?: User;
  subcategory?: ServiceSubcategory;
}

// User stats interface matching your database
export interface UserStats {
  id: number;
  user_id: number;
  courses_enrolled: number;
  courses_completed: number;
  certificates_earned: number;
  learning_streak: number;
  last_activity: string;
  user?: User;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard specific types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  completedCourses: number;
  pendingAssignments: number;
  serviceRequests: number;
}

export interface UserDashboardData {
  user: User;
  stats: UserStats;
  enrollments: Enrollment[];
  assignments: Assignment[];
  certificates: Certificate[];
  serviceRequests: ServiceRequest[];
}

// Form types for frontend use
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  account_type: User['account_type'];
  phone?: string;
  company?: string;
  website?: string;
}

export interface AssignmentSubmissionForm {
  assignment_id: number;
  content?: string;
  file?: File;
}

export interface ServiceRequestForm {
  subcategory_id: number;
  full_name: string;
  email: string;
  phone: string;
  company?: string;
  website?: string;
  project_details: string;
  budget_range: string;
  timeline: string;
  contact_method: 'email' | 'phone' | 'whatsapp';
  additional_requirements?: string;
}

// Extended Certificate interface for admin use
export interface AdminCertificate extends Certificate {
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Certificate response for API
export interface CertificateResponse {
  message: string;
  data?: any;
  downloadUrl?: string;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

// Common error type
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// For user stats
export interface UserStats {
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  learningStreak: number;
  lastActivity: string; // ISO date string
  // Original schema doesn't have assignments_submitted, average_grade
}

// For Admin Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: string; // Changed to string as it's formatted in frontend
  pendingContacts: number; // Based on contact_messages without 'status' field, using date logic
  pendingServiceRequests: number;
}

// For RecentUser
export interface RecentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_type: string;
  join_date: string;
}

// For All Users Management
export interface DetailedUser extends Omit<RecentUser, 'join_date'> {
  phone?: string;
  password_hash?: string; // Only for admin internal, not sent to frontend usually
  password?: string; // For form input
  company?: string;
  website?: string;
  bio?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string; // For detail view, full date
  updated_at?: string;
}

// For RecentEnrollment
export interface RecentEnrollment {
  id: number;
  user_name: string;
  course_name: string;
  date: string;
  status: 'active' | 'completed' | 'cancelled';
}

// For Detailed Enrollment Management
export interface DetailedEnrollment extends RecentEnrollment {
  user_id: number;
  course_id: number;
  progress: number;
  completion_date?: string; // YYYY-MM-DD
}

// For Service Request (Recent)
export interface RecentServiceRequest {
  id: number;
  name: string; // full_name
  service: string; // Alias from service_sub_category.name
  date: string;
  status: 'pending' | 'in-process' | 'completed' | 'cancelled';
}

// For Detailed Service Request Management
export interface DetailedServiceRequest extends RecentServiceRequest {
  email: string;
  phone: string;
  company?: string;
  website?: string;
  project_details: string;
  budget_range: string;
  timeline: string;
  contact_method: 'email' | 'phone' | 'whatsapp';
  additional_requirements?: string;
  user_id: number; // NOT NULL in schema
  subcategory_id: number;
  service_name: string; // Alias from service_sub_category.name for detail view
}

// For Assignment Management
export interface Assignment {
  id: number;
  course_id: number;
  course_title: string; // Alias from courses.title
  title: string;
  description?: string;
  due_date: string; // YYYY-MM-DD
  max_points: number;
  created_at: string;
}

// For Certificate Management
export interface Certificate {
  id: number;
  user_id: number;
  user_name: string; // Alias from users.first_name/last_name
  course_id: number;
  course_title: string; // Alias from courses.title
  certificate_url: string;
  issued_date: string; // YYYY-MM-DD
}

// For Contact Message Management (Strictly from original schema - no 'status' column)
export interface ContactMessage {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  created_at: string;
  status?: 'pending' | 'resolved' | 'contacted' | 'closed'; // Conceptual status for frontend display
}

// For Calendar Event Management
export interface CalendarEvent {
  id: number;
  user_id: number;
  user_name?: string; // Alias from users.first_name/last_name
  title: string;
  description?: string;
  event_date: string; // YYYY-MM-DD
  event_time?: string; // HH:MM
  event_type: string;
  created_at: string;
}

// For Service Category Management
export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// For Service Sub Category Management
export interface ServiceSubCategory {
  id: number;
  category_id: number;
  category_name: string; // Alias from service_category.name
  name: string;
  description?: string;
  base_price?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// For Service Offerings Management (Original 'service' table)
export interface ServiceOffering { // Renamed to avoid conflict with `ServiceRequest`
  id: number;
  name: string;
  category_id: number;
  category_name: string; // Alias from service_category.name
  description?: string;
  price: number;
  duration?: string;
  rating?: number;
  reviews?: number;
  features?: string; // Assuming JSON string or similar
  popular?: boolean; // tinyint(1)
  created_at: string;
  updated_at?: string;
}


// Lookup types for dropdowns
export interface UserLookup {
  id: number;
  first_name: string;
  last_name: string;
}

export interface CourseLookup {
  id: number;
  title: string;
}

export interface ServiceCategoryLookup {
  id: number;
  name: string;
}

export interface ServiceSubCategoryLookup {
  id: number;
  name: string;
  category_id: number;
}

// Internships (from original DB schema)
export interface Internship {
  id: number;
  title: string;
  company: string;
  location: string;
  duration: string;
  type: string;
  level: string;
  description: string;
  requirements: string;
  benefits: string;
  posted_at: string;
  applications_count: number;
  spots_available: number;
  // is_active is NOT in original schema
}

// src/lib/types.ts

// For general dashboard user object (from useAuth)
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  accountType: 'student' | 'professional' | 'business' | 'agency' | 'admin'; // 'admin' is a conceptual addition, needs DB schema update
  profileImage?: string;
}

// For user stats (only columns in your schema)
export interface UserStats {
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  learningStreak: number;
  lastActivity: string; // ISO date string
}

// For Admin Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: string; // Changed to string as it's formatted in frontend
  pendingContacts: number; // Based on contact_messages without 'status' field, using date logic
  pendingServiceRequests: number;
}

// For RecentUser
export interface RecentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_type: string;
  join_date: string;
}

// For All Users Management
export interface DetailedUser extends Omit<RecentUser, 'join_date'> {
  phone?: string;
  password_hash?: string; // Only for admin internal, not sent to frontend usually
  password?: string; // For form input
  company?: string;
  website?: string;
  bio?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string; // For detail view, full date
  updated_at?: string;
}

// For RecentEnrollment
export interface RecentEnrollment {
  id: number;
  user_name: string;
  course_name: string;
  date: string;
  status: 'active' | 'completed' | 'cancelled';
}

// For Detailed Enrollment Management
export interface DetailedEnrollment extends RecentEnrollment {
  user_id: number;
  course_id: number;
  progress: number;
  completion_date?: string; // YYYY-MM-DD
}

// For Recent Service Request (from server.js /api/admin/recent-service-requests)
export interface RecentServiceRequest {
  id: number;
  name: string; // full_name
  service: string; // Alias from service_sub_category.name
  date: string;
  status: 'pending' | 'in-process' | 'completed' | 'cancelled';
}

// For Detailed Service Request Management (from server.js /api/admin/service-requests/:id)
export interface DetailedServiceRequest extends RecentServiceRequest {
  email: string;
  phone: string;
  company?: string;
  website?: string;
  project_details: string;
  budget_range: string;
  timeline: string;
  contact_method: 'email' | 'phone' | 'whatsapp';
  additional_requirements?: string;
  user_id: number; // NOT NULL in schema
  subcategory_id: number;
  service_name: string; // Alias from service_sub_category.name for detail view
}


// For Course Management (Strictly from original schema)
export interface Course {
  id: number;
  title: string;
  description: string;
  image_url?: string; // Explicitly in your schema
  duration: number; // Original schema has INT duration
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  price: number;
  thumbnail_url?: string;
  is_active: boolean;
  created_at: string; // Full date format in detail
  updated_at?: string;
}

// For Assignment Management
export interface Assignment {
  id: number;
  course_id: number;
  course_title: string; // Alias from courses.title
  title: string;
  description?: string;
  due_date: string; // YYYY-MM-DD
  max_points: number;
  created_at: string;
}

// For Certificate Management
export interface Certificate {
  id: number;
  user_id: number;
  user_name: string; // Alias from users.first_name/last_name
  course_id: number;
  course_title: string; // Alias from courses.title
  certificate_url: string;
  issued_date: string; // YYYY-MM-DD
}

// For Contact Message Management (Strictly from original schema - no 'status' column)
export interface ContactMessage {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  created_at: string;
  status?: 'pending' | 'resolved' | 'contacted' | 'closed'; // Conceptual status for frontend display
}

// For Calendar Event Management
export interface CalendarEvent {
  id: number;
  user_id: number;
  user_name?: string; // Alias from users.first_name/last_name
  title: string;
  description?: string;
  event_date: string; // YYYY-MM-DD
  event_time?: string; // HH:MM
  event_type: string;
  created_at: string;
}

// For Service Category Management
export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// For Service Sub Category Management
export interface ServiceSubCategory {
  id: number;
  category_id: number;
  category_name: string; // Alias from service_category.name
  name: string;
  description?: string;
  base_price?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// For Service Offerings Management (Original 'service' table)
export interface ServiceOffering { // Renamed to avoid conflict with `ServiceRequest`
  id: number;
  name: string;
  category_id: number;
  category_name: string; // Alias from service_category.name
  description?: string;
  price: number;
  duration?: string;
  rating?: number;
  reviews?: number;
  features?: string; // Assuming LONGTEXT is string, frontend can parse if JSON
  popular?: boolean; // tinyint(1)
  created_at: string;
  updated_at?: string;
}


// Lookup types for dropdowns
export interface UserLookup {
  id: number;
  first_name: string;
  last_name: string;
}

export interface CourseLookup {
  id: number;
  title: string;
}

export interface ServiceCategoryLookup {
  id: number;
  name: string;
}

export interface ServiceSubCategoryLookup {
  id: number;
  name: string;
  category_id: number;
}

// Internships (from original DB schema)
export interface Internship {
  id: number;
  title: string;
  company: string;
  location: string;
  duration: string;
  type: string;
  level: string;
  description: string;
  requirements: string; // LONGTEXT in DB
  benefits: string; // LONGTEXT in DB
  posted_at: string;
  applications_count: number;
  spots_available: number;
  // is_active is NOT in original schema for internships
}