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

interface ResourceConservationItem {
  id: number;
  materialType: string;
  processedWeight: number;
  weightUnit: string;
  normalizedWeight: number;
  treesEquivalent: number;
  oreEquivalent: number;
  energySaved: number;
  co2Avoided: number;
  dateCreated: string;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  materialType: string;
  weightUnit: string;
}

export default function ResourceConservationPage() {
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ roles: [], permissions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [filteredData, setFilteredData] = useState<ResourceConservationItem[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    materialType: '',
    weightUnit: ''
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

  const normalizeWeight = (weight: number, unit: string): number => {
    const conversionFactors: Record<string, number> = {
      'kg': 1,
      'lbs': 0.453592,
      'tons': 1000,
      'g': 0.001
    };
    return weight * (conversionFactors[unit.toLowerCase()] || 1);
  };

  const calculateConservation = (materialType: string, weightKg: number) => {
    const conservationFactors: Record<string, { trees: number; ore: number; energy: number; co2: number }> = {
      'paper': { trees: 0.017, ore: 0, energy: 3.3, co2: 1.1 },
      'cardboard': { trees: 0.014, ore: 0, energy: 2.8, co2: 0.9 },
      'plastic': { trees: 0, ore: 1.8, energy: 2.0, co2: 1.8 },
      'metal': { trees: 0, ore: 4.0, energy: 14.0, co2: 2.3 },
      'aluminum': { trees: 0, ore: 8.0, energy: 95.0, co2: 9.0 },
      'glass': { trees: 0, ore: 1.2, energy: 0.3, co2: 0.3 },
      'electronics': { trees: 0, ore: 15.0, energy: 20.0, co2: 5.0 },
      'default': { trees: 0.005, ore: 1.0, energy: 2.0, co2: 1.0 }
    };

    const factors = conservationFactors[materialType.toLowerCase()] || conservationFactors['default'];
    
    return {
      treesEquivalent: weightKg * factors.trees,
      oreEquivalent: weightKg * factors.ore,
      energySaved: weightKg * factors.energy,
      co2Avoided: weightKg * factors.co2
    };
  };

  const fetchReportData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.materialType) queryParams.append('materialType', filters.materialType);
      if (filters.weightUnit) queryParams.append('weightUnit', filters.weightUnit);

      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterials?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const processedData = data.map((item: ResourceConservationItem) => {
          const normalizedWeight = normalizeWeight(item.processedWeight || 0, item.weightUnit || 'kg');
          const conservation = calculateConservation(item.materialType || 'default', normalizedWeight);
          
          return {
            ...item,
            materialType: item.materialType || 'Unknown',
            weightUnit: item.weightUnit || 'kg',
            normalizedWeight,
            ...conservation
          };
        });
        setFilteredData(processedData);
        setShowPreview(true);
      } else {
        setError('Failed to fetch resource conservation data');
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
      materialType: '',
      weightUnit: ''
    });
    setShowPreview(false);
    setFilteredData([]);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Material Type': item.materialType,
      'Processed Weight': item.processedWeight,
      'Weight Unit': item.weightUnit,
      'Normalized Weight (kg)': item.normalizedWeight.toFixed(2),
      'Trees Equivalent': item.treesEquivalent.toFixed(2),
      'Ore Equivalent (kg)': item.oreEquivalent.toFixed(2),
      'Energy Saved (kWh)': item.energySaved.toFixed(2),
      'CO2 Avoided (kg)': item.co2Avoided.toFixed(2),
      'Date Created': new Date(item.dateCreated).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resource Conservation');
    XLSX.writeFile(wb, `resource-conservation-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Material Type', 'Processed Weight', 'Weight Unit', 'Normalized Weight (kg)', 'Trees Equivalent', 'Ore Equivalent (kg)', 'Energy Saved (kWh)', 'CO2 Avoided (kg)', 'Date Created'],
      ...filteredData.map(item => [
        item.materialType,
        item.processedWeight,
        item.weightUnit,
        item.normalizedWeight.toFixed(2),
        item.treesEquivalent.toFixed(2),
        item.oreEquivalent.toFixed(2),
        item.energySaved.toFixed(2),
        item.co2Avoided.toFixed(2),
        new Date(item.dateCreated).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resource-conservation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getChartData = () => {
    if (!filteredData.length) return null;

    const materialTypeData = filteredData.reduce((acc: Record<string, { trees: number; ore: number; energy: number; co2: number }>, item) => {
      if (!acc[item.materialType]) {
        acc[item.materialType] = { trees: 0, ore: 0, energy: 0, co2: 0 };
      }
      acc[item.materialType].trees += item.treesEquivalent;
      acc[item.materialType].ore += item.oreEquivalent;
      acc[item.materialType].energy += item.energySaved;
      acc[item.materialType].co2 += item.co2Avoided;
      return acc;
    }, {});

    const materialEntries = Object.entries(materialTypeData);

    if (chartType === 'bar') {
      return {
        labels: materialEntries.map(([type]) => type),
        datasets: [
          {
            label: 'Trees Saved',
            data: materialEntries.map(([, data]) => data.trees),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
          },
          {
            label: 'Energy Saved (kWh)',
            data: materialEntries.map(([, data]) => data.energy),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          }
        ],
      };
    } else {
      const totalTrees = materialEntries.reduce((sum, [, data]) => sum + data.trees, 0);
      return {
        labels: materialEntries.map(([type]) => type),
        datasets: [
          {
            data: materialEntries.map(([, data]) => (data.trees / totalTrees) * 100),
            backgroundColor: [
              '#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6',
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
        text: chartType === 'bar' ? 'Resource Conservation by Material Type' : 'Trees Saved Distribution',
      },
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Conservation Units'
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
  const totalTrees = filteredData.reduce((sum, item) => sum + item.treesEquivalent, 0);
  const totalOre = filteredData.reduce((sum, item) => sum + item.oreEquivalent, 0);
  const totalEnergy = filteredData.reduce((sum, item) => sum + item.energySaved, 0);
  const totalCO2 = filteredData.reduce((sum, item) => sum + item.co2Avoided, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resource Conservation Report</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Estimates the amount of raw materials (e.g., trees, ore) saved by the recycling efforts
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

            <div>
              <label htmlFor="weightUnit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight Unit
              </label>
              <select
                id="weightUnit"
                name="weightUnit"
                value={filters.weightUnit}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Units</option>
                <option value="kg">Kilograms</option>
                <option value="lbs">Pounds</option>
                <option value="tons">Tons</option>
                <option value="g">Grams</option>
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Conservation Summary</h2>
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
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Trees Saved</h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{totalTrees.toFixed(1)}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Energy Saved</h3>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalEnergy.toFixed(1)} kWh</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Ore Saved</h3>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{totalOre.toFixed(1)} kg</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">CO2 Avoided</h3>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{totalCO2.toFixed(1)} kg</p>
                </div>
              </div>
            </div>

            {chartData && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Conservation Visualization</h2>
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
                    No resource conservation data found for the selected filters. Try adjusting your search criteria.
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
