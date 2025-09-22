'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '../../../components/AppLayout';
import { fetchUserPermissions, hasPermission, UserPermissions } from '../../../utils/rbac';
import { COMPLIANCE_DOCUMENT_TYPES, BACKEND_URL } from '../../../utils/constants';

interface SimpleUser { id: number; firstName: string; lastName: string; }

interface ComplianceDoc {
  id: number;
  documentType?: string;
  issueDate?: string;
  expirationDate?: string;
  dateReceived?: string;
  filename?: string;
  documentUrl?: string;
  contentType?: string;
  reviewedBy?: number | null;
  dateCreated: string;
  dateUpdated: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface Filters {
  documentType: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

export default function DocumentsTrackerList() {
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });
  const [filters, setFilters] = useState<Filters>({ documentType: '', dateFrom: '', dateTo: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    documentType: '',
    issueDate: '',
    expirationDate: '',
    dateReceived: '',
    reviewComment: '',
    lastReviewDate: '',
    reviewedBy: '',
    description: '',
    file: null as File | null,
    filename: ''
  });
  const [formErrors, setFormErrors] = useState<{[k:string]: string}>({});
  const [error, setError] = useState('');
  const [users, setUsers] = useState<SimpleUser[]>([]);

  const fetchDocs = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const params = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
      });
      const res = await fetch('/api/compliance-tracker/documents?' + params.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.items || data);
        const totalCount = data.totalCount ?? parseInt(res.headers.get('X-Total-Count') || '0');
        setPagination(prev => ({ ...prev, totalCount, totalPages: totalCount ? Math.ceil(totalCount / prev.pageSize) : (data.items ? Math.ceil((data.items.length || 0)/prev.pageSize) : prev.totalPages) }));
      }
    } catch {
      setError('Failed to load documents.');
    }
  }, [pagination.page, pagination.pageSize]);

  const fetchUsers = async (token: string) => {
    try {
      const res = await fetch('/api/admin/users?page=1&pageSize=1000', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : (data.items || []));
      }
    } catch {
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const perms = await fetchUserPermissions(token);
      setPermissions(perms);
      await fetchUsers(token);
      if (hasPermission(perms, 'ProjectManagement', 'Read')) {
        await fetchDocs();
      }
      setLoading(false);
    };
    init();
  }, [fetchDocs]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ documentType: '', dateFrom: '', dateTo: '', search: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = () => {
    const headers = ['Document Type','Issue Date','Expiration Date','Date Received','Filename','Created'];
    const rows = docs.map(d => [
      d.documentType || '',
      d.issueDate || '',
      d.expirationDate || '',
      d.dateReceived || '',
      d.filename || '',
      d.dateCreated || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'documents-tracker.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const validateForm = () => {
    const errs: {[k:string]: string} = {};
    if (!formData.documentType) errs.documentType = 'Document Type is required';
    if (!formData.dateReceived) errs.dateReceived = 'Date Received is required';
    if (!formData.file) errs.file = 'File is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFormData(prev => ({ ...prev, file: f, filename: f ? f.name : '' }));
    if (f) setFormErrors(prev => { const p = { ...prev }; delete p.file; return p; });
  };

  const submitNewDocument = async () => {
    if (!validateForm()) return;
    try {
      setUploading(true);
      const token = localStorage.getItem('token')!;
      const fd = new FormData();
      if (formData.file) fd.append('file', formData.file);
      if (formData.description) fd.append('description', formData.description);
      if (formData.documentType) fd.append('documentType', formData.documentType);
      if (formData.issueDate) fd.append('issueDate', formData.issueDate);
      if (formData.expirationDate) fd.append('expirationDate', formData.expirationDate);
      if (formData.dateReceived) fd.append('dateReceived', formData.dateReceived);
      if (formData.reviewComment) fd.append('reviewComment', formData.reviewComment);
      if (formData.lastReviewDate) fd.append('lastReviewDate', formData.lastReviewDate);
      if (formData.reviewedBy) fd.append('reviewedBy', formData.reviewedBy);

      const res = await fetch('/api/compliance-tracker/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          documentType: '', issueDate: '', expirationDate: '', dateReceived: '',
          reviewComment: '', lastReviewDate: '', reviewedBy: '', description: '', file: null, filename: ''
        });
        await fetchDocs();
      } else {
        setError('Failed to upload document.');
      }
    } finally {
      setUploading(false);
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
          <p className="mt-2 text-gray-600">You don&apos;t have permission to view Documents Tracker.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents Tracker</h1>
            <p className="mt-2 text-gray-600">Track compliance documents across your organization</p>
          </div>
          <div className="flex space-x-4">
            <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">Export CSV</button>
            {hasPermission(permissions, 'ProjectManagement', 'Create') && (
              <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">Add New Document</button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Document Type</label>
              <select name="documentType" value={filters.documentType} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="">All</option>
                {COMPLIANCE_DOCUMENT_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date From</label>
              <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date To</label>
              <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Search</label>
              <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search by filename or comment" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <button onClick={clearFilters} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">Clear Filters</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {docs.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.documentType || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.issueDate || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.expirationDate || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.dateReceived || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.filename || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/compliance-tracker/documents-tracker-detail/${d.id}`} className="text-blue-600 hover:text-blue-900">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {docs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No documents found.</p>
          </div>
        )}

        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}</span> of <span className="font-medium">{pagination.totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={pagination.page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                <button onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages || prev.page + 1, prev.page + 1) }))} disabled={pagination.page === pagination.totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Next</button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Compliance Document</h3>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type <span className="text-red-500">*</span></label>
                  <select value={formData.documentType} onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))} className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.documentType ? 'border-red-500' : 'border-gray-300'}`}>
                    <option value="">Select Document Type</option>
                    {COMPLIANCE_DOCUMENT_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                  {formErrors.documentType && <p className="mt-1 text-sm text-red-600">{formErrors.documentType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                  <input type="date" value={formData.issueDate} onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
                  <input type="date" value={formData.expirationDate} onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Received <span className="text-red-500">*</span></label>
                  <input type="date" value={formData.dateReceived} onChange={(e) => setFormData(prev => ({ ...prev, dateReceived: e.target.value }))} className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.dateReceived ? 'border-red-500' : 'border-gray-300'}`} />
                  {formErrors.dateReceived && <p className="mt-1 text-sm text-red-600">{formErrors.dateReceived}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Review Comment</label>
                  <textarea value={formData.reviewComment} onChange={(e) => setFormData(prev => ({ ...prev, reviewComment: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y" rows={3} placeholder="Optional review comments" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reviewed By</label>
                  <select
                    value={formData.reviewedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, reviewedBy: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Reviewer</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Review Date</label>
                  <input type="datetime-local" value={formData.lastReviewDate} onChange={(e) => setFormData(prev => ({ ...prev, lastReviewDate: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Optional description" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">File <span className="text-red-500">*</span></label>
                  <input type="file" onChange={handleFileChange} className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.file ? 'border-red-500' : 'border-gray-300'}`} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                  {formErrors.file && <p className="mt-1 text-sm text-red-600">{formErrors.file}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">Cancel</button>
                  <button type="button" disabled={uploading} onClick={submitNewDocument} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">{uploading ? 'Uploading...' : 'Add Document'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
