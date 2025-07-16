// src/lib/constants.ts
export const API_ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
      PROFILE: '/auth/profile',
      AVATAR: '/auth/avatar',
      CHANGE_PASSWORD: '/auth/change-password',
    },
    COURSES: {
      LIST: '/courses',
      ENROLL: '/courses/enroll',
      MY_COURSES: '/enrollments/my-courses',
    },
    ASSIGNMENTS: {
      MY_ASSIGNMENTS: '/assignments/my-assignments',
      SUBMIT: '/assignments/submit',
    },
    SERVICES: {
      CATEGORIES: '/services/categories',
      REQUESTS: '/services/requests',
    },
    ADMIN: {
      USERS: '/admin/users',
      COURSES: '/admin/courses',
      ANALYTICS: '/admin/analytics',
    },
  };
  
  export const USER_TYPES = {
    STUDENT: 'student',
    PROFESSIONAL: 'professional',
    BUSINESS: 'business',
    AGENCY: 'agency',
    ADMIN: 'admin',
  } as const;
  
  export const ASSIGNMENT_STATUS = {
    SUBMITTED: 'submitted',
    GRADED: 'graded',
    RETURNED: 'returned',
  } as const;
  
  export const SERVICE_REQUEST_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  } as const;