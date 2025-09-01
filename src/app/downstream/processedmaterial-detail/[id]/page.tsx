"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "../../../../components/AppLayout";

type MaterialType = {
  id: number;
  name: string;
};

type ProcessingLot = {
  id: number;
  lotNumber: string;
};

type ProcessedMaterial = {
  id: number;
  materialType?: MaterialType | null;
  materialTypeId?: number | null;
  description?: string | null;
  quantity?: number | null;
  unitOfMeasure?: string | null;
  qualityGrade?: string | null;
  location?: string | null;
  status?: string | null;
  processingLotId?: number | null;
  processedWeight?: number | null;
  weightUnit?: string | null;
  destinationVendor?: string | null;
  expectedSalesPrice?: number | null;
  actualSalesPrice?: number | null;
  saleDate?: string | null;
  notes?: string | null;
  certificationNumber?: string | null;
  isHazardous?: boolean;
  hazardousClassification?: string | null;
  purchaseCostPerUnit?: number | null;
  processingCostPerUnit?: number | null;
};

type ProcessedMaterialTest = {
  id: number;
  processedMaterialId: number;
  testDate?: string | null;
  lab?: string | null;
  parameters?: string | null;
  results?: string | null;
  complianceStatus?: string | null;
  reportDocumentUrl?: string | null;
};

type ProcessedMaterialDocument = {
  id: number;
  processedMaterialId: number;
  fileName: string;
  filePath: string;
  contentType: string | null;
  fileSize: number;
  description: string | null;
  documentType: string | null;
  dateCreated: string;
};

interface ProcessedMaterialTestFile {
  fileName: string;
  fullFileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
  documentType: string;
}

interface ProcessedMaterialTestFile {
  fileName: string;
  fullFileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
  documentType: string;
}

export default function ProcessedMaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params as { id?: string })?.id;
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
  }, []);

  const [data, setData] = useState<ProcessedMaterial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sales" | "qc" | "documents" | "financials">("sales");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [testResults, setTestResults] = useState<ProcessedMaterialTest[]>([]);
  const [testResultsLoading, setTestResultsLoading] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState<ProcessedMaterialTest | null>(null);
  const [testFormData, setTestFormData] = useState({
    testDate: '',
    lab: '',
    parameters: '',
    results: '',
    complianceStatus: '',
    reportDocumentUrl: ''
  });
  const [testFormErrors, setTestFormErrors] = useState<Record<string, string>>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState<number | null>(null);

  const [documents, setDocuments] = useState<ProcessedMaterialDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ProcessedMaterial>>({});
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [processingLots, setProcessingLots] = useState<ProcessingLot[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<ProcessedMaterialDocument | null>(null);
  const [documentFormData, setDocumentFormData] = useState({
    fileName: '',
    filePath: '',
    contentType: '',
    fileSize: 0,
    description: '',
    documentType: ''
  });
  const [documentFormErrors, setDocumentFormErrors] = useState<Record<string, string>>({});
  const [documentUploadFile, setDocumentUploadFile] = useState<File | null>(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [showDocumentDeleteConfirm, setShowDocumentDeleteConfirm] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterials/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const json = await res.json();
      setData(json);
      setStatus(json?.status || "");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/MaterialTypes?pageSize=1000', {
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

  const fetchProcessingLots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://irevlogix-backend.onrender.com/api/ProcessingLots?pageSize=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProcessingLots(data);
      }
    } catch {
      console.error('Failed to fetch processing lots');
    }
  };

  useEffect(() => {
    if (!token || !id) return;
    fetchDetail();
    fetchMaterialTypes();
    fetchProcessingLots();
    fetchUploadedTestFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  useEffect(() => {
    if (activeTab === "qc" && data) {
      fetchTestResults();
    }
    if (activeTab === "documents" && data) {
      fetchDocuments();
    }
  }, [activeTab, data]);

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    
    if (!editedData.description?.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!editedData.materialTypeId) {
      errors.materialTypeId = 'Material Type is required';
    }
    
    if (!editedData.processingLotId) {
      errors.processingLotId = 'Processing Lot is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateEditForm()) {
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterials/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Description: editedData.description,
          MaterialTypeId: editedData.materialTypeId,
          Quantity: editedData.quantity,
          UnitOfMeasure: editedData.unitOfMeasure,
          QualityGrade: editedData.qualityGrade,
          Location: editedData.location,
          Status: editedData.status,
          ProcessingLotId: editedData.processingLotId,
          ProcessedWeight: editedData.processedWeight,
          WeightUnit: editedData.weightUnit,
          DestinationVendor: editedData.destinationVendor,
          ExpectedSalesPrice: editedData.expectedSalesPrice,
          ActualSalesPrice: editedData.actualSalesPrice,
          SaleDate: editedData.saleDate,
          Notes: editedData.notes,
          CertificationNumber: editedData.certificationNumber,
          IsHazardous: editedData.isHazardous,
          HazardousClassification: editedData.hazardousClassification,
          PurchaseCostPerUnit: editedData.purchaseCostPerUnit,
          ProcessingCostPerUnit: editedData.processingCostPerUnit
        }),
      });

      if (response.ok) {
        setData(editedData as ProcessedMaterial);
        setIsEditing(false);
        setValidationErrors({});
        await fetchDetail();
      } else {
        setError('Failed to update processed material');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onSaveStatus = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterials/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      await fetchDetail();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const fetchTestResults = async () => {
    if (!data) return;
    
    setTestResultsLoading(true);
    try {
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialTests?processedMaterialId=${data.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch test results');
      }
      const responseData = await response.json();
      setTestResults(responseData.items || []);
    } catch (err) {
      console.error('Error fetching test results:', err);
    } finally {
      setTestResultsLoading(false);
    }
  };

  const handleTestInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTestFormData(prev => ({ ...prev, [name]: value }));
    if (testFormErrors[name]) {
      setTestFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const uploadTestFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://irevlogix-backend.onrender.com/api/ProcessedMaterialTests/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const responseData = await response.json();
    return responseData.filePath;
  };

  const validateTestForm = () => {
    const errors: Record<string, string> = {};
    
    if (!testFormData.testDate) errors.testDate = 'Test date is required';
    if (!testFormData.lab) errors.lab = 'Lab is required';
    if (!testFormData.parameters) errors.parameters = 'Parameters are required';
    if (!testFormData.results) errors.results = 'Results are required';
    if (!testFormData.complianceStatus) errors.complianceStatus = 'Compliance status is required';
    
    setTestFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateTestForm()) return;
    if (!data) return;

    setUploading(true);
    try {
      let reportDocumentUrl = testFormData.reportDocumentUrl;
      
      if (uploadFile) {
        reportDocumentUrl = await uploadTestFile(uploadFile);
      }

      const submitData = {
        ...testFormData,
        processedMaterialId: data.id,
        reportDocumentUrl
      };

      const url = editingTest 
        ? `https://irevlogix-backend.onrender.com/api/ProcessedMaterialTests/${editingTest.id}`
        : 'https://irevlogix-backend.onrender.com/api/ProcessedMaterialTests';
      
      const method = editingTest ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to save test result');
      }

      await fetchTestResults();
      await fetchUploadedTestFiles();
      setShowTestModal(false);
      setEditingTest(null);
      setTestFormData({
        testDate: '',
        lab: '',
        parameters: '',
        results: '',
        complianceStatus: '',
        reportDocumentUrl: ''
      });
      setUploadFile(null);
      setTestFormErrors({});
    } catch (err) {
      setError('Failed to save test result');
    } finally {
      setUploading(false);
    }
  };

  const handleEditTest = (test: ProcessedMaterialTest) => {
    setEditingTest(test);
    setTestFormData({
      testDate: test.testDate ? test.testDate.split('T')[0] : '',
      lab: test.lab || '',
      parameters: test.parameters || '',
      results: test.results || '',
      complianceStatus: test.complianceStatus || '',
      reportDocumentUrl: test.reportDocumentUrl || ''
    });
    setShowTestModal(true);
  };

  const handleDeleteTest = async (testId: number) => {
    try {
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialTests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete test result');
      }

      await fetchTestResults();
      setShowDeleteConfirm(false);
      setDeletingTestId(null);
    } catch (err) {
      setError('Failed to delete test result');
    }
  };

  const fetchUploadedTestFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialTests/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedTestFiles(data);
      } else {
        console.error('Failed to fetch uploaded test files');
        setUploadedTestFiles([]);
      }
    } catch (error) {
      console.error('Error fetching uploaded test files:', error);
      setUploadedTestFiles([]);
    }
  };

  const openAddTestModal = () => {
    setEditingTest(null);
    setTestFormData({
      testDate: '',
      lab: '',
      parameters: '',
      results: '',
      complianceStatus: '',
      reportDocumentUrl: ''
    });
    setUploadFile(null);
    setTestFormErrors({});
    setShowTestModal(true);
  };

  const fetchDocuments = async () => {
    if (!data) return;
    
    setDocumentsLoading(true);
    try {
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialDocuments?processedMaterialId=${data.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const responseData = await response.json();
      setDocuments(responseData.items || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDocumentFormData(prev => ({ ...prev, [name]: value }));
    if (documentFormErrors[name]) {
      setDocumentFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentUploadFile(file);
    }
  };

  const uploadDocumentFile = async (file: File): Promise<{ filePath: string; fileName: string; contentType: string; fileSize: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://irevlogix-backend.onrender.com/api/ProcessedMaterialDocuments/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const responseData = await response.json();
    return {
      filePath: responseData.filePath,
      fileName: responseData.fileName,
      contentType: responseData.contentType,
      fileSize: responseData.fileSize
    };
  };

  const validateDocumentForm = () => {
    const errors: Record<string, string> = {};
    
    if (!documentFormData.documentType) {
      errors.documentType = 'Document type is required';
    }
    
    if (!editingDocument && !documentUploadFile) {
      errors.file = 'File upload is required';
    }
    
    setDocumentFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDocumentForm()) {
      return;
    }

    setDocumentUploading(true);
    try {
      let fileData = {
        fileName: documentFormData.fileName,
        filePath: documentFormData.filePath,
        contentType: documentFormData.contentType,
        fileSize: documentFormData.fileSize
      };
      
      if (documentUploadFile) {
        const uploadResult = await uploadDocumentFile(documentUploadFile);
        fileData = uploadResult;
      }

      const submitData = {
        processedMaterialId: data!.id,
        fileName: fileData.fileName,
        filePath: fileData.filePath,
        contentType: fileData.contentType,
        fileSize: fileData.fileSize,
        description: documentFormData.description || null,
        documentType: documentFormData.documentType || null
      };

      const url = editingDocument 
        ? `https://irevlogix-backend.onrender.com/api/ProcessedMaterialDocuments/${editingDocument.id}`
        : 'https://irevlogix-backend.onrender.com/api/ProcessedMaterialDocuments';
      
      const method = editingDocument ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      await fetchDocuments();
      setShowDocumentModal(false);
      resetDocumentForm();
    } catch (err) {
      console.error('Error saving document:', err);
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleEditDocument = (document: ProcessedMaterialDocument) => {
    setEditingDocument(document);
    setDocumentFormData({
      fileName: document.fileName,
      filePath: document.filePath,
      contentType: document.contentType || '',
      fileSize: document.fileSize,
      description: document.description || '',
      documentType: document.documentType || ''
    });
    setShowDocumentModal(true);
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialDocuments/${documentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      await fetchDocuments();
      setShowDocumentDeleteConfirm(false);
      setDeletingDocumentId(null);
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const openAddDocumentModal = () => {
    setEditingDocument(null);
    setDocumentFormData({
      fileName: '',
      filePath: '',
      contentType: '',
      fileSize: 0,
      description: '',
      documentType: ''
    });
    setDocumentFormErrors({});
    setDocumentUploadFile(null);
    setShowDocumentModal(true);
  };

  const resetDocumentForm = () => {
    setDocumentFormData({
      fileName: '',
      filePath: '',
      contentType: '',
      fileSize: 0,
      description: '',
      documentType: ''
    });
    setDocumentFormErrors({});
    setDocumentUploadFile(null);
    setEditingDocument(null);
  };

  const calculateFinancials = () => {
    if (!data) return { totalCost: 0, totalRevenue: 0, netProfit: 0 };
    
    const quantity = data.quantity || 0;
    const purchaseCost = data.purchaseCostPerUnit || 0;
    const processingCost = data.processingCostPerUnit || 0;
    const salesPrice = data.actualSalesPrice || 0;
    
    const totalCost = (purchaseCost + processingCost) * quantity;
    const totalRevenue = salesPrice * quantity;
    const netProfit = totalRevenue - totalCost;
    
    return { totalCost, totalRevenue, netProfit };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };


  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Processed Material Detail</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/downstream/processedmaterial')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Processed Materials
          </button>
          {!isEditing ? (
            <>
              <select className="border rounded px-2 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Select Status</option>
                <option value="Available">Available</option>
                <option value="On Hold">On Hold</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold">Sold</option>
              </select>
              <button onClick={onSaveStatus} className="px-3 py-2 bg-blue-600 text-white rounded" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditedData(data || {});
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Edit
              </button>
            </>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedData({});
                  setValidationErrors({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : !data ? (
        <div>No data</div>
      ) : (
        <>
          <div className="bg-white border rounded p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Material Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {isEditing && <span className="text-red-500">*</span>} Material Type
                </label>
                {isEditing ? (
                  <div>
                    <select
                      value={editedData.materialTypeId || ''}
                      onChange={(e) => {
                        setEditedData(prev => ({ ...prev, materialTypeId: e.target.value ? parseInt(e.target.value) : undefined }));
                        if (validationErrors.materialTypeId) {
                          setValidationErrors(prev => ({ ...prev, materialTypeId: '' }));
                        }
                      }}
                      className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.materialTypeId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Material Type</option>
                      {materialTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.materialTypeId && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.materialTypeId}</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.materialType?.name || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {isEditing && <span className="text-red-500">*</span>} Description
                </label>
                {isEditing ? (
                  <div>
                    <textarea
                      value={editedData.description || ''}
                      onChange={(e) => {
                        setEditedData(prev => ({ ...prev, description: e.target.value }));
                        if (validationErrors.description) {
                          setValidationErrors(prev => ({ ...prev, description: '' }));
                        }
                      }}
                      className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      rows={2}
                    />
                    {validationErrors.description && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.description || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedData.quantity || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, quantity: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.quantity ?? 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Unit of Measure</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.unitOfMeasure || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, unitOfMeasure: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.unitOfMeasure || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quality Grade</label>
                {isEditing ? (
                  <select
                    value={editedData.qualityGrade || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, qualityGrade: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Quality Grade</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.qualityGrade || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Current Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.location || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, location: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.location || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                {isEditing ? (
                  <select
                    value={editedData.status || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, status: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Available">Available</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Sold">Sold</option>
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.status || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {isEditing && <span className="text-red-500">*</span>} Processing Lot
                </label>
                {isEditing ? (
                  <div>
                    <select
                      value={editedData.processingLotId || ''}
                      onChange={(e) => {
                        setEditedData(prev => ({ ...prev, processingLotId: e.target.value ? parseInt(e.target.value) : undefined }));
                        if (validationErrors.processingLotId) {
                          setValidationErrors(prev => ({ ...prev, processingLotId: '' }));
                        }
                      }}
                      className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.processingLotId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Processing Lot</option>
                      {processingLots.map(lot => (
                        <option key={lot.id} value={lot.id}>
                          {lot.lotNumber}
                        </option>
                      ))}
                    </select>
                    {validationErrors.processingLotId && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.processingLotId}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    {data?.processingLotId ? (
                      <Link className="text-blue-600 underline" href={`/processing/lot-detail/${data.processingLotId}`}>
                        Lot #{data.processingLotId}
                      </Link>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">N/A</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Processed Weight</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedData.processedWeight || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, processedWeight: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.processedWeight ?? 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Weight Unit</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.weightUnit || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, weightUnit: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.weightUnit || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Destination Vendor</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.destinationVendor || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, destinationVendor: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.destinationVendor || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Expected Sales Price ($)</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedData.expectedSalesPrice || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, expectedSalesPrice: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.expectedSalesPrice ? `$${data.expectedSalesPrice.toFixed(2)}` : 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Actual Sales Price ($)</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedData.actualSalesPrice || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, actualSalesPrice: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.actualSalesPrice ? `$${data.actualSalesPrice.toFixed(2)}` : 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sale Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedData.saleDate || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, saleDate: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.saleDate ? new Date(data.saleDate).toLocaleDateString() : 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Certification Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.certificationNumber || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, certificationNumber: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.certificationNumber || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Is Hazardous</label>
                {isEditing ? (
                  <select
                    value={editedData.isHazardous ? 'true' : 'false'}
                    onChange={(e) => setEditedData(prev => ({ ...prev, isHazardous: e.target.value === 'true' }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.isHazardous ? 'Yes' : 'No'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hazardous Classification</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.hazardousClassification || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, hazardousClassification: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.hazardousClassification || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Purchase Cost Per Unit ($)</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedData.purchaseCostPerUnit || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, purchaseCostPerUnit: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.purchaseCostPerUnit ? `$${data.purchaseCostPerUnit.toFixed(2)}` : 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Processing Cost Per Unit ($)</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedData.processingCostPerUnit || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, processingCostPerUnit: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.processingCostPerUnit ? `$${data.processingCostPerUnit.toFixed(2)}` : 'N/A'}</p>
                )}
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                {isEditing ? (
                  <textarea
                    value={editedData.notes || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{data?.notes || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b">
            <button
              className={`px-4 py-2 ${activeTab === "sales" ? "border-b-2 border-blue-600" : ""}`}
              onClick={() => setActiveTab("sales")}
            >
              Sales &amp; Shipments
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "qc" ? "border-b-2 border-blue-600" : ""}`}
              onClick={() => setActiveTab("qc")}
            >
              Quality Control &amp; Testing
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "documents" ? "border-b-2 border-blue-600" : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              Documents
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "financials" ? "border-b-2 border-blue-600" : ""}`}
              onClick={() => setActiveTab("financials")}
            >
              Financials
            </button>
          </div>

          {activeTab === "sales" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">Sales Records</div>
                  <Link href={`/downstream/processedmaterial-sales?materialId=${id}`} className="px-3 py-2 bg-blue-600 text-white rounded">
                    Manage Sales Records
                  </Link>
                </div>
                <div className="text-gray-500">View and manage sales records in the dedicated sales section.</div>
              </div>
            </div>
          )}

          {activeTab === "qc" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Quality Control & Testing</h3>
                <button
                  onClick={openAddTestModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add New Test Result
                </button>
              </div>

              {testResultsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading test results...</p>
                </div>
              ) : testResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No test results found for this processed material.</p>
                  <p className="text-sm mt-1">Click &quot;Add New Test Result&quot; to get started.</p>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {testResults.map((test) => (
                      <li key={test.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Test Date</p>
                              <p className="text-sm text-gray-500">
                                {test.testDate ? new Date(test.testDate).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Lab</p>
                              <p className="text-sm text-gray-500">{test.lab || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Compliance Status</p>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                test.complianceStatus === 'Pass' ? 'bg-green-100 text-green-800' :
                                test.complianceStatus === 'Fail' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {test.complianceStatus || 'N/A'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Report Document</p>
                              {test.reportDocumentUrl ? (
                                <a 
                                  href={`https://irevlogix-backend.onrender.com/${test.reportDocumentUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  View Document
                                </a>
                              ) : (
                                <p className="text-sm text-gray-500">No document</p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEditTest(test)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeletingTestId(test.id);
                                setShowDeleteConfirm(true);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {(test.parameters || test.results) && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {test.parameters && (
                              <div>
                                <p className="text-sm font-medium text-gray-900">Parameters</p>
                                <p className="text-sm text-gray-500">{test.parameters}</p>
                              </div>
                            )}
                            {test.results && (
                              <div>
                                <p className="text-sm font-medium text-gray-900">Results</p>
                                <p className="text-sm text-gray-500">{test.results}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {uploadedTestFiles.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Uploaded Test Documents</h4>
                  <div className="space-y-3">
                    {uploadedTestFiles.map((file, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(file.uploadDate).toLocaleDateString()} • 
                              Size: {(file.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <a
                              href={`https://irevlogix-backend.onrender.com${file.filePath}`}
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
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                <button
                  onClick={openAddDocumentModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add New Document
                </button>
              </div>

              {documentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No documents found for this processed material.</p>
                  <p className="text-sm mt-1">Click &quot;Add New Document&quot; to get started.</p>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {documents.map((document) => (
                      <li key={document.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">File Name</p>
                              <a 
                                href={`https://irevlogix-backend.onrender.com/${document.filePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                {document.fileName}
                              </a>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Document Type</p>
                              <p className="text-sm text-gray-500">{document.documentType || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">File Size</p>
                              <p className="text-sm text-gray-500">
                                {(document.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Upload Date</p>
                              <p className="text-sm text-gray-500">
                                {new Date(document.dateCreated).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEditDocument(document)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeletingDocumentId(document.id);
                                setShowDocumentDeleteConfirm(true);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {document.description && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-900">Description</p>
                            <p className="text-sm text-gray-500">{document.description}</p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "financials" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Financial Summary</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Total Purchase/Processing Cost</div>
                    <div className="font-medium">{formatCurrency(calculateFinancials().totalCost)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Revenue</div>
                    <div className="font-medium">{formatCurrency(calculateFinancials().totalRevenue)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Net Profit/Loss</div>
                    <div className={`font-medium ${calculateFinancials().netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculateFinancials().netProfit)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white border rounded p-4">
                <div className="text-sm text-gray-400">[AI Suggestion Placeholder - insights coming soon]</div>
              </div>
            </div>
          )}
        </>
      )}

      {showTestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTest ? 'Edit Test Result' : 'Add New Test Result'}
              </h3>
              
              <form onSubmit={handleTestSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Test Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="testDate"
                      value={testFormData.testDate}
                      onChange={handleTestInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {testFormErrors.testDate && (
                      <p className="mt-1 text-sm text-red-600">{testFormErrors.testDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Lab <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lab"
                      value={testFormData.lab}
                      onChange={handleTestInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {testFormErrors.lab && (
                      <p className="mt-1 text-sm text-red-600">{testFormErrors.lab}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Parameters <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="parameters"
                    value={testFormData.parameters}
                    onChange={handleTestInputChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {testFormErrors.parameters && (
                    <p className="mt-1 text-sm text-red-600">{testFormErrors.parameters}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Results <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="results"
                    value={testFormData.results}
                    onChange={handleTestInputChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {testFormErrors.results && (
                    <p className="mt-1 text-sm text-red-600">{testFormErrors.results}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Compliance Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="complianceStatus"
                    value={testFormData.complianceStatus}
                    onChange={handleTestInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                    <option value="Pending">Pending</option>
                  </select>
                  {testFormErrors.complianceStatus && (
                    <p className="mt-1 text-sm text-red-600">{testFormErrors.complianceStatus}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Document
                  </label>
                  
                  {testFormData.reportDocumentUrl && (
                    <div className="mb-2 text-sm text-green-600">
                      Current file: {testFormData.reportDocumentUrl}
                    </div>
                  )}
                  
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  
                  {uploadFile && (
                    <div className="mt-2 text-sm text-blue-600">
                      Selected: {uploadFile.name}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowTestModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? 'Saving...' : (editingTest ? 'Update Test Result' : 'Add Test Result')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this test result? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletingTestId && handleDeleteTest(deletingTestId)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDocumentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDocument ? 'Edit Document' : 'Add New Document'}
              </h3>
              
              <form onSubmit={handleDocumentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="documentType"
                    value={documentFormData.documentType}
                    onChange={handleDocumentInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select document type</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Report">Report</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Specification">Specification</option>
                    <option value="Other">Other</option>
                  </select>
                  {documentFormErrors.documentType && (
                    <p className="mt-1 text-sm text-red-600">{documentFormErrors.documentType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={documentFormData.description}
                    onChange={handleDocumentInputChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional description of the document"
                  />
                  {documentFormErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{documentFormErrors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Upload {!editingDocument && <span className="text-red-500">*</span>}
                  </label>
                  
                  {editingDocument && documentFormData.fileName && (
                    <div className="mb-2 text-sm text-green-600">
                      Current file: {documentFormData.fileName}
                    </div>
                  )}
                  
                  <input
                    type="file"
                    onChange={handleDocumentFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  
                  {documentUploadFile && (
                    <div className="mt-2 text-sm text-blue-600">
                      Selected: {documentUploadFile.name}
                    </div>
                  )}
                  
                  {documentFormErrors.file && (
                    <p className="mt-1 text-sm text-red-600">{documentFormErrors.file}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowDocumentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={documentUploading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {documentUploading ? 'Saving...' : (editingDocument ? 'Update Document' : 'Add Document')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDocumentDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this document? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDocumentDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletingDocumentId && handleDeleteDocument(deletingDocumentId)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
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
