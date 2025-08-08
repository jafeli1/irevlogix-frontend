'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../../components/AppLayout';

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

interface ProcessingStep {
  id: number;
  stepName: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  responsibleUserId?: number;
  responsibleUser?: User;
  processingCostPerUnit?: number;
  laborHours?: number;
  machineHours?: number;
  energyConsumption?: number;
  isCompleted: boolean;
}

interface IncomingMaterial {
  id: number;
  materialType?: MaterialType;
  quantity: number;
  condition?: string;
  sourceShipmentId?: number;
  actualReceivedWeight?: number;
  contaminationPercentage?: number;
  incomingMaterialCost?: number;
}

interface ProcessedMaterial {
  id: number;
  materialType?: MaterialType;
  quantity: number;
  unitOfMeasure?: string;
  processedWeight?: number;
  qualityGrade?: string;
  destinationDownstreamVendor?: string;
  expectedSalesPricePerUnit?: number;
  actualSalesPricePerUnit?: number;
}

interface ProcessingLot {
  id: number;
  lotNumber: string;
  status: string;
  description?: string;
  assignedOperator?: string;
  assignedOperatorId?: number;
  processingCost?: number;
  expectedRevenue?: number;
  actualRevenue?: number;
  netProfit?: number;
  dateCreated: string;
  dateUpdated: string;
  weight?: number;
  contaminationPercentage?: number;
  processingSteps: ProcessingStep[];
  incomingMaterials: IncomingMaterial[];
  processedMaterials: ProcessedMaterial[];
}

export default function LotDetail() {
  const router = useRouter();
  const params = useParams();
  const lotId = params.id as string;
  
  const [lot, setLot] = useState<ProcessingLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('incoming');
  const [isEditing, setIsEditing] = useState(false);
  const [editedLot, setEditedLot] = useState<Partial<ProcessingLot>>({});
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchLot();
    fetchMaterialTypes();
    fetchUsers();
  }, [router, lotId]);

  const fetchLot = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingLots/${lotId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLot(data);
        setEditedLot(data);
      } else if (response.status === 404) {
        setError('Processing lot not found');
      } else {
        setError('Failed to fetch lot details');
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
      const response = await fetch('https://irevlogix-backend.onrender.com/api/MaterialTypes', {
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

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingLots/${lotId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedLot),
      });

      if (response.ok) {
        setLot(editedLot as ProcessingLot);
        setIsEditing(false);
      } else {
        setError('Failed to update lot');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'ready for sale': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lot details...</p>
        </div>
      </div>
    );
  }

  if (error || !lot) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <div className="text-red-600 text-2xl">⚠</div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              {error || 'Lot not found'}
            </h2>
            <div className="mt-6">
              <Link
                href="/processing/lots"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Processing Lots
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Processing Lot {lot.lotNumber}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Created {formatDateTime(lot.dateCreated)}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(lot.status)}`}>
                  {lot.status}
                </span>
                <Link
                  href="/processing/lots"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Lots
                </Link>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedLot(lot);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Lot Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lot ID</label>
                    <p className="mt-1 text-sm text-gray-900">{lot.lotNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned Operator</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {lot.assignedOperator || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {lot.description || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    {isEditing ? (
                      <select
                        value={editedLot.status || lot.status}
                        onChange={(e) => setEditedLot(prev => ({ ...prev, status: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Ready for Sale">Ready for Sale</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{lot.status}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Weight:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {lot.weight ? `${lot.weight} lbs` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Processing Cost:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {lot.processingCost ? `$${lot.processingCost.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expected Revenue:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {lot.expectedRevenue ? `$${lot.expectedRevenue.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Net Profit:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {lot.netProfit ? `$${lot.netProfit.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
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
                    onClick={() => setActiveTab('steps')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'steps'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Processing Steps
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

              <div className="mt-6">
                {activeTab === 'incoming' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Incoming Materials</h4>
                    {lot.incomingMaterials?.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No incoming materials assigned to this lot</p>
                    ) : (
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
                                Source Shipment
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actual Weight
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contamination %
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cost
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {lot.incomingMaterials?.map((material) => (
                              <tr key={material.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.materialType?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.condition || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.sourceShipmentId || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.actualReceivedWeight ? `${material.actualReceivedWeight} lbs` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.contaminationPercentage ? `${material.contaminationPercentage}%` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.incomingMaterialCost ? `$${material.incomingMaterialCost.toFixed(2)}` : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'steps' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Processing Steps</h4>
                      <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                        Add Processing Step
                      </button>
                    </div>
                    {lot.processingSteps?.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No processing steps defined for this lot</p>
                    ) : (
                      <div className="space-y-4">
                        {lot.processingSteps?.map((step) => (
                          <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="text-lg font-medium text-gray-900">{step.stepName}</h5>
                                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                  <div>
                                    <span className="text-xs font-medium text-gray-500">Start Time</span>
                                    <p className="text-sm text-gray-900">{formatDateTime(step.startTime)}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-gray-500">End Time</span>
                                    <p className="text-sm text-gray-900">{formatDateTime(step.endTime)}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-gray-500">Responsible User</span>
                                    <p className="text-sm text-gray-900">
                                      {step.responsibleUser ? `${step.responsibleUser.firstName} ${step.responsibleUser.lastName}` : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-gray-500">Labor Hours</span>
                                    <p className="text-sm text-gray-900">{step.laborHours || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  step.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {step.isCompleted ? 'Completed' : 'In Progress'}
                                </span>
                                {!step.isCompleted && (
                                  <button className="text-sm text-blue-600 hover:text-blue-900">
                                    Mark Complete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'outgoing' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Outgoing Processed Materials</h4>
                      <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                        Add Outgoing Material
                      </button>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-medium">AI</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <h5 className="text-sm font-medium text-blue-900">AI Quality Grade Prediction</h5>
                          <p className="text-sm text-blue-700 mt-1">
                            Based on incoming material properties and processing parameters, our AI will predict the likely output quality grade to aid in pricing and vendor matching.
                          </p>
                          <p className="text-xs text-blue-600 mt-2 italic">
                            [AI Suggestion Placeholder - OpenAI GPT-4o-mini integration coming soon]
                          </p>
                        </div>
                      </div>
                    </div>

                    {lot.processedMaterials?.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No outgoing materials processed yet</p>
                    ) : (
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
                                Processed Weight
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quality Grade
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Destination Vendor
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Expected Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actual Price
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {lot.processedMaterials?.map((material) => (
                              <tr key={material.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.materialType?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.quantity} {material.unitOfMeasure || 'units'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.processedWeight ? `${material.processedWeight} lbs` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.qualityGrade || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.destinationDownstreamVendor || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.expectedSalesPricePerUnit ? `$${material.expectedSalesPricePerUnit.toFixed(2)}` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {material.actualSalesPricePerUnit ? `$${material.actualSalesPricePerUnit.toFixed(2)}` : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'certifications' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Certifications & Compliance</h4>
                      <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                        Upload Certificate
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.png"
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
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <p className="text-gray-500">No certificate uploaded yet</p>
                          <p className="text-sm text-gray-400 mt-1">Upload PDF, DOC, or image files</p>
                        </div>
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
                            {lot.incomingMaterials?.reduce((sum, material) => sum + (material.incomingMaterialCost || 0), 0).toFixed(2) || '0.00'}
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
        </div>
    </AppLayout>
  );
}
