'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppLayout from '../../../components/AppLayout';

interface ApplicationSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  description: string;
  category: string;
  isEncrypted: boolean;
  isReadOnly: boolean;
  dateCreated: string;
  dateUpdated: string;
}

interface SettingsFormData {
  settingKey: string;
  settingValue: string;
  category: string;
  description: string;
  isEncrypted: boolean;
  isReadOnly: boolean;
  
  applicationLogoPath: string;
  defaultLogoutPageUrl: string;
  loginTimeoutMinutes: number;
  applicationUploadFolderPath: string;
  applicationErrorLogFolderPath: string;
  
  passwordExpiryDays: number;
  unsuccessfulLoginAttemptsBeforeLockout: number;
  lockoutDurationMinutes: number;
  twoFactorAuthenticationFrequency: string;
  passwordComplexityRequirements: string;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'application' | 'general' | 'security'>('application');
  const [settings, setSettings] = useState<ApplicationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [formData, setFormData] = useState<SettingsFormData>({
    settingKey: '',
    settingValue: '',
    category: '',
    description: '',
    isEncrypted: false,
    isReadOnly: false,
    
    applicationLogoPath: '',
    defaultLogoutPageUrl: '',
    loginTimeoutMinutes: 30,
    applicationUploadFolderPath: '',
    applicationErrorLogFolderPath: '',
    
    passwordExpiryDays: 45,
    unsuccessfulLoginAttemptsBeforeLockout: 3,
    lockoutDurationMinutes: 30,
    twoFactorAuthenticationFrequency: 'Never',
    passwordComplexityRequirements: 'Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.',
  });
  const router = useRouter();

  const fetchSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('https://irevlogix-backend.onrender.com/api/Admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        const settingsMap = data.reduce((acc: Record<string, string>, setting: ApplicationSetting) => {
          acc[setting.settingKey] = setting.settingValue;
          return acc;
        }, {} as Record<string, string>);

        setFormData(prev => ({
          ...prev,
          applicationLogoPath: settingsMap.ApplicationLogoPath || '',
          defaultLogoutPageUrl: settingsMap.DefaultLogoutPageUrl || '',
          loginTimeoutMinutes: parseInt(settingsMap.LoginTimeoutMinutes) || 30,
          applicationUploadFolderPath: settingsMap.ApplicationUploadFolderPath || '',
          applicationErrorLogFolderPath: settingsMap.ApplicationErrorLogFolderPath || '',
          passwordExpiryDays: parseInt(settingsMap.PasswordExpiryDays) || 45,
          unsuccessfulLoginAttemptsBeforeLockout: parseInt(settingsMap.UnsuccessfulLoginAttemptsBeforeLockout) || 3,
          lockoutDurationMinutes: parseInt(settingsMap.LockoutDurationMinutes) || 30,
          twoFactorAuthenticationFrequency: settingsMap.TwoFactorAuthenticationFrequency || 'Never',
          passwordComplexityRequirements: settingsMap.PasswordComplexityRequirements || 'Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.',
        }));

        if (settingsMap.ApplicationLogoPath) {
          setLogoPreview(settingsMap.ApplicationLogoPath);
        }
      } else {
        setError('Failed to fetch settings');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? (value ? parseInt(value) : 0) : value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return null;
      }

      const formData = new FormData();
      formData.append('file', logoFile);

      const response = await fetch('https://irevlogix-backend.onrender.com/api/Admin/settings/upload-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.filePath;
      } else {
        throw new Error('Failed to upload logo');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      let logoPath = formData.applicationLogoPath;
      if (logoFile) {
        logoPath = await uploadLogo();
        if (!logoPath) {
          setError('Failed to upload logo');
          setLoading(false);
          return;
        }
      }

      const applicationSettings: { [key: string]: string | number | boolean } = {};
      settings.filter(s => s.category === 'Application').forEach(setting => {
        if (setting.settingKey === 'SettingKey') {
          applicationSettings[setting.settingKey] = formData.settingKey;
        } else if (setting.settingKey === 'SettingValue') {
          applicationSettings[setting.settingKey] = formData.settingValue;
        } else if (setting.settingKey === 'Category') {
          applicationSettings[setting.settingKey] = formData.category;
        } else if (setting.settingKey === 'Description') {
          applicationSettings[setting.settingKey] = formData.description;
        } else if (setting.settingKey === 'IsEncrypted') {
          applicationSettings[setting.settingKey] = formData.isEncrypted;
        } else if (setting.settingKey === 'IsReadOnly') {
          applicationSettings[setting.settingKey] = formData.isReadOnly;
        }
      });

      const bulkSaveData = {
        applicationSettings,
        generalSettings: {
          ApplicationLogoPath: logoPath,
          DefaultLogoutPageUrl: formData.defaultLogoutPageUrl,
          LoginTimeoutMinutes: formData.loginTimeoutMinutes,
          ApplicationUploadFolderPath: formData.applicationUploadFolderPath,
          ApplicationErrorLogFolderPath: formData.applicationErrorLogFolderPath,
        },
        securitySettings: {
          PasswordExpiryDays: formData.passwordExpiryDays,
          UnsuccessfulLoginAttemptsBeforeLockout: formData.unsuccessfulLoginAttemptsBeforeLockout,
          LockoutDurationMinutes: formData.lockoutDurationMinutes,
          TwoFactorAuthenticationFrequency: formData.twoFactorAuthenticationFrequency,
          PasswordComplexityRequirements: formData.passwordComplexityRequirements,
        }
      };

      const response = await fetch('https://irevlogix-backend.onrender.com/api/Admin/settings/bulk-save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkSaveData),
      });

      if (response.ok) {
        setSuccess('Settings saved successfully!');
        fetchSettings();
      } else {
        setError('Failed to save settings');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage application configuration settings</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200 mt-2">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('application')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'application'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Application Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security Settings
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'application' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settingKey" className="block text-sm font-medium text-gray-700">
                    Setting Key
                  </label>
                  <input
                    type="text"
                    id="settingKey"
                    name="settingKey"
                    value={formData.settingKey}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="settingValue" className="block text-sm font-medium text-gray-700">
                  Setting Value
                </label>
                <textarea
                  id="settingValue"
                  name="settingValue"
                  value={formData.settingValue}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isEncrypted"
                    name="isEncrypted"
                    checked={formData.isEncrypted}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isEncrypted" className="ml-2 block text-sm text-gray-900">
                    Encrypted
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isReadOnly"
                    name="isReadOnly"
                    checked={formData.isReadOnly}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isReadOnly" className="ml-2 block text-sm text-gray-900">
                    Read Only
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Application Logo
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {logoPreview && (
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      width={64}
                      height={64}
                      className="h-16 w-16 object-contain border border-gray-300 rounded"
                    />
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">Upload and preview application logo</p>
              </div>

              <div>
                <label htmlFor="defaultLogoutPageUrl" className="block text-sm font-medium text-gray-700">
                  Default Logout Page URL
                </label>
                <input
                  type="url"
                  id="defaultLogoutPageUrl"
                  name="defaultLogoutPageUrl"
                  value={formData.defaultLogoutPageUrl}
                  onChange={handleInputChange}
                  pattern="https?://.*"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://example.com/logout"
                />
              </div>

              <div>
                <label htmlFor="loginTimeoutMinutes" className="block text-sm font-medium text-gray-700">
                  Login Timeout (minutes)
                </label>
                <input
                  type="number"
                  id="loginTimeoutMinutes"
                  name="loginTimeoutMinutes"
                  value={formData.loginTimeoutMinutes}
                  onChange={handleInputChange}
                  min="1"
                  max="1440"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="applicationUploadFolderPath" className="block text-sm font-medium text-gray-700">
                  Application Folder for Uploads
                </label>
                <input
                  type="text"
                  id="applicationUploadFolderPath"
                  name="applicationUploadFolderPath"
                  value={formData.applicationUploadFolderPath}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="/uploads"
                />
                <p className="mt-1 text-sm text-gray-500">Path validation will be applied</p>
              </div>

              <div>
                <label htmlFor="applicationErrorLogFolderPath" className="block text-sm font-medium text-gray-700">
                  Application Folder for Error Logs
                </label>
                <input
                  type="text"
                  id="applicationErrorLogFolderPath"
                  name="applicationErrorLogFolderPath"
                  value={formData.applicationErrorLogFolderPath}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="/logs/errors"
                />
                <p className="mt-1 text-sm text-gray-500">Path validation will be applied</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="passwordExpiryDays" className="block text-sm font-medium text-gray-700">
                  Password Expiry (days)
                </label>
                <input
                  type="number"
                  id="passwordExpiryDays"
                  name="passwordExpiryDays"
                  value={formData.passwordExpiryDays}
                  onChange={handleInputChange}
                  min="1"
                  max="365"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">Default: 45 days</p>
              </div>

              <div>
                <label htmlFor="unsuccessfulLoginAttemptsBeforeLockout" className="block text-sm font-medium text-gray-700">
                  Unsuccessful Login Attempts before lockout
                </label>
                <input
                  type="number"
                  id="unsuccessfulLoginAttemptsBeforeLockout"
                  name="unsuccessfulLoginAttemptsBeforeLockout"
                  value={formData.unsuccessfulLoginAttemptsBeforeLockout}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">Default: 3 attempts</p>
              </div>

              <div>
                <label htmlFor="lockoutDurationMinutes" className="block text-sm font-medium text-gray-700">
                  Lockout Duration (minutes)
                </label>
                <input
                  type="number"
                  id="lockoutDurationMinutes"
                  name="lockoutDurationMinutes"
                  value={formData.lockoutDurationMinutes}
                  onChange={handleInputChange}
                  min="1"
                  max="1440"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">Default: 30 minutes</p>
              </div>

              <div>
                <label htmlFor="twoFactorAuthenticationFrequency" className="block text-sm font-medium text-gray-700">
                  Two Factor Authentication Frequency
                </label>
                <select
                  id="twoFactorAuthenticationFrequency"
                  name="twoFactorAuthenticationFrequency"
                  value={formData.twoFactorAuthenticationFrequency}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Always">Always</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Never">Never</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password Complexity Requirements
                </label>
                <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                  <p className="text-sm text-gray-700">{formData.passwordComplexityRequirements}</p>
                </div>
                <p className="mt-1 text-sm text-gray-500">Read-only description of password requirements</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
