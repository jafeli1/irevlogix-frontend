'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../../utils/rbac';

interface FreightClaimFile {
  fileName: string;
  fullFileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
  documentType: string;
}

interface FreightLossDamageClaim {
  id?: number;
  freightLossDamageClaimId: number;
  description?: string;
  requestId?: number;
  dateOfShipment?: string;
  dateOfClaim?: string;
  claimantReferenceNumber?: string;
  claimantEmail?: string;
  claimantCompanyName?: string;
  claimantAddress?: string;
  claimantCity?: string;
  stateId?: number;
  postalCode?: string;
  claimantPhone?: string;
  claimantFax?: string;
  claimantName?: string;
  claimantJobTitle?: string;
  dateClaimWasSigned?: string;
  notificationOfLossDamageGivenTo?: string;
  notificationOfLossDamageGivenAt?: string;
  notificationOfLossDamageGivenByWhatMethod?: string;
  notificationOfLossDamageGivenOn?: string;
  commodityLostDamaged?: string;
  totalWeight?: number;
  quantity?: number;
  damageDescription?: string;
  totalValue?: number;
  claimAttachmentUpload1?: string;
  claimAttachmentUpload2?: string;
  claimAttachmentUpload3?: string;
  claimAttachmentUpload4?: string;
  dateCreated?: string;
  dateUpdated?: string;
  createdBy?: number;
  updatedBy?: number;
  clientId?: string;
}

interface FreightClaimFile {
  fileName: string;
  fullFileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
  documentType: string;
}

interface FreightClaimFile {
  fileName: string;
  fullFileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
  documentType: string;
}

export default function FreightLossDamageClaimDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [activeTab, setActiveTab] = useState<'general' | 'claimInfo' | 'upload'>('general');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);

  const [formData, setFormData] = useState<FreightLossDamageClaim>({
    freightLossDamageClaimId: 0,
    description: '',
    requestId: undefined,
    dateOfShipment: '',
    dateOfClaim: '',
    claimantReferenceNumber: '',
    claimantEmail: '',
    claimantCompanyName: '',
    claimantAddress: '',
    claimantCity: '',
    stateId: undefined,
    postalCode: '',
    claimantPhone: '',
    claimantFax: '',
    claimantName: '',
    claimantJobTitle: '',
    dateClaimWasSigned: '',
    notificationOfLossDamageGivenTo: '',
    notificationOfLossDamageGivenAt: '',
    notificationOfLossDamageGivenByWhatMethod: '',
    notificationOfLossDamageGivenOn: '',
    commodityLostDamaged: '',
    totalWeight: undefined,
    quantity: undefined,
    damageDescription: '',
    totalValue: undefined,
    claimAttachmentUpload1: '',
    claimAttachmentUpload2: '',
    claimAttachmentUpload3: '',
    claimAttachmentUpload4: ''
  });

  const [uploadFiles, setUploadFiles] = useState<{
    attachment1?: File;
    attachment2?: File;
    attachment3?: File;
    attachment4?: File;
  }>({});
  const [uploadedFiles, setUploadedFiles] = useState<FreightClaimFile[]>([]);


  const generateClaimId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000);
    const claimId = parseInt(`${year}${month}${day}${random}`);
    
    setFormData(prev => ({
      ...prev,
      freightLossDamageClaimId: claimId
    }));
  };

  const fetchUploadedFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/FreightLossDamageClaims/${claimId}/files`, {
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

  const fetchClaim = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/FreightLossDamageClaims/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data,
          dateOfShipment: data.dateOfShipment ? new Date(data.dateOfShipment).toISOString().split('T')[0] : '',
          dateOfClaim: data.dateOfClaim ? new Date(data.dateOfClaim).toISOString().split('T')[0] : '',
          dateClaimWasSigned: data.dateClaimWasSigned ? new Date(data.dateClaimWasSigned).toISOString().split('T')[0] : '',
          notificationOfLossDamageGivenOn: data.notificationOfLossDamageGivenOn ? new Date(data.notificationOfLossDamageGivenOn).toISOString().split('T')[0] : ''
        });
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else if (response.status === 404) {
        setError('Claim not found');
      } else {
        setError('Failed to fetch claim details');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }finally {
      setLoading(false);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/FreightLossDamageClaims/${id}/files`, {
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

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const userPermissions = await fetchUserPermissions(token);
      setPermissions(userPermissions);
      
      if (isNew) {
        generateClaimId();
      } else {
        fetchClaim();
        fetchUploadedFiles();
      }
    };

    loadData();
  }, [router, id, isNew, fetchClaim, generateClaimId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, attachmentType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFiles(prev => ({
        ...prev,
        [attachmentType]: file
      }));
    }
  };

  const uploadFile = async (file: File, attachmentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', attachmentType);
    formData.append('description', `Claim Attachment ${attachmentType.slice(-1)}`);

    const token = localStorage.getItem('token');
    const response = await fetch(`https://irevlogix-backend.onrender.com/api/FreightLossDamageClaims/${id}/upload`, {
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
      throw new Error('Upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const url = isNew 
        ? 'https://irevlogix-backend.onrender.com/api/FreightLossDamageClaims'
        : `https://irevlogix-backend.onrender.com/api/FreightLossDamageClaims/${id}`;
      
      const method = isNew ? 'POST' : 'PUT';

      const submitData = {
        ...formData,
        dateOfShipment: formData.dateOfShipment || null,
        dateOfClaim: formData.dateOfClaim || null,
        dateClaimWasSigned: formData.dateClaimWasSigned || null,
        notificationOfLossDamageGivenOn: formData.notificationOfLossDamageGivenOn || null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        if (isNew) {
          const result = await response.json();
        }

        for (const [attachmentType, file] of Object.entries(uploadFiles)) {
          if (file) {
            try {
              await uploadFile(file, attachmentType);
            } catch (uploadError) {
              console.error(`Failed to upload ${attachmentType}:`, uploadError);
            }
          }
        }

        await fetchUploadedFiles();

        setSuccess(isNew ? 'Claim created successfully!' : 'Claim updated successfully!');
        
        if (isNew) {
          setTimeout(() => {
            router.push('/project-management/freight-loss-damage-claims');
          }, 2000);
        }
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        const errorData = await response.text();
        setError(errorData || `Failed to ${isNew ? 'create' : 'update'} claim`);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <div className="text-gray-500">Loading claim details...</div>
        </div>
      </AppLayout>
    );
  }

  if (!permissions || !hasPermission(permissions, 'ProjectManagement', 'Read')) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don&apos;t have permission to view freight loss damage claims.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNew ? 'New Freight Loss Damage Claim' : `Claim #${formData.freightLossDamageClaimId}`}
            </h1>
            <p className="mt-2 text-gray-600">
              {isNew ? 'Create a new freight loss damage claim' : 'View and edit claim details'}
            </p>
          </div>
          <Link
            href="/project-management/freight-loss-damage-claims"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Claims
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('claimInfo')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'claimInfo'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Claim Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upload
              </button>
            </nav>
          </div>

          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Claim ID
                </label>
                <input
                  type="number"
                  name="freightLossDamageClaimId"
                  value={formData.freightLossDamageClaimId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Request ID
                </label>
                <input
                  type="number"
                  name="requestId"
                  value={formData.requestId || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter claim description"
                />
              </div>

              {!isNew && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date Created
                    </label>
                    <input
                      type="text"
                      value={formData.dateCreated ? new Date(formData.dateCreated).toLocaleString() : ''}
                      readOnly
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date Updated
                    </label>
                    <input
                      type="text"
                      value={formData.dateUpdated ? new Date(formData.dateUpdated).toLocaleString() : ''}
                      readOnly
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'claimInfo' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Shipment
                  </label>
                  <input
                    type="date"
                    name="dateOfShipment"
                    value={formData.dateOfShipment || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Claim
                  </label>
                  <input
                    type="date"
                    name="dateOfClaim"
                    value={formData.dateOfClaim || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Claimant Reference Number
                  </label>
                  <input
                    type="text"
                    name="claimantReferenceNumber"
                    value={formData.claimantReferenceNumber || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Claimant Email
                  </label>
                  <input
                    type="email"
                    name="claimantEmail"
                    value={formData.claimantEmail || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Claimant Company Name
                  </label>
                  <input
                    type="text"
                    name="claimantCompanyName"
                    value={formData.claimantCompanyName || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Claimant City
                  </label>
                  <input
                    type="text"
                    name="claimantCity"
                    value={formData.claimantCity || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State ID
                  </label>
                  <input
                    type="number"
                    name="stateId"
                    value={formData.stateId || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Claimant Phone
                  </label>
                  <input
                    type="text"
                    name="claimantPhone"
                    value={formData.claimantPhone || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Claimant Fax
                  </label>
                  <input
                    type="text"
                    name="claimantFax"
                    value={formData.claimantFax || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Claimant Name
                  </label>
                  <input
                    type="text"
                    name="claimantName"
                    value={formData.claimantName || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Claimant Job Title
                  </label>
                  <input
                    type="text"
                    name="claimantJobTitle"
                    value={formData.claimantJobTitle || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date Claim Was Signed
                  </label>
                  <input
                    type="date"
                    name="dateClaimWasSigned"
                    value={formData.dateClaimWasSigned || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notification Given To
                  </label>
                  <input
                    type="text"
                    name="notificationOfLossDamageGivenTo"
                    value={formData.notificationOfLossDamageGivenTo || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notification Given At
                  </label>
                  <input
                    type="text"
                    name="notificationOfLossDamageGivenAt"
                    value={formData.notificationOfLossDamageGivenAt || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notification Method
                  </label>
                  <input
                    type="text"
                    name="notificationOfLossDamageGivenByWhatMethod"
                    value={formData.notificationOfLossDamageGivenByWhatMethod || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notification Date
                  </label>
                  <input
                    type="date"
                    name="notificationOfLossDamageGivenOn"
                    value={formData.notificationOfLossDamageGivenOn || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Weight
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="totalWeight"
                    value={formData.totalWeight || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="quantity"
                    value={formData.quantity || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="totalValue"
                    value={formData.totalValue || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Claimant Address
                </label>
                <textarea
                  name="claimantAddress"
                  value={formData.claimantAddress || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Commodity Lost/Damaged
                </label>
                <textarea
                  name="commodityLostDamaged"
                  value={formData.commodityLostDamaged || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Damage Description
                </label>
                <textarea
                  name="damageDescription"
                  value={formData.damageDescription || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Claim Attachment {num}
                    </label>
                    
                    {formData[`claimAttachmentUpload${num}` as keyof FreightLossDamageClaim] && (
                      <div className="mb-2 text-sm text-green-600">
                        Current file: {formData[`claimAttachmentUpload${num}` as keyof FreightLossDamageClaim]}
                      </div>
                    )}
                    
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, `attachment${num}`)}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    
                    {uploadFiles[`attachment${num}` as keyof typeof uploadFiles] && (
                      <div className="mt-2 text-sm text-blue-600">
                        Selected: {uploadFiles[`attachment${num}` as keyof typeof uploadFiles]?.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Uploaded Attachments</h4>
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

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200"></div>
            <Link
              href="/project-management/freight-loss-damage-claims"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            {permissions && hasPermission(permissions, 'ProjectManagement', 'Read') && (
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isNew ? 'Create Claim' : 'Update Claim')}
              </button>
            )}
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
