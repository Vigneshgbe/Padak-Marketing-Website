// src/lib/types.ts
export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    accountType: 'student' | 'professional' | 'business' | 'agency' | 'admin';
    profileImage?: string;
    phone?: string;
    company?: string;
    website?: string;
    bio?: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface UserStats {
    coursesEnrolled: number;
    coursesCompleted: number;
    certificatesEarned: number;
    learningStreak: number;
    lastActivity: string;
  }
  
  export interface Course {
    id: number;
    title: string;
    description: string;
    instructorName: string;
    durationWeeks: number;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    price: number;
    thumbnail?: string;
    isActive: boolean;
  }
  
  export interface Enrollment {
    id: number;
    userId: number;
    courseId: number;
    progress: number;
    enrollmentDate: string;
    completionDate?: string;
    status: 'active' | 'completed' | 'dropped';
    course: Course;
  }
  
  export interface Assignment {
    id: number;
    courseId: number;
    title: string;
    description: string;
    dueDate: string;
    maxPoints: number;
    course: Course;
    submission?: AssignmentSubmission;
  }
  
  export interface AssignmentSubmission {
    id: number;
    assignmentId: number;
    userId: number;
    content: string;
    filePath?: string;
    submittedAt: string;
    grade?: number;
    feedback?: string;
    status: 'submitted' | 'graded' | 'returned';
  }
  
  export interface ServiceCategory {
    id: number;
    name: string;
    description: string;
    icon: string;
    subcategories: ServiceSubcategory[];
  }
  
  export interface ServiceSubcategory {
    id: number;
    categoryId: number;
    name: string;
    description: string;
    basePrice: number;
  }
  
  export interface ServiceRequest {
    id: number;
    userId: number;
    subcategoryId: number;
    fullName: string;
    email: string;
    phone: string;
    company?: string;
    website?: string;
    projectDetails: string;
    budgetRange: string;
    timeline: string;
    contactMethod: 'email' | 'phone' | 'whatsapp';
    additionalRequirements?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
  }
  
  export interface DashboardStats {
    totalUsers?: number;
    totalCourses?: number;
    totalEnrollments?: number;
    totalRevenue?: string;
    activeInternships?: number;
    pendingContacts?: number;
  }