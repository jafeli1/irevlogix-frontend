'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../components/AppLayout';

interface ProcessingLot {
  id: number;
  lotNumber: string;
  status: string;
  description?: string;
  assignedOperator?: string;
  processingCost?: number;
  expectedRevenue?: number;
  actualRevenue?: number;
  netProfit?: number;
  dateCreated: string;
  dateUpdated: string;
  weight?: number;
  contaminationPercentage?: number;
}

interface MaterialType {
  id: number;
  name: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Shipment {
  id: number;
  shipmentNumber: string;
}

interface Filters {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  materialType: string;
}

interface CreateLotFormData {
  lotNumber?: string;
  description: string;
  assignedOperatorId?: number;
  processingCost?: number;
  startDate?: string;
  completionDate?: string;
  totalIncomingWeight?: number;
  totalProcessedWeight?: number;
  incomingMaterialCost?: number;
  expectedRevenue?: number;
  actualRevenue?: number;
  incomingMaterialNotes?: string;
  contaminationPercentage?: number;
  qualityControlNotes?: string;
  certificationStatus?: string;
  certificationNumber?: string;
  processingNotes?: string;
  processingMethod?: string;
  sourceShipmentId?: number;
}

export default function ProcessingLotsPage() {
  const router = useRouter();
  const [lots, setLots] = useState<ProcessingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    materialType: ''
  });
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateLotFormData>({
    lotNumber: '',
    description: '',
    assignedOperatorId: undefined,
    processingCost: undefined,
    startDate: '',
    completionDate: '',
    totalIncomingWeight: undefined,
    totalProcessedWeight: undefined,
    incomingMaterialCost: undefined,
    expectedRevenue: undefined,
    actualRevenue: undefined,
    incomingMaterialNotes: '',
    contaminationPercentage: undefined,
    qualityControlNotes: '',
    certificationStatus: '',
    certificationNumber: '',
    processingNotes: '',
    processingMethod: '',
    sourceShipmentId: undefined
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchLots();
  }, [router, filters, pagination.page]);

  useEffect(() => {
    fetchMaterialTypes();
    fetchUsers();
    fetchShipments();
  }, []);

  const fetchLots = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filters.search && { lotId: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.materialType && { materialTypeId: filters.materialType })
      });
      
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingLots?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
        setLots(data);
        setPagination(prev => ({
          ...prev,
          totalCount,
          totalPages: Math.ceil(totalCount / prev.pageSize)
        }));
      } else {
        setError('Failed to fetch processing lots');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/materialtypes?pageSize=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMaterialTypes(data);
      }
    } catch {
      console.error('Failed to fetch material types');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch {
      console.error('Failed to fetch users');
    }
  };

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/shipments?pageSize=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShipments(data.data || data);
      }
    } catch {
      console.error('Failed to fetch shipments');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      startDate: '',
      endDate: '',
      materialType: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Lot ID', 'Status', 'Operator', 'Creation Date', 'Weight', 'Contamination %', 'Processing Cost', 'Expected Revenue'].join(','),
      ...lots.map(lot => [
        lot.lotNumber,
        lot.status,
        lot.assignedOperator || 'N/A',
        new Date(lot.dateCreated).toLocaleDateString(),
        lot.weight || 'N/A',
        lot.contaminationPercentage || 'N/A',
        lot.processingCost ? `$${lot.processingCost.toFixed(2)}` : 'N/A',
        lot.expectedRevenue ? `$${lot.expectedRevenue.toFixed(2)}` : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `processing-lots-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!createFormData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!createFormData.sourceShipmentId) {
      errors.sourceShipmentId = 'Source Shipment is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setCreateLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/ProcessingLots', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          LotId: createFormData.lotNumber,
          Description: createFormData.description,
          OperatorUserId: createFormData.assignedOperatorId,
          ProcessingCost: createFormData.processingCost,
          StartDate: createFormData.startDate,
          CompletionDate: createFormData.completionDate,
          TotalIncomingWeight: createFormData.totalIncomingWeight,
          TotalProcessedWeight: createFormData.totalProcessedWeight,
          IncomingMaterialCost: createFormData.incomingMaterialCost,
          ExpectedRevenue: createFormData.expectedRevenue,
          ActualRevenue: createFormData.actualRevenue,
          IncomingMaterialNotes: createFormData.incomingMaterialNotes,
          ContaminationPercentage: createFormData.contaminationPercentage,
          QualityControlNotes: createFormData.qualityControlNotes,
          CertificationStatus: createFormData.certificationStatus,
          CertificationNumber: createFormData.certificationNumber,
          ProcessingNotes: createFormData.processingNotes,
          ProcessingMethod: createFormData.processingMethod,
          SourceShipmentId: createFormData.sourceShipmentId
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setCreateFormData({
          lotNumber: '',
          description: '',
          assignedOperatorId: undefined,
          processingCost: undefined,
          startDate: '',
          completionDate: '',
          totalIncomingWeight: undefined,
          totalProcessedWeight: undefined,
          incomingMaterialCost: undefined,
          expectedRevenue: undefined,
          actualRevenue: undefined,
          incomingMaterialNotes: '',
          contaminationPercentage: undefined,
          qualityControlNotes: '',
          certificationStatus: '',
          certificationNumber: '',
          processingNotes: '',
          processingMethod: '',
          sourceShipmentId: undefined
        });
        setValidationErrors({});
        fetchLots();
      } else {
        setError('Failed to create processing lot');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };


  if (loading && lots.length === 0) {
    return (
      <AppLayout>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading processing lots...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Processing Lots</h1>
          <p className="mt-2 text-gray-600">Manage and track processing lots</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    name="search"
                    placeholder="Search by Lot ID..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Ready for Sale">Ready for Sale</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <select
                    name="materialType"
                    value={filters.materialType}
                    onChange={handleFilterChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Material Types</option>
                    {materialTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create New Lot
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lot ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creation Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contamination %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processing Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lots.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No processing lots found'}
                    </td>
                  </tr>
                ) : (
                  lots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lot.lotNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          lot.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          lot.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          lot.status === 'Ready for Sale' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lot.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lot.assignedOperator || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(lot.dateCreated).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lot.weight ? `${lot.weight} lbs` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lot.contaminationPercentage ? `${lot.contaminationPercentage}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lot.processingCost ? `$${lot.processingCost.toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/processing/lot-detail/${lot.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-[1152px] shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Processing Lot</h3>
                <form onSubmit={handleCreateLot} className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lot Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={createFormData.lotNumber || ''}
                      onChange={(e) => {
                        setCreateFormData(prev => ({ ...prev, lotNumber: e.target.value }));
                        if (validationErrors.lotNumber) {
                          setValidationErrors(prev => ({ ...prev, lotNumber: '' }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Auto-generated if left blank"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500">*</span> Lot Description
                    </label>
                    <textarea
                      value={createFormData.description}
                      onChange={(e) => {
                        setCreateFormData(prev => ({ ...prev, description: e.target.value }));
                        if (validationErrors.description) {
                          setValidationErrors(prev => ({ ...prev, description: '' }));
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      rows={3}
                      required
                    />
                    {validationErrors.description && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500">*</span> Source Shipment
                    </label>
                    <select
                      value={createFormData.sourceShipmentId || ''}
                      onChange={(e) => {
                        setCreateFormData(prev => ({ ...prev, sourceShipmentId: e.target.value ? parseInt(e.target.value) : undefined }));
                        if (validationErrors.sourceShipmentId) {
                          setValidationErrors(prev => ({ ...prev, sourceShipmentId: '' }));
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.sourceShipmentId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select Shipment</option>
                      {shipments.map(shipment => (
                        <option key={shipment.id} value={shipment.id}>
                          {shipment.shipmentNumber}
                        </option>
                      ))}
                    </select>
                    {validationErrors.sourceShipmentId && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.sourceShipmentId}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Operator
                    </label>
                    <select
                      value={createFormData.assignedOperatorId || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, assignedOperatorId: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Operator</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={createFormData.startDate || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completion Date
                    </label>
                    <input
                      type="date"
                      value={createFormData.completionDate || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, completionDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Processing Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={createFormData.processingCost || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, processingCost: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Incoming Weight (lbs)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={createFormData.totalIncomingWeight || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, totalIncomingWeight: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Processed Weight (lbs)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={createFormData.totalProcessedWeight || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, totalProcessedWeight: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Incoming Material Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={createFormData.incomingMaterialCost || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, incomingMaterialCost: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Revenue ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={createFormData.expectedRevenue || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, expectedRevenue: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Revenue ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={createFormData.actualRevenue || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, actualRevenue: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contamination Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={createFormData.contaminationPercentage || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, contaminationPercentage: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certification Status
                    </label>
                    <select
                      value={createFormData.certificationStatus || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, certificationStatus: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Certified">Certified</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Not Required">Not Required</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certification Number
                    </label>
                    <input
                      type="text"
                      value={createFormData.certificationNumber || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, certificationNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter certification number"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Incoming Material Notes
                    </label>
                    <textarea
                      value={createFormData.incomingMaterialNotes || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, incomingMaterialNotes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto"
                      rows={4}
                      placeholder="Enter notes about incoming materials..."
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Control Notes
                    </label>
                    <textarea
                      value={createFormData.qualityControlNotes || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, qualityControlNotes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto"
                      rows={4}
                      placeholder="Enter quality control notes..."
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Processing Notes
                    </label>
                    <textarea
                      value={createFormData.processingNotes || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, processingNotes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto"
                      rows={4}
                      placeholder="Enter processing notes..."
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Processing Method
                    </label>
                    <textarea
                      value={createFormData.processingMethod || ''}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, processingMethod: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto"
                      rows={4}
                      placeholder="Describe the processing method used..."
                    />
                  </div>
                  
                  <div className="col-span-3 flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setCreateFormData({
                          lotNumber: '',
                          description: '',
                          assignedOperatorId: undefined,
                          processingCost: undefined,
                          startDate: '',
                          completionDate: '',
                          totalIncomingWeight: undefined,
                          totalProcessedWeight: undefined,
                          incomingMaterialCost: undefined,
                          expectedRevenue: undefined,
                          actualRevenue: undefined,
                          incomingMaterialNotes: '',
                          contaminationPercentage: undefined,
                          qualityControlNotes: '',
                          certificationStatus: '',
                          certificationNumber: '',
                          processingNotes: '',
                          processingMethod: '',
                          sourceShipmentId: undefined
                        });
                        setValidationErrors({});
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading || !createFormData.description || !createFormData.sourceShipmentId}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createLoading ? 'Creating...' : 'Create Lot'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
    </AppLayout>
  );
}
