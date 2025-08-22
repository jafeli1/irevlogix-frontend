"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "../../../components/AppLayout";

type Vendor = {
  id: number;
  vendorName: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  materialsOfInterest?: string | null;
  paymentTerms?: string | null;
  vendorRating?: number | null;
  vendorTier?: string | null;
  upstreamTierVendor?: number | null;
  materialsPurchased?: string | null;
  lastSaleDate?: string | null;
};

type MaterialType = {
  id: number;
  name: string;
  description: string;
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

  const [vendors, setVendors] = useState<{id: number, vendorName: string}[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);

  const [filterName, setFilterName] = useState("");
  const [filterMaterialTypeId, setFilterMaterialTypeId] = useState<string>("");

  const [showCreate, setShowCreate] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
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
    vendorTier: "",
    upstreamTierVendor: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterName) params.append("vendorId", filterName);
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch(`https://irevlogix-backend.onrender.com/api/Vendors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        setVendors(json || []);
      } catch {}
    };
    const fetchMaterialTypes = async () => {
      try {
        const res = await fetch(`https://irevlogix-backend.onrender.com/api/MaterialTypes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        setMaterialTypes(json || []);
      } catch {}
    };
    if (token) {
      fetchVendors();
      fetchMaterialTypes();
    }
  }, [token]);

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
      vendorTier: "",
      upstreamTierVendor: "",
    });
    setValidationErrors({});
    setShowCreate(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!createForm.vendorName.trim()) {
      errors.vendorName = 'Vendor Name is required';
    }
    if (!createForm.contactPerson.trim()) {
      errors.contactPerson = 'Contact Person is required';
    }
    if (!createForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(createForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!createForm.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!validatePhone(createForm.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    if (!createForm.vendorTier.trim()) {
      errors.vendorTier = 'Vendor Tier is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
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
        vendorTier: createForm.vendorTier,
        upstreamTierVendor: createForm.upstreamTierVendor ? Number(createForm.upstreamTierVendor) : null,
      };
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/Vendors`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to create: ${res.status}`);
      setShowCreate(false);
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create vendor";
      setError(msg);
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
          <select 
            className="w-full border rounded px-2 py-2" 
            value={filterName} 
            onChange={(e) => { setPage(1); setFilterName(e.target.value); }}
          >
            <option value="">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>{vendor.vendorName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Material Type</label>
          <select 
            className="w-full border rounded px-2 py-2" 
            value={filterMaterialTypeId} 
            onChange={(e) => { setPage(1); setFilterMaterialTypeId(e.target.value); }}
          >
            <option value="">All Material Types</option>
            {materialTypes.map((mt) => (
              <option key={mt.id} value={mt.id}>{mt.description}</option>
            ))}
          </select>
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
                  <Link className="text-blue-600 underline" href={`/downstream/vendor-detail/${v.id}`}>View Details</Link>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add New Vendor</h2>
              <button onClick={() => setShowCreate(false)} className="px-3 py-2 border rounded">Close</button>
            </div>
            <form onSubmit={onSubmitCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Vendor Name <span className="text-red-500">*</span></label>
                  <input 
                    className="w-full border rounded px-2 py-2" 
                    value={createForm.vendorName} 
                    onChange={(e) => {
                      setCreateForm((f) => ({ ...f, vendorName: e.target.value }));
                      if (validationErrors.vendorName) {
                        setValidationErrors(prev => ({ ...prev, vendorName: '' }));
                      }
                    }} 
                  />
                  {validationErrors.vendorName && (
                    <p className="text-sm text-red-600">{validationErrors.vendorName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Contact Person <span className="text-red-500">*</span></label>
                  <input 
                    className="w-full border rounded px-2 py-2" 
                    value={createForm.contactPerson} 
                    onChange={(e) => {
                      setCreateForm((f) => ({ ...f, contactPerson: e.target.value }));
                      if (validationErrors.contactPerson) {
                        setValidationErrors(prev => ({ ...prev, contactPerson: '' }));
                      }
                    }} 
                  />
                  {validationErrors.contactPerson && (
                    <p className="text-sm text-red-600">{validationErrors.contactPerson}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    className="w-full border rounded px-2 py-2" 
                    value={createForm.email} 
                    onChange={(e) => {
                      setCreateForm((f) => ({ ...f, email: e.target.value }));
                      if (validationErrors.email) {
                        setValidationErrors(prev => ({ ...prev, email: '' }));
                      }
                    }} 
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Phone <span className="text-red-500">*</span></label>
                  <input 
                    className="w-full border rounded px-2 py-2" 
                    value={createForm.phone} 
                    onChange={(e) => {
                      setCreateForm((f) => ({ ...f, phone: e.target.value }));
                      if (validationErrors.phone) {
                        setValidationErrors(prev => ({ ...prev, phone: '' }));
                      }
                    }} 
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-600">{validationErrors.phone}</p>
                  )}
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
                  <textarea 
                    className="w-full border rounded px-2 py-2 h-20 overflow-y-auto resize-none" 
                    value={createForm.materialsOfInterest} 
                    onChange={(e) => setCreateForm((f) => ({ ...f, materialsOfInterest: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Payment Terms</label>
                  <textarea 
                    className="w-full border rounded px-2 py-2 h-20 overflow-y-auto resize-none" 
                    value={createForm.paymentTerms} 
                    onChange={(e) => setCreateForm((f) => ({ ...f, paymentTerms: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Vendor Rating</label>
                  <input type="number" step="any" className="w-full border rounded px-2 py-2" value={createForm.vendorRating} onChange={(e) => setCreateForm((f) => ({ ...f, vendorRating: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Vendor Tier <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full border rounded px-2 py-2" 
                    value={createForm.vendorTier} 
                    onChange={(e) => {
                      setCreateForm((f) => ({ ...f, vendorTier: e.target.value }));
                      if (validationErrors.vendorTier) {
                        setValidationErrors(prev => ({ ...prev, vendorTier: '' }));
                      }
                    }}
                  >
                    <option value="">Select Tier</option>
                    <option value="Tier 1">Tier 1</option>
                    <option value="Tier 2">Tier 2</option>
                    <option value="Tier 3">Tier 3</option>
                    <option value="Tier 4">Tier 4</option>
                    <option value="Tier 5">Tier 5</option>
                  </select>
                  {validationErrors.vendorTier && (
                    <p className="text-sm text-red-600">{validationErrors.vendorTier}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Upstream Tier Vendor</label>
                  <select 
                    className="w-full border rounded px-2 py-2" 
                    value={createForm.upstreamTierVendor} 
                    onChange={(e) => setCreateForm((f) => ({ ...f, upstreamTierVendor: e.target.value }))}
                  >
                    <option value="">Select Upstream Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>{vendor.vendorName}</option>
                    ))}
                  </select>
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
