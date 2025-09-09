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

interface ProcessingLot {
  id: number;
  lotNumber: string;
  status: string;
  description?: string;
  assignedOperator?: string;
  processingCost?: number;
  expectedRevenue?: number;
  actualRevenue?: number;
  netProfit?: number;
  dateCreated: string;
  dateUpdated: string;
  weight?: number;
  contaminationPercentage?: number;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  lotNumber: string;
  status: string;
}

export default function ProfitabilityByLotPage() {
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ roles: [], permissions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [filteredData, setFilteredData] = useState<ProcessingLot[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    lotNumber: '',
    status: ''
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
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        pageSize: '1000',
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.lotNumber && { lotId: filters.lotNumber }),
        ...(filters.status && { status: filters.status })
      });
      
      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingLots?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const processedData = data.map((lot: ProcessingLot) => ({
          ...lot,
          netProfit: (lot.actualRevenue || lot.expectedRevenue || 0) - (lot.processingCost || 0)
        }));
        setFilteredData(processedData);
        setShowPreview(true);
      } else {
        setError('Failed to fetch processing lots data');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      lotNumber: '',
      status: ''
    });
    setShowPreview(false);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(lot => ({
      'Lot Number': lot.lotNumber,
      'Status': lot.status,
      'Processing Cost': lot.processingCost || 0,
      'Expected Revenue': lot.expectedRevenue || 0,
      'Actual Revenue': lot.actualRevenue || 0,
      'Net Profit': lot.netProfit || 0,
      'Date Created': new Date(lot.dateCreated).toLocaleDateString(),
      'Weight (lbs)': lot.weight || 0,
      'Contamination %': lot.contaminationPercentage || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profitability by Lot');
    XLSX.writeFile(wb, `profitability-by-lot-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Lot Number', 'Status', 'Processing Cost', 'Expected Revenue', 'Actual Revenue', 'Net Profit', 'Date Created', 'Weight (lbs)', 'Contamination %'].join(','),
      ...filteredData.map(lot => [
        lot.lotNumber,
        lot.status,
        lot.processingCost || 0,
        lot.expectedRevenue || 0,
        lot.actualRevenue || 0,
        lot.netProfit || 0,
        new Date(lot.dateCreated).toLocaleDateString(),
        lot.weight || 0,
        lot.contaminationPercentage || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `profitability-by-lot-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChartData = () => {
    const profitableLots = filteredData.filter(lot => (lot.netProfit || 0) > 0);
    const unprofitableLots = filteredData.filter(lot => (lot.netProfit || 0) <= 0);

    if (chartType === 'pie') {
      return {
        labels: ['Profitable Lots', 'Unprofitable Lots'],
        datasets: [
          {
            data: [profitableLots.length, unprofitableLots.length],
            backgroundColor: ['#10B981', '#EF4444'],
            borderColor: ['#059669', '#DC2626'],
            borderWidth: 1,
          },
        ],
      };
    } else {
      const topLots = filteredData
        .sort((a, b) => (b.netProfit || 0) - (a.netProfit || 0))
        .slice(0, 10);

      return {
        labels: topLots.map(lot => lot.lotNumber),
        datasets: [
          {
            label: 'Net Profit ($)',
            data: topLots.map(lot => lot.netProfit || 0),
            backgroundColor: topLots.map(lot => (lot.netProfit || 0) > 0 ? '#10B981' : '#EF4444'),
            borderColor: topLots.map(lot => (lot.netProfit || 0) > 0 ? '#059669' : '#DC2626'),
            borderWidth: 1,
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
        text: chartType === 'pie' ? 'Profitability Distribution' : 'Top 10 Lots by Net Profit',
      },
    },
    ...(chartType === 'bar' && {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: unknown) {
              return '$' + Number(value).toLocaleString();
            }
          }
        }
      }
    })
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profitability by Lot Report</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Summarizes total revenue, processing costs, and net profit for each processing lot
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Report Parameters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <label htmlFor="lotNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lot Number
              </label>
              <input
                type="text"
                id="lotNumber"
                name="lotNumber"
                placeholder="Search by lot number..."
                value={filters.lotNumber}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

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
                <option value="In Progress">In Progress</option>
                <option value="Ready for Sale">Ready for Sale</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={fetchReportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Generate Report
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {showPreview && filteredData.length > 0 && (
          <>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Report Summary</h2>
                <div className="flex gap-2">
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as 'bar' | 'pie')}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="pie">Pie Chart</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600">Total Lots</div>
                  <div className="text-2xl font-bold text-blue-900">{filteredData.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600">Total Revenue</div>
                  <div className="text-2xl font-bold text-green-900">
                    ${filteredData.reduce((sum, lot) => sum + (lot.actualRevenue || lot.expectedRevenue || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-red-600">Total Costs</div>
                  <div className="text-2xl font-bold text-red-900">
                    ${filteredData.reduce((sum, lot) => sum + (lot.processingCost || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600">Net Profit</div>
                  <div className="text-2xl font-bold text-purple-900">
                    ${filteredData.reduce((sum, lot) => sum + (lot.netProfit || 0), 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="h-96 mb-6">
                {chartType === 'bar' ? (
                  <Bar data={getChartData()} options={chartOptions as never} />
                ) : (
                  <Pie data={getChartData()} options={chartOptions as never} />
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Report Data</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={exportToExcel}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Export Excel
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Lot Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Processing Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Expected Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actual Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Net Profit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredData.map((lot) => (
                      <tr key={lot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {lot.lotNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lot.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            lot.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            lot.status === 'Ready for Sale' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lot.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ${(lot.processingCost || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ${(lot.expectedRevenue || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ${(lot.actualRevenue || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${
                            (lot.netProfit || 0) > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${(lot.netProfit || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(lot.dateCreated).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {showPreview && filteredData.length === 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              No data found for the selected filters.
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
