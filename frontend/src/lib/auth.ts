// src/lib/auth.ts
import { apiService } from './api';
import { User } from './types';

interface LoginResponse {
  user: User;
  token: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType: string;
  phone?: string;
  company?: string;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/login', { email, password });
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/register', data);
  }

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/auth/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiService.put<User>('/auth/profile', data);
  }

  async uploadAvatar(file: File): Promise<{ profileImage: string }> {
    return apiService.uploadFile<{ profileImage: string }>(
      '/auth/avatar', 
      file, 
      'avatar'  // Pass the correct field name
    );
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiService.post<void>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }
}

export const authService = new AuthService();