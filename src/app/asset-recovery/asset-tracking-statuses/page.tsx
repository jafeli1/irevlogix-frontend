'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../utils/rbac';

interface AssetTrackingStatus {
  id: number;
  statusName: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  colorCode: string;
  dateCreated: string;
  dateUpdated: string;
  createdBy: number;
  updatedBy: number;
}

interface Filters {
  statusName: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export default function AssetTrackingStatusesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [assetTrackingStatuses, setAssetTrackingStatuses] = useState<AssetTrackingStatus[]>([]);
  const [filters, setFilters] = useState<Filters>({
    statusName: ''
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });

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

  const fetchAssetTrackingStatuses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (filters.statusName) {
        queryParams.append('statusName', filters.statusName);
      }

      const response = await fetch(`/api/assettrackingstatuses?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
        
        setAssetTrackingStatuses(data);
        setPagination(prev => ({
          ...prev,
          totalCount,
          totalPages: Math.ceil(totalCount / prev.pageSize)
        }));
      }
    } catch (error) {
      console.error('Failed to fetch asset tracking statuses:', error);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  useEffect(() => {
    if (!loading) {
      fetchAssetTrackingStatuses();
    }
  }, [loading, fetchAssetTrackingStatuses]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Status Name', 'Description', 'Active', 'Sort Order', 'Color Code', 'Date Created', 'Date Updated'];
    const csvContent = [
      headers.join(','),
      ...assetTrackingStatuses.map(status => [
        status.id,
        `"${status.statusName}"`,
        `"${status.description || ''}"`,
        status.isActive ? 'Yes' : 'No',
        status.sortOrder,
        `"${status.colorCode || ''}"`,
        new Date(status.dateCreated).toLocaleDateString(),
        new Date(status.dateUpdated).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asset-tracking-statuses.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
        <h1 className="text-3xl font-bold text-gray-900">Asset Tracking Statuses</h1>
        <p className="mt-2 text-gray-600">Manage asset tracking status definitions and configurations</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label htmlFor="statusName" className="block text-sm font-medium text-gray-700 mb-1">
                  Status Name
                </label>
                <input
                  type="text"
                  id="statusName"
                  name="statusName"
                  value={filters.statusName}
                  onChange={handleFilterChange}
                  placeholder="Filter by status name..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Export CSV
              </button>
              <Link
                href="/asset-recovery/asset-tracking-status-detail/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add New Status
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assetTrackingStatuses.map((status) => (
                <tr key={status.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {status.statusName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {status.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {status.sortOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {status.colorCode ? (
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-2 border border-gray-300"
                          style={{ backgroundColor: status.colorCode }}
                        ></div>
                        {status.colorCode}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      status.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {status.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/asset-recovery/asset-tracking-status-detail/${status.id}`}
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

        {assetTrackingStatuses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No asset tracking statuses found.</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
              {pagination.totalCount} results
            </span>
            <select
              value={pagination.pageSize}
              onChange={handlePageSizeChange}
              className="ml-4 px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
