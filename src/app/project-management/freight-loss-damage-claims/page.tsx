'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../components/AppLayout';

interface Permission {
  module: string;
  action: string;
}

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

interface UserPermissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export default function FreightLossDamageClaimsPage() {
  const [claims, setClaims] = useState<FreightLossDamageClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [permissions, setPermissions] = useState<UserPermissions>({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false
  });

  const [filters, setFilters] = useState({
    dateOfShipment: '',
    dateOfClaim: '',
    claimantCity: '',
    stateId: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchPermissions();
    fetchClaims();
  }, [router, currentPage, filters]);

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/users/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: Permission[] = await response.json();
        const projectManagementPerms = data.filter((p: Permission) => p.module === 'ProjectManagement');
        
        setPermissions({
          canRead: projectManagementPerms.some((p: Permission) => p.action === 'Read'),
          canCreate: projectManagementPerms.some((p: Permission) => p.action === 'Create'),
          canUpdate: projectManagementPerms.some((p: Permission) => p.action === 'Update'),
          canDelete: projectManagementPerms.some((p: Permission) => p.action === 'Delete')
        });
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(filters.dateOfShipment && { dateOfShipment: filters.dateOfShipment }),
        ...(filters.dateOfClaim && { dateOfClaim: filters.dateOfClaim }),
        ...(filters.claimantCity && { claimantCity: filters.claimantCity }),
        ...(filters.stateId && { stateId: filters.stateId })
      });

      const response = await fetch(`https://irevlogix-backend.onrender.com/api/FreightLossDamageClaims?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClaims(data);
        const totalCountHeader = response.headers.get('X-Total-Count');
        setTotalCount(totalCountHeader ? parseInt(totalCountHeader) : 0);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setError('Failed to fetch freight loss damage claims');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev: typeof filters) => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      dateOfShipment: '',
      dateOfClaim: '',
      claimantCity: '',
      stateId: ''
    });
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Claim ID', 'Description', 'Date of Shipment', 'Date of Claim', 'Company Name', 'City', 'Total Value'];
    const csvContent = [
      headers.join(','),
      ...claims.map((claim: FreightLossDamageClaim) => [
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this claim?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/FreightLossDamageClaims/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess('Claim deleted successfully');
        fetchClaims();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete claim');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (!permissions.canRead) {
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
          {permissions.canCreate && (
            <Link
              href="/project-management/freight-loss-damage-claim-detail/new"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Add New Claim
            </Link>
          )}
        </div>
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Shipment</label>
              <input
                type="date"
                name="dateOfShipment"
                value={filters.dateOfShipment}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Claim</label>
              <input
                type="date"
                name="dateOfClaim"
                value={filters.dateOfClaim}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Claimant City</label>
              <input
                type="text"
                name="claimantCity"
                value={filters.claimantCity}
                onChange={handleFilterChange}
                placeholder="Enter city"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="number"
                name="stateId"
                value={filters.stateId}
                onChange={handleFilterChange}
                placeholder="State ID"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading claims...</div>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No claims found</div>
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
                      {permissions.canDelete && (
                        <button
                          onClick={() => handleDelete(claim.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
