'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../../utils/rbac';

interface Recycler {
  id: number;
  companyName: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  materialTypesHandled?: string;
  certificationType?: string;
  servicesOffered?: string;
  dateCreated: string;
  dateUpdated: string;
  createdBy: number;
  updatedBy: number;
}

interface FormData {
  companyName: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  materialTypesHandled: string;
  certificationType: string[];
  servicesOffered: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const CERTIFICATION_OPTIONS = [
  'R2',
  'e-Stewards',
  'ISO 14001',
  'NAID AAA',
  'ISO 45001',
  'ISO 9001',
  'RIOS',
  'APR PCR'
];

export default function RecyclerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recyclerId = params.id as string;
  const isNewRecycler = recyclerId === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [recycler, setRecycler] = useState<Recycler | null>(null);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
    materialTypesHandled: '',
    certificationType: [],
    servicesOffered: ''
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
        if (!hasPermission(userPermissions, 'Administration', 'Read')) {
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

  const fetchRecycler = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/recyclers/${recyclerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recycler');
      }

      const data = await response.json();
      setRecycler(data);
      
      const certifications = data.certificationType 
        ? data.certificationType.split(',').map((c: string) => c.trim()).filter((c: string) => c)
        : [];

      setFormData({
        companyName: data.companyName || '',
        address: data.address || '',
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        materialTypesHandled: data.materialTypesHandled || '',
        certificationType: certifications,
        servicesOffered: data.servicesOffered || ''
      });
    } catch (error) {
      console.error('Error fetching recycler:', error);
    }
  }, [recyclerId]);

  useEffect(() => {
    if (!loading && permissions && hasPermission(permissions, 'Administration', 'Read')) {
      if (!isNewRecycler) {
        fetchRecycler();
      }
    }
  }, [loading, permissions, recyclerId, isNewRecycler, fetchRecycler]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (formData.contactPhone && !/^\d{3}-\d{3}-\d{4}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Phone number must be in format: nnn-nnn-nnnn';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCertificationChange = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certificationType: prev.certificationType.includes(cert)
        ? prev.certificationType.filter(c => c !== cert)
        : [...prev.certificationType, cert]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSuccessMessage('');

    try {
      const url = isNewRecycler ? '/api/admin/recyclers' : `/api/admin/recyclers/${recyclerId}`;
      const method = isNewRecycler ? 'POST' : 'PUT';

      const requestData = {
        companyName: formData.companyName,
        address: formData.address || null,
        contactPhone: formData.contactPhone || null,
        contactEmail: formData.contactEmail || null,
        materialTypesHandled: formData.materialTypesHandled || null,
        certificationType: formData.certificationType.length > 0 
          ? formData.certificationType.join(', ')
          : null,
        servicesOffered: formData.servicesOffered || null
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
        throw new Error(errorData || 'Failed to save recycler');
      }

      setSuccessMessage(isNewRecycler ? 'Recycler created successfully!' : 'Recycler updated successfully!');
      
      if (isNewRecycler) {
        setTimeout(() => {
          router.push('/admin/recyclers');
        }, 2000);
      } else {
        fetchRecycler();
      }
    } catch (error) {
      console.error('Error saving recycler:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save recycler' });
    } finally {
      setSaving(false);
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

  if (!permissions || !hasPermission(permissions, 'Administration', 'Read')) {
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
            {isNewRecycler ? 'Add New Recycler' : 'Edit Recycler'}
          </h1>
          <Link
            href="/admin/recyclers"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Recyclers
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
          <div className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.companyName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter company name"
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="nnn-nnn-nnnn"
                />
                {errors.contactPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactPhone}</p>
                )}
              </div>

              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.contactEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="email@example.com"
                />
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="materialTypesHandled" className="block text-sm font-medium text-gray-700 mb-1">
                Material Types Handled
              </label>
              <textarea
                id="materialTypesHandled"
                name="materialTypesHandled"
                value={formData.materialTypesHandled}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter material types handled"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certification Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CERTIFICATION_OPTIONS.map((cert) => (
                  <label key={cert} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.certificationType.includes(cert)}
                      onChange={() => handleCertificationChange(cert)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{cert}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="servicesOffered" className="block text-sm font-medium text-gray-700 mb-1">
                Services Offered
              </label>
              <input
                type="text"
                id="servicesOffered"
                name="servicesOffered"
                value={formData.servicesOffered}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter services offered"
              />
            </div>

            {!isNewRecycler && recycler && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Created</label>
                    <input
                      type="text"
                      value={new Date(recycler.dateCreated).toLocaleString()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                    <input
                      type="text"
                      value={recycler.createdBy}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Updated</label>
                    <input
                      type="text"
                      value={new Date(recycler.dateUpdated).toLocaleString()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Updated By</label>
                    <input
                      type="text"
                      value={recycler.updatedBy}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin/recyclers"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : (isNewRecycler ? 'Create Recycler' : 'Update Recycler')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
