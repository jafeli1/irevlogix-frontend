"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "../../../components/AppLayout";

type Vendor = {
  id: number;
  vendorName: string;
  contactPerson?: string | null;
  materialsPurchased?: string | null;
  lastSaleDate?: string | null;
  vendorRating?: number | null;
};

type PagedResponse = {
  items: Vendor[];
  total: number;
};

const pageSizeOptions = [10, 25, 50];

export default function VendorsPage() {
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
  }, []);

  const [data, setData] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterName, setFilterName] = useState("");
  const [filterMaterialTypeId, setFilterMaterialTypeId] = useState<string>("");

  const [showCreate, setShowCreate] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    vendorName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    materialsOfInterest: "",
    paymentTerms: "",
    vendorRating: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterName) params.append("name", filterName);
      if (filterMaterialTypeId) params.append("materialTypeId", filterMaterialTypeId);
      params.append("page", String(page));
      params.append("pageSize", String(pageSize));
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/Vendors?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const totalHeader = res.headers.get("X-Total-Count");
      if (totalHeader) setTotal(parseInt(totalHeader, 10));
      const json: Vendor[] = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, pageSize, filterName, filterMaterialTypeId]);

  const onExportCsv = () => {
    const header = ["Id", "Vendor Name", "Contact Person", "Materials Purchased", "Last Sale Date", "Vendor Rating"];
    const rows = data.map((v) => [
      v.id,
      v.vendorName,
      v.contactPerson || "",
      v.materialsPurchased || "",
      v.lastSaleDate || "",
      v.vendorRating ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendors.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const validatePhone = (phone: string) => /^[0-9\-\+\s\(\)]+$/.test(phone);

  const onOpenCreate = () => {
    setCreateForm({
      vendorName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      materialsOfInterest: "",
      paymentTerms: "",
      vendorRating: "",
    });
    setShowCreate(true);
  };

  const onSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.vendorName || !createForm.contactPerson || !validateEmail(createForm.email) || !validatePhone(createForm.phone)) {
      setError("Please provide required fields with valid formats.");
      return;
    }
    setCreateSubmitting(true);
    setError(null);
    try {
      const body = {
        vendorName: createForm.vendorName,
        contactPerson: createForm.contactPerson,
        email: createForm.email,
        phone: createForm.phone,
        address: createForm.address || null,
        city: createForm.city || null,
        state: createForm.state || null,
        postalCode: createForm.postalCode || null,
        country: createForm.country || null,
        materialsOfInterest: createForm.materialsOfInterest || null,
        paymentTerms: createForm.paymentTerms || null,
        vendorRating: createForm.vendorRating ? Number(createForm.vendorRating) : null,
      };
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/Vendors`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to create: ${res.status}`);
      setShowCreate(false);
      await fetchData();
    } catch (e: any) {
      setError(e?.message || "Failed to create vendor");
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vendors</h1>
        <div className="flex gap-3">
          <button onClick={onExportCsv} className="px-3 py-2 border rounded">Export CSV</button>
          <button onClick={onOpenCreate} className="px-3 py-2 bg-blue-600 text-white rounded">Add New Vendor</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm mb-1">Vendor Name</label>
          <input className="w-full border rounded px-2 py-2" value={filterName} onChange={(e) => { setPage(1); setFilterName(e.target.value); }} />
        </div>
        <div>
          <label className="block text-sm mb-1">Material Type</label>
          <input className="w-full border rounded px-2 py-2" value={filterMaterialTypeId} onChange={(e) => { setPage(1); setFilterMaterialTypeId(e.target.value); }} placeholder="Material Type Id" />
        </div>
        <div>
          <label className="block text-sm mb-1">Page Size</label>
          <select className="w-full border rounded px-2 py-2" value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
            {pageSizeOptions.map((ps) => (<option key={ps} value={ps}>{ps}</option>))}
          </select>
        </div>
      </div>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="px-4 py-3">Id</th>
              <th className="px-4 py-3">Vendor Name</th>
              <th className="px-4 py-3">Contact Person</th>
              <th className="px-4 py-3">Materials Purchased</th>
              <th className="px-4 py-3">Last Sale Date</th>
              <th className="px-4 py-3">Vendor Rating</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6" colSpan={7}>Loading...</td></tr>
            ) : error ? (
              <tr><td className="px-4 py-6 text-red-600" colSpan={7}>{error}</td></tr>
            ) : data.length === 0 ? (
              <tr><td className="px-4 py-6" colSpan={7}>No vendors</td></tr>
            ) : data.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-3">{v.id}</td>
                <td className="px-4 py-3">{v.vendorName}</td>
                <td className="px-4 py-3">{v.contactPerson || ""}</td>
                <td className="px-4 py-3">{v.materialsPurchased || ""}</td>
                <td className="px-4 py-3">{v.lastSaleDate ? new Date(v.lastSaleDate).toLocaleDateString() : ""}</td>
                <td className="px-4 py-3">{v.vendorRating ?? ""}</td>
                <td className="px-4 py-3">
                  <Link className="text-blue-600 underline" href={`/downstream/vendor-detail/${v.id}`}>Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div>Total: {total}</div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 border rounded disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <div>Page {page}</div>
          <button className="px-3 py-2 border rounded disabled:opacity-50" disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl rounded p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add New Vendor</h2>
              <button onClick={() => setShowCreate(false)} className="px-3 py-2 border rounded">Close</button>
            </div>
            <form onSubmit={onSubmitCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Vendor Name</label>
                  <input className="w-full border rounded px-2 py-2" value={createForm.vendorName} onChange={(e) => setCreateForm((f) => ({ ...f, vendorName: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Contact Person</label>
                  <input className="w-full border rounded px-2 py-2" value={createForm.contactPerson} onChange={(e) => setCreateForm((f) => ({ ...f, contactPerson: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input type="email" className="w-full border rounded px-2 py-2" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Phone</label>
                  <input className="w-full border rounded px-2 py-2" value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Address</label>
                  <input className="w-full border rounded px-2 py-2" value={createForm.address} onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">City</label>
                  <input className="w-full border rounded px-2 py-2" value={createForm.city} onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">State</label>
                  <input className="w-full border rounded px-2 py-2" value={createForm.state} onChange={(e) => setCreateForm((f) => ({ ...f, state: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Postal Code</label>
                  <input className="w-full border rounded px-2 py-2" value={createForm.postalCode} onChange={(e) => setCreateForm((f) => ({ ...f, postalCode: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Country</label>
                  <input className="w-full border rounded px-2 py-2" value={createForm.country} onChange={(e) => setCreateForm((f) => ({ ...f, country: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Materials of Interest</label>
                  <input className="w-full border rounded px-2 py-2" value={createForm.materialsOfInterest} onChange={(e) => setCreateForm((f) => ({ ...f, materialsOfInterest: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Payment Terms</label>
                  <input className="w-full border rounded px-2 py-2" value={createForm.paymentTerms} onChange={(e) => setCreateForm((f) => ({ ...f, paymentTerms: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Vendor Rating</label>
                  <input type="number" step="any" className="w-full border rounded px-2 py-2" value={createForm.vendorRating} onChange={(e) => setCreateForm((f) => ({ ...f, vendorRating: e.target.value }))} />
                </div>
              </div>
              <div className="text-sm text-gray-500">AI Suggestion: Vendor Performance Scorecard [Placeholder]</div>
              <div className="flex items-center gap-3 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 border rounded">Cancel</button>
                <button disabled={createSubmitting} type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">{createSubmitting ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}
