"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "../../../../components/AppLayout";
type TabKey = "profile" | "data" | "coc" | "recycling" | "documents";

type AssetDocument = {
  id: number;
  assetId: number;
  fileName: string;
  filePath: string;
  contentType: string;
  description?: string | null;
  dateCreated?: string;
};

type Asset = {
  id: number;
  assetID?: string;
  assetId?: string;
  assetCategoryId?: number;
  assetCategory?: { id?: number; name?: string };
  sourceShipmentId?: number;
  sourceShipment?: { shipmentNumber?: string };
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  originalPurchaseDate?: string;
  originalCost?: number;
  condition?: string;
  estimatedValue?: number;
  actualSalePrice?: number;
  costOfRecovery?: number;
  isDataBearing?: boolean;
  storageDeviceType?: string;
  dataSanitizationStatus?: string;
  currentLocation?: string;
  currentResponsibleUserId?: number;
  currentResponsibleUser?: { firstName?: string; lastName?: string };
  currentStatusId?: number;
  currentStatus?: { statusName?: string };
  reuseDisposition?: boolean;
  resaleDisposition?: boolean;
  reuseRecipient?: string;
  reusePurpose?: string;
  reuseDate?: string;
  fairMarketValue?: number;
  buyer?: string;
  saleDate?: string;
  resalePlatform?: string;
  costOfSale?: number;
  salesInvoice?: string;
  recyclingVendorId?: number;
  recyclingVendor?: { vendorName?: string };
  recyclingDate?: string;
  recyclingCost?: number;
  certificateOfRecycling?: string;
  processingLotId?: number;
  processingLot?: { lotNumber?: string };
  notes?: string;
  estimatedResaleValue?: number;
  recipient?: string;
  purpose?: string;
};


export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = Array.isArray(params?.assetId) ? params.assetId[0] : (params?.assetId as string | undefined);

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAsset, setEditedAsset] = useState<Partial<Asset>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [asset, setAsset] = useState<Asset | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [statuses, setStatuses] = useState<{ id: number; statusName: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: number; vendorName: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [shipments, setShipments] = useState<{ id: number; shipmentNumber?: string }[]>([]);
  const [processingLots, setProcessingLots] = useState<{ id: number; lotNumber?: string }[]>([]);

  useEffect(() => {
    let ignore = false;
    async function fetchAsset() {
      if (!assetId) return;
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/assets/${assetId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch asset");
        const data: Asset = await res.json();
        if (!ignore) {
          setAsset(data);
          setEditedAsset(data);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load asset";
        if (!ignore) setError(msg);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    async function fetchDocuments() {
      if (!assetId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/assets/${assetId}/documents`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (res.ok) {
          const data: AssetDocument[] = await res.json();
          setDocuments(data);
        }
      } catch {}
    }

    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('/api/assetcategories', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const fetchStatuses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('https://irevlogix-backend.onrender.com/api/assettracking/statuses', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          setStatuses(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching statuses:', error);
      }
    };

    const fetchVendors = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('https://irevlogix-backend.onrender.com/api/Vendors', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          setVendors(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('https://irevlogix-backend.onrender.com/api/Users', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchShipments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('https://irevlogix-backend.onrender.com/api/Shipments', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          setShipments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching shipments:', error);
      }
    };

    const fetchProcessingLots = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('https://irevlogix-backend.onrender.com/api/ProcessingLots', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          setProcessingLots(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching processing lots:', error);
      }
    };

    fetchDocuments();
    fetchAsset();
    fetchCategories();
    fetchStatuses();
    fetchVendors();
    fetchUsers();
    fetchShipments();
    fetchProcessingLots();
    return () => {
      ignore = true;
    };
  }, [assetId, router]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!editedAsset.assetID && !editedAsset.assetId) {
      errors.assetID = 'Asset ID is required';
    }
    
    if (!editedAsset.description) {
      errors.description = 'Description is required';
    }
    
    if (!editedAsset.manufacturer) {
      errors.manufacturer = 'Manufacturer is required';
    }
    
    if (!editedAsset.model) {
      errors.model = 'Model is required';
    }
    
    if (!editedAsset.condition) {
      errors.condition = 'Condition is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors before saving.');
      return;
    }
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/assets/${assetId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedAsset),
      });

      if (response.ok) {
        setAsset(editedAsset as Asset);
        setIsEditing(false);
      } else if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        setError('Failed to update asset');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  return (
    <AppLayout>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Asset Detail</h1>
              <p className="mt-1 text-sm text-gray-600">View and manage asset lifecycle information</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/asset-recovery/asset-tracking"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Assets
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
                      setEditedAsset(asset || {});
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
          {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700">{error}</div>}
          {loading && <div className="mb-4 rounded-md bg-gray-50 p-3 text-gray-700">Loading...</div>}

          <div className="mb-6 rounded-md border bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm text-gray-500">Asset ID</div>
            <div className="font-medium text-gray-900">{asset?.assetID || asset?.assetId || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Serial Number</div>
            <div className="font-medium text-gray-900">{asset?.serialNumber || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Category</div>
            <div className="font-medium text-gray-900">{asset?.assetCategory?.name || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Manufacturer</div>
            <div className="font-medium text-gray-900">{asset?.manufacturer || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Model</div>
            <div className="font-medium text-gray-900">{asset?.model || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Current Status</div>
            <div className="font-medium text-gray-900">{asset?.currentStatus?.statusName || "-"}</div>
          </div>
        </div>
      </div>

          <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Asset Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "data"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Data Destruction
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("coc")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "coc"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Chain of Custody
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recycling")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "recycling"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Certified Recycling
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "documents"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Documents
          </button>
        </nav>
      </div>

          <div className="rounded-md border bg-white p-4">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Asset ID</label>
                <input 
                  type="text" 
                  className={`mt-1 w-full rounded-md border px-3 py-2 ${
                    validationErrors.assetID ? 'border-red-300' : ''
                  }`}
                  value={isEditing ? (editedAsset?.assetID || editedAsset?.assetId || "") : (asset?.assetID || asset?.assetId || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('assetID');
                      setEditedAsset(prev => ({ ...prev, assetID: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                />
                {validationErrors.assetID && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.assetID}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Asset Category</label>
                <select 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.assetCategoryId || "") : (asset?.assetCategoryId || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('assetCategoryId');
                      setEditedAsset(prev => ({ ...prev, assetCategoryId: parseInt(e.target.value) || undefined }));
                    }
                  }}
                  disabled={!isEditing}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                <input 
                  type="text" 
                  className={`mt-1 w-full rounded-md border px-3 py-2 ${
                    validationErrors.manufacturer ? 'border-red-300' : ''
                  }`}
                  value={isEditing ? (editedAsset?.manufacturer || "") : (asset?.manufacturer || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('manufacturer');
                      setEditedAsset(prev => ({ ...prev, manufacturer: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                />
                {validationErrors.manufacturer && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.manufacturer}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input 
                  type="text" 
                  className={`mt-1 w-full rounded-md border px-3 py-2 ${
                    validationErrors.model ? 'border-red-300' : ''
                  }`}
                  value={isEditing ? (editedAsset?.model || "") : (asset?.model || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('model');
                      setEditedAsset(prev => ({ ...prev, model: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                />
                {validationErrors.model && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.model}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                <input 
                  type="text" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.serialNumber || "") : (asset?.serialNumber || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('serialNumber');
                      setEditedAsset(prev => ({ ...prev, serialNumber: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Condition</label>
                <select 
                  className={`mt-1 w-full rounded-md border px-3 py-2 ${
                    validationErrors.condition ? 'border-red-300' : ''
                  }`}
                  value={isEditing ? (editedAsset?.condition || "") : (asset?.condition || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('condition');
                      setEditedAsset(prev => ({ ...prev, condition: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                >
                  <option value="">Select Condition</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
                {validationErrors.condition && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.condition}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Value ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.estimatedValue || "") : (asset?.estimatedValue || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('estimatedValue');
                      setEditedAsset(prev => ({ ...prev, estimatedValue: parseFloat(e.target.value) || undefined }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Current Location</label>
                <input 
                  type="text" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.currentLocation || "") : (asset?.currentLocation || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('currentLocation');
                      setEditedAsset(prev => ({ ...prev, currentLocation: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Current Status</label>
                <select 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.currentStatusId || "") : (asset?.currentStatusId || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('currentStatusId');
                      setEditedAsset(prev => ({ ...prev, currentStatusId: parseInt(e.target.value) || undefined }));
                    }
                  }}
                  disabled={!isEditing}
                >
                  <option value="">Select Status</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.statusName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Source Shipment</label>
                <select 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.sourceShipmentId || "") : (asset?.sourceShipmentId || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('sourceShipmentId');
                      setEditedAsset(prev => ({ ...prev, sourceShipmentId: parseInt(e.target.value) || undefined }));
                    }
                  }}
                  disabled={!isEditing}
                >
                  <option value="">Select Shipment</option>
                  {shipments.map((shipment) => (
                    <option key={shipment.id} value={shipment.id}>
                      {shipment.shipmentNumber || `Shipment ${shipment.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Original Purchase Date</label>
                <input 
                  type="date" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.originalPurchaseDate || "") : (asset?.originalPurchaseDate || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('originalPurchaseDate');
                      setEditedAsset(prev => ({ ...prev, originalPurchaseDate: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Original Cost ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.originalCost || "") : (asset?.originalCost || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('originalCost');
                      setEditedAsset(prev => ({ ...prev, originalCost: parseFloat(e.target.value) || undefined }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Actual Sale Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.actualSalePrice || "") : (asset?.actualSalePrice || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('actualSalePrice');
                      setEditedAsset(prev => ({ ...prev, actualSalePrice: parseFloat(e.target.value) || undefined }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Cost of Recovery ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.costOfRecovery || "") : (asset?.costOfRecovery || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('costOfRecovery');
                      setEditedAsset(prev => ({ ...prev, costOfRecovery: parseFloat(e.target.value) || undefined }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Current Responsible User</label>
                <select 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.currentResponsibleUserId || "") : (asset?.currentResponsibleUserId || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('currentResponsibleUserId');
                      setEditedAsset(prev => ({ ...prev, currentResponsibleUserId: parseInt(e.target.value) || undefined }));
                    }
                  }}
                  disabled={!isEditing}
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reuse Recipient</label>
                <input 
                  type="text" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.reuseRecipient || "") : (asset?.reuseRecipient || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('reuseRecipient');
                      setEditedAsset(prev => ({ ...prev, reuseRecipient: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reuse Purpose</label>
                <input 
                  type="text" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.reusePurpose || "") : (asset?.reusePurpose || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('reusePurpose');
                      setEditedAsset(prev => ({ ...prev, reusePurpose: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reuse Date</label>
                <input 
                  type="date" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.reuseDate || "") : (asset?.reuseDate || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('reuseDate');
                      setEditedAsset(prev => ({ ...prev, reuseDate: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fair Market Value ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.fairMarketValue || "") : (asset?.fairMarketValue || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('fairMarketValue');
                      setEditedAsset(prev => ({ ...prev, fairMarketValue: parseFloat(e.target.value) || undefined }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Buyer</label>
                <input 
                  type="text" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.buyer || "") : (asset?.buyer || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('buyer');
                      setEditedAsset(prev => ({ ...prev, buyer: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sale Date</label>
                <input 
                  type="date" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.saleDate || "") : (asset?.saleDate || "")}
                  onChange={(e) => {
                    if (isEditing) {
                      clearFieldError('saleDate');
                      setEditedAsset(prev => ({ ...prev, saleDate: e.target.value }));
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Resale Platform</label>
                <input 
                  type="text" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.resalePlatform || "") : (asset?.resalePlatform || "")}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, resalePlatform: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Cost of Sale ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.costOfSale || "") : (asset?.costOfSale || "")}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, costOfSale: parseFloat(e.target.value) || undefined }))}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sales Invoice</label>
                <input 
                  type="text" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.salesInvoice || "") : (asset?.salesInvoice || "")}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, salesInvoice: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Recycling Vendor</label>
                <select 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.recyclingVendorId || "") : (asset?.recyclingVendorId || "")}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, recyclingVendorId: parseInt(e.target.value) || undefined }))}
                  disabled={!isEditing}
                >
                  <option value="">Select Recycling Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.vendorName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Recycling Date</label>
                <input 
                  type="date" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.recyclingDate || "") : (asset?.recyclingDate || "")}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, recyclingDate: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Recycling Cost ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.recyclingCost || "") : (asset?.recyclingCost || "")}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, recyclingCost: parseFloat(e.target.value) || undefined }))}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Certificate of Recycling</label>
                <input 
                  type="text" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.certificateOfRecycling || "") : (asset?.certificateOfRecycling || "")}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, certificateOfRecycling: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Processing Lot</label>
                <select 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.processingLotId || "") : (asset?.processingLotId || "")}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, processingLotId: parseInt(e.target.value) || undefined }))}
                  disabled={!isEditing}
                >
                  <option value="">Select Processing Lot</option>
                  {processingLots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.lotNumber || `Lot ${lot.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                rows={3}
                className={`mt-1 w-full rounded-md border px-3 py-2 ${
                  validationErrors.description ? 'border-red-300' : ''
                }`}
                value={isEditing ? (editedAsset?.description || "") : (asset?.description || "")}
                onChange={(e) => {
                  if (isEditing) {
                    clearFieldError('description');
                    setEditedAsset(prev => ({ ...prev, description: e.target.value }));
                  }
                }}
                disabled={!isEditing}
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea 
                rows={3}
                className="mt-1 w-full rounded-md border px-3 py-2" 
                value={isEditing ? (editedAsset?.notes || "") : (asset?.notes || "")}
                onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, notes: e.target.value }))}
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  checked={isEditing ? (editedAsset?.reuseDisposition || false) : (asset?.reuseDisposition || false)}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, reuseDisposition: e.target.checked }))}
                  disabled={!isEditing}
                />
                <label className="ml-2 block text-sm text-gray-900">Reuse Disposition</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  checked={isEditing ? (editedAsset?.resaleDisposition || false) : (asset?.resaleDisposition || false)}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, resaleDisposition: e.target.checked }))}
                  disabled={!isEditing}
                />
                <label className="ml-2 block text-sm text-gray-900">Resale Disposition</label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "data" && (
          <div className="space-y-4">
            <div className="rounded-md border bg-yellow-50 p-3 text-sm text-yellow-800">
              Compliance placeholder: If asset is data bearing and sanitization status is not completed, show alert.
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Method</label>
                <select className="mt-1 w-full rounded-md border px-3 py-2">
                  <option>DoD 5220.22-M</option>
                  <option>NIST 800-88</option>
                  <option>Physical Destruction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select className="mt-1 w-full rounded-md border px-3 py-2">
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data Destruction Cost ($)</label>
                <input type="number" className="mt-1 w-full rounded-md border px-3 py-2" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Certificate of Destruction</label>
                <input type="file" className="mt-1 w-full rounded-md border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Evidence Photo/Video</label>
                <input type="file" className="mt-1 w-full rounded-md border px-3 py-2" />
              </div>
            </div>

          </div>
        )}

        {activeTab === "coc" && (
          <div className="space-y-4">
            <div className="rounded-md border bg-gray-50 p-3">
              <div className="text-sm font-medium text-gray-800 mb-2">Add Chain of Custody Record</div>
              <div className="grid gap-4 md:grid-cols-4">
                <input className="rounded-md border px-3 py-2" placeholder="Location" />
                <input className="rounded-md border px-3 py-2" placeholder="User" />
                <input className="rounded-md border px-3 py-2" placeholder="Status Change" />
                <input className="rounded-md border px-3 py-2" placeholder="Timestamp" />
              </div>
              <textarea className="mt-3 w-full rounded-md border px-3 py-2" rows={3} placeholder="Notes"></textarea>
              <div className="mt-3 flex justify-end">
                <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Add Entry</button>
              </div>
            </div>

            <div className="rounded-md border bg-white">
              <div className="border-b px-4 py-2 text-sm font-medium text-gray-700">Chain of Custody Log</div>
              <div className="p-4 text-sm text-gray-600">
                Placeholder for chronological CoC entries.
              </div>
            </div>
          </div>
        )}

        {activeTab === "recycling" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <input className="rounded-md border px-3 py-2" placeholder="Recycling Vendor" />
              <input className="rounded-md border px-3 py-2" placeholder="Recycling Date" />
              <input type="number" className="rounded-md border px-3 py-2" placeholder="Recycling Cost ($)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Certificate of Recycling</label>
              <input type="file" className="mt-1 w-full rounded-md border px-3 py-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className="rounded-md border px-3 py-2" placeholder="Processing Lot ID (optional)" />
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="rounded-md border bg-gray-50 p-3">
              <div className="text-sm font-medium text-gray-800">Upload Documents</div>
              <input type="file" multiple className="mt-2 w-full rounded-md border px-3 py-2" />
            </div>
            <div className="rounded-md border bg-white">
              <div className="border-b px-4 py-2 text-sm font-medium text-gray-700">Documents</div>
              <div className="p-4 text-sm text-gray-600">Placeholder for documents list.</div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
