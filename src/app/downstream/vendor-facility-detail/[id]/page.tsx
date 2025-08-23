'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '../../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../../utils/rbac';

interface VendorFacilityData {
  id?: number;
  vendorId: number;
  clientId: string;
  description: string;
  facilityLocation: string;
  totalEmployees: number | null;
  sizeofFacilitySquareFoot: number | null;
  facilityOwnedLeased: string;
  numberofShifts: number | null;
  hoursofOperations: string;
  describeFacilitySecurity: string;
  totalSquareFootCapacityForStorage: number | null;
  totalSquareFootCapacityForProcessing: number | null;
  facilityProcessingMethod: string;
  hazardousDisposalMethod: string;
  organizationChartUpload: string;
  siteLayoutUpload: string;
  lastFacilityAuditReportUpload: string;
  lastAuditReportFindingsUpload: string;
  lastAuditReportCorrectiveActionsUpload: string;
  currentContractForThisFacilityUpload: string;
  facilityClosurePlanUpload: string;
  facilitiesMaintenancePlanUpload: string;
  physicalSecurityPlanUpload: string;
  yearsInOperation: number | null;
  currentOwner: string;
  parentCompany: string;
  previousOwners: string;
  sensitiveReceptors: string;
  regulatoryComplianceStatus: string;
  describeProcessFlow: string;
  describeProcessFlowUpload: string;
  describeWasteMaterialGenerated: string;
  describeDownstreamAuditingProcess: string;
  utilizeChildPrisonLabor: boolean;
  materialsShippedNonOECDCountries: boolean;
  describeNonOECDCountryShipments: string;
  competentAuthorityPermission: boolean;
  documentRequestCompetentAuthorityPermissionUpload: string;
  documentRequestCompetentAuthorityPermissionExpDate: string;
  zeroLandfillPolicy: boolean;
  documentRequestZeroLandfillPolicyUpload: string;
  describeTrackingInboundOutboundMaterials: string;
  documentRequestMassBalanceUpload: string;
  describeDataWipingProcedures: string;
  dataDestructionVerified: boolean;
  dataDestructionValidationUpload: string;
  functionalityTestingDescription: string;
  assetGradingDescription: string;
  doYouOperateALandfill: boolean;
  doYouOwnAnIncinerator: boolean;
  doYouPerformChemicalFixationAndStabilization: boolean;
  updatedNamesAndLocationsOfYourDownstreamVendors: string;
  scopeOfOperationsDocumentUpload: string;
  equipmentEndOfLifePolicyUpload: string;
  downsteamVendorSelectionProcessDocumentUpload: string;
  electronicsDispositionPolicyUpload: string;
  dataSecurityPolicyUpload: string;
  nonDiscriminationPolicyUpload: string;
  hazardousMaterialManagementPlanUpload: string;
  dataSanitizationPlanAndProcedureUpload: string;
  dataStorageDeviceShipmentAndProcessingContractUpload: string;
  materialGenerated1: string;
  howMaterialsProcessedDisposed1: string;
  nextTierVendorNameAddress1: string;
  materialGenerated2: string;
  howmaterialsProcessedDisposed2: string;
  nextTierVendorNameAddress2: string;
  materialGenerated3: string;
  howmaterialsProcessedDisposed3: string;
  nextTierVendorNameAddress3: string;
  materialGenerated4: string;
  howmaterialsProcessedDisposed4: string;
  nextTierVendorNameAddress4: string;
  materialGenerated5: string;
  howmaterialsProcessedDisposed5: string;
  nextTierVendorNameAddress5: string;
  materialGenerated6: string;
  howmaterialsProcessedDisposed6: string;
  nextTierVendorNameAddress6: string;
  describeTransportationIncomingOutgoingMaterials: string;
  describeAuditingProcessThirdPartyTransporters: string;
  occupationalHealthSafetyManagementSystem: boolean;
  documentRequestOccupationalHealthSafetyManagementSystem: string;
  facilityDocumentedHealthSafety: boolean;
  facilityAnnualHealthSafetyTraining: boolean;
  healthSafetyViolations: boolean;
  healthSafetyViolationsxplanation: string;
  ehsManager: string;
  complianceManager: string;
  ohsmManager: string;
  facilityManager: string;
  managementRepresentativeName: string;
  managementRepresentativeTitle: string;
}

interface Vendor {
  id: number;
  vendorName: string;
}

interface Client {
  id: string;
  companyName: string;
}

export default function VendorFacilityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [formData, setFormData] = useState<VendorFacilityData>({
    vendorId: 0,
    clientId: '',
    description: '',
    facilityLocation: '',
    totalEmployees: null,
    sizeofFacilitySquareFoot: null,
    facilityOwnedLeased: '',
    numberofShifts: null,
    hoursofOperations: '',
    describeFacilitySecurity: '',
    totalSquareFootCapacityForStorage: null,
    totalSquareFootCapacityForProcessing: null,
    facilityProcessingMethod: '',
    hazardousDisposalMethod: '',
    organizationChartUpload: '',
    siteLayoutUpload: '',
    lastFacilityAuditReportUpload: '',
    lastAuditReportFindingsUpload: '',
    lastAuditReportCorrectiveActionsUpload: '',
    currentContractForThisFacilityUpload: '',
    facilityClosurePlanUpload: '',
    facilitiesMaintenancePlanUpload: '',
    physicalSecurityPlanUpload: '',
    yearsInOperation: null,
    currentOwner: '',
    parentCompany: '',
    previousOwners: '',
    sensitiveReceptors: '',
    regulatoryComplianceStatus: '',
    describeProcessFlow: '',
    describeProcessFlowUpload: '',
    describeWasteMaterialGenerated: '',
    describeDownstreamAuditingProcess: '',
    utilizeChildPrisonLabor: false,
    materialsShippedNonOECDCountries: false,
    describeNonOECDCountryShipments: '',
    competentAuthorityPermission: false,
    documentRequestCompetentAuthorityPermissionUpload: '',
    documentRequestCompetentAuthorityPermissionExpDate: '',
    zeroLandfillPolicy: false,
    documentRequestZeroLandfillPolicyUpload: '',
    describeTrackingInboundOutboundMaterials: '',
    documentRequestMassBalanceUpload: '',
    describeDataWipingProcedures: '',
    dataDestructionVerified: false,
    dataDestructionValidationUpload: '',
    functionalityTestingDescription: '',
    assetGradingDescription: '',
    doYouOperateALandfill: false,
    doYouOwnAnIncinerator: false,
    doYouPerformChemicalFixationAndStabilization: false,
    updatedNamesAndLocationsOfYourDownstreamVendors: '',
    scopeOfOperationsDocumentUpload: '',
    equipmentEndOfLifePolicyUpload: '',
    downsteamVendorSelectionProcessDocumentUpload: '',
    electronicsDispositionPolicyUpload: '',
    dataSecurityPolicyUpload: '',
    nonDiscriminationPolicyUpload: '',
    hazardousMaterialManagementPlanUpload: '',
    dataSanitizationPlanAndProcedureUpload: '',
    dataStorageDeviceShipmentAndProcessingContractUpload: '',
    materialGenerated1: '',
    howMaterialsProcessedDisposed1: '',
    nextTierVendorNameAddress1: '',
    materialGenerated2: '',
    howmaterialsProcessedDisposed2: '',
    nextTierVendorNameAddress2: '',
    materialGenerated3: '',
    howmaterialsProcessedDisposed3: '',
    nextTierVendorNameAddress3: '',
    materialGenerated4: '',
    howmaterialsProcessedDisposed4: '',
    nextTierVendorNameAddress4: '',
    materialGenerated5: '',
    howmaterialsProcessedDisposed5: '',
    nextTierVendorNameAddress5: '',
    materialGenerated6: '',
    howmaterialsProcessedDisposed6: '',
    nextTierVendorNameAddress6: '',
    describeTransportationIncomingOutgoingMaterials: '',
    describeAuditingProcessThirdPartyTransporters: '',
    occupationalHealthSafetyManagementSystem: false,
    documentRequestOccupationalHealthSafetyManagementSystem: '',
    facilityDocumentedHealthSafety: false,
    facilityAnnualHealthSafetyTraining: false,
    healthSafetyViolations: false,
    healthSafetyViolationsxplanation: '',
    ehsManager: '',
    complianceManager: '',
    ohsmManager: '',
    facilityManager: '',
    managementRepresentativeName: '',
    managementRepresentativeTitle: ''
  });

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [uploadFiles, setUploadFiles] = useState<Record<string, File>>({});

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('https://irevlogix-backend.onrender.com/api/Vendors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('https://irevlogix-backend.onrender.com/api/Clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchVendorFacility = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`https://irevlogix-backend.onrender.com/api/vendorfacilities/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data,
          documentRequestCompetentAuthorityPermissionExpDate: data.documentRequestCompetentAuthorityPermissionExpDate ? 
            data.documentRequestCompetentAuthorityPermissionExpDate.split('T')[0] : ''
        });
      } else if (response.status === 401) {
        router.push('/login');
      } else if (response.status === 404) {
        setError('Vendor facility not found');
      }
    } catch (error) {
      console.error('Error fetching vendor facility:', error);
      setError('Error loading vendor facility data');
    }
  }, [id, router]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const userPermissions = await fetchUserPermissions(token);
      setPermissions(userPermissions);

      if (userPermissions && hasPermission(userPermissions, 'DownstreamMaterials', 'Read')) {
        await Promise.all([fetchVendors(), fetchClients(), !isNew && fetchVendorFacility()]);
      }
      setLoading(false);
    };

    loadData();
  }, [id, isNew, router, fetchVendorFacility]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.vendorId) {
      errors.vendorId = 'Vendor selection is required';
    }

    if (!formData.clientId.trim()) {
      errors.clientId = 'Client selection is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? (value ? parseInt(value) : null) : value
    }));

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFiles(prev => ({ ...prev, [fieldName]: file }));
    }
  };

  const uploadFile = async (file: File, facilityId: number, fieldName: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fieldName', fieldName);

    const token = localStorage.getItem('token');
    const response = await fetch(`https://irevlogix-backend.onrender.com/api/vendorfacilities/${facilityId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      return result.filePath;
    }
    throw new Error('File upload failed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the validation errors');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const submitData = {
        ...formData,
        documentRequestCompetentAuthorityPermissionExpDate: formData.documentRequestCompetentAuthorityPermissionExpDate ? 
          new Date(formData.documentRequestCompetentAuthorityPermissionExpDate).toISOString() : null
      };

      const url = isNew ? 'https://irevlogix-backend.onrender.com/api/vendorfacilities' : `https://irevlogix-backend.onrender.com/api/vendorfacilities/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const facilityId = isNew ? (await response.json()).id : parseInt(id);

        for (const [fieldName, file] of Object.entries(uploadFiles)) {
          await uploadFile(file, facilityId, fieldName);
        }

        setSuccess(isNew ? 'Vendor facility created successfully!' : 'Vendor facility updated successfully!');
        
        if (isNew) {
          setTimeout(() => {
            router.push('/downstream/vendor-facility');
          }, 2000);
        }
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        const errorData = await response.text();
        setError(errorData || 'Error saving vendor facility');
      }
    } catch (error) {
      console.error('Error saving vendor facility:', error);
      setError('Error saving vendor facility');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vendor facility?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`https://irevlogix-backend.onrender.com/api/vendorfacilities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Vendor facility deleted successfully!');
        setTimeout(() => {
          router.push('/downstream/vendor-facility');
        }, 2000);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError('Error deleting vendor facility');
      }
    } catch (error) {
      console.error('Error deleting vendor facility:', error);
      setError('Error deleting vendor facility');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (!permissions || !hasPermission(permissions, 'DownstreamMaterials', 'Read')) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don&apos;t have permission to manage vendor facilities.</p>
        </div>
      </AppLayout>
    );
  }

  const tabs = [
    { id: 'general', name: 'General' },
    { id: 'facility', name: 'Facility Information' },
    { id: 'history', name: 'Company History' },
    { id: 'documents', name: 'Information and Documents' },
    { id: 'materials', name: 'Materials Generated' },
    { id: 'ohsm', name: 'OHSM System' },
    { id: 'management', name: 'Management' }
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isNew ? 'Add New Vendor Facility' : 'Edit Vendor Facility'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isNew ? 'Create a new vendor facility record' : 'Update vendor facility information'}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="vendorId" className="block text-sm font-medium text-gray-700">
                    Vendor *
                  </label>
                  <select
                    id="vendorId"
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      validationErrors.vendorId ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Select a vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.vendorName}
                      </option>
                    ))}
                  </select>
                  {validationErrors.vendorId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.vendorId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                    Client *
                  </label>
                  <select
                    id="clientId"
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      validationErrors.clientId ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                  {validationErrors.clientId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.clientId}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'facility' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="facilityLocation" className="block text-sm font-medium text-gray-700">
                    Facility Location
                  </label>
                  <input
                    type="text"
                    id="facilityLocation"
                    name="facilityLocation"
                    value={formData.facilityLocation}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="totalEmployees" className="block text-sm font-medium text-gray-700">
                    Total Employees
                  </label>
                  <input
                    type="number"
                    id="totalEmployees"
                    name="totalEmployees"
                    value={formData.totalEmployees || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="sizeofFacilitySquareFoot" className="block text-sm font-medium text-gray-700">
                    Size of Facility (Square Foot)
                  </label>
                  <input
                    type="number"
                    id="sizeofFacilitySquareFoot"
                    name="sizeofFacilitySquareFoot"
                    value={formData.sizeofFacilitySquareFoot || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="facilityOwnedLeased" className="block text-sm font-medium text-gray-700">
                    Facility Owned/Leased
                  </label>
                  <select
                    id="facilityOwnedLeased"
                    name="facilityOwnedLeased"
                    value={formData.facilityOwnedLeased}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select</option>
                    <option value="Owned">Owned</option>
                    <option value="Leased">Leased</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="numberofShifts" className="block text-sm font-medium text-gray-700">
                    Number of Shifts
                  </label>
                  <input
                    type="number"
                    id="numberofShifts"
                    name="numberofShifts"
                    value={formData.numberofShifts || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="hoursofOperations" className="block text-sm font-medium text-gray-700">
                    Hours of Operations
                  </label>
                  <input
                    type="text"
                    id="hoursofOperations"
                    name="hoursofOperations"
                    value={formData.hoursofOperations}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="describeFacilitySecurity" className="block text-sm font-medium text-gray-700">
                  Describe Facility Security
                </label>
                <textarea
                  id="describeFacilitySecurity"
                  name="describeFacilitySecurity"
                  rows={4}
                  value={formData.describeFacilitySecurity}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="totalSquareFootCapacityForStorage" className="block text-sm font-medium text-gray-700">
                    Total Square Foot Capacity for Storage
                  </label>
                  <input
                    type="number"
                    id="totalSquareFootCapacityForStorage"
                    name="totalSquareFootCapacityForStorage"
                    value={formData.totalSquareFootCapacityForStorage || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="totalSquareFootCapacityForProcessing" className="block text-sm font-medium text-gray-700">
                    Total Square Foot Capacity for Processing
                  </label>
                  <input
                    type="number"
                    id="totalSquareFootCapacityForProcessing"
                    name="totalSquareFootCapacityForProcessing"
                    value={formData.totalSquareFootCapacityForProcessing || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="facilityProcessingMethod" className="block text-sm font-medium text-gray-700">
                  Facility Processing Method
                </label>
                <textarea
                  id="facilityProcessingMethod"
                  name="facilityProcessingMethod"
                  rows={4}
                  value={formData.facilityProcessingMethod}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="hazardousDisposalMethod" className="block text-sm font-medium text-gray-700">
                  Hazardous Disposal Method
                </label>
                <textarea
                  id="hazardousDisposalMethod"
                  name="hazardousDisposalMethod"
                  rows={4}
                  value={formData.hazardousDisposalMethod}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Document Uploads</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="organizationChartUpload" className="block text-sm font-medium text-gray-700">
                      Organization Chart
                    </label>
                    <input
                      type="file"
                      id="organizationChartUpload"
                      onChange={(e) => handleFileChange(e, 'organizationChartUpload')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="siteLayoutUpload" className="block text-sm font-medium text-gray-700">
                      Site Layout
                    </label>
                    <input
                      type="file"
                      id="siteLayoutUpload"
                      onChange={(e) => handleFileChange(e, 'siteLayoutUpload')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastFacilityAuditReportUpload" className="block text-sm font-medium text-gray-700">
                      Last Facility Audit Report
                    </label>
                    <input
                      type="file"
                      id="lastFacilityAuditReportUpload"
                      onChange={(e) => handleFileChange(e, 'lastFacilityAuditReportUpload')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastAuditReportFindingsUpload" className="block text-sm font-medium text-gray-700">
                      Last Audit Report Findings
                    </label>
                    <input
                      type="file"
                      id="lastAuditReportFindingsUpload"
                      onChange={(e) => handleFileChange(e, 'lastAuditReportFindingsUpload')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastAuditReportCorrectiveActionsUpload" className="block text-sm font-medium text-gray-700">
                      Last Audit Report Corrective Actions
                    </label>
                    <input
                      type="file"
                      id="lastAuditReportCorrectiveActionsUpload"
                      onChange={(e) => handleFileChange(e, 'lastAuditReportCorrectiveActionsUpload')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="currentContractForThisFacilityUpload" className="block text-sm font-medium text-gray-700">
                      Current Contract For This Facility
                    </label>
                    <input
                      type="file"
                      id="currentContractForThisFacilityUpload"
                      onChange={(e) => handleFileChange(e, 'currentContractForThisFacilityUpload')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="facilityClosurePlanUpload" className="block text-sm font-medium text-gray-700">
                      Facility Closure Plan
                    </label>
                    <input
                      type="file"
                      id="facilityClosurePlanUpload"
                      onChange={(e) => handleFileChange(e, 'facilityClosurePlanUpload')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="facilitiesMaintenancePlanUpload" className="block text-sm font-medium text-gray-700">
                      Facilities Maintenance Plan
                    </label>
                    <input
                      type="file"
                      id="facilitiesMaintenancePlanUpload"
                      onChange={(e) => handleFileChange(e, 'facilitiesMaintenancePlanUpload')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="physicalSecurityPlanUpload" className="block text-sm font-medium text-gray-700">
                      Physical Security Plan
                    </label>
                    <input
                      type="file"
                      id="physicalSecurityPlanUpload"
                      onChange={(e) => handleFileChange(e, 'physicalSecurityPlanUpload')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="yearsInOperation" className="block text-sm font-medium text-gray-700">
                    Years in Operation
                  </label>
                  <input
                    type="number"
                    id="yearsInOperation"
                    name="yearsInOperation"
                    value={formData.yearsInOperation || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="currentOwner" className="block text-sm font-medium text-gray-700">
                    Current Owner
                  </label>
                  <input
                    type="text"
                    id="currentOwner"
                    name="currentOwner"
                    value={formData.currentOwner}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="parentCompany" className="block text-sm font-medium text-gray-700">
                    Parent Company
                  </label>
                  <input
                    type="text"
                    id="parentCompany"
                    name="parentCompany"
                    value={formData.parentCompany}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="previousOwners" className="block text-sm font-medium text-gray-700">
                    Previous Owners
                  </label>
                  <input
                    type="text"
                    id="previousOwners"
                    name="previousOwners"
                    value={formData.previousOwners}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="sensitiveReceptors" className="block text-sm font-medium text-gray-700">
                    Sensitive Receptors
                  </label>
                  <input
                    type="text"
                    id="sensitiveReceptors"
                    name="sensitiveReceptors"
                    value={formData.sensitiveReceptors}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="regulatoryComplianceStatus" className="block text-sm font-medium text-gray-700">
                    Regulatory Compliance Status
                  </label>
                  <input
                    type="text"
                    id="regulatoryComplianceStatus"
                    name="regulatoryComplianceStatus"
                    value={formData.regulatoryComplianceStatus}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="describeProcessFlow" className="block text-sm font-medium text-gray-700">
                  Describe Process Flow
                </label>
                <textarea
                  id="describeProcessFlow"
                  name="describeProcessFlow"
                  rows={4}
                  value={formData.describeProcessFlow}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="describeProcessFlowUpload" className="block text-sm font-medium text-gray-700">
                  Process Flow Document
                </label>
                <input
                  type="file"
                  id="describeProcessFlowUpload"
                  onChange={(e) => handleFileChange(e, 'describeProcessFlowUpload')}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label htmlFor="describeWasteMaterialGenerated" className="block text-sm font-medium text-gray-700">
                  Describe Waste Material Generated
                </label>
                <textarea
                  id="describeWasteMaterialGenerated"
                  name="describeWasteMaterialGenerated"
                  rows={4}
                  value={formData.describeWasteMaterialGenerated}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="describeDownstreamAuditingProcess" className="block text-sm font-medium text-gray-700">
                  Describe Downstream Auditing Process
                </label>
                <textarea
                  id="describeDownstreamAuditingProcess"
                  name="describeDownstreamAuditingProcess"
                  rows={4}
                  value={formData.describeDownstreamAuditingProcess}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    id="utilizeChildPrisonLabor"
                    name="utilizeChildPrisonLabor"
                    type="checkbox"
                    checked={formData.utilizeChildPrisonLabor}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="utilizeChildPrisonLabor" className="ml-2 block text-sm text-gray-900">
                    Utilize Child/Prison Labor
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="materialsShippedNonOECDCountries"
                    name="materialsShippedNonOECDCountries"
                    type="checkbox"
                    checked={formData.materialsShippedNonOECDCountries}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="materialsShippedNonOECDCountries" className="ml-2 block text-sm text-gray-900">
                    Materials Shipped to Non-OECD Countries
                  </label>
                </div>
              </div>

              {formData.materialsShippedNonOECDCountries && (
                <div>
                  <label htmlFor="describeNonOECDCountryShipments" className="block text-sm font-medium text-gray-700">
                    Describe Non-OECD Country Shipments
                  </label>
                  <textarea
                    id="describeNonOECDCountryShipments"
                    name="describeNonOECDCountryShipments"
                    rows={4}
                    value={formData.describeNonOECDCountryShipments}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Policy Documents</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="scopeOfOperationsDocumentUpload" className="block text-sm font-medium text-gray-700">
                      Scope of Operations Document
                    </label>
                    <input
                      type="file"
                      id="scopeOfOperationsDocumentUpload"
                      onChange={(e) => handleFileChange(e, 'scopeOfOperationsDocumentUpload')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="equipmentEndOfLifePolicyUpload" className="block text-sm font-medium text-gray-700">
                      Equipment End of Life Policy
                    </label>
                    <input
                      type="file"
                      id="equipmentEndOfLifePolicyUpload"
                      onChange={(e) => handleFileChange(e, 'equipmentEndOfLifePolicyUpload')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Materials Generated</h3>
              
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div key={num} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Material {num}</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor={`materialGenerated${num}`} className="block text-sm font-medium text-gray-700">
                        Material Generated
                      </label>
                      <input
                        type="text"
                        id={`materialGenerated${num}`}
                        name={`materialGenerated${num}`}
                        value={(formData as unknown as Record<string, string>)[`materialGenerated${num}`] || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor={`howMaterialsProcessedDisposed${num}`} className="block text-sm font-medium text-gray-700">
                        How Materials Processed/Disposed
                      </label>
                      <textarea
                        id={`howMaterialsProcessedDisposed${num}`}
                        name={`howMaterialsProcessedDisposed${num}`}
                        rows={3}
                        value={(formData as unknown as Record<string, string>)[`howMaterialsProcessedDisposed${num}`] || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor={`nextTierVendorNameAddress${num}`} className="block text-sm font-medium text-gray-700">
                        Next Tier Vendor Name & Address
                      </label>
                      <input
                        type="text"
                        id={`nextTierVendorNameAddress${num}`}
                        name={`nextTierVendorNameAddress${num}`}
                        value={(formData as unknown as Record<string, string>)[`nextTierVendorNameAddress${num}`] || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <label htmlFor="describeTransportationIncomingOutgoingMaterials" className="block text-sm font-medium text-gray-700">
                  Describe Transportation of Incoming/Outgoing Materials
                </label>
                <textarea
                  id="describeTransportationIncomingOutgoingMaterials"
                  name="describeTransportationIncomingOutgoingMaterials"
                  rows={4}
                  value={formData.describeTransportationIncomingOutgoingMaterials}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="describeAuditingProcessThirdPartyTransporters" className="block text-sm font-medium text-gray-700">
                  Describe Auditing Process for Third Party Transporters
                </label>
                <textarea
                  id="describeAuditingProcessThirdPartyTransporters"
                  name="describeAuditingProcessThirdPartyTransporters"
                  rows={4}
                  value={formData.describeAuditingProcessThirdPartyTransporters}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'ohsm' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Occupational Health & Safety Management System</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    id="occupationalHealthSafetyManagementSystem"
                    name="occupationalHealthSafetyManagementSystem"
                    type="checkbox"
                    checked={formData.occupationalHealthSafetyManagementSystem}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="occupationalHealthSafetyManagementSystem" className="ml-2 block text-sm text-gray-900">
                    Occupational Health & Safety Management System
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="facilityDocumentedHealthSafety"
                    name="facilityDocumentedHealthSafety"
                    type="checkbox"
                    checked={formData.facilityDocumentedHealthSafety}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="facilityDocumentedHealthSafety" className="ml-2 block text-sm text-gray-900">
                    Facility Documented Health & Safety
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="facilityAnnualHealthSafetyTraining"
                    name="facilityAnnualHealthSafetyTraining"
                    type="checkbox"
                    checked={formData.facilityAnnualHealthSafetyTraining}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="facilityAnnualHealthSafetyTraining" className="ml-2 block text-sm text-gray-900">
                    Facility Annual Health & Safety Training
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="healthSafetyViolations"
                    name="healthSafetyViolations"
                    type="checkbox"
                    checked={formData.healthSafetyViolations}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="healthSafetyViolations" className="ml-2 block text-sm text-gray-900">
                    Health & Safety Violations
                  </label>
                </div>
              </div>

              {formData.occupationalHealthSafetyManagementSystem && (
                <div>
                  <label htmlFor="documentRequestOccupationalHealthSafetyManagementSystem" className="block text-sm font-medium text-gray-700">
                    Document Request - Occupational Health & Safety Management System
                  </label>
                  <textarea
                    id="documentRequestOccupationalHealthSafetyManagementSystem"
                    name="documentRequestOccupationalHealthSafetyManagementSystem"
                    rows={4}
                    value={formData.documentRequestOccupationalHealthSafetyManagementSystem}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}

              {formData.healthSafetyViolations && (
                <div>
                  <label htmlFor="healthSafetyViolationsxplanation" className="block text-sm font-medium text-gray-700">
                    Health & Safety Violations Explanation
                  </label>
                  <textarea
                    id="healthSafetyViolationsxplanation"
                    name="healthSafetyViolationsxplanation"
                    rows={4}
                    value={formData.healthSafetyViolationsxplanation}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'management' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Management Team</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="ehsManager" className="block text-sm font-medium text-gray-700">
                    EHS Manager
                  </label>
                  <input
                    type="text"
                    id="ehsManager"
                    name="ehsManager"
                    value={formData.ehsManager}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="complianceManager" className="block text-sm font-medium text-gray-700">
                    Compliance Manager
                  </label>
                  <input
                    type="text"
                    id="complianceManager"
                    name="complianceManager"
                    value={formData.complianceManager}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="ohsmManager" className="block text-sm font-medium text-gray-700">
                    OHSM Manager
                  </label>
                  <input
                    type="text"
                    id="ohsmManager"
                    name="ohsmManager"
                    value={formData.ohsmManager}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="facilityManager" className="block text-sm font-medium text-gray-700">
                    Facility Manager
                  </label>
                  <input
                    type="text"
                    id="facilityManager"
                    name="facilityManager"
                    value={formData.facilityManager}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="managementRepresentativeName" className="block text-sm font-medium text-gray-700">
                    Management Representative Name
                  </label>
                  <input
                    type="text"
                    id="managementRepresentativeName"
                    name="managementRepresentativeName"
                    value={formData.managementRepresentativeName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="managementRepresentativeTitle" className="block text-sm font-medium text-gray-700">
                    Management Representative Title
                  </label>
                  <input
                    type="text"
                    id="managementRepresentativeTitle"
                    name="managementRepresentativeTitle"
                    value={formData.managementRepresentativeTitle}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div>
              {!isNew && hasPermission(permissions, 'DownstreamMaterials', 'Delete') && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Delete Facility
                </button>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push('/downstream/vendor-facility')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isNew ? 'Create Facility' : 'Update Facility')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
