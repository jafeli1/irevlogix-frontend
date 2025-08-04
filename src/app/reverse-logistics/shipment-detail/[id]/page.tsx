'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface MaterialType {
  id: number;
  name: string;
}

interface AssetCategory {
  id: number;
  name: string;
}

interface ShipmentItem {
  id: number;
  materialType?: MaterialType;
  assetCategory?: AssetCategory;
  description: string;
  quantity: number;
  unitOfMeasure?: string;
  condition?: string;
  isAssetRecoverable: boolean;
  weight?: number;
  weightUnit?: string;
  notes?: string;
  processingStatus?: string;
  dispositionMethod?: string;
  dispositionCost?: number;
}

interface Client {
  id: number;
  companyName: string;
}

interface ClientContact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Shipment {
  id: number;
  shipmentNumber: string;
  status: string;
  scheduledPickupDate?: string;
  actualPickupDate?: string;
  shipmentDate: string;
  receivedDate?: string;
  carrier?: string;
  trackingNumber?: string;
  weight?: number;
  weightUnit?: string;
  numberOfBoxes?: number;
  notes?: string;
  dispositionNotes?: string;
  transportationCost?: number;
  logisticsCost?: number;
  dispositionCost?: number;
  originAddress?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  originatorClient?: Client;
  clientContact?: ClientContact;
  shipmentItems: ShipmentItem[];
  dateCreated: string;
  dateUpdated: string;
}

export default function ShipmentDetail() {
  const router = useRouter();
  const params = useParams();
  const shipmentId = params.id as string;
  
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('manifest');
  const [isEditing, setIsEditing] = useState(false);
  const [editedShipment, setEditedShipment] = useState<Partial<Shipment>>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchShipment();
  }, [router, shipmentId]);

  const fetchShipment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/shipments/${shipmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShipment(data);
        setEditedShipment(data);
      } else if (response.status === 404) {
        setError('Shipment not found');
      } else {
        setError('Failed to fetch shipment details');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedShipment),
      });

      if (response.ok) {
        setShipment(editedShipment as Shipment);
        setIsEditing(false);
      } else {
        setError('Failed to update shipment');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'in transit': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
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
          <p className="mt-4 text-gray-600">Loading shipment details...</p>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <div className="text-red-600 text-2xl">⚠</div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              {error || 'Shipment not found'}
            </h2>
            <div className="mt-6">
              <Link
                href="/reverse-logistics/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Shipment {shipment.shipmentNumber}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Created {formatDateTime(shipment.dateCreated)}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                  {shipment.status}
                </span>
                <Link
                  href="/reverse-logistics/dashboard"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Dashboard
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
                        setEditedShipment(shipment);
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shipment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Originator</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {shipment.originatorClient?.companyName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {shipment.clientContact 
                        ? `${shipment.clientContact.firstName} ${shipment.clientContact.lastName}`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Scheduled Pickup</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDateTime(shipment.scheduledPickupDate)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Actual Pickup</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDateTime(shipment.actualPickupDate)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Carrier</label>
                    <p className="mt-1 text-sm text-gray-900">{shipment.carrier || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                    <p className="mt-1 text-sm text-gray-900">{shipment.trackingNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Items:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {shipment.shipmentItems.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Weight:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {shipment.weight ? `${shipment.weight} ${shipment.weightUnit || 'lbs'}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transportation Cost:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {shipment.transportationCost ? `$${shipment.transportationCost.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Logistics Cost:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {shipment.logisticsCost ? `$${shipment.logisticsCost.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('manifest')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'manifest'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Manifest & Disposition
                  </button>
                  <button
                    onClick={() => setActiveTab('logistics')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'logistics'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Logistics & History
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
                {activeTab === 'manifest' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Shipment Items</h4>
                    {shipment.shipmentItems.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No items in this shipment</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
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
                                Recoverable
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {shipment.shipmentItems.map((item) => (
                              <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.description}
                                  </div>
                                  {item.notes && (
                                    <div className="text-sm text-gray-500">{item.notes}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.materialType?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.quantity} {item.unitOfMeasure || 'units'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.condition || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.isAssetRecoverable ? 'Yes' : 'No'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.processingStatus || 'Pending'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'logistics' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Logistics Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Origin Address
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                            {shipment.originAddress || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pickup Address
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                            {shipment.pickupAddress || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Notes</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            General Notes
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                            {shipment.notes || 'No notes available'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Disposition Notes
                          </label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                            {shipment.dispositionNotes || 'No disposition notes available'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'financials' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h4>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Transportation Cost
                          </label>
                          <p className="mt-1 text-lg font-semibold text-gray-900">
                            {shipment.transportationCost ? `$${shipment.transportationCost.toFixed(2)}` : '$0.00'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Logistics Cost
                          </label>
                          <p className="mt-1 text-lg font-semibold text-gray-900">
                            {shipment.logisticsCost ? `$${shipment.logisticsCost.toFixed(2)}` : '$0.00'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Disposition Cost
                          </label>
                          <p className="mt-1 text-lg font-semibold text-gray-900">
                            {shipment.dispositionCost ? `$${shipment.dispositionCost.toFixed(2)}` : '$0.00'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Total Cost
                          </label>
                          <p className="mt-1 text-lg font-semibold text-red-600">
                            ${((shipment.transportationCost || 0) + 
                               (shipment.logisticsCost || 0) + 
                               (shipment.dispositionCost || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
