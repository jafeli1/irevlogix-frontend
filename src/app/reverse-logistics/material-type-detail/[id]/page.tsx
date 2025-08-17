'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../../utils/rbac';

interface MaterialType {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  defaultPricePerUnit: number;
  unitOfMeasure: string;
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
  defaultPricePerUnit: number;
  unitOfMeasure: string;
  clientId: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function MaterialTypeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const materialTypeId = params.id as string;
  const isNewMaterialType = materialTypeId === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isActive: true,
    defaultPricePerUnit: 0,
    unitOfMeasure: '',
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
        if (!hasPermission(userPermissions, 'ReverseLogistics', 'Read')) {
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

  const fetchMaterialType = useCallback(async () => {
    try {
      const response = await fetch(`/api/materialtypes/${materialTypeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch material type');
      }

      const materialType: MaterialType = await response.json();
      setFormData({
        name: materialType.name,
        description: materialType.description || '',
        isActive: materialType.isActive,
        defaultPricePerUnit: materialType.defaultPricePerUnit || 0,
        unitOfMeasure: materialType.unitOfMeasure || '',
        clientId: materialType.clientId
      });
    } catch (error) {
      console.error('Error fetching material type:', error);
    }
  }, [materialTypeId]);

  useEffect(() => {
    if (!loading && permissions && hasPermission(permissions, 'ReverseLogistics', 'Read')) {
      fetchClients();
      if (!isNewMaterialType) {
        fetchMaterialType();
      }
    }
  }, [loading, permissions, materialTypeId, isNewMaterialType, fetchMaterialType, fetchClients]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (formData.defaultPricePerUnit < 0) {
      newErrors.defaultPricePerUnit = 'Default price per unit cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
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
      const url = isNewMaterialType ? '/api/materialtypes' : `/api/materialtypes/${materialTypeId}`;
      const method = isNewMaterialType ? 'POST' : 'PUT';

      const requestData = {
        ...(isNewMaterialType ? {} : { id: parseInt(materialTypeId) }),
        name: formData.name,
        description: formData.description || null,
        isActive: formData.isActive,
        defaultPricePerUnit: formData.defaultPricePerUnit || null,
        unitOfMeasure: formData.unitOfMeasure || null,
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
        throw new Error(errorData || 'Failed to save material type');
      }

      setSuccessMessage(isNewMaterialType ? 'Material type created successfully!' : 'Material type updated successfully!');
      
      if (isNewMaterialType) {
        setTimeout(() => {
          router.push('/reverse-logistics/material-types');
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving material type:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save material type' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this material type? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/materialtypes/${materialTypeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete material type');
      }

      router.push('/reverse-logistics/material-types');
    } catch (error) {
      console.error('Error deleting material type:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to delete material type' });
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

  if (!permissions || !hasPermission(permissions, 'ReverseLogistics', 'Read')) {
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
            {isNewMaterialType ? 'Add New Material Type' : 'Edit Material Type'}
          </h1>
          <Link
            href="/reverse-logistics/material-types"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Material Types
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
                placeholder="Enter material type name"
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
                placeholder="Enter material type description"
              />
            </div>

            <div>
              <label htmlFor="unitOfMeasure" className="block text-sm font-medium text-gray-700 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                id="unitOfMeasure"
                name="unitOfMeasure"
                value={formData.unitOfMeasure}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="kg, lbs, pieces, etc."
              />
            </div>

            <div>
              <label htmlFor="defaultPricePerUnit" className="block text-sm font-medium text-gray-700 mb-1">
                Default Price Per Unit
              </label>
              <input
                type="number"
                id="defaultPricePerUnit"
                name="defaultPricePerUnit"
                value={formData.defaultPricePerUnit}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.defaultPricePerUnit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.defaultPricePerUnit && <p className="mt-1 text-sm text-red-600">{errors.defaultPricePerUnit}</p>}
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Material Type Settings</h3>
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
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <div>
              {!isNewMaterialType && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Material Type'}
                </button>
              )}
            </div>
            <div className="flex space-x-4">
              <Link
                href="/reverse-logistics/material-types"
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isNewMaterialType ? 'Create Material Type' : 'Update Material Type')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
