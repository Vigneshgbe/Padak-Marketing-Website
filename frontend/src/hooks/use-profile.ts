// src/hooks/use-profile.ts
import { useState } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { apiService } from '../lib/api'; // Import apiService directly

export const useProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateProfile = async (data: any) => {
    if (!user) return;

    setLoading(true);
    try {
      // Use apiService directly for profile update
      const updatedUser = await apiService.put('/auth/profile', data);
      updateUser(updatedUser);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file); // Correct field name
      
      // Use apiService directly for avatar upload
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload avatar');
      }

      const { profileImage } = await response.json();
      
      // Update user context with new profile image
      updateUser({ profileImage });
      
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
      
      return profileImage;
    } catch (error: any) {
      let errorMessage = "Failed to upload avatar";
      
      if (error instanceof SyntaxError) {
        errorMessage = "Invalid server response";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    updateProfile,
    uploadAvatar,
  };
};