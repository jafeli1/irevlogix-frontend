"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "../../../../components/AppLayout";

type Vendor = {
  id: number;
  vendorName: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  materialsOfInterest?: string | null;
  paymentTerms?: string | null;
  vendorRating?: number | null;
};

type MaterialType = {
  id: number;
  name: string;
  description: string;
};

type ProcessedMaterialSalesListItem = {
  id: number;
  processedMaterialId: number;
  processedMaterial?: { id: number; description: string; materialType?: MaterialType | null } | null;
  vendorId?: number | null;
  salesQuantity?: number | null;
  agreedPricePerUnit?: number | null;
  shipmentDate?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  freightCost?: number | null;
  loadingCost?: number | null;
  invoiceId?: string | null;
  invoiceDate?: string | null;
  dateInvoicePaid?: string | null;
  invoiceTotal?: number | null;
  invoiceStatus?: string | null;
};

interface VendorContract {
  id: number;
  vendorId: number;
  documentUrl: string | null;
  effectiveStartDate: string | null;
  effectiveEndDate: string | null;
  dateCreated: string;
  dateUpdated: string;
}

interface VendorPricing {
  id: number;
  vendorId: number;
  materialTypeId: number | null;
  materialType: { id: number; name: string } | null;
  pricePerUnit: number | null;
  effectiveStartDate: string | null;
  effectiveEndDate: string | null;
  dateCreated: string;
  dateUpdated: string;
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params as { id?: string })?.id;

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
  }, []);

  const [data, setData] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sales" | "contracts" | "pricing" | "communications" | "financials" | "documents">("sales");

  const [salesData, setSalesData] = useState<ProcessedMaterialSalesListItem[]>([]);
  const [filteredSalesData, setFilteredSalesData] = useState<ProcessedMaterialSalesListItem[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterMaterialTypeId, setFilterMaterialTypeId] = useState("");
  
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize, setSalesPageSize] = useState(25);

  const [contracts, setContracts] = useState<VendorContract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [editingContract, setEditingContract] = useState<VendorContract | null>(null);
  const [contractFormData, setContractFormData] = useState({
    effectiveStartDate: '',
    effectiveEndDate: '',
    documentUrl: ''
  });
  const [contractFormErrors, setContractFormErrors] = useState<Record<string, string>>({});
  const [contractUploadFile, setContractUploadFile] = useState<File | null>(null);
  const [contractUploading, setContractUploading] = useState(false);
  const [showContractDeleteConfirm, setShowContractDeleteConfirm] = useState(false);
  const [deletingContractId, setDeletingContractId] = useState<number | null>(null);

  const [pricing, setPricing] = useState<VendorPricing[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<VendorPricing | null>(null);
  const [pricingFormData, setPricingFormData] = useState({
    materialTypeId: '',
    pricePerUnit: '',
    effectiveStartDate: '',
    effectiveEndDate: ''
  });
  const [pricingFormErrors, setPricingFormErrors] = useState<Record<string, string>>({});
  const [showPricingDeleteConfirm, setShowPricingDeleteConfirm] = useState(false);
  const [deletingPricingId, setDeletingPricingId] = useState<number | null>(null);
  
  const pageSizeOptions = [10, 25, 50];

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/Vendors/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    setSalesLoading(true);
    setSalesError(null);
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialSales?page=1&pageSize=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = await res.json();
      setSalesData(json.items || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load sales data";
      setSalesError(msg);
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchMaterialTypes = async () => {
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/MaterialTypes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setMaterialTypes(json || []);
    } catch {}
  };

  useEffect(() => {
    if (!salesData.length || !id) return;
    
    let filtered = salesData.filter(sale => sale.vendorId === parseInt(id));
    
    if (startDate) {
      filtered = filtered.filter(sale => {
        const saleDate = sale.invoiceDate ? new Date(sale.invoiceDate) : null;
        return saleDate && saleDate >= new Date(startDate);
      });
    }
    
    if (endDate) {
      filtered = filtered.filter(sale => {
        const saleDate = sale.invoiceDate ? new Date(sale.invoiceDate) : null;
        return saleDate && saleDate <= new Date(endDate);
      });
    }
    
    if (filterMaterialTypeId) {
      filtered = filtered.filter(sale => 
        sale.processedMaterial?.materialType?.id === parseInt(filterMaterialTypeId)
      );
    }
    
    setFilteredSalesData(filtered);
    setSalesPage(1);
  }, [salesData, id, startDate, endDate, filterMaterialTypeId]);

  useEffect(() => {
    if (!token || !id) return;
    fetchDetail();
    fetchSalesData();
    fetchMaterialTypes();
    fetchPricing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  useEffect(() => {
    if (data && activeTab === "contracts") {
      fetchContracts();
    }
  }, [data, activeTab]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterMaterialTypeId("");
  };

  const fetchContracts = async () => {
    if (!data) return;
    
    setContractsLoading(true);
    setContractsError(null);
    
    try {
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/VendorContracts?vendorId=${data.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts data');
      }
      
      const contractsData = await response.json();
      setContracts(contractsData.items || []);
    } catch (err) {
      setContractsError('Failed to load contracts data');
      console.error('Error fetching contracts:', err);
    } finally {
      setContractsLoading(false);
    }
  };

  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setContractUploadFile(file);
    }
  };

  const uploadContractFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://irevlogix-backend.onrender.com/api/VendorContracts/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const responseData = await response.json();
    return responseData.filePath;
  };

  const validateContractForm = () => {
    const errors: Record<string, string> = {};
    
    if (!contractFormData.effectiveStartDate) {
      errors.effectiveStartDate = 'Effective start date is required';
    }
    
    if (!editingContract && !contractUploadFile) {
      errors.file = 'File upload is required';
    }
    
    setContractFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateContractForm() || !data) return;
    
    setContractUploading(true);
    
    try {
      let documentUrl = contractFormData.documentUrl;
      
      if (contractUploadFile) {
        documentUrl = await uploadContractFile(contractUploadFile);
      }

      const submitData = {
        vendorId: data.id,
        effectiveStartDate: contractFormData.effectiveStartDate,
        effectiveEndDate: contractFormData.effectiveEndDate || null,
        documentUrl: documentUrl
      };

      const url = editingContract 
        ? `https://irevlogix-backend.onrender.com/api/VendorContracts/${editingContract.id}`
        : 'https://irevlogix-backend.onrender.com/api/VendorContracts';
      
      const method = editingContract ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to save contract');
      }

      await fetchContracts();
      setShowContractModal(false);
      setContractFormData({
        effectiveStartDate: '',
        effectiveEndDate: '',
        documentUrl: ''
      });
      setContractUploadFile(null);
      setContractFormErrors({});
      setEditingContract(null);
    } catch (err) {
      setContractsError('Failed to save contract');
      console.error('Error saving contract:', err);
    } finally {
      setContractUploading(false);
    }
  };

  const handleEditContract = (contract: VendorContract) => {
    setEditingContract(contract);
    setContractFormData({
      effectiveStartDate: contract.effectiveStartDate || '',
      effectiveEndDate: contract.effectiveEndDate || '',
      documentUrl: contract.documentUrl || ''
    });
    setContractFormErrors({});
    setContractUploadFile(null);
    setShowContractModal(true);
  };

  const handleDeleteContract = async (contractId: number) => {
    try {
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/VendorContracts/${contractId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete contract');
      }

      await fetchContracts();
      setShowContractDeleteConfirm(false);
      setDeletingContractId(null);
    } catch (err) {
      setContractsError('Failed to delete contract');
      console.error('Error deleting contract:', err);
    }
  };

  const openAddContractModal = () => {
    setEditingContract(null);
    setContractFormData({
      effectiveStartDate: '',
      effectiveEndDate: '',
      documentUrl: ''
    });
    setContractFormErrors({});
    setContractUploadFile(null);
    setShowContractModal(true);
  };

  const closeContractModal = () => {
    setShowContractModal(false);
    setContractFormData({
      effectiveStartDate: '',
      effectiveEndDate: '',
      documentUrl: ''
    });
    setContractFormErrors({});
    setContractUploadFile(null);
    setEditingContract(null);
  };

  const fetchPricing = async () => {
    if (!id || !token) return;
    
    setPricingLoading(true);
    setPricingError(null);
    
    try {
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/VendorPricing?vendorId=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pricing data');
      }
      
      const result = await response.json();
      setPricing(result.items || []);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      setPricingError('Failed to load pricing data');
    } finally {
      setPricingLoading(false);
    }
  };

  const validatePricingForm = () => {
    const errors: Record<string, string> = {};
    
    if (!pricingFormData.materialTypeId) {
      errors.materialTypeId = 'Material Type is required';
    }
    if (!pricingFormData.pricePerUnit) {
      errors.pricePerUnit = 'Price Per Unit is required';
    } else if (isNaN(Number(pricingFormData.pricePerUnit)) || Number(pricingFormData.pricePerUnit) <= 0) {
      errors.pricePerUnit = 'Price Per Unit must be a positive number';
    }
    if (!pricingFormData.effectiveStartDate) {
      errors.effectiveStartDate = 'Effective Start Date is required';
    }
    
    setPricingFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePricingForm()) {
      return;
    }
    
    try {
      const submitData = {
        vendorId: Number(id),
        materialTypeId: Number(pricingFormData.materialTypeId),
        pricePerUnit: Number(pricingFormData.pricePerUnit),
        effectiveStartDate: pricingFormData.effectiveStartDate,
        effectiveEndDate: pricingFormData.effectiveEndDate || null
      };
      
      const url = editingPricing 
        ? `https://irevlogix-backend.onrender.com/api/VendorPricing/${editingPricing.id}`
        : 'https://irevlogix-backend.onrender.com/api/VendorPricing';
      
      const method = editingPricing ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save pricing');
      }
      
      await fetchPricing();
      closePricingModal();
    } catch (error) {
      console.error('Error saving pricing:', error);
      setPricingFormErrors({ submit: 'Failed to save pricing. Please try again.' });
    }
  };

  const handleEditPricing = (pricing: VendorPricing) => {
    setEditingPricing(pricing);
    setPricingFormData({
      materialTypeId: pricing.materialTypeId?.toString() || '',
      pricePerUnit: pricing.pricePerUnit?.toString() || '',
      effectiveStartDate: pricing.effectiveStartDate || '',
      effectiveEndDate: pricing.effectiveEndDate || ''
    });
    setShowPricingModal(true);
  };

  const handleDeletePricing = async (pricingId: number) => {
    try {
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/VendorPricing/${pricingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete pricing');
      }
      
      await fetchPricing();
      setShowPricingDeleteConfirm(false);
      setDeletingPricingId(null);
    } catch (error) {
      console.error('Error deleting pricing:', error);
    }
  };

  const openAddPricingModal = () => {
    setEditingPricing(null);
    setPricingFormData({
      materialTypeId: '',
      pricePerUnit: '',
      effectiveStartDate: '',
      effectiveEndDate: ''
    });
    setPricingFormErrors({});
    setShowPricingModal(true);
  };

  const closePricingModal = () => {
    setShowPricingModal(false);
    setEditingPricing(null);
    setPricingFormData({
      materialTypeId: '',
      pricePerUnit: '',
      effectiveStartDate: '',
      effectiveEndDate: ''
    });
    setPricingFormErrors({});
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vendor Detail</h1>
        <button
          onClick={() => router.push('/downstream/vendors')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Vendors
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : !data ? (
        <div>No data</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border rounded p-4">
            <div>
              <div className="text-sm text-gray-500">Vendor Name</div>
              <div className="font-medium">{data.vendorName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Contact</div>
              <div className="font-medium">{data.contactPerson || ""}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium">{data.email || ""}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium">{data.phone || ""}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Address</div>
              <div className="font-medium">
                {[data.address, data.city, data.state, data.postalCode, data.country].filter(Boolean).join(", ")}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Vendor Rating</div>
              <div className="font-medium">{data.vendorRating ?? ""}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b">
            <button className={`px-4 py-2 ${activeTab === "sales" ? "border-b-2 border-blue-600" : ""}`} onClick={() => setActiveTab("sales")}>Sales History</button>
            <button className={`px-4 py-2 ${activeTab === "contracts" ? "border-b-2 border-blue-600" : ""}`} onClick={() => setActiveTab("contracts")}>Contracts</button>
            <button className={`px-4 py-2 ${activeTab === "pricing" ? "border-b-2 border-blue-600" : ""}`} onClick={() => setActiveTab("pricing")}>Pricing</button>
            <button className={`px-4 py-2 ${activeTab === "communications" ? "border-b-2 border-blue-600" : ""}`} onClick={() => setActiveTab("communications")}>Communications Log</button>
            <button className={`px-4 py-2 ${activeTab === "financials" ? "border-b-2 border-blue-600" : ""}`} onClick={() => setActiveTab("financials")}>Financial Summary</button>
            <button className={`px-4 py-2 ${activeTab === "documents" ? "border-b-2 border-blue-600" : ""}`} onClick={() => setActiveTab("documents")}>Documents</button>
          </div>

          {activeTab === "sales" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Sales History Filters</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filterMaterialTypeId}
                      onChange={(e) => setFilterMaterialTypeId(e.target.value)}
                    >
                      <option value="">All Material Types</option>
                      {materialTypes.map((mt) => (
                        <option key={mt.id} value={mt.id}>{mt.description}</option>
                      ))}
                    </select>
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

              {/* Sales History Table */}
              <div className="bg-white border rounded">
                <div className="text-lg font-semibold p-4 border-b">Sales History</div>
                
                {salesLoading ? (
                  <div className="p-4">Loading sales data...</div>
                ) : salesError ? (
                  <div className="p-4 text-red-600">{salesError}</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Processed Material</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Material Type</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Sales Quantity</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Agreed Price/Unit</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Shipment Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Carrier</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tracking Number</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Freight Cost</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Loading Cost</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice ID</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date Invoice Paid</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice Total</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredSalesData
                            .slice((salesPage - 1) * salesPageSize, salesPage * salesPageSize)
                            .map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">{item.id}</td>
                              <td className="px-4 py-3 text-sm">{item.processedMaterial?.description || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.processedMaterial?.materialType?.name || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.salesQuantity?.toFixed(2) || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">${item.agreedPricePerUnit?.toFixed(2) || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.shipmentDate ? new Date(item.shipmentDate).toLocaleDateString() : "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.carrier || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.trackingNumber || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">${item.freightCost?.toFixed(2) || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">${item.loadingCost?.toFixed(2) || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.invoiceId || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString() : "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.dateInvoicePaid ? new Date(item.dateInvoicePaid).toLocaleDateString() : "N/A"}</td>
                              <td className="px-4 py-3 text-sm">${item.invoiceTotal?.toFixed(2) || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.invoiceStatus || "N/A"}</td>
                            </tr>
                          ))}
                          {filteredSalesData.length === 0 && (
                            <tr>
                              <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                                No sales history found for this vendor.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Show</span>
                        <select
                          className="border rounded px-2 py-1"
                          value={salesPageSize}
                          onChange={(e) => {
                            setSalesPageSize(Number(e.target.value));
                            setSalesPage(1);
                          }}
                        >
                          {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                        <span className="text-sm text-gray-500">entries</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSalesPage(Math.max(1, salesPage - 1))}
                          disabled={salesPage <= 1}
                          className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-500">
                          Page {salesPage} of {Math.ceil(filteredSalesData.length / salesPageSize)} ({filteredSalesData.length} total)
                        </span>
                        <button
                          onClick={() => setSalesPage(Math.min(Math.ceil(filteredSalesData.length / salesPageSize), salesPage + 1))}
                          disabled={salesPage >= Math.ceil(filteredSalesData.length / salesPageSize)}
                          className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "contracts" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Vendor Contracts</h3>
                <button
                  onClick={openAddContractModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Contract
                </button>
              </div>

              {contractsError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800">{contractsError}</p>
                </div>
              )}

              {contractsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  {contracts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No contracts found for this vendor.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {contracts.map((contract) => (
                        <li key={contract.id} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    Contract #{contract.id}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {contract.effectiveStartDate && (
                                      <>Start: {new Date(contract.effectiveStartDate).toLocaleDateString()}</>
                                    )}
                                    {contract.effectiveEndDate && (
                                      <> | End: {new Date(contract.effectiveEndDate).toLocaleDateString()}</>
                                    )}
                                  </p>
                                </div>
                                {contract.documentUrl && (
                                  <div>
                                    <a
                                      href={`https://irevlogix-backend.onrender.com/${contract.documentUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      View Document
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditContract(contract)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingContractId(contract.id);
                                  setShowContractDeleteConfirm(true);
                                }}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Vendor Pricing</h3>
                <button
                  onClick={openAddPricingModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Pricing
                </button>
              </div>

              {pricingError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800">{pricingError}</p>
                </div>
              )}

              {pricingLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  {pricing.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No pricing found for this vendor.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Per Unit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Start Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective End Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pricing.map((pricingItem) => (
                            <tr key={pricingItem.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pricingItem.materialType?.name || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pricingItem.pricePerUnit ? `$${pricingItem.pricePerUnit.toFixed(2)}` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pricingItem.effectiveStartDate ? new Date(pricingItem.effectiveStartDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pricingItem.effectiveEndDate ? new Date(pricingItem.effectiveEndDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleEditPricing(pricingItem)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setDeletingPricingId(pricingItem.id);
                                    setShowPricingDeleteConfirm(true);
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Delete
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
            </div>
          )}

          {activeTab === "communications" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Communications Log</div>
                <div className="text-gray-500">No communications logged.</div>
              </div>
            </div>
          )}

          {activeTab === "financials" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Financial Summary</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Total Revenue</div>
                    <div className="font-medium">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Average Days to Pay</div>
                    <div className="font-medium">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Outstanding Invoices</div>
                    <div className="font-medium">-</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Documents</div>
                <div className="text-gray-500">Upload and listing coming soon.</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingContract ? 'Edit Contract' : 'Add New Contract'}
              </h3>
              <form onSubmit={handleContractSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Effective Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={contractFormData.effectiveStartDate}
                    onChange={(e) => setContractFormData({
                      ...contractFormData,
                      effectiveStartDate: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {contractFormErrors.effectiveStartDate && (
                    <p className="mt-1 text-sm text-red-600">{contractFormErrors.effectiveStartDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Effective End Date
                  </label>
                  <input
                    type="date"
                    value={contractFormData.effectiveEndDate}
                    onChange={(e) => setContractFormData({
                      ...contractFormData,
                      effectiveEndDate: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contract Document {!editingContract && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="file"
                    onChange={handleContractFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  
                  {contractUploadFile && (
                    <div className="mt-2 text-sm text-blue-600">
                      Selected: {contractUploadFile.name}
                    </div>
                  )}

                  {editingContract && contractFormData.documentUrl && !contractUploadFile && (
                    <div className="mt-2 text-sm text-gray-600">
                      Current: <a href={`https://irevlogix-backend.onrender.com/${contractFormData.documentUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">View Document</a>
                    </div>
                  )}

                  {contractFormErrors.file && (
                    <p className="mt-1 text-sm text-red-600">{contractFormErrors.file}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeContractModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={contractUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {contractUploading ? 'Saving...' : (editingContract ? 'Update Contract' : 'Add Contract')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showContractDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Contract</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete this contract? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowContractDeleteConfirm(false);
                    setDeletingContractId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletingContractId && handleDeleteContract(deletingContractId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPricing ? 'Edit Pricing' : 'Add New Pricing'}
              </h3>
              <form onSubmit={handlePricingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Material Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={pricingFormData.materialTypeId}
                    onChange={(e) => setPricingFormData({ ...pricingFormData, materialTypeId: e.target.value })}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      pricingFormErrors.materialTypeId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Material Type</option>
                    {materialTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {pricingFormErrors.materialTypeId && (
                    <p className="mt-1 text-sm text-red-600">{pricingFormErrors.materialTypeId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price Per Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingFormData.pricePerUnit}
                    onChange={(e) => setPricingFormData({ ...pricingFormData, pricePerUnit: e.target.value })}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      pricingFormErrors.pricePerUnit ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {pricingFormErrors.pricePerUnit && (
                    <p className="mt-1 text-sm text-red-600">{pricingFormErrors.pricePerUnit}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Effective Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={pricingFormData.effectiveStartDate}
                    onChange={(e) => setPricingFormData({ ...pricingFormData, effectiveStartDate: e.target.value })}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      pricingFormErrors.effectiveStartDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {pricingFormErrors.effectiveStartDate && (
                    <p className="mt-1 text-sm text-red-600">{pricingFormErrors.effectiveStartDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Effective End Date
                  </label>
                  <input
                    type="date"
                    value={pricingFormData.effectiveEndDate}
                    onChange={(e) => setPricingFormData({ ...pricingFormData, effectiveEndDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {pricingFormErrors.submit && (
                  <div className="text-red-600 text-sm">{pricingFormErrors.submit}</div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closePricingModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editingPricing ? 'Update Pricing' : 'Add Pricing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Delete Confirmation Modal */}
      {showPricingDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Pricing</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete this pricing? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowPricingDeleteConfirm(false);
                    setDeletingPricingId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletingPricingId && handleDeletePricing(deletingPricingId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}
