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
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface FinancialData {
  period: string;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  assetRevenue: number;
  materialRevenue: number;
  processingCosts: number;
  recoveryCosts: number;
}

interface ProcessingLot {
  id: number;
  dateCreated: string;
  actualRevenue?: number;
  processingCost?: number;
  netProfit?: number;
}

interface Asset {
  id: number;
  dateCreated: string;
  actualSalePrice?: number;
  costOfRecovery?: number;
  costOfSale?: number;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  period: string;
}

export default function FinancialSummaryPage() {
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ roles: [], permissions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [filteredData, setFilteredData] = useState<FinancialData[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    period: 'monthly'
  });
  const [showPreview, setShowPreview] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('line');
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
      queryParams.append('period', filters.period);

      const lotsResponse = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingLots?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const assetsResponse = await fetch(`https://irevlogix-backend.onrender.com/api/Assets?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (lotsResponse.ok && assetsResponse.ok) {
        const lotsData = await lotsResponse.json();
        const assetsData = await assetsResponse.json();

        const aggregatedData = aggregateFinancialData(lotsData, assetsData, filters.period);
        setFilteredData(aggregatedData);
        setShowPreview(true);
      } else {
        setError('Failed to fetch financial data');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('An error occurred while fetching the report data');
    } finally {
      setIsLoading(false);
    }
  };

  const aggregateFinancialData = (lots: ProcessingLot[], assets: Asset[], period: string): FinancialData[] => {
    const dataMap = new Map<string, FinancialData>();

    lots.forEach(lot => {
      const date = new Date(lot.dateCreated);
      const periodKey = getPeriodKey(date, period);
      
      if (!dataMap.has(periodKey)) {
        dataMap.set(periodKey, {
          period: periodKey,
          totalRevenue: 0,
          totalCosts: 0,
          netProfit: 0,
          assetRevenue: 0,
          materialRevenue: 0,
          processingCosts: 0,
          recoveryCosts: 0
        });
      }

      const data = dataMap.get(periodKey)!;
      data.materialRevenue += lot.actualRevenue || 0;
      data.processingCosts += lot.processingCost || 0;
      data.totalRevenue += lot.actualRevenue || 0;
      data.totalCosts += lot.processingCost || 0;
      data.netProfit += lot.netProfit || 0;
    });

    assets.forEach(asset => {
      const date = new Date(asset.dateCreated);
      const periodKey = getPeriodKey(date, period);
      
      if (!dataMap.has(periodKey)) {
        dataMap.set(periodKey, {
          period: periodKey,
          totalRevenue: 0,
          totalCosts: 0,
          netProfit: 0,
          assetRevenue: 0,
          materialRevenue: 0,
          processingCosts: 0,
          recoveryCosts: 0
        });
      }

      const data = dataMap.get(periodKey)!;
      data.assetRevenue += asset.actualSalePrice || 0;
      data.recoveryCosts += asset.costOfRecovery || 0;
      data.totalRevenue += asset.actualSalePrice || 0;
      data.totalCosts += (asset.costOfRecovery || 0) + (asset.costOfSale || 0);
      data.netProfit += (asset.actualSalePrice || 0) - ((asset.costOfRecovery || 0) + (asset.costOfSale || 0));
    });

    return Array.from(dataMap.values()).sort((a, b) => a.period.localeCompare(b.period));
  };

  const getPeriodKey = (date: Date, period: string): string => {
    switch (period) {
      case 'daily':
        return date.toISOString().split('T')[0];
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `Week of ${weekStart.toISOString().split('T')[0]}`;
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      case 'yearly':
        return date.getFullYear().toString();
      default:
        return date.toISOString().split('T')[0];
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      period: 'monthly'
    });
    setShowPreview(false);
    setFilteredData([]);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(data => ({
      'Period': data.period,
      'Total Revenue': data.totalRevenue,
      'Total Costs': data.totalCosts,
      'Net Profit': data.netProfit,
      'Asset Revenue': data.assetRevenue,
      'Material Revenue': data.materialRevenue,
      'Processing Costs': data.processingCosts,
      'Recovery Costs': data.recoveryCosts
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financial Summary');
    XLSX.writeFile(wb, `financial-summary-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Period', 'Total Revenue', 'Total Costs', 'Net Profit', 'Asset Revenue', 'Material Revenue', 'Processing Costs', 'Recovery Costs'],
      ...filteredData.map(data => [
        data.period,
        data.totalRevenue,
        data.totalCosts,
        data.netProfit,
        data.assetRevenue,
        data.materialRevenue,
        data.processingCosts,
        data.recoveryCosts
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-summary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getChartData = () => {
    if (!filteredData.length) return null;

    if (chartType === 'line') {
      return {
        labels: filteredData.map(data => data.period),
        datasets: [
          {
            label: 'Revenue',
            data: filteredData.map(data => data.totalRevenue),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Costs',
            data: filteredData.map(data => data.totalCosts),
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Net Profit',
            data: filteredData.map(data => data.netProfit),
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
          }
        ],
      };
    } else if (chartType === 'bar') {
      return {
        labels: filteredData.map(data => data.period),
        datasets: [
          {
            label: 'Revenue',
            data: filteredData.map(data => data.totalRevenue),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
          },
          {
            label: 'Costs',
            data: filteredData.map(data => data.totalCosts),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
          }
        ],
      };
    } else {
      const totalRevenue = filteredData.reduce((sum, data) => sum + data.totalRevenue, 0);
      const totalCosts = filteredData.reduce((sum, data) => sum + data.totalCosts, 0);
      
      return {
        labels: ['Revenue', 'Costs'],
        datasets: [
          {
            data: [totalRevenue, totalCosts],
            backgroundColor: ['#3B82F6', '#EF4444'],
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
        text: 'Financial Performance Over Time',
      },
    },
    scales: chartType !== 'pie' ? {
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
  const totalRevenue = filteredData.reduce((sum, data) => sum + data.totalRevenue, 0);
  const totalCosts = filteredData.reduce((sum, data) => sum + data.totalCosts, 0);
  const totalProfit = totalRevenue - totalCosts;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Summary Report</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                A high-level report showing total revenue, costs, and profit over a specified period
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <label htmlFor="period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Period
              </label>
              <select
                id="period"
                name="period"
                value={filters.period}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Financial Overview</h2>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Total Revenue</h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">${totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Total Costs</h3>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">${totalCosts.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Net Profit</h3>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">${totalProfit.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {chartData && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Financial Trends</h2>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as 'bar' | 'pie' | 'line')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="line">Line Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="pie">Pie Chart</option>
                  </select>
                </div>
                <div className="h-96">
                  {chartType === 'line' ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : chartType === 'bar' ? (
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
                    No financial data found for the selected period. Try adjusting your date range.
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
