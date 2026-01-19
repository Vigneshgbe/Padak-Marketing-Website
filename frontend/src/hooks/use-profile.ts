// src/hooks/use-profile.ts
import { useState } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export const useProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateProfile = async (data: any) => {
    if (!user) return;
    setLoading(true);
    
    try {
      const response = await fetch('https://padak-backend.onrender.com/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();
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
      formData.append('avatar', file);
      
      const response = await fetch(
        `https://padak-backend.onrender.com/api/auth/avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formData
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload avatar');
      }
  
      // Get the JSON response with user data
      const data = await response.json();
      
      // Update user context with new profile image path
      updateUser({ 
        profileImage: data.profile_image,
        ...data.user 
      });
      
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      });
      
      return data.profile_image;
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
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