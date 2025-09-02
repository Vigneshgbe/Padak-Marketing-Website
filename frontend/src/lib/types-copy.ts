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

// Course interface matching your database
export interface Course {
  id: number;
  title: string;
  description?: string;
  instructor_name?: string;
  duration_weeks?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  price?: number;
  thumbnail?: string;
  is_active: boolean;
  created_at: string;
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
  certificate_url?: string;
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