'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../../components/AppLayout';

type TabKey = 'esg' | 'financial' | 'compliance';

interface ApiListResponse<T> {
  items?: T[];
  data?: T[];
  results?: T[];
}
interface Shipment {
  id: number | string;
  dateCreated?: string;
  status?: string;
}

interface ProcessedMaterial {
  id: number | string;
  materialType?: string;
  weightLbs?: number;
  weight?: number;
  status?: string;
  processingLotId?: number | string;
  dateCreated?: string;
}

interface Asset {
  id: number | string;
  status?: string;
  disposition?: string;
  category?: string;
  createdAt?: string;
}
interface EsgSummary {
  totalIncomingWeight: number;
  totalProcessedWeight: number;
  diversionRate: number;
  co2eSavedLbs: number;
  waterSavedGallons: number;
  energySavedKwh: number;
  factors?: {
    co2ePerLb: number;
    waterGalPerLb: number;
    energyKwhPerLb: number;
  }
}

interface FinancialSummary {
  totalActualRevenue: number;
  totalExpectedRevenue: number;
  totalProcessingCost: number;
  totalIncomingMaterialCost: number;
  netProfit: number;
}

interface ComplianceSummary {
  totalLots: number;
  overdueCertifications: number;
  pendingCertifications: number;
}
interface DrilldownApiItem {
  recordType: string;
  id: number;
  nameOrType?: string | null;
  date?: string | null;
  weightLbs?: number | null;
  status?: string | null;
}


interface DrilldownApiItem {
  recordType: string;
  id: number;
  nameOrType?: string | null;
  date?: string | null;
  weightLbs?: number | null;
  status?: string | null;
}


interface ProcessingLot {
  id: number | string;
  totalProcessedWeight?: number;
  totalIncomingWeight?: number;
  actualRevenue?: number;
  expectedRevenue?: number;
  processingCost?: number;
  incomingMaterialCost?: number;
  certificationStatus?: string;
  completionDate?: string;
  dateCreated?: string;
}

type DrillRow = ProcessingLot | ProcessedMaterial | Asset | Shipment

export default function ReportsDashboardsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('esg');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [processedMaterials, setProcessedMaterials] = useState<ProcessedMaterial[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [processingLots, setProcessingLots] = useState<ProcessingLot[]>([]);

  const [drillTitle, setDrillTitle] = useState('');
  const [drillRows, setDrillRows] = useState<DrillRow[]>([]);
  const [esgSummary, setEsgSummary] = useState<EsgSummary | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);


  const [drillOpen, setDrillOpen] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const fetchAll = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [shipmentsRes, pmRes, assetsRes, lotsRes, esgRes, finRes, compRes] = await Promise.all([
          fetch('https://irevlogix-backend.onrender.com/api/shipments', { headers }),
          fetch('https://irevlogix-backend.onrender.com/api/processedmaterials', { headers }),
          fetch('https://irevlogix-backend.onrender.com/api/assets', { headers }),
          fetch('https://irevlogix-backend.onrender.com/api/processinglots', { headers }),
          fetch('https://irevlogix-backend.onrender.com/api/reports/esg-summary', { headers }),
          fetch('https://irevlogix-backend.onrender.com/api/reports/financial-summary', { headers }),
          fetch('https://irevlogix-backend.onrender.com/api/reports/compliance-summary', { headers }),
        ]);

        const parse = async <T,>(res: Response): Promise<T[]> => {
          if (!res.ok) return [];
          const data = await res.json();
          const payload: ApiListResponse<T> | T[] = data;
          if (Array.isArray(payload)) return payload;
          return payload.items || payload.data || payload.results || [];
        };

        setShipments(await parse(shipmentsRes));
        setProcessedMaterials(await parse(pmRes));
        setAssets(await parse(assetsRes));
        setProcessingLots(await parse(lotsRes));

        try {
          if (esgRes.ok) setEsgSummary(await esgRes.json());
        } catch {}
        try {
          if (finRes.ok) setFinancialSummary(await finRes.json());
        } catch {}
        try {
          if (compRes.ok) setComplianceSummary(await compRes.json());
        } catch {}
      } catch {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  const totals = useMemo(() => {
    const lotProcessedWeight = processingLots.reduce((sum: number, l: ProcessingLot) => sum + Number(l.totalProcessedWeight || l.totalIncomingWeight || 0), 0);
    const pmWeight = processedMaterials.reduce((sum: number, r: ProcessedMaterial) => sum + Number(r.weightLbs || r.weight || 0), 0);
    const totalProcessedWeight = lotProcessedWeight || pmWeight;

    const reusedAssets = assets.filter((a: Asset) => a.status === 'Reused' || a.disposition === 'Reuse').length;

    const divertedWeight = totalProcessedWeight;
    const diversionRate = totalProcessedWeight > 0 ? divertedWeight / totalProcessedWeight : 0;

    const CO2_FACTOR_PER_LB = 0.6;
    const WATER_SAVED_GAL_PER_LB = 3.2;
    const ENERGY_SAVED_KWH_PER_LB = 0.8;

    const co2eSaved = totalProcessedWeight * CO2_FACTOR_PER_LB;
    const waterSaved = totalProcessedWeight * WATER_SAVED_GAL_PER_LB;
    const energySaved = totalProcessedWeight * ENERGY_SAVED_KWH_PER_LB;

    const totalRevenue = processingLots.reduce((sum: number, l: ProcessingLot) => sum + Number(l.actualRevenue || l.expectedRevenue || 0), 0);
    const processingCost = processingLots.reduce((sum: number, l: ProcessingLot) => sum + Number(l.processingCost || 0), 0);
    const incomingMaterialCost = processingLots.reduce((sum: number, l: ProcessingLot) => sum + Number(l.incomingMaterialCost || 0), 0);
    const totalCost = processingCost + incomingMaterialCost;
    const netProfit = totalRevenue - totalCost;

    const overdueThresholdDays = 7;
    const now = new Date().getTime();
    const overdueLots = processingLots.filter((l: ProcessingLot) => {
      const status = (l.certificationStatus || '').toString().toLowerCase();
      if (status === 'completed' || status === 'complete') return false;
      const completionDate = l.completionDate ? new Date(l.completionDate).getTime() : null;
      if (!completionDate) return false;
      const daysSince = (now - completionDate) / (1000 * 60 * 60 * 24);
      return daysSince > overdueThresholdDays || status === 'overdue';
    });

    const revenueReuse = 0;
    const revenueResale = 0;
    const revenueMaterial = 0;

    const costTransportation = 0;
    const costDestruction = 0;
    const costLabor = 0;

    const pendingAudits = 0;
    const regulatoryStatus = 'On Track';

    return {
      totalProcessedWeight,
      reusedAssets,
      diversionRate,
      co2eSaved,
      waterSaved,

      energySaved,
      totalRevenue,
      revenueReuse,
      revenueResale,
      revenueMaterial,
      totalCost,
      processingCost,
  const fetchDrilldown = async (title: string, type: 'processinglots' | 'processedmaterials', opts?: { status?: string; from?: string; to?: string; page?: number; pageSize?: number }) => {
    if (!token) return;
    setDrillTitle(title);
    setDrillOpen(true);
    setDrillLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('type', type);
      if (opts?.status) params.set('status', opts.status);
      if (opts?.from) params.set('from', opts.from);
  const fetchDrilldown = async (title: string, type: 'processinglots' | 'processedmaterials', opts?: { status?: string; from?: string; to?: string; page?: number; pageSize?: number }) => {
    if (!token) return;
    setDrillTitle(title);
    setDrillOpen(true);
    setDrillLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('type', type);
      if (opts?.status) params.set('status', opts.status);
      if (opts?.from) params.set('from', opts.from);
      if (opts?.to) params.set('to', opts.to);
      params.set('page', String(opts?.page ?? 1));
      params.set('pageSize', String(opts?.pageSize ?? 25));
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/reports/drilldown?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setDrillRows([]);
        return;
      }
      const data: { items?: DrilldownApiItem[]; totalCount?: number; page?: number; pageSize?: number } = await res.json();
      const items = data.items ?? [];
      const mapped: DrillRow[] = items.map((it) => {
        if (it.recordType?.toLowerCase() === 'processinglot') {
          return {
            id: it.id,
            dateCreated: it.date ?? undefined,
            totalProcessedWeight: it.weightLbs ?? undefined,
            certificationStatus: it.status ?? undefined,
          } as ProcessingLot;
        }
        return {
          id: it.id,
          materialType: it.nameOrType ?? undefined,
          dateCreated: it.date ?? undefined,
          weightLbs: it.weightLbs ?? undefined,
          status: it.status ?? undefined,
        } as ProcessedMaterial;
      });
      setDrillRows(mapped);
    } catch {
      setDrillRows([]);
    } finally {
      setDrillLoading(false);
    }
  };
      if (opts?.to) params.set('to', opts.to);
      params.set('page', String(opts?.page ?? 1));
      params.set('pageSize', String(opts?.pageSize ?? 25));
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/reports/drilldown?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setDrillRows([]);
        return;
      }
      const data: { items?: DrilldownApiItem[]; totalCount?: number; page?: number; pageSize?: number } = await res.json();
      const items = data.items ?? [];
      const mapped: DrillRow[] = items.map((it) => {
        if (it.recordType?.toLowerCase() === 'processinglot') {
          return {
            id: it.id,
            dateCreated: it.date ?? undefined,
            totalProcessedWeight: it.weightLbs ?? undefined,
            certificationStatus: it.status ?? undefined,
          } as ProcessingLot;
        }
        return {
          id: it.id,
          materialType: it.nameOrType ?? undefined,
          dateCreated: it.date ?? undefined,
          weightLbs: it.weightLbs ?? undefined,
          status: it.status ?? undefined,
        } as ProcessedMaterial;
      });
      setDrillRows(mapped);
    } catch {
      setDrillRows([]);
    } finally {
      setDrillLoading(false);
    }
  };

      incomingMaterialCost,
      costTransportation,
      costDestruction,
      costLabor,
      netProfit,
      overdueCerts: overdueLots.length,
      overdueLots,
      pendingAudits,
      regulatoryStatus,
    };
  }, [processingLots, processedMaterials, assets]);

  const openDrill = (title: string, rows: DrillRow[]) => {
    setDrillTitle(title);
    setDrillRows(rows);
    setDrillOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboards</h1>
          <p className="text-gray-500">ESG, Financial, and Compliance overview</p>
        </div>

        <div className="flex items-center gap-4 border-b">
          <button className={`px-4 py-2 ${activeTab === 'esg' ? 'border-b-2 border-blue-600' : ''}`} onClick={() => setActiveTab('esg')}>ESG</button>
          <button className={`px-4 py-2 ${activeTab === 'financial' ? 'border-b-2 border-blue-600' : ''}`} onClick={() => setActiveTab('financial')}>Financial</button>
          <button className={`px-4 py-2 ${activeTab === 'compliance' ? 'border-b-2 border-blue-600' : ''}`} onClick={() => setActiveTab('compliance')}>Compliance</button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded p-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'esg' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border rounded p-4 cursor-pointer" onClick={() => fetchDrilldown('Processed Materials', 'processedmaterials')}>
                    <div className="text-sm text-gray-500">CO2e Saved</div>
                    <div className="text-2xl font-semibold">{(esgSummary?.co2eSavedLbs ?? totals.co2eSaved).toLocaleString(undefined, { maximumFractionDigits: 0 })} lb CO2e</div>
                    <div className="text-xs text-gray-400 mt-1">Assumption: {(esgSummary?.factors?.co2ePerLb ?? 0.6)} lb CO2e per lb processed</div>
                  </div>
                  <div className="bg-white border rounded p-4 cursor-pointer" onClick={() => fetchDrilldown('Processed Materials', 'processedmaterials')}>
                    <div className="text-sm text-gray-500">Diversion Rate</div>
                    <div className="text-2xl font-semibold">{(((esgSummary?.diversionRate ?? totals.diversionRate) * 100)).toFixed(1)}%</div>
                    <div className="text-xs text-gray-400 mt-1">Diverted / Total processed weight</div>
                  </div>
                  <div className="bg-white border rounded p-4">
                    <div className="text-sm text-gray-500">Social Impact</div>
                    <div className="text-2xl font-semibold">Placeholder</div>
                    <div className="text-xs text-gray-400 mt-1">To be defined with business metrics</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border rounded p-4 cursor-pointer" onClick={() => fetchDrilldown('Processed Materials', 'processedmaterials')}>
                    <div className="text-sm text-gray-500">Water Saved</div>
                    <div className="text-2xl font-semibold">{(esgSummary?.waterSavedGallons ?? totals.waterSaved).toLocaleString(undefined, { maximumFractionDigits: 0 })} gal</div>
                    <div className="text-xs text-gray-400 mt-1">Assumption: {(esgSummary?.factors?.waterGalPerLb ?? 3.2)} gal per lb processed</div>
                  </div>
                  <div className="bg-white border rounded p-4 cursor-pointer" onClick={() => fetchDrilldown('Processed Materials', 'processedmaterials')}>
                    <div className="text-sm text-gray-500">Energy Saved</div>
                    <div className="text-2xl font-semibold">{(esgSummary?.energySavedKwh ?? totals.energySaved).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</div>
                    <div className="text-xs text-gray-400 mt-1">Assumption: {(esgSummary?.factors?.energyKwhPerLb ?? 0.8)} kWh per lb processed</div>
                  </div>
                  <div className="bg-white border rounded p-4">
                    <div className="text-sm text-gray-500">ESG Impact Forecaster</div>
                    <div className="text-gray-400">AI placeholder – to be implemented with gpt-4o-mini</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border rounded p-4">
                    <div className="text-sm text-gray-500">Total Revenue</div>
                    <div className="text-2xl font-semibold">${(financialSummary?.totalActualRevenue ?? totals.totalRevenue).toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-1">Breakdown by category shown below</div>
                  </div>
                  <div className="bg-white border rounded p-4">
                    <div className="text-sm text-gray-500">Total Costs</div>
                    <div className="text-2xl font-semibold">${((financialSummary ? (financialSummary.totalProcessingCost + financialSummary.totalIncomingMaterialCost) : totals.totalCost).toLocaleString())}</div>
                    <div className="text-xs text-gray-400 mt-1">Transportation, Processing, Destruction, Labor</div>
                  </div>
                  <div className="bg-white border rounded p-4">
                    <div className="text-sm text-gray-500">Net Profit/Loss</div>
                    <div className={`text-2xl font-semibold ${((financialSummary?.netProfit ?? totals.netProfit) >= 0 ? 'text-green-700' : 'text-red-700')}`}>${(financialSummary?.netProfit ?? totals.netProfit).toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border rounded p-4">
                    <div className="text-sm text-gray-500">Revenue: Reuse</div>
                    <div className="text-xl font-semibold">${totals.revenueReuse.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-1">Placeholder until revenue fields are populated</div>
                  </div>
                  <div className="bg-white border rounded p-4">
                    <div className="text-sm text-gray-500">Revenue: Resale</div>
                    <div className="text-xl font-semibold">${totals.revenueResale.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-1">Placeholder</div>
                  </div>
                  <div className="bg-white border rounded p-4">
                    <div className="text-sm text-gray-500">Revenue: Material Sales</div>
                    <div className="text-xl font-semibold">${totals.revenueMaterial.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-1">Placeholder</div>
                  </div>
                </div>

                <div className="bg-white border rounded p-4">
                  <div className="text-sm text-gray-500 mb-1">AI Suggestions</div>
                  <div className="text-gray-400">Placeholder for profit optimization suggestions</div>
                </div>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border rounded p-4 cursor-pointer" onClick={() => openDrill('Overdue Certifications (Processing Lots)', totals.overdueLots)}>
                    <div className="text-sm text-gray-500">Overdue Certifications</div>
                    <div className="text-2xl font-semibold">{(complianceSummary?.overdueCertifications ?? totals.overdueCerts)}</div>
                    <div className="text-xs text-gray-400 mt-1">Based on CertificationStatus and CompletionDate</div>
                  </div>
                  <div className="bg-white border rounded p-4">
                    <div className="text-sm text-gray-500">Pending Audits</div>
                    <div className="text-2xl font-semibold">{totals.pendingAudits}</div>
                    <div className="text-xs text-gray-400 mt-1">Placeholder – audits module pending</div>
                  </div>
                  <div className="bg-white border rounded p-4">
                    <div className="text-sm text-gray-500">Regulatory Status</div>
                    <div className="text-2xl font-semibold">{totals.regulatoryStatus}</div>
                    <div className="text-xs text-gray-400 mt-1">R2 / e‑Stewards adherence summary</div>
                  </div>
                </div>

                <div className="bg-white border rounded p-4">
                  <div className="text-sm text-gray-500 mb-1">AI Suggestions</div>
                  <div className="text-gray-400">Placeholder for compliance risk summary</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {drillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-4xl rounded shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="text-lg font-semibold">{drillTitle}</div>
              <button className="px-2 py-1 rounded hover:bg-gray-100" onClick={() => setDrillOpen(false)}>✕</button>
            </div>
            <div className="p-4 overflow-auto">
              {drillLoading ? (
                <div className="py-6 text-center text-gray-600">Loading...</div>
              ) : (
                <table className="min-w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="px-3 py-2">Id</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Weight</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {drillRows.map((r: DrillRow) => {
                    const isLot = 'certificationStatus' in r || 'processingCost' in r || 'totalProcessedWeight' in r;
                    const isPM = 'materialType' in r || 'processingLotId' in r;
                    const dateVal = (() => {
                      if ('completionDate' in r && r.completionDate) return r.completionDate;
                      if ('dateCreated' in r && r.dateCreated) return r.dateCreated;
                      if ('createdAt' in r && r.createdAt) return r.createdAt;
                      return null;
                    })();
                    const weightVal = (() => {
                      if ('totalProcessedWeight' in r && r.totalProcessedWeight !== undefined) return r.totalProcessedWeight;
                      if ('totalIncomingWeight' in r && r.totalIncomingWeight !== undefined) return r.totalIncomingWeight;
                      if ('weightLbs' in r && r.weightLbs !== undefined) return r.weightLbs;
                      if ('weight' in r && r.weight !== undefined) return r.weight;
                      return null;
                    })();
                    return (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">{r.id}</td>
                        <td className="px-3 py-2">{isLot ? 'Processing Lot' : isPM ? 'Processed Material' : ('category' in r ? r.category : '—')}</td>
                        <td className="px-3 py-2">{dateVal ? new Date(dateVal).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2">{weightVal ?? '—'}</td>
                        <td className="px-3 py-2">{('certificationStatus' in r && r.certificationStatus) || ('status' in r && r.status) || '—'}</td>
                        <td className="px-3 py-2">
                          {isLot ? (
                            <a className="text-blue-600 underline" href={`/processing/lot-detail/${r.id}`}>View</a>
                          ) : isPM ? (
                            <a className="text-blue-600 underline" href={`/downstream/processedmaterial-detail/${r.id}`}>View</a>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {drillRows.length === 0 && (
                <div className="text-center text-gray-500 py-8">No data</div>
              )}
            </div>
            <div className="px-4 py-3 border-t text-right">
              <button className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setDrillOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
