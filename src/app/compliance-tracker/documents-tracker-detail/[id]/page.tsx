'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../../../components/AppLayout';
import Link from 'next/link';
import { fetchUserPermissions, hasPermission, UserPermissions } from '../../../../utils/rbac';
import { COMPLIANCE_DOCUMENT_TYPES, BACKEND_URL } from '../../../../utils/constants';

interface ComplianceDocDetail {
  id: number;
  documentType?: string;
  issueDate?: string;
  expirationDate?: string;
  dateReceived?: string;
  reviewComment?: string;
  lastReviewDate?: string;
  reviewedBy?: number | null;
  description?: string;
  filename?: string;
  documentUrl?: string;
  contentType?: string;
  dateCreated: string;
  dateUpdated: string;
}

interface SimpleUser { id: number; firstName: string; lastName: string; }

export default function DocumentsTrackerDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [detail, setDetail] = useState<ComplianceDocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [edited, setEdited] = useState<Partial<ComplianceDocDetail>>({});
  const [users, setUsers] = useState<SimpleUser[]>([]);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');
      const perms = await fetchUserPermissions(token);
      setPermissions(perms);
      await fetchUsers();
      await fetchDetail();
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')!;
      const res = await fetch('/api/admin/users?page=1&pageSize=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : (data.items || []));
      }
    } catch {
    }
  };

  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem('token')!;
      const res = await fetch(`/api/compliance-tracker/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
        const fmt = (s?: string | null) => (s ? s.split('T')[0] : '');
        setEdited({
          ...data,
          issueDate: fmt(data.issueDate),
          expirationDate: fmt(data.expirationDate),
          dateReceived: fmt(data.dateReceived),
        });
      } else {
        setError('Failed to load document detail.');
      }
    } catch {
      setError('Network error.');
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token')!;
      const res = await fetch(`/api/compliance-tracker/documents/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(edited)
      });
      if (res.ok || res.status === 204) {
        await fetchDetail();
      } else {
        setError('Failed to save changes.');
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    const token = localStorage.getItem('token')!;
    const res = await fetch(`/api/compliance-tracker/documents/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      router.push('/compliance-tracker/documents-tracker');
    } else {
      setError('Failed to delete document.');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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

  if (!detail) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Document not found</h2>
          <Link href="/compliance-tracker/documents-tracker" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">Back to Documents Tracker</Link>
        </div>
      </AppLayout>
    );
  }

  const fileUrl = detail.documentUrl ? `${BACKEND_URL}/${detail.documentUrl}` : '';

  return (
    <AppLayout>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documents Tracker Detail</h1>
              <p className="mt-1 text-sm text-gray-600">Edit compliance document</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/compliance-tracker/documents-tracker" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Back to List</Link>
              {hasPermission(permissions, 'ProjectManagement', 'Delete') && (
                <button onClick={remove} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">Delete</button>
              )}
              {hasPermission(permissions, 'ProjectManagement', 'Update') && (
                <button onClick={save} disabled={saving} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700">Document Type</label>
            <select value={edited.documentType || ''} onChange={(e) => setEdited(prev => ({ ...prev, documentType: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select Document Type</option>
              {COMPLIANCE_DOCUMENT_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Issue Date</label>
              <input type="date" value={edited.issueDate || ''} onChange={(e) => setEdited(prev => ({ ...prev, issueDate: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
              <input type="date" value={edited.expirationDate || ''} onChange={(e) => setEdited(prev => ({ ...prev, expirationDate: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Received</label>
              <input type="date" value={edited.dateReceived || ''} onChange={(e) => setEdited(prev => ({ ...prev, dateReceived: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Review Date</label>
              <input type="datetime-local" value={edited.lastReviewDate || ''} onChange={(e) => setEdited(prev => ({ ...prev, lastReviewDate: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Review Comment</label>
            <textarea value={edited.reviewComment || ''} onChange={(e) => setEdited(prev => ({ ...prev, reviewComment: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Optional review comments" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reviewed By</label>
            <select value={edited.reviewedBy ?? ''} onChange={(e) => setEdited(prev => ({ ...prev, reviewedBy: e.target.value ? parseInt(e.target.value) : null }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select Reviewer</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">File</label>
            <div className="space-y-2">
              {detail.filename ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-900">{detail.filename}</span>
                  {detail.documentUrl && (
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">Download</a>
                  )}
                  {hasPermission(permissions!, 'ProjectManagement', 'Update') && (
                    <button
                      onClick={async () => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
                        input.onchange = async (e: Event) => {
                          const target = e.target as HTMLInputElement | null;
                          const f = target?.files?.[0];
                          if (!f) return;
                          const token = localStorage.getItem('token')!;
                          const fd = new FormData();
                          fd.append('file', f);
                          const res = await fetch(`/api/compliance-tracker/documents/${id}/upload`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: fd
                          });
                          if (res.ok) await fetchDetail(); else setError('Failed to replace file.');
                        };
                        input.click();
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Replace
                    </button>
                  )}
                  {hasPermission(permissions!, 'ProjectManagement', 'Delete') && (
                    <button
                      onClick={async () => {
                        if (!confirm('Delete the attached file?')) return;
                        const token = localStorage.getItem('token')!;
                        const res = await fetch(`/api/compliance-tracker/documents/${id}/file`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok || res.status === 204) await fetchDetail(); else setError('Failed to delete file.');
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">No file uploaded.</span>
                  {hasPermission(permissions!, 'ProjectManagement', 'Update') && (
                    <button
                      onClick={async () => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
                        input.onchange = async (e: Event) => {
                          const target = e.target as HTMLInputElement | null;
                          const f = target?.files?.[0];
                          if (!f) return;
                          const token = localStorage.getItem('token')!;
                          const fd = new FormData();
                          fd.append('file', f);
                          const res = await fetch(`/api/compliance-tracker/documents/${id}/upload`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: fd
                          });
                          if (res.ok) await fetchDetail(); else setError('Failed to upload file.');
                        };
                        input.click();
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Upload
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
