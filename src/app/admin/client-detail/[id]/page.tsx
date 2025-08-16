'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../../components/AppLayout';
import { hasPermission, fetchUserPermissions } from '../../../../utils/rbac';
import { US_STATES, COUNTRIES } from '../../../../utils/constants';

interface Client {
  id: number;
  clientId: string;
  companyName: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  clientType?: string;
  isActive: boolean;
  dateCreated: string;
  dateUpdated: string;
  createdBy: number;
  updatedBy: number;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const isNewClient = clientId === 'new';
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<Partial<Client>>({
    companyName: '',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    clientType: '',
    isActive: true
  });

  useEffect(() => {
    const checkPermissions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const permissions = await fetchUserPermissions(token);
        if (!hasPermission(permissions, 'clients', 'read')) {
          router.push('/unauthorized');
          return;
        }
      } catch {
        router.push('/login');
        return;
      }

      if (!isNewClient) {
        fetchClient();
      } else {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [router, clientId, isNewClient]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/Clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClient(data);
        setFormData(data);
      } else if (response.status === 404) {
        setError('Client not found');
      } else if (response.status === 403) {
        router.push('/unauthorized');
      } else {
        setError('Failed to fetch client details');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.companyName?.trim()) {
      setError('Company Name is required');
      return false;
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.contactPhone && !/^[\d\s\-\(\)\+\.]+$/.test(formData.contactPhone)) {
      setError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      
      const url = isNewClient 
        ? 'https://irevlogix-backend.onrender.com/api/Clients'
        : `https://irevlogix-backend.onrender.com/api/Clients/${clientId}`;
      
      const method = isNewClient ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        if (isNewClient) {
          const newClient = await response.json();
          setSuccess('Client created successfully!');
          router.push(`/admin/client-detail/${newClient.id}`);
        } else {
          setSuccess('Client updated successfully!');
          fetchClient();
        }
      } else if (response.status === 403) {
        router.push('/unauthorized');
      } else {
        setError('Failed to save client');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
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

  if (error && !isNewClient && !client) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto mt-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <div className="text-red-600 text-2xl">⚠</div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              {error}
            </h2>
            <div className="mt-6">
              <Link
                href="/admin/clients"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Clients
              </Link>
            </div>
          </div>
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
              {isNewClient ? 'Add New Client' : `Client: ${client?.companyName || 'Loading...'}`}
            </h1>
            <p className="mt-2 text-gray-600">
              {isNewClient ? 'Create a new client account' : 'View and edit client information'}
            </p>
          </div>
          <Link
            href="/admin/clients"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Clients
          </Link>
        </div>
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
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName || ''}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="clientType" className="block text-sm font-medium text-gray-700">
                Client Type
              </label>
              <input
                type="text"
                id="clientType"
                name="clientType"
                value={formData.clientType || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="contactFirstName" className="block text-sm font-medium text-gray-700">
                Contact First Name
              </label>
              <input
                type="text"
                id="contactFirstName"
                name="contactFirstName"
                value={formData.contactFirstName || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="contactLastName" className="block text-sm font-medium text-gray-700">
                Contact Last Name
              </label>
              <input
                type="text"
                id="contactLastName"
                name="contactLastName"
                value={formData.contactLastName || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                Contact Email
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                Contact Phone
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="address2" className="block text-sm font-medium text-gray-700">
                Address 2
              </label>
              <input
                type="text"
                id="address2"
                name="address2"
                value={formData.address2 || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                value={formData.city || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <select
                id="state"
                name="state"
                value={formData.state || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select State</option>
                {US_STATES.map(state => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <select
                id="country"
                name="country"
                value={formData.country || 'US'}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {COUNTRIES.map(country => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Is Active
                </label>
              </div>
            </div>
          </div>

          {!isNewClient && client && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client ID</label>
                  <p className="mt-1 text-sm text-gray-900">{client.clientId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Created</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(client.dateCreated)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(client.dateUpdated)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created By</label>
                  <p className="mt-1 text-sm text-gray-900">User ID: {client.createdBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Updated By</label>
                  <p className="mt-1 text-sm text-gray-900">User ID: {client.updatedBy}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
