// src/components/dashboard/profile/AvatarUpload.tsx
import React, { useState, useRef } from 'react';
import { Camera, Upload, User, Shield } from 'lucide-react';
import { useProfile } from '../../../hooks/use-profile';
import { User as UserType } from '../../../lib/types';

interface AvatarUploadProps {
  user: UserType;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ user }) => {
  const { uploadAvatar, loading } = useProfile();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      uploadAvatar(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const currentImage = preview || user.profileImage;

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="relative inline-block">
          {currentImage ? (
            <img 
              src={currentImage} 
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-600 border-4 border-gray-300 dark:border-gray-500 flex items-center justify-center">
              {user.accountType === 'admin' ? (
                <Shield size={48} className="text-orange-500" />
              ) : (
                <User size={48} className="text-gray-400" />
              )}
            </div>
          )}
          
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
      />

      <button
        onClick={handleUploadClick}
        disabled={loading}
        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center mx-auto"
      >
        <Upload size={18} className="mr-2" />
        {loading ? 'Uploading...' : 'Upload New Avatar'}
      </button>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        Supported formats: JPG, PNG, GIF. Max size: 5MB
      </p>
    </div>
  );
};

export default AvatarUpload;