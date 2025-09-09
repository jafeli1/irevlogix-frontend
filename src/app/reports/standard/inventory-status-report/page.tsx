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

interface InventoryItem {
  id: number;
  materialType: string;
  status: string;
  quantity: number;
  location: string;
  qualityGrade: string;
  dateCreated: string;
  lastUpdated: string;
}

interface ReportFilters {
  status: string;
  location: string;
  qualityGrade: string;
  materialType: string;
}

export default function InventoryStatusReportPage() {
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ roles: [], permissions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    status: '',
    location: '',
    qualityGrade: '',
    materialType: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
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
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.qualityGrade) queryParams.append('qualityGrade', filters.qualityGrade);
      if (filters.materialType) queryParams.append('materialType', filters.materialType);

      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterials?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const processedData = data.map((item: InventoryItem) => ({
          ...item,
          materialType: item.materialType || 'Unknown',
          status: item.status || 'Pending',
          location: item.location || 'Unknown',
          qualityGrade: item.qualityGrade || 'Ungraded'
        }));
        setFilteredData(processedData);
        setShowPreview(true);
      } else {
        setError('Failed to fetch inventory status data');
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
      status: '',
      location: '',
      qualityGrade: '',
      materialType: ''
    });
    setShowPreview(false);
    setFilteredData([]);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Material Type': item.materialType,
      'Status': item.status,
      'Quantity': item.quantity,
      'Location': item.location,
      'Quality Grade': item.qualityGrade,
      'Date Created': new Date(item.dateCreated).toLocaleDateString(),
      'Last Updated': new Date(item.lastUpdated).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Status Report');
    XLSX.writeFile(wb, `inventory-status-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Material Type', 'Status', 'Quantity', 'Location', 'Quality Grade', 'Date Created', 'Last Updated'],
      ...filteredData.map(item => [
        item.materialType,
        item.status,
        item.quantity,
        item.location,
        item.qualityGrade,
        new Date(item.dateCreated).toLocaleDateString(),
        new Date(item.lastUpdated).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-status-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getChartData = () => {
    if (!filteredData.length) return null;

    if (chartType === 'bar') {
      const statusData = filteredData.reduce((acc: Record<string, number>, item) => {
        acc[item.status] = (acc[item.status] || 0) + item.quantity;
        return acc;
      }, {});

      const statusEntries = Object.entries(statusData);

      return {
        labels: statusEntries.map(([status]) => status),
        datasets: [
          {
            label: 'Quantity by Status',
            data: statusEntries.map(([, quantity]) => quantity),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          }
        ],
      };
    } else {
      const locationData = filteredData.reduce((acc: Record<string, number>, item) => {
        acc[item.location] = (acc[item.location] || 0) + item.quantity;
        return acc;
      }, {});

      const locationEntries = Object.entries(locationData);

      return {
        labels: locationEntries.map(([location]) => location),
        datasets: [
          {
            data: locationEntries.map(([, quantity]) => quantity),
            backgroundColor: [
              '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
              '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
            ],
            borderWidth: 2,
          },
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
        text: chartType === 'bar' ? 'Inventory Quantity by Status' : 'Inventory Distribution by Location',
      },
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity'
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
  const totalItems = filteredData.length;
  const totalQuantity = filteredData.reduce((sum, item) => sum + item.quantity, 0);
  const pendingProcessing = filteredData.filter(item => item.status.toLowerCase().includes('pending')).length;
  const readyForSale = filteredData.filter(item => item.status.toLowerCase().includes('ready')).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Status Report</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Provides a current snapshot of all items and materials in inventory, categorized by their status (e.g., pending processing, ready for sale)
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
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="Pending Processing">Pending Processing</option>
                <option value="Ready for Sale">Ready for Sale</option>
                <option value="In Processing">In Processing</option>
                <option value="Quality Check">Quality Check</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="Enter location..."
                value={filters.location}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="qualityGrade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quality Grade
              </label>
              <select
                id="qualityGrade"
                name="qualityGrade"
                value={filters.qualityGrade}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Grades</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="Ungraded">Ungraded</option>
              </select>
            </div>

            <div>
              <label htmlFor="materialType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Material Type
              </label>
              <input
                type="text"
                id="materialType"
                name="materialType"
                placeholder="Enter material type..."
                value={filters.materialType}
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Inventory Summary</h2>
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
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Items</h3>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalItems}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Total Quantity</h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{totalQuantity.toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Pending Processing</h3>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{pendingProcessing}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Ready for Sale</h3>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{readyForSale}</p>
                </div>
              </div>
            </div>

            {chartData && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Inventory Visualization</h2>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as 'bar' | 'pie')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="bar">Bar Chart (by Status)</option>
                    <option value="pie">Pie Chart (by Location)</option>
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
                    No inventory data found for the selected filters. Try adjusting your search criteria.
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
