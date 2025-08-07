'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';

interface AssetCategory {
  id: number;
  name: string;
}

interface AssetTrackingStatus {
  id: number;
  statusName: string;
}

export default function AssetIntakeAuditPage() {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [statuses, setStatuses] = useState<AssetTrackingStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

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
    notes: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchStatuses();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('https://irevlogix-backend.onrender.com/api/AssetCategories', {
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

      const response = await fetch('https://irevlogix-backend.onrender.com/api/AssetTracking/statuses', {
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
          notes: ''
        });
        setTimeout(() => {
          router.push('/asset-recovery/tracking');
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
    <AppLayout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Asset Intake & Audit</h1>
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

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDataBearing"
                  name="isDataBearing"
                  checked={formData.isDataBearing}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDataBearing" className="ml-2 block text-sm text-gray-900">
                  This asset contains data storage devices
                </label>
              </div>

              {formData.isDataBearing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="storageDeviceType" className="block text-sm font-medium text-gray-700">
                      Storage Device Type
                    </label>
                    <select
                      id="storageDeviceType"
                      name="storageDeviceType"
                      value={formData.storageDeviceType}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="HDD">Hard Disk Drive (HDD)</option>
                      <option value="SSD">Solid State Drive (SSD)</option>
                      <option value="Hybrid">Hybrid Drive</option>
                      <option value="Flash">Flash Storage</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dataSanitizationStatus" className="block text-sm font-medium text-gray-700">
                      Data Sanitization Status
                    </label>
                    <select
                      id="dataSanitizationStatus"
                      name="dataSanitizationStatus"
                      value={formData.dataSanitizationStatus}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Not Required">Not Required</option>
                      <option value="Required">Required</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Certified">Certified</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about the asset..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/asset-recovery/tracking')}
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
          </form>
        </div>
    </AppLayout>
  );
}
