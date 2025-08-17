'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../../utils/rbac';

interface AssetTrackingStatus {
  id: number;
  statusName: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  colorCode: string;
  clientId: string;
  dateCreated: string;
  dateUpdated: string;
  createdBy: number;
  updatedBy: number;
}

interface Client {
  id: number;
  clientId: string;
  companyName: string;
}

interface FormData {
  statusName: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  colorCode: string;
  clientId: string;
}

export default function AssetTrackingStatusDetailPage() {
  const router = useRouter();
  const params = useParams();
  const statusId = params.id as string;
  const isNew = statusId === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [status, setStatus] = useState<AssetTrackingStatus | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    statusName: '',
    description: '',
    isActive: true,
    sortOrder: 0,
    colorCode: '',
    clientId: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const checkPermissions = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const userPermissions = await fetchUserPermissions(token);
    setPermissions(userPermissions);

    if (!hasPermission(userPermissions, 'AssetRecovery', 'Read')) {
      router.push('/dashboard');
      return;
    }

    setLoading(false);
  }, [router]);

  const fetchClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (isNew) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/assettrackingstatuses/${statusId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setFormData({
          statusName: data.statusName,
          description: data.description || '',
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          colorCode: data.colorCode || '',
          clientId: data.clientId
        });
      } else if (response.status === 404) {
        setMessage({ type: 'error', text: 'Asset tracking status not found' });
      }
    } catch (error) {
      console.error('Failed to fetch asset tracking status:', error);
      setMessage({ type: 'error', text: 'Failed to load asset tracking status' });
    }
  }, [statusId, isNew]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  useEffect(() => {
    if (!loading) {
      fetchClients();
      fetchStatus();
    }
  }, [loading, fetchClients, fetchStatus]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.statusName.trim()) {
      newErrors.statusName = 'Status name is required';
    }

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (formData.sortOrder < 0) {
      newErrors.sortOrder = 'Sort order must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               name === 'sortOrder' ? parseInt(value) || 0 : value
    }));

    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = isNew ? '/api/assettrackingstatuses' : `/api/assettrackingstatuses/${statusId}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Asset tracking status ${isNew ? 'created' : 'updated'} successfully` 
        });
        
        if (isNew) {
          setTimeout(() => {
            router.push('/asset-recovery/asset-tracking-statuses');
          }, 1500);
        }
      } else {
        const errorText = await response.text();
        setMessage({ type: 'error', text: errorText || 'Failed to save asset tracking status' });
      }
    } catch (error) {
      console.error('Failed to save asset tracking status:', error);
      setMessage({ type: 'error', text: 'Failed to save asset tracking status' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!status || !confirm('Are you sure you want to delete this asset tracking status?')) {
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/assettrackingstatuses/${statusId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Asset tracking status deleted successfully' });
        setTimeout(() => {
          router.push('/asset-recovery/asset-tracking-statuses');
        }, 1500);
      } else {
        const errorText = await response.text();
        setMessage({ type: 'error', text: errorText || 'Failed to delete asset tracking status' });
      }
    } catch (error) {
      console.error('Failed to delete asset tracking status:', error);
      setMessage({ type: 'error', text: 'Failed to delete asset tracking status' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNew ? 'Create Asset Tracking Status' : 'Edit Asset Tracking Status'}
            </h1>
            <p className="mt-2 text-gray-600">
              {isNew ? 'Add a new asset tracking status' : 'Update asset tracking status information'}
            </p>
          </div>
          <Link
            href="/asset-recovery/asset-tracking-statuses"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to List
          </Link>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="statusName" className="block text-sm font-medium text-gray-700 mb-1">
                Status Name *
              </label>
              <input
                type="text"
                id="statusName"
                name="statusName"
                value={formData.statusName}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.statusName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter status name"
              />
              {errors.statusName && (
                <p className="mt-1 text-sm text-red-600">{errors.statusName}</p>
              )}
            </div>

            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                Client *
              </label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.clientId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.clientId}>
                    {client.companyName}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
              )}
            </div>

            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                id="sortOrder"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleInputChange}
                min="0"
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.sortOrder ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.sortOrder && (
                <p className="mt-1 text-sm text-red-600">{errors.sortOrder}</p>
              )}
            </div>

            <div>
              <label htmlFor="colorCode" className="block text-sm font-medium text-gray-700 mb-1">
                Color Code
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="colorCode"
                  name="colorCode"
                  value={formData.colorCode || '#000000'}
                  onChange={handleInputChange}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.colorCode}
                  onChange={handleInputChange}
                  name="colorCode"
                  placeholder="#000000"
                  className="block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter status description"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          {!isNew && status && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Created</label>
                <p className="text-sm text-gray-900">{new Date(status.dateCreated).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Updated</label>
                <p className="text-sm text-gray-900">{new Date(status.dateUpdated).toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div>
              {!isNew && hasPermission(permissions, 'AssetRecovery', 'Delete') && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Status'}
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <Link
                href="/asset-recovery/asset-tracking-statuses"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isNew ? 'Create Status' : 'Update Status')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
