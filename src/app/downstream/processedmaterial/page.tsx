"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "../../../components/AppLayout";

type MaterialType = {
  id: number;
  name: string;
};

type ProcessedMaterialListItem = {
  id: number;
  materialType?: MaterialType | null;
  quantity?: number | null;
  unitOfMeasure?: string | null;
  qualityGrade?: string | null;
  location?: string | null;
  status?: string | null;
  processingLotId?: number | null;
};


const pageSizeOptions = [10, 25, 50];

export default function ProcessedMaterialsPage() {
  const [data, setData] = useState<ProcessedMaterialListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);

  const [filterMaterialTypeId, setFilterMaterialTypeId] = useState<string>("");
  const [filterQualityGrade, setFilterQualityGrade] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    materialTypeId: "",
    description: "",
    quantity: "",
    unitOfMeasure: "",
    qualityGrade: "",
    location: "",
    status: "",
    purchaseCostPerUnit: "",
    processingLotId: "",
  });

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
  }, []);

  useEffect(() => {
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
    if (token) fetchMaterialTypes();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterMaterialTypeId) params.append("materialTypeId", filterMaterialTypeId);
      if (filterQualityGrade) params.append("qualityGrade", filterQualityGrade);
      if (filterLocation) params.append("location", filterLocation);
      if (filterStatus) params.append("status", filterStatus);
      params.append("page", String(page));
      params.append("pageSize", String(pageSize));

      const url = `https://irevlogix-backend.onrender.com/api/ProcessedMaterials?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to load: ${res.status}`);
      }
      const totalHeader = res.headers.get("X-Total-Count");
      if (totalHeader) setTotal(parseInt(totalHeader, 10));
      const json: ProcessedMaterialListItem[] = await res.json();
      setData(json);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, pageSize, filterMaterialTypeId, filterQualityGrade, filterLocation, filterStatus]);

  const onExportCsv = async () => {
    try {
      const header = ["Id", "Material Type", "Quantity", "UoM", "Quality Grade", "Location", "Availability Status", "Processing Lot Id"];
      const rows = data.map((row) => [
        row.id,
        row.materialType?.name || "",
        row.quantity ?? "",
        row.unitOfMeasure || "",
        row.qualityGrade || "",
        row.location || "",
        row.status || "",
        row.processingLotId ?? "",
      ]);
      const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "processed_materials.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

  const onOpenCreate = () => {
    setCreateForm({
      materialTypeId: "",
      description: "",
      quantity: "",
      unitOfMeasure: "",
      qualityGrade: "",
      location: "",
      status: "",
      purchaseCostPerUnit: "",
      processingLotId: "",
    });
    setShowCreate(true);
  };

  const onSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setError(null);
    try {
      const body = {
        materialTypeId: createForm.materialTypeId ? Number(createForm.materialTypeId) : null,
        description: createForm.description || null,
        quantity: createForm.quantity ? Number(createForm.quantity) : null,
        unitOfMeasure: createForm.unitOfMeasure || null,
        qualityGrade: createForm.qualityGrade || null,
        location: createForm.location || null,
        status: createForm.status || null,
        purchaseCostPerUnit: createForm.purchaseCostPerUnit ? Number(createForm.purchaseCostPerUnit) : null,
        processingLotId: createForm.processingLotId ? Number(createForm.processingLotId) : null,
      };
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterials`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`Failed to create: ${res.status}`);
      }
      setShowCreate(false);
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create record";
      setError(msg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Processed Materials</h1>
        <div className="flex gap-3">
          <button onClick={onExportCsv} className="px-3 py-2 border rounded">Export CSV</button>
          <button onClick={onOpenCreate} className="px-3 py-2 bg-blue-600 text-white rounded">Create New Inventory Record</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm mb-1">Material Type</label>
          <select
            className="w-full border rounded px-2 py-2"
            value={filterMaterialTypeId}
            onChange={(e) => { setPage(1); setFilterMaterialTypeId(e.target.value); }}
          >
            <option value="">All</option>
            {materialTypes.map((mt) => (
              <option key={mt.id} value={mt.id}>{mt.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Quality Grade</label>
          <input
            className="w-full border rounded px-2 py-2"
            value={filterQualityGrade}
            onChange={(e) => { setPage(1); setFilterQualityGrade(e.target.value); }}
            placeholder="e.g. A, B"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Location</label>
          <input
            className="w-full border rounded px-2 py-2"
            value={filterLocation}
            onChange={(e) => { setPage(1); setFilterLocation(e.target.value); }}
            placeholder="Location"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Availability Status</label>
          <select
            className="w-full border rounded px-2 py-2"
            value={filterStatus}
            onChange={(e) => { setPage(1); setFilterStatus(e.target.value); }}
          >
            <option value="">All</option>
            <option value="Available">Available</option>
            <option value="On Hold">On Hold</option>
            <option value="Reserved">Reserved</option>
            <option value="Sold">Sold</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Page Size</label>
          <select
            className="w-full border rounded px-2 py-2"
            value={pageSize}
            onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
          >
            {pageSizeOptions.map((ps) => (<option key={ps} value={ps}>{ps}</option>))}
          </select>
        </div>
      </div>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="px-4 py-3">Id</th>
              <th className="px-4 py-3">Material Type</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">UoM</th>
              <th className="px-4 py-3">Quality Grade</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Availability Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6" colSpan={8}>Loading...</td></tr>
            ) : error ? (
              <tr><td className="px-4 py-6 text-red-600" colSpan={8}>{error}</td></tr>
            ) : data.length === 0 ? (
              <tr><td className="px-4 py-6" colSpan={8}>No records</td></tr>
            ) : data.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3">{row.id}</td>
                <td className="px-4 py-3">{row.materialType?.name || ""}</td>
                <td className="px-4 py-3">{row.quantity ?? ""}</td>
                <td className="px-4 py-3">{row.unitOfMeasure || ""}</td>
                <td className="px-4 py-3">{row.qualityGrade || ""}</td>
                <td className="px-4 py-3">{row.location || ""}</td>
                <td className="px-4 py-3">{row.status || ""}</td>
                <td className="px-4 py-3">
                  <Link className="text-blue-600 underline" href={`/downstream/processedmaterial-detail/${row.id}`}>Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div>Total: {total}</div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 border rounded disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <div>Page {page}</div>
          <button
            className="px-3 py-2 border rounded disabled:opacity-50"
            disabled={page * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl rounded p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create New Inventory Record</h2>
              <button onClick={() => setShowCreate(false)} className="px-3 py-2 border rounded">Close</button>
            </div>
            <form onSubmit={onSubmitCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Material Type</label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.materialTypeId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, materialTypeId: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {materialTypes.map((mt) => (
                      <option key={mt.id} value={mt.id}>{mt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <input
                    className="w-full border rounded px-2 py-2"
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.quantity}
                    onChange={(e) => setCreateForm((f) => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">UoM</label>
                  <input
                    className="w-full border rounded px-2 py-2"
                    value={createForm.unitOfMeasure}
                    onChange={(e) => setCreateForm((f) => ({ ...f, unitOfMeasure: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Quality Grade</label>
                  <input
                    className="w-full border rounded px-2 py-2"
                    value={createForm.qualityGrade}
                    onChange={(e) => setCreateForm((f) => ({ ...f, qualityGrade: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Location</label>
                  <input
                    className="w-full border rounded px-2 py-2"
                    value={createForm.location}
                    onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Availability Status</label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.status}
                    onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="Available">Available</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Purchase Cost Per Unit</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.purchaseCostPerUnit}
                    onChange={(e) => setCreateForm((f) => ({ ...f, purchaseCostPerUnit: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Associated Processing Lot Id</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.processingLotId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, processingLotId: e.target.value }))}
                  />
                </div>
              </div>
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
