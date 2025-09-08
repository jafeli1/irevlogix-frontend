'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import AppLayout from '../../../components/AppLayout';
import * as XLSX from 'xlsx';

interface DataSource {
  id: string;
  name: string;
  endpoint: string;
}

interface ColumnDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

interface FilterConfig {
  column: string;
  type: 'text' | 'date' | 'number' | 'select';
  value: string;
  operator?: 'equals' | 'contains' | 'gte' | 'lte' | 'between';
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface ReportTemplate {
  id: string;
  name: string;
  dataSource: string;
  selectedColumns: string[];
  filters: FilterConfig[];
  sorting: SortConfig[];
  createdDate: Date;
}

const DATA_SOURCES: DataSource[] = [
  { id: 'assets', name: 'Assets', endpoint: '/api/Assets' },
  { id: 'shipments', name: 'Shipments', endpoint: '/api/Shipments' },
  { id: 'processing-lots', name: 'Processing Lots', endpoint: '/api/ProcessingLots' },
  { id: 'processed-materials', name: 'Processed Materials', endpoint: '/api/ProcessedMaterials' },
  { id: 'vendors', name: 'Vendors', endpoint: '/api/Vendors' }
];

const COLUMN_DEFINITIONS: Record<string, ColumnDefinition[]> = {
  assets: [
    { key: 'assetID', label: 'Asset ID', type: 'string' },
    { key: 'manufacturer', label: 'Manufacturer', type: 'string' },
    { key: 'model', label: 'Model', type: 'string' },
    { key: 'serialNumber', label: 'Serial Number', type: 'string' },
    { key: 'condition', label: 'Condition', type: 'string' },
    { key: 'isDataBearing', label: 'Data Bearing', type: 'boolean' },
    { key: 'currentLocation', label: 'Current Location', type: 'string' },
    { key: 'estimatedValue', label: 'Estimated Value', type: 'number' },
    { key: 'actualSalePrice', label: 'Actual Sale Price', type: 'number' },
    { key: 'createdAt', label: 'Created Date', type: 'date' }
  ],
  shipments: [
    { key: 'shipmentNumber', label: 'Shipment Number', type: 'string' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'trackingNumber', label: 'Tracking Number', type: 'string' },
    { key: 'carrier', label: 'Carrier', type: 'string' },
    { key: 'weight', label: 'Weight', type: 'number' },
    { key: 'scheduledPickupDate', label: 'Scheduled Pickup Date', type: 'date' },
    { key: 'actualPickupDate', label: 'Actual Pickup Date', type: 'date' },
    { key: 'shipmentDate', label: 'Shipment Date', type: 'date' },
    { key: 'receivedDate', label: 'Received Date', type: 'date' },
    { key: 'estimatedValue', label: 'Estimated Value', type: 'number' }
  ],
  'processing-lots': [
    { key: 'lotNumber', label: 'Lot Number', type: 'string' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'description', label: 'Description', type: 'string' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'completionDate', label: 'Completion Date', type: 'date' },
    { key: 'totalIncomingWeight', label: 'Total Incoming Weight', type: 'number' },
    { key: 'totalProcessedWeight', label: 'Total Processed Weight', type: 'number' },
    { key: 'processingCost', label: 'Processing Cost', type: 'number' },
    { key: 'expectedRevenue', label: 'Expected Revenue', type: 'number' },
    { key: 'actualRevenue', label: 'Actual Revenue', type: 'number' }
  ],
  'processed-materials': [
    { key: 'description', label: 'Description', type: 'string' },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'unitOfMeasure', label: 'Unit of Measure', type: 'string' },
    { key: 'qualityGrade', label: 'Quality Grade', type: 'string' },
    { key: 'location', label: 'Location', type: 'string' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'expectedSalesPrice', label: 'Expected Sales Price', type: 'number' },
    { key: 'actualSalesPrice', label: 'Actual Sales Price', type: 'number' },
    { key: 'saleDate', label: 'Sale Date', type: 'date' },
    { key: 'isHazardous', label: 'Hazardous', type: 'boolean' }
  ],
  vendors: [
    { key: 'vendorName', label: 'Vendor Name', type: 'string' },
    { key: 'contactPerson', label: 'Contact Person', type: 'string' },
    { key: 'email', label: 'Email', type: 'string' },
    { key: 'phone', label: 'Phone', type: 'string' },
    { key: 'city', label: 'City', type: 'string' },
    { key: 'state', label: 'State', type: 'string' },
    { key: 'country', label: 'Country', type: 'string' },
    { key: 'materialsOfInterest', label: 'Materials of Interest', type: 'string' },
    { key: 'vendorRating', label: 'Vendor Rating', type: 'number' },
    { key: 'vendorTier', label: 'Vendor Tier', type: 'string' }
  ]
};

export default function CustomReportsPage() {
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [sorting, setSorting] = useState<SortConfig[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, string | number>[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0 });
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const availableColumns = useMemo(() => {
    return selectedDataSource ? COLUMN_DEFINITIONS[selectedDataSource] || [] : [];
  }, [selectedDataSource]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const fetchPreviewData = useCallback(async () => {
    if (!selectedDataSource || selectedColumns.length === 0) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dataSource = DATA_SOURCES.find(ds => ds.id === selectedDataSource);
      if (!dataSource) return;

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: '10'
      });

      filters.forEach(filter => {
        if (filter.column && filter.value) {
          queryParams.append(filter.column, filter.value);
        }
      });

      const response = await fetch(`https://irevlogix-backend.onrender.com${dataSource.endpoint}?${queryParams}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (response.ok) {
        const result = await response.json();
        const data = Array.isArray(result) ? result : (result.data || result.items || []);
        
        const filteredData = data.slice(0, 10).map((item: any) => {
          const obj: Record<string, string | number> = {};
          selectedColumns.forEach(columnKey => {
            obj[columnKey] = item[columnKey] || '';
          });
          return obj;
        });
        
        setPreviewData(filteredData);
        
        const totalCount = response.headers.get('X-Total-Count') 
          ? parseInt(response.headers.get('X-Total-Count') || '0', 10)
          : data.length;
        
        setPagination(prev => ({ ...prev, totalCount }));
      }
    } catch (error) {
      console.error('Error fetching preview data:', error);
      setPreviewData([]);
      setPagination(prev => ({ ...prev, totalCount: 0 }));
    } finally {
      setLoading(false);
    }
  }, [selectedDataSource, selectedColumns, filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    if (selectedDataSource && selectedColumns.length > 0) {
      fetchPreviewData();
    }
  }, [selectedDataSource, selectedColumns, filters, sorting, pagination.page, fetchPreviewData]);

  const loadTemplates = () => {
    const saved = localStorage.getItem('reportTemplates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    }
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return;

    const template: ReportTemplate = {
      id: Date.now().toString(),
      name: templateName,
      dataSource: selectedDataSource,
      selectedColumns,
      filters,
      sorting,
      createdDate: new Date()
    };

    const updatedTemplates = [...templates, template];
    setTemplates(updatedTemplates);
    localStorage.setItem('reportTemplates', JSON.stringify(updatedTemplates));
    setTemplateName('');
    setShowSaveTemplate(false);
  };

  const loadTemplate = (template: ReportTemplate) => {
    setSelectedDataSource(template.dataSource);
    setSelectedColumns(template.selectedColumns);
    setFilters(template.filters);
    setSorting(template.sorting);
    
    setPagination(prev => ({ ...prev, page: 1 }));
    
    setTimeout(() => {
      if (template.dataSource && template.selectedColumns.length > 0) {
        fetchPreviewData();
      }
    }, 100);
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem('reportTemplates', JSON.stringify(updatedTemplates));
  };


  const exportToExcel = async () => {
    if (!selectedDataSource || selectedColumns.length === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dataSource = DATA_SOURCES.find(ds => ds.id === selectedDataSource);
      if (!dataSource) return;

      const params = new URLSearchParams();
      params.set('export', 'csv');
      
      filters.forEach(filter => {
        if (filter.value) {
          params.set(filter.column, filter.value.toString());
        }
      });

      const response = await fetch(`https://irevlogix-backend.onrender.com${dataSource.endpoint}?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (response.ok) {
        const csvData = await response.text();
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        const rows = lines.slice(1).map(line => line.split(','));

        const filteredData = rows.map(row => {
          const obj: Record<string, string | number> = {};
          headers.forEach((header, index) => {
            if (selectedColumns.includes(header.replace(/"/g, ''))) {
              obj[header.replace(/"/g, '')] = row[index]?.replace(/"/g, '') || '';
            }
          });
          return obj;
        });

        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();

        const headerRow = [
          [`Recycling Lifecycle Report - ${dataSource.name}`],
          [`Generated: ${new Date().toLocaleString()}`],
          [`Filters Applied: ${filters.length > 0 ? filters.map(f => `${f.column}=${f.value}`).join(', ') : 'None'}`],
          []
        ];

        XLSX.utils.sheet_add_aoa(worksheet, headerRow, { origin: 'A1' });
        XLSX.utils.sheet_add_json(worksheet, filteredData, { origin: 'A5', skipHeader: false });

        XLSX.utils.book_append_sheet(workbook, worksheet, dataSource.name);
        XLSX.writeFile(workbook, `${dataSource.name}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFilter = () => {
    setFilters([...filters, { column: '', type: 'text', value: '' }]);
  };

  const updateFilter = (index: number, updates: Partial<FilterConfig>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const addSort = () => {
    setSorting([...sorting, { column: '', direction: 'asc' }]);
  };

  const updateSort = (index: number, updates: Partial<SortConfig>) => {
    const newSorting = [...sorting];
    newSorting[index] = { ...newSorting[index], ...updates };
    setSorting(newSorting);
  };

  const removeSort = (index: number) => {
    setSorting(sorting.filter((_, i) => i !== index));
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Create custom reports with filtering, sorting, and export capabilities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Data Source Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Source</h3>
              <select
                value={selectedDataSource}
                onChange={(e) => {
                  setSelectedDataSource(e.target.value);
                  setSelectedColumns([]);
                  setFilters([]);
                  setSorting([]);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Data Source</option>
                {DATA_SOURCES.map(source => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </select>
            </div>

            {/* Column Selection */}
            {selectedDataSource && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Columns</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableColumns.map(column => (
                    <label key={column.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(column.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColumns([...selectedColumns, column.key]);
                          } else {
                            setSelectedColumns(selectedColumns.filter(col => col !== column.key));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            {selectedDataSource && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
                  <button
                    onClick={addFilter}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Add Filter
                  </button>
                </div>
                <div className="space-y-3">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={filter.column}
                        onChange={(e) => updateFilter(index, { column: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select Column</option>
                        {availableColumns.map(col => (
                          <option key={col.key} value={col.key}>{col.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="Value"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <button
                        onClick={() => removeFilter(index)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sorting */}
            {selectedDataSource && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sorting</h3>
                  <button
                    onClick={addSort}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Add Sort
                  </button>
                </div>
                <div className="space-y-3">
                  {sorting.map((sort, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={sort.column}
                        onChange={(e) => updateSort(index, { column: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select Column</option>
                        {availableColumns.map(col => (
                          <option key={col.key} value={col.key}>{col.label}</option>
                        ))}
                      </select>
                      <select
                        value={sort.direction}
                        onChange={(e) => updateSort(index, { direction: e.target.value as 'asc' | 'desc' })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </select>
                      <button
                        onClick={() => removeSort(index)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Templates */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Templates</h3>
              
              {/* Save Template */}
              {selectedDataSource && selectedColumns.length > 0 && (
                <div className="mb-4">
                  {showSaveTemplate ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Template name"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <button
                        onClick={saveTemplate}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowSaveTemplate(false)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSaveTemplate(true)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save as Template
                    </button>
                  )}
                </div>
              )}

              {/* Load Templates */}
              <div className="space-y-2">
                {templates.map(template => (
                  <div key={template.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{template.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{template.dataSource}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => loadTemplate(template)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preview</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchPreviewData}
                      disabled={!selectedDataSource || selectedColumns.length === 0 || loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    <button
                      onClick={exportToExcel}
                      disabled={!selectedDataSource || selectedColumns.length === 0 || loading}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Export Excel
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {selectedDataSource && selectedColumns.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            {selectedColumns.map(columnKey => {
                              const column = availableColumns.find(col => col.key === columnKey);
                              return (
                                <th
                                  key={columnKey}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                >
                                  {column?.label || columnKey}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {previewData.map((row, index) => (
                            <tr key={index}>
                              {selectedColumns.map(columnKey => (
                                <td
                                  key={columnKey}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                                >
                                  {row[columnKey] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Showing {pagination.totalCount > 0 ? ((pagination.page - 1) * pagination.pageSize) + 1 : 0} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} results
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                          disabled={pagination.page === 1}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-gray-700 dark:text-gray-300">
                          Page {pagination.page} of {Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize))}
                        </span>
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page >= Math.ceil(pagination.totalCount / pagination.pageSize)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      Select a data source and columns to preview your report
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
