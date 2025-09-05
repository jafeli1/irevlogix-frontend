'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

interface MaterialType {
  id: number;
  name: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
}

interface Shipment {
  id: number;
  shipmentNumber: string;
}

interface ProcessingLot {
  id: number;
  lotNumber: string;
  status: string;
  description: string;
  processingCost: number;
  expectedRevenue: number;
  actualRevenue: number;
  incomingMaterialCost: number;
  totalIncomingWeight: number;
  totalProcessedWeight: number;
  dateCreated: string;
  createdBy: string;
  clientId: string;
  sourceShipmentId: number;
  completionDate: string;
  contaminationPercentage: number;
  certificationNumber: string;
  incomingMaterialNotes: string;
  qualityControlNotes: string;
  processingNotes: string;
  processingMethod: string;
  netProfit: number;
  weight: number;
  processingSteps: any[];
  processedMaterials: any[];
  incomingMaterials: any[];
}

interface OutgoingMaterialForm {
  materialTypeId: string;
  quantity: string;
  description: string;
  unitOfMeasure: string;
  qualityGrade: string;
}

export default function LotDetail() {
  const params = useParams();
  const id = params?.id as string;
  
  const [lot, setLot] = useState<ProcessingLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('incoming');
  const [isEditing, setIsEditing] = useState(false);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCertificates, setUploadedCertificates] = useState<any[]>([]);
  const [showOutgoingMaterialModal, setShowOutgoingMaterialModal] = useState(false);
  const [outgoingMaterialForm, setOutgoingMaterialForm] = useState<OutgoingMaterialForm>({
    materialTypeId: '',
    quantity: '',
    description: '',
    unitOfMeasure: 'kg',
    qualityGrade: ''
  });
  const [outgoingMaterialErrors, setOutgoingMaterialErrors] = useState<{[key: string]: string}>({});

  const fetchLot = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingLots/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLot(data);
      } else {
        setError('Failed to load lot details');
      }
    } catch (error) {
      setError('Error loading lot details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/MaterialTypes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaterialTypes(data);
      }
    } catch (error) {
      console.error('Error fetching material types:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/Users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/Shipments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShipments(data);
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
    }
  };

  const validateEditForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!lot?.description?.trim()) {
      errors.description = 'Description is required';
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingLots/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: lot?.id,
          lotNumber: lot?.lotNumber,
          status: lot?.status,
          description: lot?.description,
          processingCost: lot?.processingCost,
          expectedRevenue: lot?.expectedRevenue,
          actualRevenue: lot?.actualRevenue,
          incomingMaterialCost: lot?.incomingMaterialCost,
          totalIncomingWeight: lot?.totalIncomingWeight,
          totalProcessedWeight: lot?.totalProcessedWeight,
          clientId: lot?.clientId,
          sourceShipmentId: lot?.sourceShipmentId,
          completionDate: lot?.completionDate,
          contaminationPercentage: lot?.contaminationPercentage,
          certificationNumber: lot?.certificationNumber,
          incomingMaterialNotes: lot?.incomingMaterialNotes,
          qualityControlNotes: lot?.qualityControlNotes,
          processingNotes: lot?.processingNotes,
          processingMethod: lot?.processingMethod
        })
      });

      if (response.ok) {
        setIsEditing(false);
        await fetchLot();
      } else {
        setError('Failed to save changes');
      }
    } catch (error) {
      setError('Error saving changes');
    }
  };

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingLots/${id}/certificates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUploadedCertificates(data);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('processingLotId', id);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/ProcessingLots/upload-certificate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        await fetchCertificates();
      } else {
        setError('Failed to upload certificate');
      }
    } catch (error) {
      setError('Error uploading certificate');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'On Hold': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${amount.toFixed(2)}`;
  };

  const openAddOutgoingMaterialModal = () => {
    setOutgoingMaterialForm({
      materialTypeId: '',
      quantity: '',
      description: '',
      unitOfMeasure: 'kg',
      qualityGrade: ''
    });
    setOutgoingMaterialErrors({});
    setShowOutgoingMaterialModal(true);
  };

  const handleOutgoingMaterialInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOutgoingMaterialForm(prev => ({ ...prev, [name]: value }));
    if (outgoingMaterialErrors[name]) {
      setOutgoingMaterialErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOutgoingMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/ProcessedMaterials', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          processingLotId: parseInt(id),
          materialTypeId: parseInt(outgoingMaterialForm.materialTypeId),
          quantity: parseFloat(outgoingMaterialForm.quantity),
          description: outgoingMaterialForm.description,
          unitOfMeasure: outgoingMaterialForm.unitOfMeasure,
          qualityGrade: outgoingMaterialForm.qualityGrade,
          dateProcessed: new Date().toISOString(),
          processedBy: 'Current User'
        })
      });

      if (response.ok) {
        setShowOutgoingMaterialModal(false);
        await fetchLot();
      } else {
        setError('Failed to add outgoing material');
      }
    } catch (error) {
      setError('Error adding outgoing material');
    }
  };

  useEffect(() => {
    if (id) {
      fetchLot();
      fetchMaterialTypes();
      fetchUsers();
      fetchShipments();
      fetchCertificates();
    }
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lot details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-2 text-lg font-medium text-gray-900">{error}</h2>
        </div>
      </AppLayout>
    );
  }

  if (!lot) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900">Lot not found</h2>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Processing Lot Details</h1>
              <p className="mt-2 text-sm text-gray-600">
                Lot #{lot.lotNumber} • Created {formatDate(lot.dateCreated)}
              </p>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      fetchLot();
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Lot Information</h3>
              </div>
              <div className="px-6 py-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lot Number</label>
                    <p className="mt-1 text-sm text-gray-900">{lot.lotNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lot.status)}`}>
                      {lot.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Processing Method</label>
                    <p className="mt-1 text-sm text-gray-900">{lot.processingMethod || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completion Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {lot.completionDate ? formatDate(lot.completionDate) : 'Not completed'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  {isEditing ? (
                    <textarea
                      value={lot.description || ''}
                      onChange={(e) => setLot(prev => prev ? {...prev, description: e.target.value} : null)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{lot.description || 'No description provided'}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Processing Cost</label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={lot.processingCost || ''}
                        onChange={(e) => setLot(prev => prev ? {...prev, processingCost: parseFloat(e.target.value)} : null)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{formatCurrency(lot.processingCost)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Revenue</label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={lot.expectedRevenue || ''}
                        onChange={(e) => setLot(prev => prev ? {...prev, expectedRevenue: parseFloat(e.target.value)} : null)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{formatCurrency(lot.expectedRevenue)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Actual Revenue</label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={lot.actualRevenue || ''}
                        onChange={(e) => setLot(prev => prev ? {...prev, actualRevenue: parseFloat(e.target.value)} : null)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{formatCurrency(lot.actualRevenue)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Summary</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Weight:</span>
                  <span className="text-sm text-gray-900">
                    {lot.weight ? `${lot.weight} kg` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Incoming Materials:</span>
                  <span className="text-sm text-gray-900">{lot.incomingMaterials?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Processed Materials:</span>
                  <span className="text-sm text-gray-900">{lot.processedMaterials?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Processing Steps:</span>
                  <span className="text-sm text-gray-900">{lot.processingSteps?.length || 0}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Net Profit:</span>
                    <span className={`text-sm font-medium ${
                      (lot.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(lot.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <div className="px-6 py-3">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('incoming')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'incoming'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Incoming Materials
                  </button>
                  <button
                    onClick={() => setActiveTab('outgoing')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'outgoing'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Outgoing Materials
                  </button>
                  <button
                    onClick={() => setActiveTab('certifications')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'certifications'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Certifications & Compliance
                  </button>
                  <button
                    onClick={() => setActiveTab('financials')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'financials'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Financials
                  </button>
                </nav>
              </div>
            </div>

            <div className="px-6 py-6">
              {activeTab === 'incoming' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Incoming Materials</h4>
                  {lot.incomingMaterials && lot.incomingMaterials.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Material Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Condition
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Weight
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cost
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {lot.incomingMaterials.map((material: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {material.materialType?.name || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {material.quantity || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {material.condition || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {material.actualReceivedWeight ? `${material.actualReceivedWeight} kg` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(material.incomingMaterialCost)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No incoming materials found for this lot.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'outgoing' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Outgoing Materials</h4>
                    <button
                      onClick={openAddOutgoingMaterialModal}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Add Outgoing Material
                    </button>
                  </div>
                  {lot.processedMaterials && lot.processedMaterials.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Material Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quality Grade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date Processed
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {lot.processedMaterials.map((material: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {material.materialType?.name || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {material.quantity} {material.unitOfMeasure}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {material.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {material.qualityGrade || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(material.dateProcessed)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No outgoing materials found for this lot.</p>
                      <p className="text-sm text-gray-400 mt-1">Click "Add Outgoing Material" to get started.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'certifications' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Certifications & Compliance</h4>
                    <label className={`px-4 py-2 rounded-md cursor-pointer ${
                      uploading 
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}>
                      {uploading ? 'Uploading...' : 'Upload Certificate'}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        onChange={handleCertificateUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h5 className="text-md font-medium text-gray-900 mb-3">Applicable Certifications</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h6 className="font-medium text-gray-900">R2 Certification</h6>
                          <p className="text-sm text-gray-600 mt-1">Responsible Recycling Standard</p>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-2">
                            Active
                          </span>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h6 className="font-medium text-gray-900">e-Stewards</h6>
                          <p className="text-sm text-gray-600 mt-1">Electronics Recycling Standard</p>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-2">
                            Active
                          </span>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h6 className="font-medium text-gray-900">ISO 14001</h6>
                          <p className="text-sm text-gray-600 mt-1">Environmental Management</p>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 mt-2">
                            Pending
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-md font-medium text-gray-900 mb-3">Certificate of Recycling</h5>
                      {uploadedCertificates.length > 0 ? (
                        <div className="space-y-3">
                          {uploadedCertificates.map((cert, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{cert.fileName}</p>
                                  <p className="text-xs text-gray-500">
                                    Uploaded: {new Date(cert.uploadDate).toLocaleDateString()} • 
                                    Size: {(cert.fileSize / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <a
                                    href={`https://irevlogix-backend.onrender.com${cert.filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    View
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <p className="text-gray-500">No certificate uploaded yet</p>
                          <p className="text-sm text-gray-400 mt-1">Upload PDF, DOC, or image files</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 className="text-md font-medium text-gray-900 mb-3">Compliance Notes</h5>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Add compliance notes and observations..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'financials' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Financial Summary (Read-Only)</h4>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Total Incoming Material Cost
                        </label>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          ${lot.incomingMaterials?.reduce((sum, material) => sum + (material.incomingMaterialCost || 0), 0).toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Total Processing Costs
                        </label>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          ${lot.processingCost?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Expected Revenue
                        </label>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          ${lot.expectedRevenue?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Net Profit/Loss
                        </label>
                        <p className={`mt-1 text-lg font-semibold ${
                          (lot.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${lot.netProfit?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h5 className="text-md font-medium text-gray-900 mb-3">Cost Breakdown</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Labor Costs:</span>
                          <span className="text-gray-900">
                            ${lot.processingSteps?.reduce((sum, step) => sum + ((step.laborHours || 0) * 25), 0).toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Machine Costs:</span>
                          <span className="text-gray-900">
                            ${lot.processingSteps?.reduce((sum, step) => sum + ((step.machineHours || 0) * 15), 0).toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Energy Costs:</span>
                          <span className="text-gray-900">
                            ${lot.processingSteps?.reduce((sum, step) => sum + ((step.energyConsumption || 0) * 0.12), 0).toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showOutgoingMaterialModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Outgoing Material</h3>
                
                <form onSubmit={handleOutgoingMaterialSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Material Type</label>
                      <select
                        name="materialTypeId"
                        value={outgoingMaterialForm.materialTypeId}
                        onChange={handleOutgoingMaterialInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Material Type</option>
                        {materialTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        name="quantity"
                        value={outgoingMaterialForm.quantity}
                        onChange={handleOutgoingMaterialInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                    <textarea
                      name="description"
                      value={outgoingMaterialForm.description}
                      onChange={handleOutgoingMaterialInputChange}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit of Measure</label>
                      <select
                        name="unitOfMeasure"
                        value={outgoingMaterialForm.unitOfMeasure}
                        onChange={handleOutgoingMaterialInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                        <option value="tons">tons</option>
                        <option value="units">units</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quality Grade</label>
                      <input
                        type="text"
                        name="qualityGrade"
                        value={outgoingMaterialForm.qualityGrade}
                        onChange={handleOutgoingMaterialInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Grade A, Grade B"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowOutgoingMaterialModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Add Material
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
