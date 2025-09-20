'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../utils/rbac';

type OriginatorOption = { id: number; originatorClient: string };

interface ContaminationSourceRow {
  processingLotId: number;
  materialType?: string | null;
  contaminationPercentage?: number | null;
  incomingMaterialNotes?: string | null;
  actualReceivedWeight?: number | null;
  originatorClientId?: number | null;
  originatorName?: string | null;
  shipmentId?: number | null;
  dateCreated: string;
}

interface ContaminationAnalysisResult {
  commonContaminants: string[];
  preventativeMeasures: string[];
  supplierImprovements: string[];
  usedRows: ContaminationSourceRow[];
  totalRows: number;
  materialType?: string | null;
  originatorClientId?: number | null;
  periodWeeks: number;
  generatedAt: string;
}

export default function ContaminationAnalysisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [materialTypes, setMaterialTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [originatorClients, setOriginatorClients] = useState<OriginatorOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContaminationAnalysisResult | null>(null);

  const [filters, setFilters] = useState({
    materialTypeId: '',
    originatorClientId: '',
    periodWeeks: 4,
  });

  useEffect(() => {
    const init = async () => {
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
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('https://irevlogix-backend.onrender.com/api/Shipments/originators', {
            headers: { Authorization: `Bearer ${token}` },
          }),
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
      } catch (_) {}

      await loadData(token);
      setLoading(false);
    };
    init();
  }, [router]);

  const loadData = async (token: string) => {
    try {
      const params = new URLSearchParams();
      if (filters.materialTypeId) {
        const mt = materialTypes.find((m: { id: number; name: string }) => String(m.id) === String(filters.materialTypeId));
        if (mt?.name) params.append('materialType', mt.name);
      }
      if (filters.originatorClientId) params.append('originatorClientId', String(filters.originatorClientId));
      params.append('periodWeeks', String(filters.periodWeeks));

      const response = await fetch(`/api/ai-operations/contamination-analysis?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to load contamination analysis');

      const data = await response.json();
      setResult(data);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Failed to load analysis. Please try again.');
    }
  };

  const handleApply = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      setLoading(true);
      await loadData(token);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
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
        <h1 className="text-3xl font-bold text-gray-900">Material Contamination Analysis</h1>
        <p className="mt-2 text-gray-600">
          AI-powered analysis of incoming material quality to identify common contaminants and recommend preventative measures.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Analysis Filters</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Period in Weeks</label>
            <select
              value={filters.periodWeeks}
              onChange={(e) => setFilters({ ...filters, periodWeeks: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleApply}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Run Analysis
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3">Common Contaminants</h3>
            {result.commonContaminants.length === 0 ? (
              <p className="text-gray-600">No common contaminants identified.</p>
            ) : (
              <div className="space-y-2">
                {result.commonContaminants.map((c, i) => (
                  <p key={i} className="text-gray-700">{c}</p>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3">Preventative Measures</h3>
            {result.preventativeMeasures.length === 0 ? (
              <p className="text-gray-600">No preventative measures suggested.</p>
            ) : (
              <div className="space-y-2">
                {result.preventativeMeasures.map((m, i) => (
                  <p key={i} className="text-gray-700">{m}</p>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3">Supplier Improvements</h3>
            {result.supplierImprovements.length === 0 ? (
              <p className="text-gray-600">No supplier improvements suggested.</p>
            ) : (
              <div className="space-y-2">
                {result.supplierImprovements.map((s, i) => (
                  <p key={i} className="text-gray-700">{s}</p>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">Data Used for Analysis</h3>
              <div className="text-sm text-gray-500">
                {result.totalRows > 50
                  ? `Displaying only 50 of ${result.totalRows} rows`
                  : `${result.totalRows} row(s)`}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shipment ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Originator</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contamination %</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Received Weight (kg)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(result.usedRows || []).slice(0, 50).map((r, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-700">{new Date(r.dateCreated).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.processingLotId}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.shipmentId ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.originatorName ?? r.originatorClientId ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.materialType ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.contaminationPercentage ?? 0}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.incomingMaterialNotes ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.actualReceivedWeight ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Generated at: {result.generatedAt ? new Date(result.generatedAt).toLocaleString() : ''}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
