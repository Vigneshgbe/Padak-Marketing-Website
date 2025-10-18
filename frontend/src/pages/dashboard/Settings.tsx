import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, Palette, Globe, Save, Eye, EyeOff, 
  CheckCircle, Lock, Smartphone, Monitor, Moon, Sun, 
  Languages, Clock, Calendar, AlertTriangle, LogOut,
  ChevronRight, Info, Mail, MessageSquare, Laptop
} from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';

interface NotificationSettings {
  emailNotifications: boolean;
  assignmentReminders: boolean;
  courseUpdates: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  reduceAnimations: boolean;
  highContrast: boolean;
}

interface LanguageSettings {
  language: string;
  timeZone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

interface SettingsProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ darkMode: propDarkMode, onToggleDarkMode }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Initialize settings with default values
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    assignmentReminders: true,
    courseUpdates: false,
    marketingEmails: false,
    securityAlerts: true
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    fontSize: 'medium',
    reduceAnimations: false,
    highContrast: false
  });

  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>({
    language: 'en',
    timeZone: 'IST',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h'
  });

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedNotifications = localStorage.getItem('notificationSettings');
        const savedSecurity = localStorage.getItem('securitySettings');
        const savedAppearance = localStorage.getItem('appearanceSettings');
        const savedLanguage = localStorage.getItem('languageSettings');

        if (savedNotifications) {
          setNotificationSettings(JSON.parse(savedNotifications));
        }
        if (savedSecurity) {
          const parsed = JSON.parse(savedSecurity);
          setSecuritySettings({
            ...parsed,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
        if (savedAppearance) {
          const appearance = JSON.parse(savedAppearance);
          setAppearanceSettings(appearance);
          applyFontSize(appearance.fontSize);
        } else {
          // Set initial theme based on prop
          setAppearanceSettings(prev => ({
            ...prev,
            theme: propDarkMode ? 'dark' : 'light'
          }));
        }
        if (savedLanguage) {
          setLanguageSettings(JSON.parse(savedLanguage));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Sync appearance settings when darkMode prop changes
  useEffect(() => {
    if (propDarkMode !== undefined) {
      setAppearanceSettings(prev => ({
        ...prev,
        theme: propDarkMode ? 'dark' : 'light'
      }));
    }
  }, [propDarkMode]);

  // Calculate password strength
  useEffect(() => {
    const password = securitySettings.newPassword;
    let strength = 0;
    
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    setPasswordStrength(strength);
  }, [securitySettings.newPassword]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'language', label: 'Language', icon: <Globe size={18} /> },
  ];

  const notificationOptions = [
    {
      key: 'emailNotifications',
      icon: <Mail className="w-5 h-5" />,
      title: 'Email Notifications',
      description: 'Receive important updates and announcements via email'
    },
    {
      key: 'assignmentReminders',
      icon: <Calendar className="w-5 h-5" />,
      title: 'Assignment Reminders',
      description: 'Get notified 24 hours before assignment deadlines'
    },
    {
      key: 'courseUpdates',
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'Course Updates',
      description: 'Stay informed about new content and course announcements'
    },
    {
      key: 'marketingEmails',
      icon: <Info className="w-5 h-5" />,
      title: 'Marketing & Promotions',
      description: 'Receive special offers, tips, and product updates'
    },
    {
      key: 'securityAlerts',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: 'Security Alerts',
      description: 'Important notifications about your account security'
    }
  ];

  // Apply font size to document
  const applyFontSize = (size: string) => {
    const root = document.documentElement;
    root.classList.remove('font-small', 'font-medium', 'font-large');
    
    switch(size) {
      case 'small':
        root.classList.add('font-small');
        root.style.fontSize = '14px';
        break;
      case 'large':
        root.classList.add('font-large');
        root.style.fontSize = '18px';
        break;
      default:
        root.classList.add('font-medium');
        root.style.fontSize = '16px';
    }
  };

  // ✅ FIX 1: Format the member since date from Firestore timestamp
  const formatMemberSince = (dateValue: any) => {
    if (!dateValue) {
      console.log('No date value provided');
      return 'Unknown';
    }
    
    try {
      let date: Date;
      
      // Handle Firestore Timestamp object
      if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
        date = dateValue.toDate();
      }
      // Handle ISO string
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }
      // Handle Date object
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // Handle timestamp number
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      else {
        console.log('Unknown date format:', dateValue);
        return 'Unknown';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', dateValue);
        return 'Unknown';
      }
      
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting member since date:', error, dateValue);
      return 'Unknown';
    }
  };

  // ✅ FIX 2: Format date for display
  const formatDate = (dateValue: any) => {
    if (!dateValue) {
      return 'Not provided';
    }
    
    try {
      let date: Date;
      
      // Handle Firestore Timestamp object
      if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
        date = dateValue.toDate();
      }
      // Handle ISO string
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }
      // Handle Date object
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // Handle timestamp number
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      else {
        return 'Not provided';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Not provided';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Not provided';
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      localStorage.setItem('securitySettings', JSON.stringify({
        twoFactorEnabled: securitySettings.twoFactorEnabled
      }));
      localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
      localStorage.setItem('languageSettings', JSON.stringify(languageSettings));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSecurityChange = (key: keyof SecuritySettings, value: string | boolean) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ✅ FIX 3: Dark mode toggle with proper theme handling
  const handleAppearanceChange = (key: keyof AppearanceSettings, value: string | boolean) => {
    console.log('Appearance change:', key, value);
    
    if (key === 'theme' && typeof value === 'string') {
      const themeValue = value as 'light' | 'dark' | 'system';
      
      // Update local state
      setAppearanceSettings(prev => ({
        ...prev,
        theme: themeValue
      }));

      // Call parent toggle function if provided
      if (onToggleDarkMode) {
        if (themeValue === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark !== propDarkMode) {
            onToggleDarkMode();
          }
        } else if (themeValue === 'dark' && !propDarkMode) {
          onToggleDarkMode();
        } else if (themeValue === 'light' && propDarkMode) {
          onToggleDarkMode();
        }
      }
    } else if (key === 'fontSize' && typeof value === 'string') {
      applyFontSize(value);
      setAppearanceSettings(prev => ({
        ...prev,
        fontSize: value as 'small' | 'medium' | 'large'
      }));
    } else {
      setAppearanceSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const handleLanguageChange = (key: keyof LanguageSettings, value: string) => {
    setLanguageSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    
    if (securitySettings.newPassword.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }
    
    alert("Password updated successfully!");
    
    setSecuritySettings(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  // ✅ FIX 4: Determine current theme correctly
  const getCurrentTheme = () => {
    if (appearanceSettings.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return appearanceSettings.theme;
  };

  // ✅ FIX 5: Check if theme button should be active
  const isThemeActive = (themeValue: string) => {
    return appearanceSettings.theme === themeValue;
  };

  // Debug logging
  useEffect(() => {
    console.log('User data:', user);
    console.log('Created at:', user?.createdAt);
    console.log('Formatted:', formatMemberSince(user?.createdAt));
  }, [user]);

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-orange-100">
          Customize your experience and manage your account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Sidebar Navigation */}
        <div className="xl:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 sticky top-24">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`mr-3 transition-transform duration-200 ${
                    activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    {tab.icon}
                  </span>
                  <span className="font-medium">{tab.label}</span>
                  {activeTab === tab.id && (
                    <ChevronRight className="ml-auto" size={18} />
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 p-2">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-400 disabled:to-orange-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:scale-100"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save All Changes
                  </>
                )}
              </button>
              
              {saveSuccess && (
                <div className="mt-3 flex items-center justify-center text-green-600 dark:text-green-400 animate-fade-in">
                  <CheckCircle size={16} className="mr-1" />
                  <span className="text-sm font-medium">Saved successfully!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="xl:col-span-9">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-white">
                  <User className="mr-3 text-orange-500" />
                  Profile Information
                </h2>
                
                {/* Profile Card */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 mb-8">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                        {(user?.firstName?.charAt(0) || 'U').toUpperCase()}{(user?.lastName?.charAt(0) || 'U').toUpperCase()}
                      </div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {user?.firstName || 'User'} {user?.lastName || 'Name'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">{user?.email || 'email@example.com'}</p>
                      <div className="flex items-center space-x-4 flex-wrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                          {(user?.accountType || 'STUDENT').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Member since {formatMemberSince(user?.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-500 dark:text-gray-400">Full Name</span>
                        <span className="font-medium text-right text-gray-800 dark:text-white">
                          {user?.firstName || 'Not'} {user?.lastName || 'Provided'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-500 dark:text-gray-400">Email</span>
                        <span className="font-medium text-right text-gray-800 dark:text-white break-all">
                          {user?.email || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-500 dark:text-gray-400">Phone</span>
                        <span className="font-medium text-right text-gray-800 dark:text-white">
                          {user?.phone || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-500 dark:text-gray-400">Member Since</span>
                        <span className="font-medium text-right text-gray-800 dark:text-white">
                          {formatDate(user?.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
                      Professional Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-500 dark:text-gray-400">Company</span>
                        <span className="font-medium text-right text-gray-800 dark:text-white">
                          {user?.company || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-500 dark:text-gray-400">Website</span>
                        <span className="font-medium text-right text-gray-800 dark:text-white break-all">
                          {user?.website || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-500 dark:text-gray-400">Account Type</span>
                        <span className="font-medium text-right text-gray-800 dark:text-white capitalize">
                          {user?.accountType || 'student'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-500 dark:text-gray-400">Status</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {user?.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start">
                    <Info className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        Profile Management
                      </h4>
                      <p className="text-blue-700 dark:text-blue-400 text-sm">
                        To update your profile information, photo, or bio, please use the Profile button in the sidebar navigation. 
                        This Settings page is for managing your account preferences and system settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-white">
                  <Bell className="mr-3 text-orange-500" />
                  Notification Preferences
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Choose how and when you want to receive notifications. We'll only send you notifications for the categories you enable.
                </p>

                <div className="space-y-4">
                  {notificationOptions.map((option) => (
                    <div 
                      key={option.key}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400 flex-shrink-0">
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-1">
                              {option.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {option.description}
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={notificationSettings[option.key as keyof NotificationSettings]}
                            onChange={() => handleNotificationChange(option.key as keyof NotificationSettings)}
                          />
                          <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-500 peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-orange-600"></div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-white">
                  <Shield className="mr-3 text-orange-500" />
                  Security Settings
                </h2>

                {/* Change Password Section */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center text-gray-800 dark:text-white">
                    <Lock className="mr-2 text-gray-600 dark:text-gray-400" size={20} />
                    Change Password
                  </h3>
                  
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          value={securitySettings.currentPassword}
                          onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                          className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                          {showPassword.current ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.new ? "text" : "password"}
                          value={securitySettings.newPassword}
                          onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                          className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter new password"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                          {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator */}
                      {securitySettings.newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Password Strength</span>
                            <span className={`text-xs font-medium ${
                              passwordStrength < 40 ? 'text-red-500' : 
                              passwordStrength < 70 ? 'text-yellow-500' : 'text-green-500'
                            }`}>
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          value={securitySettings.confirmPassword}
                          onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                          className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          placeholder="Confirm new password"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                          {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                    >
                      Update Password
                    </button>
                  </form>
                </div>

                {/* Two-Factor Authentication */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 flex-shrink-0">
                        <Smartphone size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Add an extra layer of security to your account by requiring a verification code in addition to your password.
                        </p>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          securitySettings.twoFactorEnabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                        }`}>
                          {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={securitySettings.twoFactorEnabled}
                        onChange={(e) => handleSecurityChange('twoFactorEnabled', e.target.checked)}
                      />
                      <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-500 peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 flex-shrink-0">
                      <Laptop size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">
                        Active Sessions
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Manage devices where you're currently logged in.
                      </p>
                      <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300">
                        <LogOut size={16} className="mr-2" />
                        View All Sessions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-white">
                  <Palette className="mr-3 text-orange-500" />
                  Appearance Settings
                </h2>

                {/* Theme Selection */}
                <div className="mb-8">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Theme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: 'Light', icon: <Sun size={20} />, gradient: 'from-yellow-100 to-orange-100' },
                      { value: 'dark', label: 'Dark', icon: <Moon size={20} />, gradient: 'from-gray-700 to-gray-900' },
                      { value: 'system', label: 'System', icon: <Monitor size={20} />, gradient: 'from-blue-100 to-purple-100' }
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => handleAppearanceChange('theme', theme.value)}
                        className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                          isThemeActive(theme.value)
                            ? 'border-orange-500 shadow-lg transform scale-[1.02]'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} rounded-xl opacity-10`}></div>
                        <div className="relative flex flex-col items-center">
                          <div className={`p-3 rounded-full mb-3 ${
                            isThemeActive(theme.value)
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {theme.icon}
                          </div>
                          <span className="font-medium text-gray-800 dark:text-white">{theme.label}</span>
                        </div>
                        {isThemeActive(theme.value) && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="text-orange-500" size={20} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Current theme: <span className="font-medium capitalize">{getCurrentTheme()}</span>
                  </p>
                </div>

                {/* Font Size */}
                <div className="mb-8">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Font Size</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="flex space-x-2">
                      {['small', 'medium', 'large'].map((size) => (
                        <button
                          key={size}
                          onClick={() => handleAppearanceChange('fontSize', size)}
                          className={`flex-1 py-3 rounded-lg transition-all duration-200 ${
                            appearanceSettings.fontSize === size
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                              : 'bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-800 dark:text-white'
                          }`}
                        >
                          <span className={`font-medium capitalize ${
                            size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
                          }`}>
                            {size}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      Changes to font size are applied immediately across the entire application.
                    </p>
                  </div>
                </div>

                {/* Accessibility Options */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">Accessibility</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-white mb-1">
                            Reduce Animations
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Minimize motion effects throughout the interface
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={appearanceSettings.reduceAnimations}
                            onChange={(e) => handleAppearanceChange('reduceAnimations', e.target.checked)}
                          />
                          <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-500 peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-orange-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-white mb-1">
                            High Contrast Mode
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Increase color contrast for better visibility
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={appearanceSettings.highContrast}
                            onChange={(e) => handleAppearanceChange('highContrast', e.target.checked)}
                          />
                          <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-500 peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-orange-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-white">
                  <Globe className="mr-3 text-orange-500" />
                  Language & Region
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      <Languages className="inline mr-2" size={16} />
                      Display Language
                    </label>
                    <select 
                      value={languageSettings.language}
                      onChange={(e) => handleLanguageChange('language', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="en">English (US)</option>
                      <option value="en-gb">English (UK)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="fr">Français (French)</option>
                      <option value="de">Deutsch (German)</option>
                      <option value="ja">日本語 (Japanese)</option>
                      <option value="zh">中文 (Chinese)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      <Clock className="inline mr-2" size={16} />
                      Time Zone
                    </label>
                    <select 
                      value={languageSettings.timeZone}
                      onChange={(e) => handleLanguageChange('timeZone', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="IST">India Standard Time (IST)</option>
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="EST">Eastern Standard Time (EST)</option>
                      <option value="PST">Pacific Standard Time (PST)</option>
                      <option value="GMT">Greenwich Mean Time (GMT)</option>
                      <option value="CET">Central European Time (CET)</option>
                      <option value="JST">Japan Standard Time (JST)</option>
                      <option value="AEST">Australian Eastern Standard Time (AEST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      <Calendar className="inline mr-2" size={16} />
                      Date Format
                    </label>
                    <select 
                      value={languageSettings.dateFormat}
                      onChange={(e) => handleLanguageChange('dateFormat', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                      <option value="DD-MMM-YYYY">DD-MMM-YYYY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      <Clock className="inline mr-2" size={16} />
                      Time Format
                    </label>
                    <select 
                      value={languageSettings.timeFormat}
                      onChange={(e) => handleLanguageChange('timeFormat', e.target.value as '12h' | '24h')}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="12h">12-hour (1:30 PM)</option>
                      <option value="24h">24-hour (13:30)</option>
                    </select>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
                    Preview
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-inner">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Current Date:</span>
                        <span className="font-mono font-medium text-gray-800 dark:text-white">
                          {new Date().toLocaleDateString('en-US', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Current Time:</span>
                        <span className="font-mono font-medium text-gray-800 dark:text-white">
                          {new Date().toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: languageSettings.timeFormat === '12h'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Time Zone:</span>
                        <span className="font-mono font-medium text-gray-800 dark:text-white">{languageSettings.timeZone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add fade-in animation */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Settings;