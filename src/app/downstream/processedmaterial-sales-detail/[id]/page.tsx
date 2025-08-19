"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppLayout from "../../../../components/AppLayout";

type MaterialType = {
  id: number;
  name: string;
};

type ProcessedMaterial = {
  id: number;
  description: string;
  materialType?: MaterialType | null;
};

type ProcessedMaterialSales = {
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

export default function ProcessedMaterialSalesDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params as { id?: string })?.id;
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
  }, []);

  const [data, setData] = useState<ProcessedMaterialSales | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
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

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialSales/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const json = await res.json();
      setData(json);
      setEditForm({
        vendorId: json?.vendorId?.toString() || "",
        salesQuantity: json?.salesQuantity?.toString() || "",
        agreedPricePerUnit: json?.agreedPricePerUnit?.toString() || "",
        shipmentDate: json?.shipmentDate ? json.shipmentDate.split('T')[0] : "",
        carrier: json?.carrier || "",
        trackingNumber: json?.trackingNumber || "",
        freightCost: json?.freightCost?.toString() || "",
        loadingCost: json?.loadingCost?.toString() || "",
        invoiceId: json?.invoiceId || "",
        invoiceDate: json?.invoiceDate ? json.invoiceDate.split('T')[0] : "",
        dateInvoicePaid: json?.dateInvoicePaid ? json.dateInvoicePaid.split('T')[0] : "",
        invoiceTotal: json?.invoiceTotal?.toString() || "",
        invoiceStatus: json?.invoiceStatus || "",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !id) return;
    fetchDetail();
  }, [token, id]);

  const onSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        vendorId: editForm.vendorId ? Number(editForm.vendorId) : null,
        salesQuantity: editForm.salesQuantity ? Number(editForm.salesQuantity) : null,
        agreedPricePerUnit: editForm.agreedPricePerUnit ? Number(editForm.agreedPricePerUnit) : null,
        shipmentDate: editForm.shipmentDate || null,
        carrier: editForm.carrier || null,
        trackingNumber: editForm.trackingNumber || null,
        freightCost: editForm.freightCost ? Number(editForm.freightCost) : null,
        loadingCost: editForm.loadingCost ? Number(editForm.loadingCost) : null,
        invoiceId: editForm.invoiceId || null,
        invoiceDate: editForm.invoiceDate || null,
        dateInvoicePaid: editForm.dateInvoicePaid || null,
        invoiceTotal: editForm.invoiceTotal ? Number(editForm.invoiceTotal) : null,
        invoiceStatus: editForm.invoiceStatus || null,
      };
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialSales/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      await fetchDetail();
      setEditing(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sales Record Detail</h1>
        <div className="flex items-center gap-3">
          <Link href="/downstream/processedmaterial-sales" className="px-3 py-2 border rounded">
            Back to List
          </Link>
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 py-2 border rounded"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          {editing && (
            <button
              onClick={onSave}
              disabled={saving}
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : !data ? (
        <div>No data</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border rounded p-4">
            <div>
              <div className="text-sm text-gray-500">Processed Material</div>
              <div className="font-medium">{data.processedMaterial?.description || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Material Type</div>
              <div className="font-medium">{data.processedMaterial?.materialType?.name || "N/A"}</div>
            </div>
          </div>

          <div className="bg-white border rounded p-4">
            <div className="text-lg font-semibold mb-4">Sales Information</div>
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Sales Quantity</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full border rounded px-2 py-2"
                      value={editForm.salesQuantity}
                      onChange={(e) => setEditForm((f) => ({ ...f, salesQuantity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Agreed Price Per Unit</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full border rounded px-2 py-2"
                      value={editForm.agreedPricePerUnit}
                      onChange={(e) => setEditForm((f) => ({ ...f, agreedPricePerUnit: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Shipment Date</label>
                    <input
                      type="date"
                      className="w-full border rounded px-2 py-2"
                      value={editForm.shipmentDate}
                      onChange={(e) => setEditForm((f) => ({ ...f, shipmentDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Carrier</label>
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-2"
                      value={editForm.carrier}
                      onChange={(e) => setEditForm((f) => ({ ...f, carrier: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Tracking Number</label>
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-2"
                      value={editForm.trackingNumber}
                      onChange={(e) => setEditForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Freight Cost</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full border rounded px-2 py-2"
                      value={editForm.freightCost}
                      onChange={(e) => setEditForm((f) => ({ ...f, freightCost: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Loading Cost</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full border rounded px-2 py-2"
                      value={editForm.loadingCost}
                      onChange={(e) => setEditForm((f) => ({ ...f, loadingCost: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Sales Quantity</div>
                  <div className="font-medium">{data.salesQuantity?.toFixed(2) || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Agreed Price Per Unit</div>
                  <div className="font-medium">${data.agreedPricePerUnit?.toFixed(2) || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Shipment Date</div>
                  <div className="font-medium">{data.shipmentDate ? new Date(data.shipmentDate).toLocaleDateString() : "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Carrier</div>
                  <div className="font-medium">{data.carrier || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tracking Number</div>
                  <div className="font-medium">{data.trackingNumber || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Freight Cost</div>
                  <div className="font-medium">${data.freightCost?.toFixed(2) || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Loading Cost</div>
                  <div className="font-medium">${data.loadingCost?.toFixed(2) || "N/A"}</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border rounded p-4">
            <div className="text-lg font-semibold mb-4">Invoice Information</div>
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Invoice ID</label>
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-2"
                      value={editForm.invoiceId}
                      onChange={(e) => setEditForm((f) => ({ ...f, invoiceId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Invoice Date</label>
                    <input
                      type="date"
                      className="w-full border rounded px-2 py-2"
                      value={editForm.invoiceDate}
                      onChange={(e) => setEditForm((f) => ({ ...f, invoiceDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Date Invoice Paid</label>
                    <input
                      type="date"
                      className="w-full border rounded px-2 py-2"
                      value={editForm.dateInvoicePaid}
                      onChange={(e) => setEditForm((f) => ({ ...f, dateInvoicePaid: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Invoice Total</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full border rounded px-2 py-2"
                      value={editForm.invoiceTotal}
                      onChange={(e) => setEditForm((f) => ({ ...f, invoiceTotal: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Invoice Status</label>
                    <select
                      className="w-full border rounded px-2 py-2"
                      value={editForm.invoiceStatus}
                      onChange={(e) => setEditForm((f) => ({ ...f, invoiceStatus: e.target.value }))}
                    >
                      <option value="">Select</option>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Invoice ID</div>
                  <div className="font-medium">{data.invoiceId || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Invoice Date</div>
                  <div className="font-medium">{data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString() : "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Date Invoice Paid</div>
                  <div className="font-medium">{data.dateInvoicePaid ? new Date(data.dateInvoicePaid).toLocaleDateString() : "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Invoice Total</div>
                  <div className="font-medium">${data.invoiceTotal?.toFixed(2) || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Invoice Status</div>
                  <div className="font-medium">{data.invoiceStatus || "N/A"}</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border rounded p-4">
            <div className="text-sm text-gray-400">[AI Suggestion Placeholder - insights coming soon]</div>
          </div>
        </>
      )}
      </div>
    </AppLayout>
  );
}
