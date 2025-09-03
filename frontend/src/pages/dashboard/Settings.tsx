import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Globe, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
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

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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
    theme: 'system',
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
          setSecuritySettings(JSON.parse(savedSecurity));
        }
        if (savedAppearance) {
          setAppearanceSettings(JSON.parse(savedAppearance));
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'language', label: 'Language', icon: <Globe size={18} /> },
  ];

  const handleSaveSettings = () => {
    setSaving(true);
    
    // Simulate API call to save settings
    setTimeout(() => {
      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
      localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
      localStorage.setItem('languageSettings', JSON.stringify(languageSettings));
      
      setSaving(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
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

  const handleAppearanceChange = (key: keyof AppearanceSettings, value: string | boolean) => {
    setAppearanceSettings(prev => ({
      ...prev,
      [key]: value
    }));
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

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    
    if (securitySettings.newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }
    
    // In a real app, you would make an API call to update the password
    alert("Password updated successfully!");
    
    // Clear password fields
    setSecuritySettings(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 lg:sticky lg:top-24 lg:h-fit">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
            
            {saveSuccess && (
              <div className="mt-3 flex items-center text-green-600 dark:text-green-400">
                <CheckCircle size={16} className="mr-1" />
                <span className="text-sm">Settings saved successfully!</span>
              </div>
            )}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium">{user?.firstName} {user?.lastName}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.accountType} Account</p>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 py-4">
                  Use the profile button in the sidebar to edit your profile information and avatar.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <h3 className="font-medium mb-2">Account Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500 dark:text-gray-400">Name:</span> {user?.firstName} {user?.lastName}</p>
                      <p><span className="text-gray-500 dark:text-gray-400">Email:</span> {user?.email}</p>
                      <p><span className="text-gray-500 dark:text-gray-400">Account Type:</span> {user?.accountType}</p>
                      <p><span className="text-gray-500 dark:text-gray-400">Member since:</span> {new Date(user?.createdAt || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Additional Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500 dark:text-gray-400">Phone:</span> {user?.phone || 'Not provided'}</p>
                      <p><span className="text-gray-500 dark:text-gray-400">Company:</span> {user?.company || 'Not provided'}</p>
                      <p><span className="text-gray-500 dark:text-gray-400">Website:</span> {user?.website || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings.emailNotifications}
                      onChange={() => handleNotificationChange('emailNotifications')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium">Assignment Reminders</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get reminded about due assignments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings.assignmentReminders}
                      onChange={() => handleNotificationChange('assignmentReminders')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium">Course Updates</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Notifications about new course content</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings.courseUpdates}
                      onChange={() => handleNotificationChange('courseUpdates')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium">Marketing Emails</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive promotional offers and updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings.marketingEmails}
                      onChange={() => handleNotificationChange('marketingEmails')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium">Security Alerts</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about important security events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings.securityAlerts}
                      onChange={() => handleNotificationChange('securityAlerts')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Security Settings</h2>
              <div className="space-y-6">
                <form onSubmit={handlePasswordUpdate} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="font-medium mb-4">Change Password</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          value={securitySettings.currentPassword}
                          onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-300 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                        >
                          {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword.new ? "text" : "password"}
                          value={securitySettings.newPassword}
                          onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-300 pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                        >
                          {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          value={securitySettings.confirmPassword}
                          onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-300 pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                        >
                          {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Add an extra layer of security to your account
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{securitySettings.twoFactorEnabled ? "Enabled" : "Disabled"}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {securitySettings.twoFactorEnabled 
                          ? "Two-factor authentication is currently enabled for your account." 
                          : "Two-factor authentication is not yet enabled for your account."}
                      </p>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={securitySettings.twoFactorEnabled}
                        onChange={(e) => handleSecurityChange('twoFactorEnabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                  
                  {!securitySettings.twoFactorEnabled && (
                    <button className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Enable 2FA
                    </button>
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium mb-2">Active Sessions</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Manage your active login sessions
                  </p>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    View Active Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Appearance Settings</h2>
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="font-medium mb-4">Theme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => handleAppearanceChange('theme', 'light')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        appearanceSettings.theme === 'light' 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="w-full h-20 bg-white rounded mb-2 border border-gray-200"></div>
                      <span>Light</span>
                    </button>
                    
                    <button 
                      onClick={() => handleAppearanceChange('theme', 'dark')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        appearanceSettings.theme === 'dark' 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="w-full h-20 bg-gray-800 rounded mb-2 border border-gray-700"></div>
                      <span>Dark</span>
                    </button>
                    
                    <button 
                      onClick={() => handleAppearanceChange('theme', 'system')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        appearanceSettings.theme === 'system' 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="w-full h-20 bg-gradient-to-r from-white to-gray-800 rounded mb-2 border border-gray-300 dark:border-gray-700"></div>
                      <span>System</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="font-medium mb-4">Font Size</h3>
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => handleAppearanceChange('fontSize', 'small')}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        appearanceSettings.fontSize === 'small' 
                          ? 'border-orange-500 bg-orange-500 text-white' 
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      Small
                    </button>
                    <button 
                      onClick={() => handleAppearanceChange('fontSize', 'medium')}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        appearanceSettings.fontSize === 'medium' 
                          ? 'border-orange-500 bg-orange-500 text-white' 
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      Medium
                    </button>
                    <button 
                      onClick={() => handleAppearanceChange('fontSize', 'large')}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        appearanceSettings.fontSize === 'large' 
                          ? 'border-orange-500 bg-orange-500 text-white' 
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      Large
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="font-medium mb-4">Accessibility</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Reduce Animations</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Minimize motion and animations throughout the app</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={appearanceSettings.reduceAnimations}
                          onChange={(e) => handleAppearanceChange('reduceAnimations', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">High Contrast Mode</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Increase color contrast for better visibility</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={appearanceSettings.highContrast}
                          onChange={(e) => handleAppearanceChange('highContrast', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Language & Region</h2>
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="font-medium mb-4">Language Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Language</label>
                      <select 
                        value={languageSettings.language}
                        onChange={(e) => handleLanguageChange('language', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Time Format</label>
                      <select 
                        value={languageSettings.timeFormat}
                        onChange={(e) => handleLanguageChange('timeFormat', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        <option value="12h">12-hour (AM/PM)</option>
                        <option value="24h">24-hour</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="font-medium mb-4">Regional Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Time Zone</label>
                      <select 
                        value={languageSettings.timeZone}
                        onChange={(e) => handleLanguageChange('timeZone', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        <option value="IST">India Standard Time (IST)</option>
                        <option value="UTC">Coordinated Universal Time (UTC)</option>
                        <option value="EST">Eastern Standard Time (EST)</option>
                        <option value="PST">Pacific Standard Time (PST)</option>
                        <option value="CET">Central European Time (CET)</option>
                        <option value="AEST">Australian Eastern Standard Time (AEST)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Date Format</label>
                      <select 
                        value={languageSettings.dateFormat}
                        onChange={(e) => handleLanguageChange('dateFormat', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD MMM YYYY">DD MMM YYYY</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="font-medium mb-4">Preview</h3>
                  <div className="p-4 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500">
                    <p className="mb-2">
                      <span className="text-gray-500 dark:text-gray-400">Current time: </span>
                      {new Date().toLocaleTimeString()}
                    </p>
                    <p>
                      <span className="text-gray-500 dark:text-gray-400">Today's date: </span>
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;