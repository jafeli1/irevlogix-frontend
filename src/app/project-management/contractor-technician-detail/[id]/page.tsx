'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '../../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../../utils/rbac';
import { US_STATES } from '../../../../utils/constants';

interface ContractorTechnicianData {
  id?: number;
  userId: number;
  clientId: string;
  approved: boolean;
  preferred: boolean;
  technicianSource: string;
  comments: string;
  firstName: string;
  lastName: string;
  city: string;
  stateId: string | null;
  zipCode: string;
  phone: string;
  email: string;
  shippingAddress: string;
  onboardDate: string;
  expirationDate: string;
  backgroundCheckOnboarding: boolean;
  drugTestOnboarding: boolean;
  thirdPartyAgreementOnboarding: boolean;
  backgroundCheckDate: string;
  drugTestDate: string;
  thirdPartyServiceProviderAgreementVersion: string;
  trainingCompletionDate: string;
  backgroundCheckFormUpload: string;
  drugTestUpload: string;
  thirdPartyServiceProviderAgreementUpload: string;
  miscUpload: string;
  updateSummary: string;
}

interface ContractorFile {
  fileName: string;
  fullFileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
  documentType: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function ContractorTechnicianDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [formData, setFormData] = useState<ContractorTechnicianData>({
    userId: 0,
    clientId: '',
    approved: false,
    preferred: false,
    technicianSource: '',
    comments: '',
    firstName: '',
    lastName: '',
    city: '',
    stateId: null,
    zipCode: '',
    phone: '',
    email: '',
    shippingAddress: '',
    onboardDate: '',
    expirationDate: '',
    backgroundCheckOnboarding: false,
    drugTestOnboarding: false,
    thirdPartyAgreementOnboarding: false,
    backgroundCheckDate: '',
    drugTestDate: '',
    thirdPartyServiceProviderAgreementVersion: '',
    trainingCompletionDate: '',
    backgroundCheckFormUpload: '',
    drugTestUpload: '',
    thirdPartyServiceProviderAgreementUpload: '',
    miscUpload: '',
    updateSummary: ''
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [uploadFiles, setUploadFiles] = useState<{
    backgroundCheck?: File;
    drugTest?: File;
    thirdPartyAgreement?: File;
    misc?: File;
  }>({});
  const [uploadedFiles, setUploadedFiles] = useState<ContractorFile[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const userPermissions = await fetchUserPermissions(token);
      setPermissions(userPermissions);

      if (userPermissions && hasPermission(userPermissions, 'ProjectManagement', 'Read')) {
        await Promise.all([fetchUsers(), !isNew && fetchContractorTechnician(), !isNew && fetchUploadedFiles()]);
      }
      setLoading(false);
    };

    loadData();
  }, [id, isNew, router]);

  const fetchUploadedFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ContractorTechnicians/${id}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(data);
      }
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchContractorTechnician = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/contractortechnicians/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data,
          onboardDate: data.onboardDate ? data.onboardDate.split('T')[0] : '',
          expirationDate: data.expirationDate ? data.expirationDate.split('T')[0] : '',
          backgroundCheckDate: data.backgroundCheckDate ? data.backgroundCheckDate.split('T')[0] : '',
          drugTestDate: data.drugTestDate ? data.drugTestDate.split('T')[0] : '',
          thirdPartyServiceProviderAgreementVersion: data.thirdPartyServiceProviderAgreementVersion ? data.thirdPartyServiceProviderAgreementVersion.split('T')[0] : '',
          trainingCompletionDate: data.trainingCompletionDate ? data.trainingCompletionDate.split('T')[0] : ''
        });
      } else if (response.status === 401) {
        router.push('/login');
      } else if (response.status === 404) {
        setError('Contractor technician not found');
      }
    } catch (error) {
      console.error('Error fetching contractor technician:', error);
      setError('Error loading contractor technician data');
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.userId) {
      errors.userId = 'User selection is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'stateId' ? (value === '' ? null : parseInt(value, 10)) :
              value
    }));

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFiles(prev => ({ ...prev, [fileType]: file }));
    }
  };

  const uploadFile = async (file: File, contractorId: number, documentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const token = localStorage.getItem('token');
    const response = await fetch(`/api/contractortechnicians/${contractorId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      await fetchUploadedFiles();
      return result.filePath;
    }
    throw new Error('File upload failed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the validation errors');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const submitData = {
        userId: formData.userId,
        approved: formData.approved,
        preferred: formData.preferred,
        technicianSource: formData.technicianSource,
        comments: formData.comments,
        firstName: formData.firstName,
        lastName: formData.lastName,
        city: formData.city,
        stateId: formData.stateId,
        zipCode: formData.zipCode,
        phone: formData.phone,
        email: formData.email,
        shippingAddress: formData.shippingAddress,
        onboardDate: formData.onboardDate ? new Date(formData.onboardDate).toISOString() : null,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null,
        backgroundCheckOnboarding: formData.backgroundCheckOnboarding,
        drugTestOnboarding: formData.drugTestOnboarding,
        thirdPartyAgreementOnboarding: formData.thirdPartyAgreementOnboarding,
        backgroundCheckDate: formData.backgroundCheckDate ? new Date(formData.backgroundCheckDate).toISOString() : null,
        drugTestDate: formData.drugTestDate ? new Date(formData.drugTestDate).toISOString() : null,
        thirdPartyServiceProviderAgreementVersion: formData.thirdPartyServiceProviderAgreementVersion ? new Date(formData.thirdPartyServiceProviderAgreementVersion).toISOString() : null,
        trainingCompletionDate: formData.trainingCompletionDate ? new Date(formData.trainingCompletionDate).toISOString() : null,
        backgroundCheckFormUpload: formData.backgroundCheckFormUpload,
        drugTestUpload: formData.drugTestUpload,
        thirdPartyServiceProviderAgreementUpload: formData.thirdPartyServiceProviderAgreementUpload,
        miscUpload: formData.miscUpload,
        updateSummary: formData.updateSummary
      };

      const url = isNew ? '/api/contractortechnicians' : `/api/contractortechnicians/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const contractorId = isNew ? (await response.json()).id : parseInt(id);

        if (uploadFiles.backgroundCheck) {
          await uploadFile(uploadFiles.backgroundCheck, contractorId, 'BackgroundCheck');
        }
        if (uploadFiles.drugTest) {
          await uploadFile(uploadFiles.drugTest, contractorId, 'DrugTest');
        }
        if (uploadFiles.thirdPartyAgreement) {
          await uploadFile(uploadFiles.thirdPartyAgreement, contractorId, 'ThirdPartyAgreement');
        }
        if (uploadFiles.misc) {
          await uploadFile(uploadFiles.misc, contractorId, 'Misc');
        }

        setSuccess(isNew ? 'Contractor technician created successfully!' : 'Contractor technician updated successfully!');
        
        if (isNew) {
          setTimeout(() => {
            router.push('/project-management/contractor-technicians');
          }, 2000);
        }
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        const errorData = await response.text();
        setError(errorData || 'Error saving contractor technician');
      }
    } catch (error) {
      console.error('Error saving contractor technician:', error);
      setError('Error saving contractor technician');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contractor technician?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/contractortechnicians/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Contractor technician deleted successfully!');
        setTimeout(() => {
          router.push('/project-management/contractor-technicians');
        }, 2000);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError('Error deleting contractor technician');
      }
    } catch (error) {
      console.error('Error deleting contractor technician:', error);
      setError('Error deleting contractor technician');
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

  if (!permissions || !hasPermission(permissions, 'ProjectManagement', 'Read')) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don&apos;t have permission to manage contractor technicians.</p>
        </div>
      </AppLayout>
    );
  }

  const tabs = [
    { id: 'general', name: 'General' },
    { id: 'contact', name: 'Contact' },
    { id: 'compliance', name: 'Compliance' },
    { id: 'uploads', name: 'Uploads' }
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isNew ? 'Add New Contractor Technician' : 'Edit Contractor Technician'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isNew ? 'Create a new contractor technician record' : 'Update contractor technician information'}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                    User *
                  </label>
                  <select
                    id="userId"
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      validationErrors.userId ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                  {validationErrors.userId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.userId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="technicianSource" className="block text-sm font-medium text-gray-700">
                    Technician Source
                  </label>
                  <input
                    type="text"
                    id="technicianSource"
                    name="technicianSource"
                    value={formData.technicianSource}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    id="approved"
                    name="approved"
                    type="checkbox"
                    checked={formData.approved}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="approved" className="ml-2 block text-sm text-gray-900">
                    Approved
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="preferred"
                    name="preferred"
                    type="checkbox"
                    checked={formData.preferred}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="preferred" className="ml-2 block text-sm text-gray-900">
                    Preferred
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                  Comments
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  rows={4}
                  value={formData.comments}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      validationErrors.firstName ? 'border-red-300' : ''
                    }`}
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      validationErrors.lastName ? 'border-red-300' : ''
                    }`}
                  />
                  {validationErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="stateId" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <select
                    id="stateId"
                    name="stateId"
                    value={formData.stateId || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select State</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      validationErrors.email ? 'border-red-300' : ''
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">
                  Shipping Address
                </label>
                <textarea
                  id="shippingAddress"
                  name="shippingAddress"
                  rows={3}
                  value={formData.shippingAddress}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="onboardDate" className="block text-sm font-medium text-gray-700">
                    Onboard Date
                  </label>
                  <input
                    type="date"
                    id="onboardDate"
                    name="onboardDate"
                    value={formData.onboardDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    id="expirationDate"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <input
                    id="backgroundCheckOnboarding"
                    name="backgroundCheckOnboarding"
                    type="checkbox"
                    checked={formData.backgroundCheckOnboarding}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="backgroundCheckOnboarding" className="ml-2 block text-sm text-gray-900">
                    Background Check Onboarding
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="drugTestOnboarding"
                    name="drugTestOnboarding"
                    type="checkbox"
                    checked={formData.drugTestOnboarding}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="drugTestOnboarding" className="ml-2 block text-sm text-gray-900">
                    Drug Test Onboarding
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="thirdPartyAgreementOnboarding"
                    name="thirdPartyAgreementOnboarding"
                    type="checkbox"
                    checked={formData.thirdPartyAgreementOnboarding}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="thirdPartyAgreementOnboarding" className="ml-2 block text-sm text-gray-900">
                    Third Party Agreement Onboarding
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="backgroundCheckDate" className="block text-sm font-medium text-gray-700">
                    Background Check Date
                  </label>
                  <input
                    type="date"
                    id="backgroundCheckDate"
                    name="backgroundCheckDate"
                    value={formData.backgroundCheckDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="drugTestDate" className="block text-sm font-medium text-gray-700">
                    Drug Test Date
                  </label>
                  <input
                    type="date"
                    id="drugTestDate"
                    name="drugTestDate"
                    value={formData.drugTestDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="thirdPartyServiceProviderAgreementVersion" className="block text-sm font-medium text-gray-700">
                    Third Party Service Provider Agreement Version
                  </label>
                  <input
                    type="date"
                    id="thirdPartyServiceProviderAgreementVersion"
                    name="thirdPartyServiceProviderAgreementVersion"
                    value={formData.thirdPartyServiceProviderAgreementVersion}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="trainingCompletionDate" className="block text-sm font-medium text-gray-700">
                    Training Completion Date
                  </label>
                  <input
                    type="date"
                    id="trainingCompletionDate"
                    name="trainingCompletionDate"
                    value={formData.trainingCompletionDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'uploads' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="backgroundCheckUpload" className="block text-sm font-medium text-gray-700">
                    Background Check Form Upload
                  </label>
                  <input
                    type="file"
                    id="backgroundCheckUpload"
                    onChange={(e) => handleFileChange(e, 'backgroundCheck')}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.backgroundCheckFormUpload && (
                    <p className="mt-1 text-sm text-gray-600">Current: {formData.backgroundCheckFormUpload}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="drugTestUpload" className="block text-sm font-medium text-gray-700">
                    Drug Test Upload
                  </label>
                  <input
                    type="file"
                    id="drugTestUpload"
                    onChange={(e) => handleFileChange(e, 'drugTest')}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.drugTestUpload && (
                    <p className="mt-1 text-sm text-gray-600">Current: {formData.drugTestUpload}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="thirdPartyAgreementUpload" className="block text-sm font-medium text-gray-700">
                    Third Party Service Provider Agreement Upload
                  </label>
                  <input
                    type="file"
                    id="thirdPartyAgreementUpload"
                    onChange={(e) => handleFileChange(e, 'thirdPartyAgreement')}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.thirdPartyServiceProviderAgreementUpload && (
                    <p className="mt-1 text-sm text-gray-600">Current: {formData.thirdPartyServiceProviderAgreementUpload}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="miscUpload" className="block text-sm font-medium text-gray-700">
                    Misc Upload
                  </label>
                  <input
                    type="file"
                    id="miscUpload"
                    onChange={(e) => handleFileChange(e, 'misc')}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.miscUpload && (
                    <p className="mt-1 text-sm text-gray-600">Current: {formData.miscUpload}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="updateSummary" className="block text-sm font-medium text-gray-700">
                  Update Summary
                </label>
                <textarea
                  id="updateSummary"
                  name="updateSummary"
                  rows={4}
                  value={formData.updateSummary}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe any updates or changes made to this contractor technician record"
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h4>
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(file.uploadDate).toLocaleDateString()} • 
                              Size: {(file.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <a
                              href={`https://irevlogix-backend.onrender.com${file.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div>
              {!isNew && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push('/project-management/contractor-technicians')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isNew ? 'Create' : 'Update')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
