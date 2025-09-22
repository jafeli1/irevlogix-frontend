'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '../../../components/AppLayout';
import { fetchUserPermissions, hasPermission, UserPermissions } from '../../../utils/rbac';
import { BACKEND_URL } from '../../../utils/constants';

interface ScheduledReport {
  id: number;
  name: string;
  reportType: string;
  lastRunDate?: string | null;
  nextRunDate?: string | null;
  createdBy: number;
  dateCreated: string;
}

export default function ReportsTrackerPage() {
  const [perms, setPerms] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [error, setError] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/compliance-tracker/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const items: ScheduledReport[] = (Array.isArray(data) ? data : (data.items || [])).map((d: any) => ({
        id: d.id,
        name: d.name,
        reportType: d.reportType,
        lastRunDate: d.lastRunDate,
        nextRunDate: d.nextRunDate,
        createdBy: d.createdBy,
        dateCreated: d.dateCreated
      }));
      items.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
      setReports(items);
    } catch {
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token') || '';
      const p = await fetchUserPermissions(token);
      setPerms(p);
      await load();
    };
    init();
  }, [load]);

  const canRead = perms && hasPermission(perms, 'ProjectManagement', 'Read');

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Reports Tracker</h1>
        </div>
        {!canRead ? (
          <div className="text-red-600">Access Denied</div>
        ) : loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Run</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2">{r.reportType}</td>
                    <td className="px-4 py-2">{r.lastRunDate ? new Date(r.lastRunDate).toLocaleString() : ''}</td>
                    <td className="px-4 py-2">{r.nextRunDate ? new Date(r.nextRunDate).toLocaleString() : ''}</td>
                    <td className="px-4 py-2">{r.createdBy}</td>
                    <td className="px-4 py-2">
                      <Link href={`/compliance-tracker/reports-tracker-detail/${r.id}`} className="text-indigo-600 hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td className="px-4 py-4 text-gray-500" colSpan={6}>No reports found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
