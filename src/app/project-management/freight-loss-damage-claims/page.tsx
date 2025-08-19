'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../utils/rbac';

interface FreightLossDamageClaim {
  id: number;
  freightLossDamageClaimId: number;
  description?: string;
  dateOfShipment?: string;
  dateOfClaim?: string;
  claimantCompanyName?: string;
  claimantCity?: string;
  stateId?: number;
  totalValue?: number;
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
  dateOfShipment: string;
  dateOfClaim: string;
  claimantCity: string;
  stateId: string;
}

export default function FreightLossDamageClaimsPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<FreightLossDamageClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<Filters>({
    dateOfShipment: '',
    dateOfClaim: '',
    claimantCity: '',
    stateId: ''
  });

  const fetchClaims = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filters.dateOfShipment && { dateOfShipment: filters.dateOfShipment }),
        ...(filters.dateOfClaim && { dateOfClaim: filters.dateOfClaim }),
        ...(filters.claimantCity && { claimantCity: filters.claimantCity }),
        ...(filters.stateId && { stateId: filters.stateId })
      });

      const response = await fetch(`/api/freightlossdamageclaims?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
        setClaims(data);
        setPagination(prev => ({
          ...prev,
          totalCount,
          totalPages: Math.ceil(totalCount / prev.pageSize)
        }));
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching freight loss damage claims:', error);
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
      
      if (userPermissions && hasPermission(userPermissions, 'ProjectManagement', 'Read')) {
        await fetchClaims();
      }
      setLoading(false);
    };

    loadData();
  }, [fetchClaims, router]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      dateOfShipment: '',
      dateOfClaim: '',
      claimantCity: '',
      stateId: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = () => {
    const csvContent = [
      ['ID', 'Claim ID', 'Description', 'Date of Shipment', 'Date of Claim', 'Company Name', 'City', 'Total Value'].join(','),
      ...claims.map(claim => [
        claim.id,
        claim.freightLossDamageClaimId,
        `"${claim.description || ''}"`,
        claim.dateOfShipment ? new Date(claim.dateOfShipment).toLocaleDateString() : '',
        claim.dateOfClaim ? new Date(claim.dateOfClaim).toLocaleDateString() : '',
        `"${claim.claimantCompanyName || ''}"`,
        `"${claim.claimantCity || ''}"`,
        claim.totalValue || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'freight-loss-damage-claims.csv';
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

  if (!permissions || !hasPermission(permissions, 'ProjectManagement', 'Read')) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don&apos;t have permission to view freight loss damage claims.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Freight Loss Damage Claims</h1>
            <p className="mt-2 text-gray-600">Manage freight loss and damage claims</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Export CSV
            </button>
            <Link
              href="/project-management/freight-loss-damage-claim-detail/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add New Claim
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Freight Loss Damage Claims</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="dateOfShipment" className="block text-sm font-medium text-gray-700">
                Date of Shipment
              </label>
              <input
                type="date"
                id="dateOfShipment"
                name="dateOfShipment"
                value={filters.dateOfShipment}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="dateOfClaim" className="block text-sm font-medium text-gray-700">
                Date of Claim
              </label>
              <input
                type="date"
                id="dateOfClaim"
                name="dateOfClaim"
                value={filters.dateOfClaim}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="claimantCity" className="block text-sm font-medium text-gray-700">
                Claimant City
              </label>
              <input
                type="text"
                id="claimantCity"
                name="claimantCity"
                value={filters.claimantCity}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by city"
              />
            </div>
            <div>
              <label htmlFor="stateId" className="block text-sm font-medium text-gray-700">
                State ID
              </label>
              <input
                type="number"
                id="stateId"
                name="stateId"
                value={filters.stateId}
                onChange={handleFilterChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by state ID"
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
          {claims.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No freight loss damage claims found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date of Shipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date of Claim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {claim.freightLossDamageClaimId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.dateOfShipment ? new Date(claim.dateOfShipment).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.dateOfClaim ? new Date(claim.dateOfClaim).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.claimantCompanyName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.claimantCity || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.totalValue ? `$${claim.totalValue.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/project-management/freight-loss-damage-claim-detail/${claim.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
