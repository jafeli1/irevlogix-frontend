'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '../../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../../utils/rbac';

interface ReverseRequestData {
  id?: number;
  reverseJobRequestId?: number;
  clientId?: string;
  requestAcknowledged: boolean;
  description: string;
  locationName: string;
  address: string;
  addressExt: string;
  city: string;
  stateId: number | null;
  postalCode: string;
  countryId: number | null;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  secondaryContactFirstName: string;
  secondaryContactLastName: string;
  primaryContactCellPhoneNumber: string;
  secondaryContactCellPhoneNumber: string;
  primaryContactEmailAddress: string;
  secondaryContactEmailAddress: string;
  requestedPickUpDate: string;
  requestedPickUpTime: string;
  canSiteAccommodate53FeetTruck: boolean;
  doesSiteHaveADock: boolean;
  canHardwareBeResold: boolean;
  canHardDrivesBeResold: boolean;
  isEquipmentLoose: boolean;
  isEquipmentPalletized: boolean;
  isLiftGateRequired: boolean;
  isOnsiteDataDestructingRequiredWipingShredding: boolean;
  typeOfMediaToBeDestroyed: string;
  otherInstructions: string;
  instructionUpload: string;
  equipmentListUpload: string;
  assetsPhotoUpload1: string;
  assetsPhotoUpload2: string;
  assetsPhotoUpload3: string;
  assetsPhotoUpload4: string;
  assetsPhotoUpload5: string;
  helpfulPhotoUpload1: string;
  helpfulPhotoUpload2: string;
  helpfulPhotoUpload3: string;
  isActive: boolean;
  dateClosed: string;
  closureComments: string;
}

interface ReverseRequestFile {
  fileName: string;
  fullFileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
  documentType: string;
}

export default function ReverseRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [formData, setFormData] = useState<ReverseRequestData>({
    requestAcknowledged: false,
    description: '',
    locationName: '',
    address: '',
    addressExt: '',
    city: '',
    stateId: null,
    postalCode: '',
    countryId: null,
    primaryContactFirstName: '',
    primaryContactLastName: '',
    secondaryContactFirstName: '',
    secondaryContactLastName: '',
    primaryContactCellPhoneNumber: '',
    secondaryContactCellPhoneNumber: '',
    primaryContactEmailAddress: '',
    secondaryContactEmailAddress: '',
    requestedPickUpDate: '',
    requestedPickUpTime: '',
    canSiteAccommodate53FeetTruck: false,
    doesSiteHaveADock: false,
    canHardwareBeResold: false,
    canHardDrivesBeResold: false,
    isEquipmentLoose: false,
    isEquipmentPalletized: false,
    isLiftGateRequired: false,
    isOnsiteDataDestructingRequiredWipingShredding: false,
    typeOfMediaToBeDestroyed: '',
    otherInstructions: '',
    instructionUpload: '',
    equipmentListUpload: '',
    assetsPhotoUpload1: '',
    assetsPhotoUpload2: '',
    assetsPhotoUpload3: '',
    assetsPhotoUpload4: '',
    assetsPhotoUpload5: '',
    helpfulPhotoUpload1: '',
    helpfulPhotoUpload2: '',
    helpfulPhotoUpload3: '',
    isActive: true,
    dateClosed: '',
    closureComments: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  const [uploadFiles, setUploadFiles] = useState<{
    instruction?: File;
    equipmentList?: File;
    assetsPhoto1?: File;
    assetsPhoto2?: File;
    assetsPhoto3?: File;
    assetsPhoto4?: File;
    assetsPhoto5?: File;
    helpfulPhoto1?: File;
    helpfulPhoto2?: File;
    helpfulPhoto3?: File;
  }>({});
  const [uploadedFiles, setUploadedFiles] = useState<ReverseRequestFile[]>([]);

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
        if (!isNew) {
          await fetchReverseRequest();
          await fetchUploadedFiles();
        }
      }
      setLoading(false);
    };

    loadData();
  }, [id, isNew, router]);

  const fetchReverseRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/reverserequests/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data,
          requestedPickUpDate: data.requestedPickUpDate ? data.requestedPickUpDate.split('T')[0] : '',
          requestedPickUpTime: data.requestedPickUpTime || '',
          dateClosed: data.dateClosed ? data.dateClosed.split('T')[0] : ''
        });
      } else if (response.status === 401) {
        router.push('/login');
      } else if (response.status === 404) {
        setError('Reverse request not found');
      }
    } catch (error) {
      console.error('Error fetching reverse request:', error);
      setError('Error loading reverse request data');
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reverserequests/${id}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(data);
      } else {
        console.error('Failed to fetch uploaded files');
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
      setUploadedFiles([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? (value ? parseInt(value) : null) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFiles(prev => ({ ...prev, [fileType]: file }));
    }
  };

  const uploadFile = async (file: File, reverseRequestId: number, documentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const token = localStorage.getItem('token');
    const response = await fetch(`/api/reverserequests/${reverseRequestId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      return result.filePath;
    }
    throw new Error('File upload failed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        ...formData,
        requestedPickUpDate: formData.requestedPickUpDate ? new Date(formData.requestedPickUpDate).toISOString() : null,
        dateClosed: formData.dateClosed ? new Date(formData.dateClosed).toISOString() : null
      };

      const url = isNew ? '/api/reverserequests' : `/api/reverserequests/${id}`;
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
        const reverseRequestId = isNew ? (await response.json()).id : parseInt(id);

        const fileUploads = [
          { file: uploadFiles.instruction, type: 'instruction' },
          { file: uploadFiles.equipmentList, type: 'equipmentlist' },
          { file: uploadFiles.assetsPhoto1, type: 'assetsphoto1' },
          { file: uploadFiles.assetsPhoto2, type: 'assetsphoto2' },
          { file: uploadFiles.assetsPhoto3, type: 'assetsphoto3' },
          { file: uploadFiles.assetsPhoto4, type: 'assetsphoto4' },
          { file: uploadFiles.assetsPhoto5, type: 'assetsphoto5' },
          { file: uploadFiles.helpfulPhoto1, type: 'helpfulphoto1' },
          { file: uploadFiles.helpfulPhoto2, type: 'helpfulphoto2' },
          { file: uploadFiles.helpfulPhoto3, type: 'helpfulphoto3' }
        ];

        for (const upload of fileUploads) {
          if (upload.file) {
            await uploadFile(upload.file, reverseRequestId, upload.type);
          }
        }

        setSuccess(isNew ? 'Reverse request created successfully!' : 'Reverse request updated successfully!');
        
        if (isNew) {
          setTimeout(() => {
            router.push('/project-management/reverse-requests');
          }, 2000);
        }
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        const errorData = await response.text();
        setError(errorData || 'Error saving reverse request');
      }
    } catch (error) {
      console.error('Error saving reverse request:', error);
      setError('Error saving reverse request');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this reverse request?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/reverserequests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Reverse request deleted successfully!');
        setTimeout(() => {
          router.push('/project-management/reverse-requests');
        }, 2000);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError('Error deleting reverse request');
      }
    } catch (error) {
      console.error('Error deleting reverse request:', error);
      setError('Error deleting reverse request');
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
          <p className="mt-2 text-gray-600">You don&apos;t have permission to manage reverse requests.</p>
        </div>
      </AppLayout>
    );
  }

  const tabs = [
    { id: 'general', name: 'General' },
    { id: 'location', name: 'Location' },
    { id: 'contact', name: 'Contact' },
    { id: 'requestData', name: 'Request Data' },
    { id: 'uploads', name: 'Uploads' },
    { id: 'closure', name: 'Closure' }
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isNew ? 'Add New Reverse Request' : 'Edit Reverse Request'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isNew ? 'Create a new reverse logistics job request' : 'Update reverse request information'}
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
                <div className="flex items-center">
                  <input
                    id="requestAcknowledged"
                    name="requestAcknowledged"
                    type="checkbox"
                    checked={formData.requestAcknowledged}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requestAcknowledged" className="ml-2 block text-sm text-gray-900">
                    Request Acknowledged
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe the reverse logistics request"
                />
              </div>
            </div>
          )}

          {activeTab === 'location' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">
                    Location Name
                  </label>
                  <input
                    type="text"
                    id="locationName"
                    name="locationName"
                    value={formData.locationName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="addressExt" className="block text-sm font-medium text-gray-700">
                    Address Extension
                  </label>
                  <input
                    type="text"
                    id="addressExt"
                    name="addressExt"
                    value={formData.addressExt}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

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
                    State ID
                  </label>
                  <input
                    type="number"
                    id="stateId"
                    name="stateId"
                    value={formData.stateId || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="countryId" className="block text-sm font-medium text-gray-700">
                    Country ID
                  </label>
                  <input
                    type="number"
                    id="countryId"
                    name="countryId"
                    value={formData.countryId || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Primary Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="primaryContactFirstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="primaryContactFirstName"
                    name="primaryContactFirstName"
                    value={formData.primaryContactFirstName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="primaryContactLastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="primaryContactLastName"
                    name="primaryContactLastName"
                    value={formData.primaryContactLastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="primaryContactCellPhoneNumber" className="block text-sm font-medium text-gray-700">
                    Cell Phone Number
                  </label>
                  <input
                    type="tel"
                    id="primaryContactCellPhoneNumber"
                    name="primaryContactCellPhoneNumber"
                    value={formData.primaryContactCellPhoneNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="primaryContactEmailAddress" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="primaryContactEmailAddress"
                    name="primaryContactEmailAddress"
                    value={formData.primaryContactEmailAddress}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 pt-6">Secondary Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="secondaryContactFirstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="secondaryContactFirstName"
                    name="secondaryContactFirstName"
                    value={formData.secondaryContactFirstName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="secondaryContactLastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="secondaryContactLastName"
                    name="secondaryContactLastName"
                    value={formData.secondaryContactLastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="secondaryContactCellPhoneNumber" className="block text-sm font-medium text-gray-700">
                    Cell Phone Number
                  </label>
                  <input
                    type="tel"
                    id="secondaryContactCellPhoneNumber"
                    name="secondaryContactCellPhoneNumber"
                    value={formData.secondaryContactCellPhoneNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="secondaryContactEmailAddress" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="secondaryContactEmailAddress"
                    name="secondaryContactEmailAddress"
                    value={formData.secondaryContactEmailAddress}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'requestData' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="requestedPickUpDate" className="block text-sm font-medium text-gray-700">
                    Requested Pick Up Date
                  </label>
                  <input
                    type="date"
                    id="requestedPickUpDate"
                    name="requestedPickUpDate"
                    value={formData.requestedPickUpDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="requestedPickUpTime" className="block text-sm font-medium text-gray-700">
                    Requested Pick Up Time
                  </label>
                  <input
                    type="time"
                    id="requestedPickUpTime"
                    name="requestedPickUpTime"
                    value={formData.requestedPickUpTime}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="canSiteAccommodate53FeetTruck"
                      name="canSiteAccommodate53FeetTruck"
                      type="checkbox"
                      checked={formData.canSiteAccommodate53FeetTruck}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="canSiteAccommodate53FeetTruck" className="ml-2 block text-sm text-gray-900">
                      Can Site Accommodate 53 Feet Truck
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="doesSiteHaveADock"
                      name="doesSiteHaveADock"
                      type="checkbox"
                      checked={formData.doesSiteHaveADock}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="doesSiteHaveADock" className="ml-2 block text-sm text-gray-900">
                      Does Site Have A Dock
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="canHardwareBeResold"
                      name="canHardwareBeResold"
                      type="checkbox"
                      checked={formData.canHardwareBeResold}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="canHardwareBeResold" className="ml-2 block text-sm text-gray-900">
                      Can Hardware Be Resold
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="canHardDrivesBeResold"
                      name="canHardDrivesBeResold"
                      type="checkbox"
                      checked={formData.canHardDrivesBeResold}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="canHardDrivesBeResold" className="ml-2 block text-sm text-gray-900">
                      Can Hard Drives Be Resold
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="isEquipmentLoose"
                      name="isEquipmentLoose"
                      type="checkbox"
                      checked={formData.isEquipmentLoose}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isEquipmentLoose" className="ml-2 block text-sm text-gray-900">
                      Is Equipment Loose
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="isEquipmentPalletized"
                      name="isEquipmentPalletized"
                      type="checkbox"
                      checked={formData.isEquipmentPalletized}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isEquipmentPalletized" className="ml-2 block text-sm text-gray-900">
                      Is Equipment Palletized
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="isLiftGateRequired"
                      name="isLiftGateRequired"
                      type="checkbox"
                      checked={formData.isLiftGateRequired}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isLiftGateRequired" className="ml-2 block text-sm text-gray-900">
                      Is Lift Gate Required
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="isOnsiteDataDestructingRequiredWipingShredding"
                      name="isOnsiteDataDestructingRequiredWipingShredding"
                      type="checkbox"
                      checked={formData.isOnsiteDataDestructingRequiredWipingShredding}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isOnsiteDataDestructingRequiredWipingShredding" className="ml-2 block text-sm text-gray-900">
                      Is Onsite Data Destructing Required (Wiping/Shredding)
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="typeOfMediaToBeDestroyed" className="block text-sm font-medium text-gray-700">
                  Type of Media to be Destroyed
                </label>
                <input
                  type="text"
                  id="typeOfMediaToBeDestroyed"
                  name="typeOfMediaToBeDestroyed"
                  value={formData.typeOfMediaToBeDestroyed}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="otherInstructions" className="block text-sm font-medium text-gray-700">
                  Other Instructions
                </label>
                <textarea
                  id="otherInstructions"
                  name="otherInstructions"
                  rows={8}
                  value={formData.otherInstructions}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'uploads' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="instructionUpload" className="block text-sm font-medium text-gray-700">
                    Instruction Upload
                  </label>
                  <input
                    type="file"
                    id="instructionUpload"
                    onChange={(e) => handleFileChange(e, 'instruction')}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.instructionUpload && (
                    <p className="mt-1 text-sm text-gray-600">Current: {formData.instructionUpload}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="equipmentListUpload" className="block text-sm font-medium text-gray-700">
                    Equipment List Upload
                  </label>
                  <input
                    type="file"
                    id="equipmentListUpload"
                    onChange={(e) => handleFileChange(e, 'equipmentList')}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.equipmentListUpload && (
                    <p className="mt-1 text-sm text-gray-600">Current: {formData.equipmentListUpload}</p>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900">Assets Photos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num}>
                    <label htmlFor={`assetsPhotoUpload${num}`} className="block text-sm font-medium text-gray-700">
                      Assets Photo Upload {num}
                    </label>
                    <input
                      type="file"
                      id={`assetsPhotoUpload${num}`}
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, `assetsPhoto${num}`)}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {formData[`assetsPhotoUpload${num}` as keyof ReverseRequestData] && (
                      <p className="mt-1 text-sm text-gray-600">Current: {formData[`assetsPhotoUpload${num}` as keyof ReverseRequestData]}</p>
                    )}
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-medium text-gray-900">Helpful Photos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((num) => (
                  <div key={num}>
                    <label htmlFor={`helpfulPhotoUpload${num}`} className="block text-sm font-medium text-gray-700">
                      Helpful Photo Upload {num}
                    </label>
                    <input
                      type="file"
                      id={`helpfulPhotoUpload${num}`}
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, `helpfulPhoto${num}`)}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {formData[`helpfulPhotoUpload${num}` as keyof ReverseRequestData] && (
                      <p className="mt-1 text-sm text-gray-600">Current: {formData[`helpfulPhotoUpload${num}` as keyof ReverseRequestData]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'closure' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Is Active
                  </label>
                </div>

                <div>
                  <label htmlFor="dateClosed" className="block text-sm font-medium text-gray-700">
                    Date Closed
                  </label>
                  <input
                    type="date"
                    id="dateClosed"
                    name="dateClosed"
                    value={formData.dateClosed}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="closureComments" className="block text-sm font-medium text-gray-700">
                  Closure Comments
                </label>
                <textarea
                  id="closureComments"
                  name="closureComments"
                  rows={8}
                  value={formData.closureComments}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Add any closure comments or notes"
                />
              </div>
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
                  Delete Reverse Request
                </button>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push('/project-management/reverse-requests')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isNew ? 'Save Reverse Request' : 'Update Reverse Request')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
