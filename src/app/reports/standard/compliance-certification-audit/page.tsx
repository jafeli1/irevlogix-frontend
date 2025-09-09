'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../../components/AppLayout';
import { UserPermissions, fetchUserPermissions, hasPermission } from '../../../../utils/rbac';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ComplianceItem {
  id: number;
  assetId: number;
  assetType: string;
  dataSanitizationStatus: string;
  dataSanitizationCertificate?: string;
  certificateOfRecycling?: string;
  certificationNumber?: string;
  certificationStatus: string;
  dateCreated: string;
  lastUpdated: string;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  certificationStatus: string;
  assetType: string;
}

export default function ComplianceCertificationAuditPage() {
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ roles: [], permissions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [filteredData, setFilteredData] = useState<ComplianceItem[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    certificationStatus: '',
    assetType: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('pie');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const loadPermissions = async () => {
      try {
        const permissions = await fetchUserPermissions(token);
        setUserPermissions(permissions);
      } catch (error) {
        console.error('Failed to fetch user permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, [router]);

  const fetchReportData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.certificationStatus) queryParams.append('certificationStatus', filters.certificationStatus);
      if (filters.assetType) queryParams.append('assetType', filters.assetType);

      const response = await fetch(`https://irevlogix-backend.onrender.com/api/Assets?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const processedData = data.map((item: ComplianceItem) => {
          let certificationStatus = 'Pending';
          if (item.dataSanitizationCertificate && item.certificateOfRecycling) {
            certificationStatus = 'Fully Certified';
          } else if (item.dataSanitizationCertificate || item.certificateOfRecycling) {
            certificationStatus = 'Partially Certified';
          }

          return {
            ...item,
            certificationStatus,
            dataSanitizationStatus: item.dataSanitizationStatus || 'Pending',
            assetType: item.assetType || 'Unknown'
          };
        });
        setFilteredData(processedData);
        setShowPreview(true);
      } else {
        setError('Failed to fetch compliance certification data');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('An error occurred while fetching the report data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      certificationStatus: '',
      assetType: ''
    });
    setShowPreview(false);
    setFilteredData([]);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Asset ID': item.assetId,
      'Asset Type': item.assetType,
      'Data Sanitization Status': item.dataSanitizationStatus,
      'Data Sanitization Certificate': item.dataSanitizationCertificate ? 'Yes' : 'No',
      'Certificate of Recycling': item.certificateOfRecycling ? 'Yes' : 'No',
      'Certification Number': item.certificationNumber || 'N/A',
      'Certification Status': item.certificationStatus,
      'Date Created': new Date(item.dateCreated).toLocaleDateString(),
      'Last Updated': new Date(item.lastUpdated).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compliance Certification Audit');
    XLSX.writeFile(wb, `compliance-certification-audit-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Asset ID', 'Asset Type', 'Data Sanitization Status', 'Data Sanitization Certificate', 'Certificate of Recycling', 'Certification Number', 'Certification Status', 'Date Created', 'Last Updated'],
      ...filteredData.map(item => [
        item.assetId,
        item.assetType,
        item.dataSanitizationStatus,
        item.dataSanitizationCertificate ? 'Yes' : 'No',
        item.certificateOfRecycling ? 'Yes' : 'No',
        item.certificationNumber || 'N/A',
        item.certificationStatus,
        new Date(item.dateCreated).toLocaleDateString(),
        new Date(item.lastUpdated).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-certification-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getChartData = () => {
    if (!filteredData.length) return null;

    if (chartType === 'pie') {
      const statusData = filteredData.reduce((acc: Record<string, number>, item) => {
        acc[item.certificationStatus] = (acc[item.certificationStatus] || 0) + 1;
        return acc;
      }, {});

      const statusEntries = Object.entries(statusData);

      return {
        labels: statusEntries.map(([status]) => status),
        datasets: [
          {
            data: statusEntries.map(([, count]) => count),
            backgroundColor: [
              '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6',
              '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
            ],
            borderWidth: 2,
          },
        ],
      };
    } else {
      const sanitizationData = filteredData.reduce((acc: Record<string, number>, item) => {
        acc[item.dataSanitizationStatus] = (acc[item.dataSanitizationStatus] || 0) + 1;
        return acc;
      }, {});

      const sanitizationEntries = Object.entries(sanitizationData);

      return {
        labels: sanitizationEntries.map(([status]) => status),
        datasets: [
          {
            label: 'Number of Assets',
            data: sanitizationEntries.map(([, count]) => count),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          }
        ],
      };
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: chartType === 'pie' ? 'Certification Status Distribution' : 'Data Sanitization Status',
      },
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    } : undefined,
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (!hasPermission(userPermissions, 'Reporting', 'Create')) {
    return (
      <AppLayout>
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            You don&apos;t have permission to access this report.
          </div>
        </div>
      </AppLayout>
    );
  }

  const chartData = getChartData();
  const totalAssets = filteredData.length;
  const fullyCertified = filteredData.filter(item => item.certificationStatus === 'Fully Certified').length;
  const partiallyCertified = filteredData.filter(item => item.certificationStatus === 'Partially Certified').length;
  const pendingCertification = filteredData.filter(item => item.certificationStatus === 'Pending').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compliance & Certification Audit Report</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Lists all assets that have undergone a data destruction or recycling process and are awaiting a certificate
              </p>
            </div>
            <button
              onClick={() => router.push('/reports/standard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Return to Standard Reports
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Report Parameters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="certificationStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Certification Status
              </label>
              <select
                id="certificationStatus"
                name="certificationStatus"
                value={filters.certificationStatus}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="Fully Certified">Fully Certified</option>
                <option value="Partially Certified">Partially Certified</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div>
              <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Asset Type
              </label>
              <input
                type="text"
                id="assetType"
                name="assetType"
                placeholder="Enter asset type..."
                value={filters.assetType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={fetchReportData}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Generate Report
            </button>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {showPreview && (
          <>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Compliance Summary</h2>
                <div className="flex gap-2">
                  <button
                    onClick={exportToExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Assets</h3>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalAssets}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Fully Certified</h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{fullyCertified}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Partially Certified</h3>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{partiallyCertified}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Pending</h3>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{pendingCertification}</p>
                </div>
              </div>
            </div>

            {chartData && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Compliance Visualization</h2>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as 'bar' | 'pie')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="pie">Pie Chart (Certification Status)</option>
                    <option value="bar">Bar Chart (Sanitization Status)</option>
                  </select>
                </div>
                <div className="h-96">
                  {chartType === 'bar' ? (
                    <Bar data={chartData} options={chartOptions} />
                  ) : (
                    <Pie data={chartData} options={chartOptions} />
                  )}
                </div>
              </div>
            )}

            {filteredData.length === 0 && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No compliance certification data found for the selected filters. Try adjusting your search criteria.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
