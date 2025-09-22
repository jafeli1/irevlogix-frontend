'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AppLayout from '../../../components/AppLayout';
import { fetchUserPermissions, hasPermission, UserPermissions } from '../../../utils/rbac';

type ISODate = string;
type UnknownRecord = Record<string, unknown>;

interface DocumentRow {
  id: number;
  documentType: string;
  filename: string;
  issueDate?: ISODate | null;
  expirationDate?: ISODate | null;
  daysToExpiration: number | null;
  daysPastExpiration: number | null;
}

interface CertificationRow {
  id: number;
  certificationType: string;
  filename: string;
  issueDate?: ISODate | null;
  expirationDate?: ISODate | null;
  daysToExpiration: number | null;
  daysPastExpiration: number | null;
}

interface ReportRow {
  id: number;
  reportType: string;
  name: string;
  lastRunDate?: ISODate | null;
  nextRunDate?: ISODate | null;
  daysSinceLastRun: number | null;
  daysPastNextRun: number | null;
}

function diffDays(a: Date, b: Date) {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function parseDate(d?: unknown): Date | null {
  if (!d || typeof d !== 'string') return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

function toArray(data: unknown): UnknownRecord[] {
  if (Array.isArray(data)) return data as UnknownRecord[];
  if (data && typeof data === 'object') {
    const items = (data as { items?: unknown }).items;
    if (Array.isArray(items)) return items as UnknownRecord[];
  }
  return [];
}

export default function AlertsTrackerPage() {
  const [perms, setPerms] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [certs, setCerts] = useState<CertificationRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';
        const p = await fetchUserPermissions(token);
        setPerms(p);

        const headers = { Authorization: `Bearer ${token}` };

        const [docsRes, certsRes, reportsRes] = await Promise.all([
          fetch('/api/compliance-tracker/documents', { headers }),
          fetch('/api/compliance-tracker/certifications', { headers }),
          fetch('/api/compliance-tracker/reports', { headers })
        ]);

        if (!docsRes.ok || !certsRes.ok || !reportsRes.ok) throw new Error('Failed to load');

        const [docsJson, certsJson, reportsJson] = await Promise.all([docsRes.json(), certsRes.json(), reportsRes.json()]);

        const today = new Date();

        const docRows: DocumentRow[] = toArray(docsJson).map((d) => {
          const id = typeof d.id === 'number' ? d.id : Number(d.id ?? 0);
          const documentType = typeof d.documentType === 'string' ? d.documentType : '';
          const filename = typeof d.fileName === 'string' ? d.fileName : typeof d.filename === 'string' ? d.filename : '';
          const issueDate = typeof d.issueDate === 'string' ? d.issueDate : null;
          const expirationDate = typeof d.expirationDate === 'string' ? d.expirationDate : null;

          const exp = parseDate(expirationDate || undefined);
          let daysToExpiration: number | null = null;
          let daysPastExpiration: number | null = null;
          if (exp) {
            const delta = diffDays(exp, today);
            daysToExpiration = delta >= 0 ? delta : null;
            daysPastExpiration = delta < 0 ? -delta : null;
          }

          return { id, documentType, filename, issueDate, expirationDate, daysToExpiration, daysPastExpiration };
        }).filter((r) => {
          if (!r.expirationDate) return false;
          const exp = parseDate(r.expirationDate);
          if (!exp) return false;
          const days = diffDays(exp, today);
          return days <= 30; 
        });

        const certRows: CertificationRow[] = toArray(certsJson).map((c) => {
          const id = typeof c.id === 'number' ? c.id : Number(c.id ?? 0);
          const certificationType = typeof c.certificationType === 'string' ? c.certificationType : '';
          const filename = typeof c.fileName === 'string' ? c.fileName : typeof c.filename === 'string' ? c.filename : '';
          const issueDate = typeof c.issueDate === 'string' ? c.issueDate : null;
          const expirationDate = typeof c.expirationDate === 'string' ? c.expirationDate : null;

          const exp = parseDate(expirationDate || undefined);
          let daysToExpiration: number | null = null;
          let daysPastExpiration: number | null = null;
          if (exp) {
            const delta = diffDays(exp, today);
            daysToExpiration = delta >= 0 ? delta : null;
            daysPastExpiration = delta < 0 ? -delta : null;
          }

          return { id, certificationType, filename, issueDate, expirationDate, daysToExpiration, daysPastExpiration };
        }).filter((r) => {
          if (!r.expirationDate) return false;
          const exp = parseDate(r.expirationDate);
          if (!exp) return false;
          const days = diffDays(exp, today);
          return days <= 30;
        });

        const reportsRaw = toArray(reportsJson).filter((o) => {
          const ia = o['isActive'];
          return typeof ia === 'boolean' ? ia : true;
        });

        const reportRows: ReportRow[] = reportsRaw.map((r) => {
          const id = typeof r.id === 'number' ? r.id : Number(r.id ?? 0);
          const reportType = typeof r.reportType === 'string' ? r.reportType : '';
          const name = typeof r.name === 'string' ? r.name : '';
          const lastRunDate = typeof r.lastRunDate === 'string' ? r.lastRunDate : null;
          const nextRunDate = typeof r.nextRunDate === 'string' ? r.nextRunDate : null;

          const last = parseDate(lastRunDate || undefined);
          const next = parseDate(nextRunDate || undefined);

          const daysSinceLastRun = last ? diffDays(today, last) : null;
          const daysPastNextRun = next ? diffDays(today, next) : null;

          return { id, reportType, name, lastRunDate, nextRunDate, daysSinceLastRun, daysPastNextRun };
        }).filter((r) => r.daysPastNextRun !== null && (r.daysPastNextRun as number) > 0);

        docRows.sort((a, b) => {
          const ap = (a.daysPastExpiration ?? -1);
          const bp = (b.daysPastExpiration ?? -1);
          if (ap !== bp) return (bp) - (ap);
          const at = (a.daysToExpiration ?? 99999);
          const bt = (b.daysToExpiration ?? 99999);
          return at - bt;
        });
        certRows.sort((a, b) => {
          const ap = (a.daysPastExpiration ?? -1);
          const bp = (b.daysPastExpiration ?? -1);
          if (ap !== bp) return (bp) - (ap);
          const at = (a.daysToExpiration ?? 99999);
          const bt = (b.daysToExpiration ?? 99999);
          return at - bt;
        });
        reportRows.sort((a, b) => (b.daysPastNextRun ?? 0) - (a.daysPastNextRun ?? 0));

        setDocs(docRows);
        setCerts(certRows);
        setReports(reportRows);
      } catch {
        setError('Failed to load alerts.');
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const canRead = useMemo(() => perms && hasPermission(perms, 'ProjectManagement', 'Read'), [perms]);

  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        <h1 className="text-xl font-semibold">Alerts Tracker</h1>

        {!canRead ? (
          <div className="text-red-600">Access Denied</div>
        ) : loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            <section>
              <h2 className="text-lg font-semibold mb-3">Documents Tracker Alerts</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days to Expiration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Past Expiration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {docs.map((r) => {
                      const red = (r.daysPastExpiration ?? 0) > 0;
                      const green = (r.daysToExpiration ?? 99999) < 15 && (r.daysPastExpiration ?? 0) <= 0;
                      return (
                        <tr key={r.id} className={red ? 'bg-red-50' : green ? 'bg-green-50' : ''}>
                          <td className="px-4 py-2">{r.documentType}</td>
                          <td className="px-4 py-2">{r.filename}</td>
                          <td className="px-4 py-2">{r.issueDate ? new Date(r.issueDate).toLocaleDateString() : ''}</td>
                          <td className="px-4 py-2">{r.expirationDate ? new Date(r.expirationDate).toLocaleDateString() : ''}</td>
                          <td className="px-4 py-2">{r.daysToExpiration ?? ''}</td>
                          <td className="px-4 py-2">{r.daysPastExpiration ?? ''}</td>
                          <td className="px-4 py-2">
                            <Link href={`/compliance-tracker/documents-tracker-detail/${r.id}?readonly=1`} className="text-indigo-600 hover:underline">View</Link>
                          </td>
                        </tr>
                      );
                    })}
                    {docs.length === 0 && <tr><td className="px-4 py-4 text-gray-500" colSpan={7}>No alerts.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">Certifications Tracker Alerts</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certification Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days to Expiration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Past Expiration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {certs.map((r) => {
                      const red = (r.daysPastExpiration ?? 0) > 0;
                      const green = (r.daysToExpiration ?? 99999) < 15 && (r.daysPastExpiration ?? 0) <= 0;
                      return (
                        <tr key={r.id} className={red ? 'bg-red-50' : green ? 'bg-green-50' : ''}>
                          <td className="px-4 py-2">{r.certificationType}</td>
                          <td className="px-4 py-2">{r.filename}</td>
                          <td className="px-4 py-2">{r.issueDate ? new Date(r.issueDate).toLocaleDateString() : ''}</td>
                          <td className="px-4 py-2">{r.expirationDate ? new Date(r.expirationDate).toLocaleDateString() : ''}</td>
                          <td className="px-4 py-2">{r.daysToExpiration ?? ''}</td>
                          <td className="px-4 py-2">{r.daysPastExpiration ?? ''}</td>
                          <td className="px-4 py-2">
                            <Link href={`/compliance-tracker/certifications-tracker-detail/${r.id}?readonly=1`} className="text-indigo-600 hover:underline">View</Link>
                          </td>
                        </tr>
                      );
                    })}
                    {certs.length === 0 && <tr><td className="px-4 py-4 text-gray-500" colSpan={7}>No alerts.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">Reports Tracker Alerts</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Run</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Since Last Run</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Past Next Run</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((r) => {
                      const red = (r.daysPastNextRun ?? 0) > 7;
                      const green = (r.daysPastNextRun ?? 0) <= 7 && (r.daysPastNextRun ?? 0) > 0;
                      return (
                        <tr key={r.id} className={red ? 'bg-red-50' : green ? 'bg-green-50' : ''}>
                          <td className="px-4 py-2">{r.reportType}</td>
                          <td className="px-4 py-2">{r.name}</td>
                          <td className="px-4 py-2">{r.lastRunDate ? new Date(r.lastRunDate).toLocaleString() : ''}</td>
                          <td className="px-4 py-2">{r.nextRunDate ? new Date(r.nextRunDate).toLocaleString() : ''}</td>
                          <td className="px-4 py-2">{r.daysSinceLastRun ?? ''}</td>
                          <td className="px-4 py-2">{r.daysPastNextRun ?? ''}</td>
                          <td className="px-4 py-2">
                            <Link href={`/compliance-tracker/reports-tracker-detail/${r.id}?readonly=1`} className="text-indigo-600 hover:underline">View</Link>
                          </td>
                        </tr>
                      );
                    })}
                    {reports.length === 0 && <tr><td className="px-4 py-4 text-gray-500" colSpan={7}>No alerts.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
