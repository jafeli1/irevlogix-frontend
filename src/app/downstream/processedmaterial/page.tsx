"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "../../../components/AppLayout";

type MaterialType = {
  id: number;
  name: string;
};

type ProcessingLot = {
  id: number;
  lotNumber: string;
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
  const [processingLots, setProcessingLots] = useState<ProcessingLot[]>([]);

  const [filterMaterialTypeId, setFilterMaterialTypeId] = useState<string>("");
  const [filterQualityGrade, setFilterQualityGrade] = useState("");
  const [filterProcessingLotId, setFilterProcessingLotId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
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
    processedWeight: "",
    weightUnit: "",
    destinationVendor: "",
    expectedSalesPrice: "",
    actualSalesPrice: "",
    saleDate: "",
    notes: "",
    certificationNumber: "",
    isHazardous: false,
    hazardousClassification: "",
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
    const fetchProcessingLots = async () => {
      try {
        const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingLots`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        setProcessingLots(json || []);
      } catch {}
    };
    if (token) {
      fetchMaterialTypes();
      fetchProcessingLots();
    }
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterMaterialTypeId) params.append("materialTypeId", filterMaterialTypeId);
      if (filterQualityGrade) params.append("qualityGrade", filterQualityGrade);
      if (filterProcessingLotId) params.append("processingLotId", filterProcessingLotId);
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
  }, [token, page, pageSize, filterMaterialTypeId, filterQualityGrade, filterProcessingLotId, filterStatus]);

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
      processedWeight: "",
      weightUnit: "",
      destinationVendor: "",
      expectedSalesPrice: "",
      actualSalesPrice: "",
      saleDate: "",
      notes: "",
      certificationNumber: "",
      isHazardous: false,
      hazardousClassification: "",
    });
    setShowCreate(true);
  };

  const validateForm = () => {
    if (!createForm.materialTypeId || !createForm.processingLotId) {
      setValidationError("The required fields must be filled out");
      return false;
    }
    setValidationError(null);
    return true;
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
        materialTypeId: createForm.materialTypeId ? Number(createForm.materialTypeId) : null,
        description: createForm.description || null,
        quantity: createForm.quantity ? Number(createForm.quantity) : null,
        unitOfMeasure: createForm.unitOfMeasure || null,
        qualityGrade: createForm.qualityGrade || null,
        location: createForm.location || null,
        status: createForm.status || null,
        purchaseCostPerUnit: createForm.purchaseCostPerUnit ? Number(createForm.purchaseCostPerUnit) : null,
        processingLotId: createForm.processingLotId ? Number(createForm.processingLotId) : null,
        processedWeight: createForm.processedWeight ? Number(createForm.processedWeight) : null,
        weightUnit: createForm.weightUnit || null,
        destinationVendor: createForm.destinationVendor || null,
        expectedSalesPrice: createForm.expectedSalesPrice ? Number(createForm.expectedSalesPrice) : null,
        actualSalesPrice: createForm.actualSalesPrice ? Number(createForm.actualSalesPrice) : null,
        saleDate: createForm.saleDate || null,
        notes: createForm.notes || null,
        certificationNumber: createForm.certificationNumber || null,
        isHazardous: createForm.isHazardous,
        hazardousClassification: createForm.hazardousClassification || null,
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
          <button onClick={onOpenCreate} className="px-3 py-2 bg-blue-600 text-white rounded">Add New Processed Material</button>
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
          <select
            className="w-full border rounded px-2 py-2"
            value={filterQualityGrade}
            onChange={(e) => { setPage(1); setFilterQualityGrade(e.target.value); }}
          >
            <option value="">All</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Processing Lot</label>
          <select
            className="w-full border rounded px-2 py-2"
            value={filterProcessingLotId}
            onChange={(e) => { setPage(1); setFilterProcessingLotId(e.target.value); }}
          >
            <option value="">All</option>
            {processingLots.map((lot) => (
              <option key={lot.id} value={lot.id}>{lot.lotNumber}</option>
            ))}
          </select>
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
                  <Link className="text-blue-600 underline" href={`/downstream/processedmaterial-detail/${row.id}`}>View Details</Link>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded shadow-lg flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold">Add New Processed Material</h2>
              <button onClick={() => setShowCreate(false)} className="px-3 py-2 border rounded">Close</button>
            </div>
            <form onSubmit={onSubmitCreate} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">AI Suggestion — Material Quality & Pricing Optimization:</span>
                    AI will suggest optimal quality grades, pricing estimates, and vendor recommendations based on material type and processing history.
                    <em> (Feature coming soon)</em>
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Material Type <span className="text-red-500">*</span></label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.materialTypeId}
                    onChange={(e) => {
                      setCreateForm((f) => ({ ...f, materialTypeId: e.target.value }));
                      setValidationError(null);
                    }}
                  >
                    <option value="">Select</option>
                    {materialTypes.map((mt) => (
                      <option key={mt.id} value={mt.id}>{mt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    className="w-full border rounded px-2 py-2 resize-both overflow-auto"
                    rows={3}
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
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.qualityGrade}
                    onChange={(e) => setCreateForm((f) => ({ ...f, qualityGrade: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Location</label>
                  <textarea
                    className="w-full border rounded px-2 py-2 resize-both overflow-auto"
                    rows={2}
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
                  <label className="block text-sm mb-1">Processing Lot <span className="text-red-500">*</span></label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.processingLotId}
                    onChange={(e) => {
                      setCreateForm((f) => ({ ...f, processingLotId: e.target.value }));
                      setValidationError(null);
                    }}
                  >
                    <option value="">Select</option>
                    {processingLots.map((lot) => (
                      <option key={lot.id} value={lot.id}>{lot.lotNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Processed Weight</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.processedWeight}
                    onChange={(e) => setCreateForm((f) => ({ ...f, processedWeight: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Weight Unit</label>
                  <input
                    className="w-full border rounded px-2 py-2"
                    value={createForm.weightUnit}
                    onChange={(e) => setCreateForm((f) => ({ ...f, weightUnit: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Destination Vendor</label>
                  <input
                    className="w-full border rounded px-2 py-2"
                    value={createForm.destinationVendor}
                    onChange={(e) => setCreateForm((f) => ({ ...f, destinationVendor: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Expected Sales Price</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.expectedSalesPrice}
                    onChange={(e) => setCreateForm((f) => ({ ...f, expectedSalesPrice: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Actual Sales Price</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.actualSalesPrice}
                    onChange={(e) => setCreateForm((f) => ({ ...f, actualSalesPrice: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Sale Date</label>
                  <input
                    type="date"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.saleDate}
                    onChange={(e) => setCreateForm((f) => ({ ...f, saleDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Certification Number</label>
                  <input
                    className="w-full border rounded px-2 py-2"
                    value={createForm.certificationNumber}
                    onChange={(e) => setCreateForm((f) => ({ ...f, certificationNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Is Hazardous</label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.isHazardous ? "true" : "false"}
                    onChange={(e) => setCreateForm((f) => ({ ...f, isHazardous: e.target.value === "true" }))}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Hazardous Classification</label>
                  <input
                    className="w-full border rounded px-2 py-2"
                    value={createForm.hazardousClassification}
                    onChange={(e) => setCreateForm((f) => ({ ...f, hazardousClassification: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Notes</label>
                <textarea
                  className="w-full border rounded px-2 py-2 resize-both overflow-auto"
                  rows={4}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              </div>
              {validationError && (
                <div className="px-6 py-2">
                  <p className="text-sm text-red-600">{validationError}</p>
                </div>
              )}
              <div className="flex items-center gap-3 justify-end p-6 border-t border-gray-200 flex-shrink-0">
                <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 border rounded">Cancel</button>
                <button disabled={createSubmitting} type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">{createSubmitting ? "Saving..." : "Add New Processed Material"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}
