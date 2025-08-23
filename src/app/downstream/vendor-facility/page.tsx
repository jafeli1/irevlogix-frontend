'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../utils/rbac';

interface VendorFacility {
  id: number;
  vendorId: number;
  vendorName: string;
  facilityLocation?: string;
  yearsInOperation?: number;
  description?: string;
  dateCreated: string;
  dateUpdated: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface Filters {
  vendorName: string;
  facilityLocation: string;
}

export default function VendorFacilityPage() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<VendorFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<Filters>({
    vendorName: '',
    facilityLocation: ''
  });

  const fetchFacilities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filters.vendorName && { vendorName: filters.vendorName }),
        ...(filters.facilityLocation && { facilityLocation: filters.facilityLocation })
      });

      const response = await fetch(`/api/vendorfacilities?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
        setFacilities(data);
        setPagination(prev => ({
          ...prev,
          totalCount,
          totalPages: Math.ceil(totalCount / prev.pageSize)
        }));
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching vendor facilities:', error);
    }
  }, [pagination.page, pagination.pageSize, filters, router]);

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
      
      if (userPermissions && hasPermission(userPermissions, 'DownstreamMaterials', 'Read')) {
        await fetchFacilities();
      }
      setLoading(false);
    };

    loadData();
  }, [fetchFacilities, router]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      vendorName: '',
      facilityLocation: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Facility ID', 'Vendor Name', 'Facility Location', 'Years in Operation', 'Description'].join(','),
      ...facilities.map(facility => [
        facility.id,
        facility.vendorName,
        facility.facilityLocation || '',
        facility.yearsInOperation || '',
        facility.description || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor-facilities.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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

  if (!permissions || !hasPermission(permissions, 'DownstreamMaterials', 'Read')) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don&apos;t have permission to view vendor facilities.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor Facilities</h1>
            <p className="mt-2 text-gray-600">Manage vendor facility information and compliance</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Export CSV
            </button>
            <Link
              href="/downstream/vendor-facility-detail/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add New Vendor Facility
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Vendor Facilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">
                Vendor Name
              </label>
              <input
                type="text"
                id="vendorName"
                name="vendorName"
                value={filters.vendorName}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by vendor name"
              />
            </div>
            <div>
              <label htmlFor="facilityLocation" className="block text-sm font-medium text-gray-700">
                Facility Location
              </label>
              <input
                type="text"
                id="facilityLocation"
                name="facilityLocation"
                value={filters.facilityLocation}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by facility location"
              />
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
                  Vendor Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facility Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Years in Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facilities.map((facility) => (
                <tr key={facility.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {facility.vendorName}
                    </div>
                    <div className="text-sm text-gray-500">ID: {facility.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {facility.facilityLocation || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {facility.yearsInOperation || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/downstream/vendor-facility-detail/${facility.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {facilities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No vendor facilities found.</p>
          </div>
        )}

        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{pagination.totalCount}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
