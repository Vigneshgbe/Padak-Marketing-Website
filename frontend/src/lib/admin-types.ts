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

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrollmentDate: string;
  status: 'active' | 'completed' | 'dropped';
  progress: number;
  completionDate?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    title: string;
    instructorName: string;
  };
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
  id: string;
  title: string;
  description: string;
  instructorName: string;
  category: string;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  duration: string;
  thumbnail?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  isPublished?: boolean;
  totalEnrollments?: number;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  createdAt: string;
  course?: {
    title: string;
  };
}

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  submissionText: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'pending';
  assignment?: {
    title: string;
    maxPoints: number;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration: string;
  order: number;
  createdAt: string;
  course?: {
    title: string;
  };
}

export interface Forum {
  id: string;
  courseId: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  repliesCount: number;
  user?: {
    firstName: string;
    lastName: string;
  };
  course?: {
    title: string;
  };
}

export interface Analytics {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  recentEnrollments: Enrollment[];
  popularCourses: Course[];
}

export interface Stats {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
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

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateUrl: string | null;
  issuedDate: string;
  course: {
    id: string;
    title: string;
    instructorName: string;
    category: string;
    difficultyLevel: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  enrollment: {
    completionDate: string | null;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: 'student' | 'admin';
  createdAt: string;
  lastLogin?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  bio?: string;
  profilePicture?: string;
}