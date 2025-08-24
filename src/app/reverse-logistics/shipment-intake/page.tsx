'use client';

import React, { useState, useEffect } from 'react';
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

interface Client {
  id: number;
  companyName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface ReverseRequest {
  id: number;
  locationName: string;
}

interface ProcessingLot {
  id: number;
  lotNumber: string;
}

interface ShipmentItem {
  materialTypeId?: number;
  assetCategoryId?: number;
  processingLotId?: number;
  description: string;
  category?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  unitOfMeasure?: string;
  condition?: string;
  isAssetRecoverable: boolean;
  estimatedValue?: number;
  actualValue?: number;
  dispositionCost?: number;
  weight?: number;
  weightUnit?: string;
  processingStatus?: string;
  dispositionMethod?: string;
  isDataBearingDevice: boolean;
  dataDestructionStatus?: string;
  dataDestructionDate?: string;
  dataDestructionMethod?: string;
  certificateNumber?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ItemValidationErrors {
  [key: string]: string;
}

interface ShipmentFormData {
  shipmentNumber?: string;
  status: string;
  originatorClientId?: number;
  reverseRequestId?: number;
  shipmentDate: string;
  receivedDate?: string;
  scheduledPickupDate?: string;
  actualPickupDate?: string;
  trackingNumber?: string;
  carrier?: string;
  weight?: number;
  weightUnit?: string;
  numberOfBoxes?: number;
  estimatedValue?: number;
  actualValue?: number;
  pickupAddress?: string;
  deliveryAddress?: string;
  originAddress?: string;
  transportationCost?: number;
  logisticsCost?: number;
  dispositionCost?: number;
  dispositionNotes?: string;
  shipmentItems: ShipmentItem[];
}

export default function ShipmentIntake() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [reverseRequests, setReverseRequests] = useState<ReverseRequest[]>([]);
  const [processingLots, setProcessingLots] = useState<ProcessingLot[]>([]);
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [itemValidationErrors, setItemValidationErrors] = useState<ItemValidationErrors>({});
  const [bulkValidationError, setBulkValidationError] = useState<string>('');
  const [documents, setDocuments] = useState<File[]>([]);

  const [formData, setFormData] = useState<ShipmentFormData>({
    status: 'Requested',
    shipmentDate: new Date().toISOString().split('T')[0],
    shipmentItems: []
  });

  const [currentItem, setCurrentItem] = useState<ShipmentItem>({
    description: '',
    quantity: 1,
    condition: 'Used',
    isAssetRecoverable: false,
    isDataBearingDevice: false,
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
    fetchClients();
    fetchReverseRequests();
    fetchProcessingLots();
  }, [router]);

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

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchReverseRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/reverserequests/dropdown', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReverseRequests(data);
      }
    } catch (error) {
      console.error('Error fetching reverse requests:', error);
    }
  };

  const fetchProcessingLots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/processinglots?pageSize=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Processing lots fetched:', data);
        setProcessingLots(data);
      }
    } catch (error) {
      console.error('Error fetching processing lots:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: ShipmentFormData) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value
    }));

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setCurrentItem((prev: ShipmentItem) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    if (itemValidationErrors[name]) {
      setItemValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCurrentItem = (): boolean => {
    const errors: ItemValidationErrors = {};

    if (!currentItem.description.trim()) {
      errors.description = 'Description is required';
    }

    if (currentItem.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }

    if (currentItem.weight && currentItem.weight <= 0) {
      errors.weight = 'Weight must be greater than 0';
    }

    if (currentItem.estimatedValue && currentItem.estimatedValue < 0) {
      errors.estimatedValue = 'Estimated value cannot be negative';
    }

    if (currentItem.actualValue && currentItem.actualValue < 0) {
      errors.actualValue = 'Actual value cannot be negative';
    }

    if (currentItem.dispositionCost && currentItem.dispositionCost < 0) {
      errors.dispositionCost = 'Disposition cost cannot be negative';
    }

    setItemValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addItem = () => {
    if (!validateCurrentItem()) {
      return;
    }

    setFormData((prev: ShipmentFormData) => ({
      ...prev,
      shipmentItems: [...prev.shipmentItems, { ...currentItem }]
    }));

    setCurrentItem({
      description: '',
      quantity: 1,
      condition: 'Used',
      isAssetRecoverable: false,
      isDataBearingDevice: false,
      weightUnit: 'lbs'
    });
    setItemValidationErrors({});
    setError('');
  };

  const removeItem = (index: number) => {
    setFormData((prev: ShipmentFormData) => ({
      ...prev,
      shipmentItems: prev.shipmentItems.filter((_: ShipmentItem, i: number) => i !== index)
    }));
  };

  const validateMainForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.shipmentDate.trim()) {
      errors.shipmentDate = 'Shipment date is required';
    }

    if (!formData.originatorClientId) {
      errors.originatorClientId = 'Originator client is required';
    }

    if (formData.trackingNumber && formData.trackingNumber.length < 3) {
      errors.trackingNumber = 'Tracking number must be at least 3 characters';
    }

    if (formData.weight && formData.weight <= 0) {
      errors.weight = 'Weight must be greater than 0';
    }

    if (formData.numberOfBoxes && formData.numberOfBoxes <= 0) {
      errors.numberOfBoxes = 'Number of boxes must be greater than 0';
    }

    if (formData.estimatedValue && formData.estimatedValue < 0) {
      errors.estimatedValue = 'Estimated value cannot be negative';
    }

    if (formData.actualValue && formData.actualValue < 0) {
      errors.actualValue = 'Actual value cannot be negative';
    }

    if (formData.dispositionCost && formData.dispositionCost < 0) {
      errors.dispositionCost = 'Disposition cost cannot be negative';
    }

    if (formData.logisticsCost && formData.logisticsCost < 0) {
      errors.logisticsCost = 'Logistics cost cannot be negative';
    }

    if (formData.transportationCost && formData.transportationCost < 0) {
      errors.transportationCost = 'Transportation cost cannot be negative';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateBulkFile = (file: File): boolean => {
    setBulkValidationError('');

    if (!file) {
      setBulkValidationError('Please select a file to upload');
      return false;
    }

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      setBulkValidationError('Please upload a CSV or Excel file (.csv, .xls, .xlsx)');
      return false;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setBulkValidationError('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!validateMainForm()) {
      setError('Please fix the validation errors before submitting');
      setIsLoading(false);
      return;
    }

    if (formData.shipmentItems.length === 0) {
      setError('At least one shipment item is required');
      setIsLoading(false);
      return;
    }

    if (activeTab === 'bulk' && bulkFile && !validateBulkFile(bulkFile)) {
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
                  setFormData({ status: 'Requested', shipmentDate: new Date().toISOString().split('T')[0], shipmentItems: [] });
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
                  Originator Client <span className="text-red-500">*</span>
                </label>
                <select
                  name="originatorClientId"
                  value={formData.originatorClientId || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.originatorClientId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.companyName}</option>
                  ))}
                </select>
                {validationErrors.originatorClientId && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.originatorClientId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reverse Request
                </label>
                <select
                  name="reverseRequestId"
                  value={formData.reverseRequestId || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Reverse Request</option>
                  {reverseRequests.map(request => (
                    <option key={request.id} value={request.id}>
                      {request.locationName}
                    </option>
                  ))}
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
                  Actual Pickup Date
                </label>
                <input
                  type="datetime-local"
                  name="actualPickupDate"
                  value={formData.actualPickupDate || ''}
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.trackingNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.trackingNumber && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.trackingNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="shipmentDate"
                  value={formData.shipmentDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.shipmentDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.shipmentDate && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.shipmentDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received Date
                </label>
                <input
                  type="date"
                  name="receivedDate"
                  value={formData.receivedDate || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.weight ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter weight"
                />
                {validationErrors.weight && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.weight}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight Unit
                </label>
                <select
                  name="weightUnit"
                  value={formData.weightUnit || 'lbs'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lbs">Pounds (lbs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="oz">Ounces (oz)</option>
                  <option value="g">Grams (g)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Boxes
                </label>
                <input
                  type="number"
                  name="numberOfBoxes"
                  value={formData.numberOfBoxes || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.numberOfBoxes ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter number of boxes"
                  min="1"
                />
                {validationErrors.numberOfBoxes && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.numberOfBoxes}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Value ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="estimatedValue"
                  value={formData.estimatedValue || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.estimatedValue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter estimated value"
                />
                {validationErrors.estimatedValue && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.estimatedValue}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Value ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="actualValue"
                  value={formData.actualValue || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.actualValue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter actual value"
                />
                {validationErrors.actualValue && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.actualValue}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Address
                </label>
                <textarea
                  name="pickupAddress"
                  value={formData.pickupAddress || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter pickup address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address
                </label>
                <textarea
                  name="deliveryAddress"
                  value={formData.deliveryAddress || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter delivery address"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logistics Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="logisticsCost"
                  value={formData.logisticsCost || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter logistics cost"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disposition Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="dispositionCost"
                  value={formData.dispositionCost || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter disposition cost"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disposition Notes
                </label>
                <textarea
                  name="dispositionNotes"
                  value={formData.dispositionNotes || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter disposition notes"
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Material/Asset Manifest</h3>
              
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'manual'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Line Items (Manual Entry)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bulk')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'bulk'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Bulk Upload (CSV/Excel)
                  </button>
                </nav>
              </div>

              {activeTab === 'manual' && (
                <div>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">AI Material Classification Assistant:</span> 
                      When you enter a description, AI will suggest relevant Material Types or Asset Categories to improve data accuracy. 
                      <em>(Feature coming soon)</em>
                    </p>
                  </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Type
                  </label>
                  <select
                    name="materialTypeId"
                    value={currentItem.materialTypeId || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-40 overflow-y-auto"
                    size={1}
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
                    Processing Lot
                  </label>
                  <select
                    name="processingLotId"
                    value={currentItem.processingLotId || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Processing Lot</option>
                    {processingLots.map(pl => (
                      <option key={pl.id} value={pl.id}>{pl.lotNumber}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={currentItem.description}
                    onChange={handleItemChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      itemValidationErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Item description"
                    required
                  />
                  {itemValidationErrors.description && (
                    <p className="text-sm text-red-600 mt-1">{itemValidationErrors.description}</p>
                  )}
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      itemValidationErrors.quantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {itemValidationErrors.quantity && (
                    <p className="text-sm text-red-600 mt-1">{itemValidationErrors.quantity}</p>
                  )}
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
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        itemValidationErrors.weight ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                  {itemValidationErrors.weight && (
                    <p className="text-sm text-red-600 mt-1">{itemValidationErrors.weight}</p>
                  )}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={currentItem.category || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Product category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={currentItem.brand || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brand name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={currentItem.model || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Model number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={currentItem.serialNumber || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Serial number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Value ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="estimatedValue"
                    value={currentItem.estimatedValue || ''}
                    onChange={handleItemChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      itemValidationErrors.estimatedValue ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {itemValidationErrors.estimatedValue && (
                    <p className="text-sm text-red-600 mt-1">{itemValidationErrors.estimatedValue}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Value ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="actualValue"
                    value={currentItem.actualValue || ''}
                    onChange={handleItemChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      itemValidationErrors.actualValue ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {itemValidationErrors.actualValue && (
                    <p className="text-sm text-red-600 mt-1">{itemValidationErrors.actualValue}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disposition Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="dispositionCost"
                    value={currentItem.dispositionCost || ''}
                    onChange={handleItemChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      itemValidationErrors.dispositionCost ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {itemValidationErrors.dispositionCost && (
                    <p className="text-sm text-red-600 mt-1">{itemValidationErrors.dispositionCost}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Processing Status
                  </label>
                  <select
                    name="processingStatus"
                    value={currentItem.processingStatus || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disposition Method
                  </label>
                  <select
                    name="dispositionMethod"
                    value={currentItem.dispositionMethod || ''}
                    onChange={handleItemChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Method</option>
                    <option value="Recycle">Recycle</option>
                    <option value="Refurbish">Refurbish</option>
                    <option value="Resale">Resale</option>
                    <option value="Destroy">Destroy</option>
                    <option value="Donate">Donate</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    name="isDataBearingDevice"
                    checked={currentItem.isDataBearingDevice}
                    onChange={handleItemChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Data Bearing Device
                  </label>
                </div>

                {currentItem.isDataBearingDevice && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-6 border-l-2 border-blue-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Destruction Status
                      </label>
                      <select
                        name="dataDestructionStatus"
                        value={currentItem.dataDestructionStatus || ''}
                        onChange={handleItemChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Not Required">Not Required</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Destruction Date
                      </label>
                      <input
                        type="date"
                        name="dataDestructionDate"
                        value={currentItem.dataDestructionDate || ''}
                        onChange={handleItemChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Destruction Method
                      </label>
                      <input
                        type="text"
                        name="dataDestructionMethod"
                        value={currentItem.dataDestructionMethod || ''}
                        onChange={handleItemChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Destruction method"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certificate Number
                      </label>
                      <input
                        type="text"
                        name="certificateNumber"
                        value={currentItem.certificateNumber || ''}
                        onChange={handleItemChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Certificate number"
                      />
                    </div>
                  </div>
                )}
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
                          Brand/Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Condition
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Est. Value
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
                            {item.brand && item.model ? `${item.brand} ${item.model}` : item.brand || item.model || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity} {item.unitOfMeasure}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.condition}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.estimatedValue ? `$${item.estimatedValue.toFixed(2)}` : '-'}
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
              )}

              {activeTab === 'bulk' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload CSV/Excel File
                    </label>
                    <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                      bulkValidationError ? 'border-red-300' : 'border-gray-300'
                    }`}>
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="bulk-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload a file</span>
                            <input
                              id="bulk-upload"
                              name="bulk-upload"
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setBulkFile(file);
                                if (file) {
                                  validateBulkFile(file);
                                }
                              }}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">CSV, XLSX up to 10MB</p>
                      </div>
                    </div>
                    {bulkValidationError && (
                      <p className="text-sm text-red-600 mt-1">{bulkValidationError}</p>
                    )}
                    {bulkFile && (
                      <p className="mt-2 text-sm text-gray-600">Selected: {bulkFile.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Template download feature coming soon');
                      }}
                    >
                      Download Template
                    </a>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">Expected columns:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>MaterialType</li>
                      <li>Description</li>
                      <li>Quantity</li>
                      <li>UnitOfMeasure</li>
                      <li>Condition</li>
                      <li>IsAssetRecoverable (true/false)</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Attachments
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Upload Bill of Lading, proof of delivery, photos of incoming shipment, etc.
              </p>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="documents" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload documents</span>
                      <input
                        id="documents"
                        name="documents"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="sr-only"
                        onChange={(e) => setDocuments(Array.from(e.target.files || []))}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC up to 10MB each</p>
                </div>
              </div>
              {documents.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected files:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {documents.map((file, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setDocuments(docs => docs.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Link
                href="/reverse-logistics/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading || formData.shipmentItems.length === 0}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Shipment...' : 'Save Shipment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Submit for Processing feature coming soon');
                  }}
                  disabled={isLoading || formData.shipmentItems.length === 0}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit for Processing
                </button>
              </div>
            </div>
          </form>
        </div>
      </AppLayout>
    );
}
