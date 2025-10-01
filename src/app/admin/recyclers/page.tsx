'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../utils/rbac';

interface Recycler {
  id: number;
  companyName: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  materialTypesHandled: string;
  certificationType: string;
  servicesOffered: string;
  dateCreated: string;
  dateUpdated: string;
}

interface Filters {
  companyName: string;
  materialTypesHandled: string;
  certificationType: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export default function AdminRecyclersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [recyclers, setRecyclers] = useState<Recycler[]>([]);
  const [filters, setFilters] = useState<Filters>({
    companyName: '',
    materialTypesHandled: '',
    certificationType: ''
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });

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

  const fetchRecyclers = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filters.companyName && { companyName: filters.companyName }),
        ...(filters.materialTypesHandled && { materialTypesHandled: filters.materialTypesHandled }),
        ...(filters.certificationType && { certificationType: filters.certificationType })
      });

      const response = await fetch(`/api/admin/recyclers?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recyclers');
      }

      const data = await response.json();
      const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
      setRecyclers(data);
      setPagination(prev => ({
        ...prev,
        totalCount,
        totalPages: Math.ceil(totalCount / prev.pageSize)
      }));
    } catch (error) {
      console.error('Error fetching recyclers:', error);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  useEffect(() => {
    if (!loading && permissions && hasPermission(permissions, 'Administration', 'Read')) {
      fetchRecyclers();
    }
  }, [loading, permissions, fetchRecyclers]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      companyName: '',
      materialTypesHandled: '',
      certificationType: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Recycler ID', 'Company Name', 'Address', 'Material Types Handled', 'Services Offered'].join(','),
      ...recyclers.map(recycler => [
        recycler.id,
        `"${recycler.companyName}"`,
        `"${recycler.address || 'N/A'}"`,
        `"${recycler.materialTypesHandled || 'N/A'}"`,
        `"${recycler.servicesOffered || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `recyclers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recycler Management</h1>
          <div className="flex space-x-4">
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Export CSV
            </button>
            <Link
              href="/admin/recycler-detail/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add New Recycler
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={filters.companyName}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label htmlFor="materialTypesHandled" className="block text-sm font-medium text-gray-700 mb-1">
                  Material Types Handled
                </label>
                <input
                  type="text"
                  id="materialTypesHandled"
                  name="materialTypesHandled"
                  value={filters.materialTypesHandled}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter material types"
                />
              </div>
              <div>
                <label htmlFor="certificationType" className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Type
                </label>
                <select
                  id="certificationType"
                  name="certificationType"
                  value={filters.certificationType}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Certifications</option>
                  <option value="R2">R2</option>
                  <option value="e-Stewards">e-Stewards</option>
                  <option value="ISO 14001">ISO 14001</option>
                  <option value="NAID AAA">NAID AAA</option>
                  <option value="ISO 45001">ISO 45001</option>
                  <option value="ISO 9001">ISO 9001</option>
                  <option value="RIOS">RIOS</option>
                  <option value="APR PCR">APR PCR</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material Types Handled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services Offered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recyclers.map(recycler => (
                  <tr key={recycler.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {recycler.companyName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{recycler.address || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{recycler.materialTypesHandled || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{recycler.servicesOffered || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/recycler-detail/${recycler.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recyclers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No recyclers found matching the current filters.</p>
            </div>
          )}

          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.totalCount)}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalCount}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
