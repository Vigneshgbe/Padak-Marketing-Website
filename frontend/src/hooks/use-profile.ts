// src/hooks/use-profile.ts
import { useState, useContext } from 'react';
import { User } from '../lib/types';
import { AuthContext } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

export const useProfile = () => {
  const { token, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);  // Changed from 'file' to 'avatar'
      
      const response = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      
      // Update user context with new profile image
      if (token) {
        const decoded: any = jwtDecode(token);
        setUser({
          ...decoded,
          profileImage: data.profileImage
        });
      }

      return data.profileImage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      
      // Update user context
      if (token) {
        const decoded: any = jwtDecode(token);
        setUser({
          ...decoded,
          ...updatedUser
        });
      }

      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { uploadAvatar, updateProfile, loading, error };
};