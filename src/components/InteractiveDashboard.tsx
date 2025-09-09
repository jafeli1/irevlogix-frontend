'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DateRange {
  from: string;
  to: string;
  preset: string;
}

interface SummaryMetrics {
  activeShipments: number;
  processingLots: number;
  monthlyRevenue: number;
  totalShipments: number;
  totalAssetsProcessed: number;
  totalRevenue: number;
}

interface CostRevenueData {
  period: string;
  cost: number;
  revenue: number;
}

interface VendorPerformance {
  vendorName: string;
  revenue: number;
  processingLots: number;
  vendorId: number;
}

interface ProcessingTimeData {
  stage: string;
  count: number;
  averageTime: number;
}

interface InboundVolumeData {
  materialType: string;
  weight: number;
  count: number;
}

interface WasteDiversionData {
  diversionRate: number;
  totalProcessed: number;
  totalDiverted: number;
}

interface CertificatesIssuedData {
  date: string;
  count: number;
}

interface AssetDispositionData {
  dispositionType: string;
  count: number;
  percentage: number;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

interface DashboardData {
  summaryMetrics?: SummaryMetrics;
  costRevenue?: CostRevenueData[];
  vendorPerformance?: VendorPerformance[];
  processingTime?: ProcessingTimeData[];
  inboundVolume?: InboundVolumeData[];
  wasteDiversion?: WasteDiversionData;
  certificatesIssued?: CertificatesIssuedData[];
  assetDisposition?: AssetDispositionData[];
  monthlyRevenue?: MonthlyRevenueData[];
}

export default function InteractiveDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: '',
    to: '',
    preset: 'last30'
  });
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({});

  const datePresets = [
    { key: 'last30', label: 'Last 30 Days', days: 30 },
    { key: 'last90', label: 'Last 90 Days', days: 90 },
    { key: 'last180', label: 'Last 180 Days', days: 180 },
    { key: 'custom', label: 'Custom Range', days: 0 }
  ];

  useEffect(() => {
    if (dateRange.preset !== 'custom') {
      const preset = datePresets.find(p => p.key === dateRange.preset);
      if (preset && preset.days > 0) {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - preset.days);
        
        setDateRange(prev => ({
          ...prev,
          from: from.toISOString().split('T')[0],
          to: to.toISOString().split('T')[0]
        }));
      }
    }
  }, [dateRange.preset]);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange.from, dateRange.to]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      
      const endpoints = [
        'summary-metrics',
        'cost-revenue-data',
        'vendor-performance',
        'processing-time-data',
        'inbound-volume-data',
        'waste-diversion-data',
        'certificates-issued-data',
        'asset-disposition-data',
        'monthly-revenue-data'
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint =>
          fetch(`https://irevlogix-backend.onrender.com/api/dashboard/${endpoint}?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );

      const data = await Promise.all(responses.map(async (r, index) => {
        if (r.ok) {
          return await r.json();
        } else {
          console.error(`Error fetching ${endpoints[index]}:`, r.status);
          return null;
        }
      }));
      
      setDashboardData({
        summaryMetrics: data[0],
        costRevenue: data[1],
        vendorPerformance: data[2],
        processingTime: data[3],
        inboundVolume: data[4],
        wasteDiversion: data[5],
        certificatesIssued: data[6],
        assetDisposition: data[7],
        monthlyRevenue: data[8]
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorClick = (vendorId: number) => {
    router.push(`/downstream/vendor-detail/${vendorId}`);
  };

  const handleAssetDispositionClick = (dispositionType: string) => {
    router.push(`/asset-recovery/asset-tracking?disposition=${dispositionType}`);
  };

  const getCostRevenueChartData = () => {
    if (!dashboardData.costRevenue) return null;
    
    return {
      labels: dashboardData.costRevenue.map(d => d.period),
      datasets: [
        {
          label: 'Cost',
          data: dashboardData.costRevenue.map(d => d.cost),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
        {
          label: 'Revenue',
          data: dashboardData.costRevenue.map(d => d.revenue),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const getVendorPerformanceChartData = () => {
    if (!dashboardData.vendorPerformance) return null;
    
    return {
      labels: dashboardData.vendorPerformance.map(v => v.vendorName),
      datasets: [
        {
          label: 'Revenue ($)',
          data: dashboardData.vendorPerformance.map(v => v.revenue),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const getProcessingTimeChartData = () => {
    if (!dashboardData.processingTime) return null;
    
    return {
      labels: dashboardData.processingTime.map(p => p.stage),
      datasets: [
        {
          label: 'Count',
          data: dashboardData.processingTime.map(p => p.count),
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const getInboundVolumeChartData = () => {
    if (!dashboardData.inboundVolume) return null;
    
    const colors = [
      'rgba(239, 68, 68, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(236, 72, 153, 0.8)'
    ];
    
    return {
      labels: dashboardData.inboundVolume.map(i => i.materialType),
      datasets: [
        {
          data: dashboardData.inboundVolume.map(i => i.weight),
          backgroundColor: colors.slice(0, dashboardData.inboundVolume.length),
          borderWidth: 1,
        }
      ]
    };
  };

  const getWasteDiversionChartData = () => {
    if (!dashboardData.wasteDiversion) return null;
    
    const diversionRate = dashboardData.wasteDiversion.diversionRate * 100;
    
    return {
      labels: ['Diverted', 'Remaining'],
      datasets: [
        {
          data: [diversionRate, 100 - diversionRate],
          backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(229, 231, 235, 0.8)'],
          borderWidth: 0,
          cutout: '70%',
        }
      ]
    };
  };

  const getCertificatesIssuedChartData = () => {
    if (!dashboardData.certificatesIssued) return null;
    
    return {
      labels: dashboardData.certificatesIssued.map(c => c.date),
      datasets: [
        {
          label: 'Certificates Issued',
          data: dashboardData.certificatesIssued.map(c => c.count),
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ]
    };
  };

  const getAssetDispositionChartData = () => {
    if (!dashboardData.assetDisposition) return null;
    
    const colors = [
      'rgba(34, 197, 94, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(239, 68, 68, 0.8)'
    ];
    
    return {
      labels: dashboardData.assetDisposition.map(a => a.dispositionType),
      datasets: [
        {
          data: dashboardData.assetDisposition.map(a => a.count),
          backgroundColor: colors.slice(0, dashboardData.assetDisposition.length),
          borderWidth: 1,
        }
      ]
    };
  };

  const getMonthlyRevenueChartData = () => {
    if (!dashboardData.monthlyRevenue) return null;
    
    return {
      labels: dashboardData.monthlyRevenue.map(m => m.month),
      datasets: [
        {
          label: 'Monthly Revenue ($)',
          data: dashboardData.monthlyRevenue.map(m => m.revenue),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
            Interactive Dashboard
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={dateRange.preset}
              onChange={(e) => setDateRange(prev => ({ ...prev, preset: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {datePresets.map(preset => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
            
            {dateRange.preset === 'custom' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {['overview', 'financial', 'operations', 'compliance'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {dashboardData.summaryMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400">Active Shipments</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {dashboardData.summaryMetrics.activeShipments}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 dark:text-purple-400">Processing Lots</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {dashboardData.summaryMetrics.processingLots}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400">Monthly Revenue</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    ${dashboardData.summaryMetrics.monthlyRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Shipments</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {dashboardData.summaryMetrics.totalShipments}
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-sm text-orange-600 dark:text-orange-400">Assets Processed</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {dashboardData.summaryMetrics.totalAssetsProcessed}
                  </div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">Total Revenue</div>
                  <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                    ${dashboardData.summaryMetrics.totalRevenue.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardData.wasteDiversion && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Waste Diversion Rate</h3>
                  <div className="h-64 flex items-center justify-center">
                    <div className="relative">
                      <Doughnut data={getWasteDiversionChartData()!} options={pieChartOptions} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {(dashboardData.wasteDiversion.diversionRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Diverted</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {dashboardData.inboundVolume && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Inbound Volume by Material</h3>
                  <div className="h-64">
                    <Pie data={getInboundVolumeChartData()!} options={pieChartOptions} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardData.costRevenue && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cost vs Revenue</h3>
                  <div className="h-64">
                    <Bar data={getCostRevenueChartData()!} options={chartOptions} />
                  </div>
                </div>
              )}

              {dashboardData.monthlyRevenue && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Revenue Trend</h3>
                  <div className="h-64">
                    <Line data={getMonthlyRevenueChartData()!} options={chartOptions} />
                  </div>
                </div>
              )}
            </div>

            {dashboardData.vendorPerformance && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Vendor Performance</h3>
                <div className="h-64">
                  <Bar 
                    data={getVendorPerformanceChartData()!} 
                    options={{
                      ...chartOptions,
                      onClick: (event, elements) => {
                        if (elements.length > 0 && dashboardData.vendorPerformance) {
                          const index = elements[0].index;
                          const vendor = dashboardData.vendorPerformance[index];
                          handleVendorClick(vendor.vendorId);
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardData.processingTime && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Processing Time Distribution</h3>
                  <div className="h-64">
                    <Bar data={getProcessingTimeChartData()!} options={chartOptions} />
                  </div>
                </div>
              )}

              {dashboardData.assetDisposition && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Asset Disposition</h3>
                  <div className="h-64">
                    <Pie 
                      data={getAssetDispositionChartData()!} 
                      options={{
                        ...pieChartOptions,
                        onClick: (event, elements) => {
                          if (elements.length > 0 && dashboardData.assetDisposition) {
                            const index = elements[0].index;
                            const disposition = dashboardData.assetDisposition[index];
                            handleAssetDispositionClick(disposition.dispositionType);
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {dashboardData.certificatesIssued && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Certificates Issued Over Time</h3>
                <div className="h-64">
                  <Line data={getCertificatesIssuedChartData()!} options={chartOptions} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
