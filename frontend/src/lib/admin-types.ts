// src/lib/admin-types.ts
export interface RecentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_type: string;
  created_at: string;
}

export interface User extends RecentUser {
  phone?: string;
  company?: string;
  website?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface RecentEnrollment {
  id: number;
  user_name: string;
  course_name: string;
  date: string;
  status: string;
}

export interface Enrollment extends RecentEnrollment {
  user_id: number;
  course_id: number;
  progress: number;
  completion_date?: string;
}

export interface ServiceRequest {
  id: number;
  name: string;
  service: string;
  date: string;
  status: string;
}

export interface DetailedServiceRequest extends ServiceRequest {
  email: string;
  phone: string;
  company?: string;
  website?: string;
  project_details: string;
  budget_range: string;
  timeline: string;
  contact_method: string;
  additional_requirements?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor_name: string;
  duration_weeks: number;
  difficulty_level: string;
  category: string;
  price: number;
  thumbnail?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Assignment {
  id: number;
  course_id: number;
  course_title: string;
  title: string;
  description?: string;
  due_date?: string;
  max_points: number;
  created_at: string;
}

export interface Certificate {
  id: number;
  user_id: number;
  user_name: string;
  course_id: number;
  course_title: string;
  certificate_url: string;
  issued_date: string;
}

export interface ContactMessage {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  created_at: string;
  status?: string;
}

export interface CalendarEvent {
  id: number;
  user_id: number;
  user_name?: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  event_type: string;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: string;
  pendingContacts: number;
  pendingServiceRequests: number;
}