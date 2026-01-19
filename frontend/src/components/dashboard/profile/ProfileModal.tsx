// src/components/dashboard/profile/ProfileModal.tsx
import React, { useState } from 'react';
import { X, Camera, User } from 'lucide-react';
import { useProfile } from '../../../hooks/use-profile';
import AvatarUpload from './AvatarUpload';
import ProfileForm from './ProfileForm';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, loading, updateProfile } = useProfile();
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar'>('profile');

  if (!isOpen || !user) return null;

  const handleAvatarSuccess = () => {
    // Optionally close modal or show success message
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold">Profile Settings</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'profile'
                ? 'border-b-2 border-orange-500 text-orange-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <User size={18} className="inline mr-2" />
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'avatar'
                ? 'border-b-2 border-orange-500 text-orange-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Camera size={18} className="inline mr-2" />
            Avatar
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'profile' ? (
            <ProfileForm user={user} onSubmit={updateProfile} loading={loading} />
          ) : (
            <AvatarUpload user={user} onSuccess={handleAvatarSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;