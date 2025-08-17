'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../../utils/rbac';

interface AssetCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  defaultDisposition: string;
  requiresDataSanitization: boolean;
  requiresDataDestruction: boolean;
  isRecoverable: boolean;
  parentCategory: string;
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
  name: string;
  description: string;
  isActive: boolean;
  defaultDisposition: string;
  requiresDataSanitization: boolean;
  requiresDataDestruction: boolean;
  isRecoverable: boolean;
  parentCategory: string;
  clientId: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function AssetCategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const isNewCategory = categoryId === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isActive: true,
    defaultDisposition: '',
    requiresDataSanitization: false,
    requiresDataDestruction: false,
    isRecoverable: true,
    parentCategory: '',
    clientId: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        const userPermissions = await fetchUserPermissions(token);
        setPermissions(userPermissions);
        if (!hasPermission(userPermissions, 'AssetRecovery', 'Read')) {
          router.push('/unauthorized');
          return;
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        router.push('/login');
        return;
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [router]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []);

  const fetchAssetCategory = useCallback(async () => {
    try {
      const response = await fetch(`/api/assetcategories/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch asset category');
      }

      const category: AssetCategory = await response.json();
      setFormData({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive,
        defaultDisposition: category.defaultDisposition || '',
        requiresDataSanitization: category.requiresDataSanitization,
        requiresDataDestruction: category.requiresDataDestruction,
        isRecoverable: category.isRecoverable,
        parentCategory: category.parentCategory || '',
        clientId: category.clientId
      });
    } catch (error) {
      console.error('Error fetching asset category:', error);
    }
  }, [categoryId]);

  useEffect(() => {
    if (!loading && permissions && hasPermission(permissions, 'AssetRecovery', 'Read')) {
      fetchClients();
      if (!isNewCategory) {
        fetchAssetCategory();
      }
    }
  }, [loading, permissions, categoryId, isNewCategory, fetchAssetCategory, fetchClients]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSuccessMessage('');

    try {
      const url = isNewCategory ? '/api/assetcategories' : `/api/assetcategories/${categoryId}`;
      const method = isNewCategory ? 'POST' : 'PUT';

      const requestData = {
        ...(isNewCategory ? {} : { id: parseInt(categoryId) }),
        name: formData.name,
        description: formData.description || null,
        isActive: formData.isActive,
        defaultDisposition: formData.defaultDisposition || null,
        requiresDataSanitization: formData.requiresDataSanitization,
        requiresDataDestruction: formData.requiresDataDestruction,
        isRecoverable: formData.isRecoverable,
        parentCategory: formData.parentCategory || null,
        clientId: formData.clientId
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to save asset category');
      }

      setSuccessMessage(isNewCategory ? 'Asset category created successfully!' : 'Asset category updated successfully!');
      
      if (isNewCategory) {
        setTimeout(() => {
          router.push('/asset-recovery/asset-categories');
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving asset category:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save asset category' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this asset category? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/assetcategories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete asset category');
      }

      router.push('/asset-recovery/asset-categories');
    } catch (error) {
      console.error('Error deleting asset category:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to delete asset category' });
    } finally {
      setDeleting(false);
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

  if (!permissions || !hasPermission(permissions, 'AssetRecovery', 'Read')) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 text-xl">Access Denied: You do not have permission to view this page.</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isNewCategory ? 'Add New Asset Category' : 'Edit Asset Category'}
          </h1>
          <Link
            href="/asset-recovery/asset-categories"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Asset Categories
          </Link>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter category name"
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clientId ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.clientId} value={client.clientId}>
                    {client.companyName}
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category description"
              />
            </div>

            <div>
              <label htmlFor="defaultDisposition" className="block text-sm font-medium text-gray-700 mb-1">
                Default Disposition
              </label>
              <select
                id="defaultDisposition"
                name="defaultDisposition"
                value={formData.defaultDisposition}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select disposition</option>
                <option value="Reuse">Reuse</option>
                <option value="Resale">Resale</option>
                <option value="Recycle">Recycle</option>
              </select>
            </div>

            <div>
              <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category
              </label>
              <input
                type="text"
                id="parentCategory"
                name="parentCategory"
                value={formData.parentCategory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter parent category"
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Category Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Is Active
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRecoverable"
                    name="isRecoverable"
                    checked={formData.isRecoverable}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isRecoverable" className="ml-2 block text-sm text-gray-900">
                    Is Recoverable
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresDataSanitization"
                    name="requiresDataSanitization"
                    checked={formData.requiresDataSanitization}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresDataSanitization" className="ml-2 block text-sm text-gray-900">
                    Requires Data Sanitization
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresDataDestruction"
                    name="requiresDataDestruction"
                    checked={formData.requiresDataDestruction}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresDataDestruction" className="ml-2 block text-sm text-gray-900">
                    Requires Data Destruction
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <div>
              {!isNewCategory && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Category'}
                </button>
              )}
            </div>
            <div className="flex space-x-4">
              <Link
                href="/asset-recovery/asset-categories"
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isNewCategory ? 'Create Category' : 'Update Category')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
