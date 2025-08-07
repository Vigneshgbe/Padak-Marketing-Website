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
      const updatedUser = await authService.updateProfile(data);
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
      const { profileImage } = await authService.uploadAvatar(file);
      updateUser({ profileImage });
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
      return profileImage;
    } catch (error: any) {
      let errorMessage = "Failed to upload avatar";
      
      // Handle server JSON errors
      if (error instanceof SyntaxError) {
        errorMessage = "Invalid server response";
      } 
      // Handle server error messages
      else if (error.message) {
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