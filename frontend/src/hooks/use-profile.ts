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
      const response = await fetch('/api/auth/profile', {
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
       // `http://localhost:5000/api/auth/avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formData
        }
      );
  
      if (!response.ok) {
        // Handle text response for errors
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload avatar');
      }
  
      // Handle text response for success
      const profileImage = await response.text();
      
      // Update user context with new absolute URL
      updateUser({ profileImage });
      
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
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