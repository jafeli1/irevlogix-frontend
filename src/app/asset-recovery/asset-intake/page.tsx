'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AssetCategory {
  id: number;
  name: string;
}

interface AssetTrackingStatus {
  id: number;
  statusName: string;
}
interface UserSummary {
  id?: number;
  Id?: number;
  name?: string;
  fullName?: string;
  email?: string;
}


export default function AssetIntakePage() {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [auditFiles, setAuditFiles] = useState<File[]>([]);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  const [statuses, setStatuses] = useState<AssetTrackingStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'basic' | 'data' | 'audit' | 'coc' | 'bulk'>('basic');
  const generateAssetId = () => {
    const now = new Date();
    const yyyy = now.getUTCFullYear().toString();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const datePart = `${yyyy}${mm}${dd}`;
    const seq = Math.floor(Math.random() * 100000);
    return `AST-${datePart}-${String(seq).padStart(5, '0')}`;
  };

  const [formData, setFormData] = useState({
    assetID: '',
    assetCategoryId: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    condition: 'Good',
    estimatedValue: '',
    isDataBearing: false,
    storageDeviceType: '',
    dataSanitizationStatus: 'Not Required',
    currentLocation: '',
    currentStatusId: '',
    notes: '',
    description: '',
    dataSanitizationMethod: '',
    storageCapacity: '',
    internalAuditNotes: '',
    internalAuditScore: '',
    receivedBy: '',
    receivedLocation: '',
    receivingTimestamp: '',
    initialDisposition: ''
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      assetID: generateAssetId(),
      receivingTimestamp: new Date().toISOString().slice(0, 16)
    }));
    fetchCategories();
    fetchStatuses();
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('https://irevlogix-backend.onrender.com/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };


  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('https://irevlogix-backend.onrender.com/api/assetcategories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchStatuses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('https://irevlogix-backend.onrender.com/api/assettracking/statuses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatuses(data);
      }
    } catch (error) {
      console.error('Failed to fetch statuses');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (formData.dataSanitizationMethod === 'Physical Destruction' && evidenceFiles.length === 0) {
      setLoading(false);
      setError('Physical Destruction requires photo/video evidence.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const submitData = {
        ...formData,
        assetCategoryId: formData.assetCategoryId ? parseInt(formData.assetCategoryId) : null,
        currentStatusId: formData.currentStatusId ? parseInt(formData.currentStatusId) : null,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null
      };

      const response = await fetch('https://irevlogix-backend.onrender.com/api/Assets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        interface CreatedAssetResponse { id?: number; Id?: number }
        const created: CreatedAssetResponse = await response.json().catch(() => ({} as CreatedAssetResponse));
        const assetId = created?.id ?? created?.Id;
        try {
          const token2 = localStorage.getItem('token');
          if (assetId && token2 && certificateFile) {
            const fd = new FormData();
            fd.append('file', certificateFile);
            fd.append('description', 'Data Sanitization Certificate');
            await fetch(`https://irevlogix-backend.onrender.com/api/Assets/${assetId}/documents`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token2}` },
              body: fd
            });
          }
          if (assetId && token2 && evidenceFiles.length > 0) {
            for (const f of evidenceFiles) {
              const fd = new FormData();
              fd.append('file', f);
              fd.append('description', 'Physical Destruction Evidence');
              await fetch(`https://irevlogix-backend.onrender.com/api/Assets/${assetId}/documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token2}` },
                body: fd
              });
            }
          }
          if (assetId && token2 && auditFiles.length > 0) {
            for (const f of auditFiles) {
              const fd = new FormData();
              fd.append('file', f);
              fd.append('description', 'Audit Media');
              await fetch(`https://irevlogix-backend.onrender.com/api/Assets/${assetId}/documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token2}` },
                body: fd
              });
            }
          }
        } catch {}
        setSuccess('Asset created successfully!');
        setFormData({
          assetID: '',
          assetCategoryId: '',
          manufacturer: '',
          model: '',
          serialNumber: '',
          condition: 'Good',
          estimatedValue: '',
          isDataBearing: false,
          storageDeviceType: '',
          dataSanitizationStatus: 'Not Required',
          currentLocation: '',
          currentStatusId: '',
          notes: '',
          description: '',
          dataSanitizationMethod: '',
          storageCapacity: '',
          internalAuditNotes: '',
          internalAuditScore: '',
          receivedBy: '',
          receivedLocation: '',
          receivingTimestamp: new Date().toISOString().slice(0, 16),
          initialDisposition: ''
        });
        setCertificateFile(null);
        setEvidenceFiles([]);
        setAuditFiles([]);
        setTimeout(() => {
          router.push('/asset-recovery/asset-tracking');
        }, 2000);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        const errorData = await response.text();
        setError(errorData || 'Failed to create asset');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Asset Intake</h1>
          <p className="mt-2 text-gray-600">Register new assets for recovery and tracking</p>
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
            <div className="border-b border-gray-200 mt-2">
              <nav className="-mb-px flex space-x-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('data')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'data' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Data Bearing
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'audit' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Visual &amp; Internal Audit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('coc')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'coc' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Chain of Custody
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bulk')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'bulk' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Bulk Upload
                </button>
              </nav>
            </div>

{activeTab === 'basic' && (
            <>
              <div className="mb-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">AI Suggestion — Automated Asset Categorization &amp; Value Estimation:</span>
                  Using uploaded images or descriptions, AI will suggest Asset Category, Manufacturer, Model, and an initial value estimate. (Placeholder — feature coming soon)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="assetID" className="block text-sm font-medium text-gray-700">
                    Asset ID *
                </label>
                <input
                  type="text"
                  id="assetID"
                  name="assetID"
                  required
                  value={formData.assetID}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter unique asset identifier"
                />
              </div>

              <div>
                <label htmlFor="assetCategoryId" className="block text-sm font-medium text-gray-700">
                  Asset Category
                </label>
                <select
                  id="assetCategoryId"
                  name="assetCategoryId"
                  value={formData.assetCategoryId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">
                  Manufacturer
                </label>
                <input
                  type="text"
                  id="manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Dell, HP, Apple"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Latitude 7420, MacBook Pro"
                />
              </div>

              <div>
                <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">
                  Serial Number
                </label>
                <input
                  type="text"
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter serial number"
                />
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                  Condition
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <div>
                <label htmlFor="estimatedValue" className="block text-sm font-medium text-gray-700">
                  Estimated Value ($)
                </label>
                <input
                  type="number"
                  id="estimatedValue"
                  name="estimatedValue"
                  step="0.01"
                  min="0"
                  value={formData.estimatedValue}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="currentLocation" className="block text-sm font-medium text-gray-700">
                  Current Location
                </label>
                <input
                  type="text"
                  id="currentLocation"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Warehouse A, Dock 3"
                />
              </div>

              <div>
                <label htmlFor="currentStatusId" className="block text-sm font-medium text-gray-700">
                  Current Status
                </label>
                <select
                  id="currentStatusId"
                  name="currentStatusId"
                  value={formData.currentStatusId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Status</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.statusName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            </>
          )}


            <div className="flex items-center justify-between">
</div>

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDataBearing_tab"
                  name="isDataBearing"
                  checked={formData.isDataBearing}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDataBearing_tab" className="ml-2 block text-sm text-gray-900">
                  This asset contains data storage devices
                </label>
              </div>

              {formData.isDataBearing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="storageDeviceType_tab" className="block text-sm font-medium text-gray-700">
                      Storage Device Type
                    </label>
                    <select
                      id="storageDeviceType_tab"
                      name="storageDeviceType"
                      value={formData.storageDeviceType}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="HDD">Hard Disk Drive (HDD)</option>
                      <option value="SSD">Solid State Drive (SSD)</option>
                      <option value="NVMe">NVMe</option>
                      <option value="USB">USB</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="storageCapacity_tab" className="block text-sm font-medium text-gray-700">
                      Storage Capacity
                    </label>
                    <input
                      type="number"
                      id="storageCapacity_tab"
                      name="storageCapacity"
                      step="0.01"
                      min="0"
                      value={formData.storageCapacity}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 512"
                    />
                  </div>

                  <div>
                    <label htmlFor="dataSanitizationMethod_tab" className="block text-sm font-medium text-gray-700">
                      Data Sanitization Method
                    </label>
                    <select
                      id="dataSanitizationMethod_tab"
                      name="dataSanitizationMethod"
                      value={formData.dataSanitizationMethod}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Method</option>
                      <option value="DoD 5220.22-M">DoD 5220.22-M</option>
                      <option value="NIST 800-88">NIST 800-88</option>
                      <option value="Physical Destruction">Physical Destruction</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dataSanitizationStatus_tab" className="block text-sm font-medium text-gray-700">
                      Data Sanitization Status
                    </label>
                    <select
                      id="dataSanitizationStatus_tab"
                      name="dataSanitizationStatus"
                      value={formData.dataSanitizationStatus}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="Not Required">Not Required</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="dataSanitizationCertificate_tab" className="block text-sm font-medium text-gray-700">
                      Data Sanitization Certificate
                    </label>
                    <input
                      type="file"
                      id="dataSanitizationCertificate_tab"
                      name="dataSanitizationCertificate"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />

                  </div>

                  {formData.dataSanitizationMethod === 'Physical Destruction' && (
                    <div className="md:col-span-2">
                      <label htmlFor="evidence_tab" className="block text-sm font-medium text-gray-700">
                        Physical Destruction Evidence (Photo/Video)
                      </label>
                      <input
                        type="file"
                        id="evidence_tab"
                        name="evidence"
                        multiple
                        onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photos/Videos</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="audit-files" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload media</span>
                        <input
                          id="audit-files"
                          name="audit-files"
                          type="file"
                          multiple
                          accept=".jpg,.jpeg,.png,.mp4,.mov"
                          className="sr-only"
                          onChange={(e) => setAuditFiles(Array.from(e.target.files || []))}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">Images or videos up to 50MB each</p>
                  </div>
                </div>
                {auditFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected files:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {auditFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setAuditFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="internalAuditNotes" className="block text-sm font-medium text-gray-700">
                  Internal Audit Notes
                </label>
                <textarea
                  id="internalAuditNotes"
                  name="internalAuditNotes"
                  rows={4}
                  value={formData.internalAuditNotes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notes from internal audit..."
                />
              </div>
              <div>
                <label htmlFor="internalAuditScore" className="block text-sm font-medium text-gray-700">
                  Internal Audit Score
                </label>
                <input
                  type="number"
                  id="internalAuditScore"
                  name="internalAuditScore"
                  value={formData.internalAuditScore}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 8"
                />
              </div>
            </div>
          )}

          {activeTab === 'coc' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="receivedBy" className="block text-sm font-medium text-gray-700">Received By</label>
                  <select
                    id="receivedBy"
                    name="receivedBy"
                    value={formData.receivedBy}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select User</option>
                    {users.map((u: UserSummary) => (
                      <option key={u.id || u.Id} value={(u.id || u.Id) as string | number}>
                        {u.name || u.fullName || u.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="receivedLocation" className="block text-sm font-medium text-gray-700">Received Location</label>
                  <input
                    type="text"
                    id="receivedLocation"
                    name="receivedLocation"
                    value={formData.receivedLocation}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Facility / Dock / Room"
                  />
                </div>
                <div>
                  <label htmlFor="receivingTimestamp" className="block text-sm font-medium text-gray-700">Receiving Timestamp</label>
                  <input
                    type="datetime-local"
                    id="receivingTimestamp"
                    name="receivingTimestamp"
                    value={formData.receivingTimestamp}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="initialDisposition" className="block text-sm font-medium text-gray-700">Initial Disposition</label>
                  <select
                    id="initialDisposition"
                    name="initialDisposition"
                    value={formData.initialDisposition}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Disposition</option>
                    <option value="To Audit">To Audit</option>
                    <option value="To Repair">To Repair</option>
                    <option value="To Data Destruction">To Data Destruction</option>
                    <option value="To Resale Inventory">To Resale Inventory</option>
                    <option value="To Certified Recycling">To Certified Recycling</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV/Excel File</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="bulk-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input
                          id="bulk-upload"
                          name="bulk-upload"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLSX up to 10MB</p>
                  </div>
                </div>
                {bulkFile && <p className="mt-2 text-sm text-gray-600">Selected: {bulkFile.name}</p>}
              </div>
              <div>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Template download feature coming soon');
                  }}
                >
                  Download Template
                </a>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Expected columns:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>AssetID</li>
                  <li>AssetCategory</li>
                  <li>Manufacturer</li>
                  <li>Model</li>
                  <li>SerialNumber</li>
                  <li>Description</li>
                  <li>OriginalPurchaseDate</li>
                  <li>OriginalCost</li>
                  <li>Condition</li>
                  <li>EstimatedValue</li>
                  <li>IsDataBearing</li>
                  <li>StorageDeviceType</li>
                  <li>StorageCapacity</li>
                  <li>DataSanitizationMethod</li>
                  <li>DataSanitizationStatus</li>
                  <li>ReceivedBy</li>
                  <li>ReceivedLocation</li>
                  <li>ReceivingTimestamp</li>
                  <li>InitialDisposition</li>
                </ul>
              </div>
            </div>
          )}



          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-3">
              <input id="bulkUploadInput" type="file" accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" />
              <button
                type="button"
                onClick={() => document.getElementById('bulkUploadInput')?.click()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Bulk Upload (CSV/Excel)
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    assetID: generateAssetId(),
                    manufacturer: '',
                    model: '',
                    serialNumber: '',
                    estimatedValue: '',
                    notes: ''
                  }));
                  setSuccess('Saved. Ready for next asset.');
                  setTimeout(() => setSuccess(''), 2000);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save &amp; Add Next
              </button>
              <button
                type="button"
                onClick={() => router.push('/asset-recovery/asset-tracking')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Asset'}
              </button>

            </div>
          </div>




          </form>
        </div>
    </>
  );
}
