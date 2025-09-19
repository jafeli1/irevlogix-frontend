'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../utils/rbac';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ForecastDataPoint {
  period: string;
  volume: number;
}

interface ReturnsForecastResult {
  hasSufficientData: boolean;
  insufficientDataMessage?: string;
  requiredTables?: string[];
  requiredFields?: string[];
  historicalData: ForecastDataPoint[];
  predictedData: ForecastDataPoint[];
  materialType?: string;
  originatorClientId?: number;
  aggregationPeriod: string;
  generatedAt: string;
}

export default function ReturnsForecastPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [forecastData, setForecastData] = useState<ReturnsForecastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [materialTypes, setMaterialTypes] = useState<Array<{ id: number; name: string }>>([]);
  type OriginatorOption = { id: number; originatorClient: string };
  const [originatorClients, setOriginatorClients] = useState<OriginatorOption[]>([]);
  const [filters, setFilters] = useState({
    materialTypeId: '',
    originatorClientId: '',
    aggregationPeriod: 'weekly',
    weeksAhead: 4
  });

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

      try {
        const [mtRes, ocRes] = await Promise.all([
          fetch('https://irevlogix-backend.onrender.com/api/MaterialTypes?pageSize=1000', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('https://irevlogix-backend.onrender.com/api/Shipments/originators', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        if (mtRes.ok) {
          const mt = await mtRes.json();
          setMaterialTypes(mt);
        }
        if (ocRes.ok) {
          const oc = await ocRes.json() as unknown;
          const arr = Array.isArray(oc) ? (oc as Array<Record<string, unknown>>) : [];
          const mapped: OriginatorOption[] = arr.map(o => ({
            id: Number((o.id ?? o.Id) as number),
            originatorClient: String((o.originatorClient ?? o.OriginatorClient ?? o.name ?? o.label) as string),
          }));
          setOriginatorClients(mapped);
        }
      } catch (e) {
        console.error('Error loading filter options', e);
      }
      
      await loadForecastData(token);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const loadForecastData = async (token: string) => {
    try {
      const params = new URLSearchParams();
      if (filters.materialTypeId) {
        const mt = materialTypes.find((m: { id: number; name: string }) => String(m.id) === String(filters.materialTypeId));
        if (mt?.name) params.append('materialType', mt.name);
      }
      if (filters.originatorClientId) params.append('originatorClientId', String(filters.originatorClientId));
      params.append('aggregationPeriod', filters.aggregationPeriod);
      params.append('weeksAhead', filters.weeksAhead.toString());

      const response = await fetch(`https://irevlogix-backend.onrender.com/api/ai-operations/returns-forecast?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load forecast data');
      }

      const data = await response.json();
      setForecastData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load forecast data. Please try again.');
      console.error('Error loading forecast data:', err);
    }
  };

  const handleFilterChange = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      setLoading(true);
      await loadForecastData(token);
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!forecastData || !forecastData.hasSufficientData) return null;

    const allPeriods = [
      ...forecastData.historicalData.map(d => d.period),
      ...forecastData.predictedData.map(d => d.period)
    ];

    const historicalVolumes = [
      ...forecastData.historicalData.map(d => d.volume),
      ...Array(forecastData.predictedData.length).fill(null)
    ];

    const predictedVolumes = [
      ...Array(forecastData.historicalData.length).fill(null),
      ...forecastData.predictedData.map(d => d.volume)
    ];

    return {
      labels: allPeriods,
      datasets: [
        {
          label: 'Historical Returns',
          data: historicalVolumes,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Predicted Returns',
          data: predictedVolumes,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderDash: [5, 5],
          tension: 0.1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Returns Volume Forecast',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Volume (Quantity)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time Period',
        },
      },
    },
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

  if (!permissions || !hasPermission(permissions, 'ProjectManagement', 'Read')) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don&apos;t have permission to view this page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Predictive Returns Forecast</h1>
        <p className="mt-2 text-gray-600">AI-powered forecasting of incoming return volumes based on historical data</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Forecast Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Material Type</label>
            <select
              value={filters.materialTypeId}
              onChange={(e) => setFilters({ ...filters, materialTypeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Material Types</option>
              {materialTypes.map(mt => (
                <option key={mt.id} value={mt.id}>{mt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Originator Client</label>
            <select
              value={filters.originatorClientId}
              onChange={(e) => setFilters({ ...filters, originatorClientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Originators</option>
              {originatorClients.map(oc => (
                <option key={oc.id} value={oc.id}>{oc.originatorClient}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aggregation Period</label>
            <select
              value={filters.aggregationPeriod}
              onChange={(e) => setFilters({...filters, aggregationPeriod: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Periods Ahead</label>
            <input
              type="number"
              min="1"
              max="12"
              value={filters.weeksAhead}
              onChange={(e) => setFilters({...filters, weeksAhead: parseInt(e.target.value) || 4})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleFilterChange}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Update Forecast
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Insufficient Data Warning */}
      {forecastData && !forecastData.hasSufficientData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Insufficient Data</h3>
          <p className="text-yellow-700 mb-4">{forecastData.insufficientDataMessage}</p>
          {forecastData.requiredTables && (
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">Required Tables:</h4>
              <ul className="list-disc list-inside text-yellow-700">
                {forecastData.requiredTables.map((table, index) => (
                  <li key={index}>{table}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {forecastData && forecastData.hasSufficientData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="h-96">
            <Line data={getChartData()!} options={chartOptions} />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Generated at: {new Date(forecastData.generatedAt).toLocaleString()}</p>
            <p>Aggregation: {forecastData.aggregationPeriod}</p>
            {forecastData.materialType && <p>Material Type: {forecastData.materialType}</p>}
            {forecastData.originatorClientId && <p>Originator Client: {forecastData.originatorClientId}</p>}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
