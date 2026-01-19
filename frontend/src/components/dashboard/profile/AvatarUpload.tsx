// src/components/dashboard/profile/AvatarUpload.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, User, Shield } from 'lucide-react';
import { useProfile } from '../../../hooks/use-profile';
import { User as UserType } from '../../../lib/types';
import { useAuth } from '../../../hooks/use-auth';

interface AvatarUploadProps {
  user: UserType;
  onSuccess?: () => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ user, onSuccess }) => {
  const { refreshUser } = useAuth();
  const { uploadAvatar, loading } = useProfile();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageKey, setImageKey] = useState(Date.now());

  useEffect(() => {
    setPreview(null);
    setImageKey(Date.now());
  }, [user]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setError(null);
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file (JPG, PNG, GIF)');
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      await uploadAvatar(file);

      // After successful upload, refresh user data
      await refreshUser();
      
      // Update image key to force reload
      setImageKey(Date.now());
      
      // Clear preview after successful upload
      setTimeout(() => {
        setPreview(null);
      }, 1000);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  // Helper function to get image URL
  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://padak-backend.onrender.com${path}`;
  };

  // Use preview if available, otherwise use user's profile image
  const imageSrc = preview || getImageUrl(user.profileImage);

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="relative inline-block">
          {imageSrc ? (
            <img 
              key={imageKey}
              src={`${imageSrc}?t=${imageKey}`}
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
              onError={(e) => {
                console.error('Failed to load image:', imageSrc);
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-avatar')?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          {/* Fallback Avatar */}
          <div className={`fallback-avatar w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-600 border-4 border-gray-300 dark:border-gray-500 flex items-center justify-center ${imageSrc ? 'hidden' : ''}`}>
            {user.accountType === 'admin' ? (
              <Shield size={48} className="text-orange-500" />
            ) : (
              <User size={48} className="text-gray-400" />
            )}
          </div>
          
          <button
            onClick={handleUploadClick}
            disabled={loading}
            className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-2 shadow-lg transition-colors disabled:opacity-50"
          >
            <Camera size={16} />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={loading}
      />

      <button
        onClick={handleUploadClick}
        disabled={loading}
        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center mx-auto"
      >
        <Upload size={18} className="mr-2" />
        {loading ? 'Uploading...' : 'Upload New Avatar'}
      </button>

      {error && (
        <div className="mt-3 text-red-500 text-sm">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        Supported formats: JPG, PNG, GIF. Max size: 5MB
      </p>
    </div>
  );
};

export default AvatarUpload;