'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../components/AppLayout';

interface MaterialType {
  id: number;
  name: string;
  description?: string;
  category?: string;
  unitOfMeasure?: string;
}

interface AssetCategory {
  id: number;
  name: string;
  description?: string;
  isRecoverable: boolean;
}

interface ShipmentItem {
  materialTypeId?: number;
  assetCategoryId?: number;
  description: string;
  quantity: number;
  unitOfMeasure?: string;
  condition?: string;
  isAssetRecoverable: boolean;
  weight?: number;
  weightUnit?: string;
  notes?: string;
}

interface ShipmentFormData {
  shipmentNumber?: string;
  status: string;
  scheduledPickupDate?: string;
  carrier?: string;
  trackingNumber?: string;
  transportationCost?: number;
  originAddress?: string;
  notes?: string;
  shipmentItems: ShipmentItem[];
}

export default function ShipmentIntake() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);

  const [formData, setFormData] = useState<ShipmentFormData>({
    status: 'Requested',
    shipmentItems: []
  });

  const [currentItem, setCurrentItem] = useState<ShipmentItem>({
    description: '',
    quantity: 1,
    condition: 'Used',
    isAssetRecoverable: false,
    weightUnit: 'lbs'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchMaterialTypes();
    fetchAssetCategories();
  }, [router]);

  const fetchMaterialTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/materialtypes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMaterialTypes(data);
      }
    } catch (error) {
      console.error('Error fetching material types:', error);
    }
  };

  const fetchAssetCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/assetcategories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssetCategories(data);
      }
    } catch (error) {
      console.error('Error fetching asset categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value
    }));
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const addItem = () => {
    if (!currentItem.description.trim()) {
      setError('Item description is required');
      return;
    }

    setFormData(prev => ({
      ...prev,
      shipmentItems: [...prev.shipmentItems, { ...currentItem }]
    }));

    setCurrentItem({
      description: '',
      quantity: 1,
      condition: 'Used',
      isAssetRecoverable: false,
      weightUnit: 'lbs'
    });
    setError('');
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shipmentItems: prev.shipmentItems.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.shipmentItems.length === 0) {
      setError('At least one shipment item is required');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/shipments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          shipmentDate: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create shipment');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <div className="text-green-600 text-2xl">✓</div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Shipment Created Successfully!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your shipment has been created and is ready for processing.
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href="/reverse-logistics/dashboard"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                View All Shipments
              </Link>
              <button
                onClick={() => {
                  setSuccess(false);
                  setFormData({ status: 'Requested', shipmentItems: [] });
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Create Another Shipment
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Shipment Intake</h1>
            <p className="mt-1 text-sm text-gray-600">Create a new shipment for reverse logistics processing</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipment Number
                </label>
                <input
                  type="text"
                  name="shipmentNumber"
                  value={formData.shipmentNumber || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-generated if left blank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Requested">Requested</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Received">Received</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Pickup Date
                </label>
                <input
                  type="datetime-local"
                  name="scheduledPickupDate"
                  value={formData.scheduledPickupDate || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carrier
                </label>
                <input
                  type="text"
                  name="carrier"
                  value={formData.carrier || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., FedEx, UPS, DHL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  name="trackingNumber"
                  value={formData.trackingNumber || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transportation Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="transportationCost"
                  value={formData.transportationCost || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origin Address
              </label>
              <textarea
                name="originAddress"
                value={formData.originAddress || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Pickup address"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Shipment Items</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Type
                  </label>
                  <select
                    name="materialTypeId"
                    value={currentItem.materialTypeId || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Material Type</option>
                    {materialTypes.map(mt => (
                      <option key={mt.id} value={mt.id}>{mt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Category
                  </label>
                  <select
                    name="assetCategoryId"
                    value={currentItem.assetCategoryId || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Asset Category</option>
                    {assetCategories.map(ac => (
                      <option key={ac.id} value={ac.id}>{ac.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={currentItem.description}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Item description"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={currentItem.quantity}
                    onChange={handleItemChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit of Measure
                  </label>
                  <select
                    name="unitOfMeasure"
                    value={currentItem.unitOfMeasure || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Unit</option>
                    <option value="units">Units</option>
                    <option value="kg">Kilograms</option>
                    <option value="lbs">Pounds</option>
                    <option value="pallets">Pallets</option>
                    <option value="boxes">Boxes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={currentItem.condition || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Non-functional">Non-functional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      name="weight"
                      value={currentItem.weight || ''}
                      onChange={handleItemChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                    <select
                      name="weightUnit"
                      value={currentItem.weightUnit || 'lbs'}
                      onChange={handleItemChange}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAssetRecoverable"
                    checked={currentItem.isAssetRecoverable}
                    onChange={handleItemChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Asset Recoverable
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={currentItem.notes || ''}
                  onChange={handleItemChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about this item"
                />
              </div>

              <button
                type="button"
                onClick={addItem}
                className="mb-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add Item
              </button>

              {formData.shipmentItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.shipmentItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity} {item.unitOfMeasure}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.condition}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.isAssetRecoverable ? 'Yes' : 'No'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disposition Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Initial observations or instructions"
              />
            </div>

            <div className="flex justify-between">
              <Link
                href="/reverse-logistics/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading || formData.shipmentItems.length === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Shipment...' : 'Create Shipment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
