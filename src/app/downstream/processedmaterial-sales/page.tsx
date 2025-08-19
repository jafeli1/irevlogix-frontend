"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "../../../components/AppLayout";

type MaterialType = {
  id: number;
  name: string;
};

type ProcessedMaterial = {
  id: number;
  description: string;
  materialType?: MaterialType | null;
};

type ProcessedMaterialSalesListItem = {
  id: number;
  processedMaterialId: number;
  processedMaterial?: ProcessedMaterial | null;
  vendorId?: number | null;
  salesQuantity?: number | null;
  agreedPricePerUnit?: number | null;
  shipmentDate?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  freightCost?: number | null;
  loadingCost?: number | null;
  invoiceId?: string | null;
  invoiceDate?: string | null;
  dateInvoicePaid?: string | null;
  invoiceTotal?: number | null;
  invoiceStatus?: string | null;
};

const pageSizeOptions = [10, 25, 50];

export default function ProcessedMaterialSalesPage() {
  const [data, setData] = useState<ProcessedMaterialSalesListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [processedMaterials, setProcessedMaterials] = useState<ProcessedMaterial[]>([]);
  const [createForm, setCreateForm] = useState({
    processedMaterialId: "",
    vendorId: "",
    salesQuantity: "",
    agreedPricePerUnit: "",
    shipmentDate: "",
    carrier: "",
    trackingNumber: "",
    freightCost: "",
    loadingCost: "",
    invoiceId: "",
    invoiceDate: "",
    dateInvoicePaid: "",
    invoiceTotal: "",
    invoiceStatus: "",
  });

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
  }, []);

  const fetchProcessedMaterials = async () => {
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterials?page=1&pageSize=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const json = await res.json();
      setProcessedMaterials(json.items || []);
    } catch (e: unknown) {
      console.error("Failed to load processed materials:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialSales?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const json = await res.json();
      setData(json.items || []);
      setTotalCount(json.totalCount || 0);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
    fetchProcessedMaterials();
  }, [token, page, pageSize]);

  const onExportCsv = async () => {
    try {
      const header = ["Id", "Processed Material", "Material Type", "Sales Quantity", "Agreed Price Per Unit", "Shipment Date", "Carrier", "Tracking Number", "Freight Cost", "Loading Cost", "Invoice ID", "Invoice Date", "Date Invoice Paid", "Invoice Total", "Invoice Status"];
      const rows = data.map((row) => [
        row.id,
        row.processedMaterial?.description || "",
        row.processedMaterial?.materialType?.name || "",
        row.salesQuantity ?? "",
        row.agreedPricePerUnit ?? "",
        row.shipmentDate || "",
        row.carrier || "",
        row.trackingNumber || "",
        row.freightCost ?? "",
        row.loadingCost ?? "",
        row.invoiceId || "",
        row.invoiceDate || "",
        row.dateInvoicePaid || "",
        row.invoiceTotal ?? "",
        row.invoiceStatus || "",
      ]);
      const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "processed-material-sales.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to export";
      setError(msg);
    }
  };

  const onOpenCreate = () => {
    setCreateForm({
      processedMaterialId: "",
      vendorId: "",
      salesQuantity: "",
      agreedPricePerUnit: "",
      shipmentDate: "",
      carrier: "",
      trackingNumber: "",
      freightCost: "",
      loadingCost: "",
      invoiceId: "",
      invoiceDate: "",
      dateInvoicePaid: "",
      invoiceTotal: "",
      invoiceStatus: "",
    });
    setShowCreate(true);
  };

  const onSubmitCreate = async () => {
    try {
      const body = {
        processedMaterialId: createForm.processedMaterialId ? Number(createForm.processedMaterialId) : null,
        vendorId: createForm.vendorId ? Number(createForm.vendorId) : null,
        salesQuantity: createForm.salesQuantity ? Number(createForm.salesQuantity) : null,
        agreedPricePerUnit: createForm.agreedPricePerUnit ? Number(createForm.agreedPricePerUnit) : null,
        shipmentDate: createForm.shipmentDate || null,
        carrier: createForm.carrier || null,
        trackingNumber: createForm.trackingNumber || null,
        freightCost: createForm.freightCost ? Number(createForm.freightCost) : null,
        loadingCost: createForm.loadingCost ? Number(createForm.loadingCost) : null,
        invoiceId: createForm.invoiceId || null,
        invoiceDate: createForm.invoiceDate || null,
        dateInvoicePaid: createForm.dateInvoicePaid || null,
        invoiceTotal: createForm.invoiceTotal ? Number(createForm.invoiceTotal) : null,
        invoiceStatus: createForm.invoiceStatus || null,
      };
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialSales`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to create: ${res.status}`);
      setShowCreate(false);
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create";
      setError(msg);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Processed Material Sales</h1>
        <div className="flex gap-3">
          <button onClick={onExportCsv} className="px-3 py-2 border rounded">Export CSV</button>
          <button onClick={onOpenCreate} className="px-3 py-2 bg-blue-600 text-white rounded">Create New Sales Record</button>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="bg-white border rounded overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Processed Material</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Sales Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Agreed Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{item.id}</td>
                    <td className="px-4 py-3 text-sm">{item.processedMaterial?.description || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">{item.salesQuantity?.toFixed(2) || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">${item.agreedPricePerUnit?.toFixed(2) || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">{item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString() : "N/A"}</td>
                    <td className="px-4 py-3 text-sm">${item.invoiceTotal?.toFixed(2) || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">{item.invoiceStatus || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/downstream/processedmaterial-sales-detail/${item.id}`} className="text-blue-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show</span>
              <select
                className="border rounded px-2 py-1"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">entries</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages} ({totalCount} total)
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New Sales Record</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Processed Material</label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.processedMaterialId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, processedMaterialId: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {processedMaterials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.description} ({material.materialType?.name || "Unknown Type"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Sales Quantity</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.salesQuantity}
                    onChange={(e) => setCreateForm((f) => ({ ...f, salesQuantity: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Agreed Price Per Unit</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.agreedPricePerUnit}
                    onChange={(e) => setCreateForm((f) => ({ ...f, agreedPricePerUnit: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Shipment Date</label>
                  <input
                    type="date"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.shipmentDate}
                    onChange={(e) => setCreateForm((f) => ({ ...f, shipmentDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Carrier</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.carrier}
                    onChange={(e) => setCreateForm((f) => ({ ...f, carrier: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Tracking Number</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.trackingNumber}
                    onChange={(e) => setCreateForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Freight Cost</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.freightCost}
                    onChange={(e) => setCreateForm((f) => ({ ...f, freightCost: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Loading Cost</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.loadingCost}
                    onChange={(e) => setCreateForm((f) => ({ ...f, loadingCost: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Invoice ID</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.invoiceId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, invoiceId: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Invoice Date</label>
                  <input
                    type="date"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.invoiceDate}
                    onChange={(e) => setCreateForm((f) => ({ ...f, invoiceDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Date Invoice Paid</label>
                  <input
                    type="date"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.dateInvoicePaid}
                    onChange={(e) => setCreateForm((f) => ({ ...f, dateInvoicePaid: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Invoice Total</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.invoiceTotal}
                    onChange={(e) => setCreateForm((f) => ({ ...f, invoiceTotal: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Invoice Status</label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.invoiceStatus}
                    onChange={(e) => setCreateForm((f) => ({ ...f, invoiceStatus: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button onClick={() => setShowCreate(false)} className="px-3 py-2 border rounded">Cancel</button>
                <button onClick={onSubmitCreate} className="px-3 py-2 bg-blue-600 text-white rounded">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}
