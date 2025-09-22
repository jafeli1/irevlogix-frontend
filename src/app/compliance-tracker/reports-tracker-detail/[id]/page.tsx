'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../../../components/AppLayout';
import { fetchUserPermissions, hasPermission, UserPermissions } from '../../../../utils/rbac';

interface ScheduledReport {
  id: number;
  name: string;
  reportType: string;
  schedule: string;
  dataSource: string;
  selectedColumns: string;
  filters?: string | null;
  sorting?: string | null;
  frequency: string;
  recipients: string[];
  deliveryTime: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  isActive: boolean;
  nextRunDate?: string | null;
  lastRunDate?: string | null;
  parameters?: string | null;
  clientId: string;
  createdBy: number;
  dateCreated: string;
  lastModifiedBy?: string | null;
  dateModified?: string | null;
}

export default function ReportsTrackerDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [perms, setPerms] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [report, setReport] = useState<ScheduledReport | null>(null);
  const [reportTypeOptions, setReportTypeOptions] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/compliance-tracker/reports/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setReport(data);
      try {
        const listRes = await fetch('/api/compliance-tracker/reports', { headers: { Authorization: `Bearer ${token}` } });
        if (listRes.ok) {
          const list = await listRes.json();
          const opts = Array.from(new Set((Array.isArray(list) ? list : (list.items || [])).map((x: any) => x.reportType).filter((x: any) => !!x)));
          setReportTypeOptions(opts);
        }
      } catch {}
    } catch {
      setError('Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const init = async () => {
      const p = await fetchUserPermissions();
      setPerms(p);
      await load();
    };
    init();
  }, [load]);

  const canRead = perms && hasPermission(perms, 'ProjectManagement', 'Read');
  const canUpdate = perms && hasPermission(perms, 'ProjectManagement', 'Update');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!report) return;
    const { name, value } = e.target;
    setReport({ ...report, [name]: value });
  };

  const handleRecipientsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!report) return;
    const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setReport({ ...report, recipients: arr });
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!report) return;
    const { name, checked } = e.target;
    setReport({ ...report, [name]: checked });
  };

  const save = async () => {
    if (!report || !canUpdate) return;
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: report.name,
        reportType: report.reportType,
        schedule: report.schedule,
        dataSource: report.dataSource,
        selectedColumns: report.selectedColumns,
        filters: report.filters,
        sorting: report.sorting,
        frequency: report.frequency,
        recipients: report.recipients,
        deliveryTime: report.deliveryTime,
        dayOfWeek: report.dayOfWeek,
        dayOfMonth: report.dayOfMonth,
        isActive: report.isActive,
        nextRunDate: report.nextRunDate,
        lastRunDate: report.lastRunDate,
        parameters: report.parameters
      };
      const res = await fetch(`/api/compliance-tracker/reports/${params.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Save failed');
      router.push('/compliance-tracker/reports-tracker');
    } catch {
      setError('Failed to save report.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Reports Tracker Detail</h1>
        {!canRead ? (
          <div className="text-red-600">Access Denied</div>
        ) : loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : report ? (
          <div className="space-y-4 max-w-3xl">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input name="name" value={report.name || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium">Report Type</label>
              <select name="reportType" value={report.reportType || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
                <option value="">Select</option>
                {reportTypeOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Schedule</label>
              <input name="schedule" value={report.schedule || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium">Data Source</label>
              <input name="dataSource" value={report.dataSource || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium">Selected Columns</label>
              <textarea name="selectedColumns" value={report.selectedColumns || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
            </div>

            <div>
              <label className="block text-sm font-medium">Filters</label>
              <textarea name="filters" value={report.filters || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
            </div>

            <div>
              <label className="block text-sm font-medium">Sorting</label>
              <input name="sorting" value={report.sorting || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium">Frequency</label>
              <input name="frequency" value={report.frequency || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium">Recipients (comma-separated)</label>
              <input name="recipients" value={report.recipients.join(', ')} onChange={handleRecipientsChange} className="mt-1 w-full border rounded px-3 py-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Delivery Time (HH:MM:SS)</label>
                <input name="deliveryTime" value={report.deliveryTime || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Day Of Week</label>
                <input type="number" name="dayOfWeek" value={report.dayOfWeek ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Day Of Month</label>
                <input type="number" name="dayOfMonth" value={report.dayOfMonth ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input id="isActive" type="checkbox" name="isActive" checked={!!report.isActive} onChange={handleCheckbox} />
                <label htmlFor="isActive" className="text-sm font-medium">Is Active</label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Next Run Date</label>
                <input name="nextRunDate" value={report.nextRunDate || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Last Run Date</label>
                <input name="lastRunDate" value={report.lastRunDate || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Parameters</label>
              <textarea name="parameters" value={report.parameters || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Date Created</label>
                <input value={report.dateCreated || ''} readOnly className="mt-1 w-full border rounded px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium">Created By</label>
                <input value={String(report.createdBy)} readOnly className="mt-1 w-full border rounded px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium">Last Modified By</label>
                <input value={report.lastModifiedBy || ''} readOnly className="mt-1 w-full border rounded px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium">Date Modified</label>
                <input value={report.dateModified || ''} readOnly className="mt-1 w-full border rounded px-3 py-2 bg-gray-100" />
              </div>
            </div>

            <div className="flex gap-3">
              {canUpdate && (
                <button onClick={save} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  {saving ? 'Saving...' : 'Save Report'}
                </button>
              )}
              <button onClick={() => router.push('/compliance-tracker/reports-tracker')} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
