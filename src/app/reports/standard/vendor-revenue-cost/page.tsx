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

interface VendorSale {
  id: number;
  vendorId: number;
  vendorName: string;
  salesPrice: number;
  quantity: number;
  saleDate: string;
  materialType?: string;
  totalRevenue: number;
  associatedCosts: number;
  netProfit: number;
}

interface Vendor {
  id: number;
  vendorName: string;
  vendorRating?: number;
  vendorTier?: string;
}

interface VendorData {
  revenue: number;
  costs: number;
  profit: number;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  vendorId: string;
  materialType: string;
}

export default function VendorRevenueCostPage() {
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ roles: [], permissions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [filteredData, setFilteredData] = useState<VendorSale[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    vendorId: '',
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

    const fetchVendors = async () => {
      try {
        const response = await fetch('https://irevlogix-backend.onrender.com/api/Vendors?pageSize=1000', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setVendors(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
      }
    };

    loadPermissions();
    fetchVendors();
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
      if (filters.vendorId) queryParams.append('vendorId', filters.vendorId);
      if (filters.materialType) queryParams.append('materialType', filters.materialType);

      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialSales?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const processedData = data.map((sale: VendorSale) => ({
          ...sale,
          totalRevenue: sale.salesPrice * sale.quantity,
          associatedCosts: 0,
          netProfit: sale.salesPrice * sale.quantity
        }));
        setFilteredData(processedData);
        setShowPreview(true);
      } else {
        setError('Failed to fetch vendor sales data');
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
      vendorId: '',
      materialType: ''
    });
    setShowPreview(false);
    setFilteredData([]);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(sale => ({
      'Vendor Name': sale.vendorName,
      'Sale Date': new Date(sale.saleDate).toLocaleDateString(),
      'Material Type': sale.materialType || 'N/A',
      'Quantity': sale.quantity,
      'Sales Price': sale.salesPrice,
      'Total Revenue': sale.totalRevenue,
      'Associated Costs': sale.associatedCosts,
      'Net Profit': sale.netProfit
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendor Revenue & Cost');
    XLSX.writeFile(wb, `vendor-revenue-cost-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Vendor Name', 'Sale Date', 'Material Type', 'Quantity', 'Sales Price', 'Total Revenue', 'Associated Costs', 'Net Profit'],
      ...filteredData.map(sale => [
        sale.vendorName,
        new Date(sale.saleDate).toLocaleDateString(),
        sale.materialType || 'N/A',
        sale.quantity,
        sale.salesPrice,
        sale.totalRevenue,
        sale.associatedCosts,
        sale.netProfit
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-revenue-cost-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getChartData = () => {
    if (!filteredData.length) return null;

    const vendorData = filteredData.reduce((acc: Record<string, VendorData>, sale) => {
      if (!acc[sale.vendorName]) {
        acc[sale.vendorName] = {
          revenue: 0,
          costs: 0,
          profit: 0
        };
      }
      acc[sale.vendorName].revenue += sale.totalRevenue;
      acc[sale.vendorName].costs += sale.associatedCosts;
      acc[sale.vendorName].profit += sale.netProfit;
      return acc;
    }, {});

    const topVendors = Object.entries(vendorData)
      .sort(([,a]: [string, VendorData], [,b]: [string, VendorData]) => b.revenue - a.revenue)
      .slice(0, 10);

    if (chartType === 'bar') {
      return {
        labels: topVendors.map(([name]) => name),
        datasets: [
          {
            label: 'Revenue',
            data: topVendors.map(([, data]: [string, VendorData]) => data.revenue),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          },
          {
            label: 'Costs',
            data: topVendors.map(([, data]: [string, VendorData]) => data.costs),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
          }
        ],
      };
    } else {
      return {
        labels: topVendors.map(([name]) => name),
        datasets: [
          {
            data: topVendors.map(([, data]: [string, VendorData]) => data.revenue),
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
        text: chartType === 'bar' ? 'Vendor Revenue vs Costs' : 'Revenue Distribution by Vendor',
      },
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: number | string) {
            return '$' + value.toLocaleString();
          }
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
  const totalRevenue = filteredData.reduce((sum, sale) => sum + sale.totalRevenue, 0);
  const totalCosts = filteredData.reduce((sum, sale) => sum + sale.associatedCosts, 0);
  const totalProfit = totalRevenue - totalCosts;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Revenue & Cost Report</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Details the revenue generated from each downstream vendor and compares it against associated costs
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
              <label htmlFor="vendorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vendor
              </label>
              <select
                id="vendorId"
                name="vendorId"
                value={filters.vendorId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.vendorName}
                  </option>
                ))}
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Report Summary</h2>
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
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Sales</h3>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{filteredData.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Total Revenue</h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">${totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Total Costs</h3>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">${totalCosts.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Net Profit</h3>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">${totalProfit.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {chartData && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Visualization</h2>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as 'bar' | 'pie')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="pie">Pie Chart</option>
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
                    No vendor sales data found for the selected filters. Try adjusting your search criteria.
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
