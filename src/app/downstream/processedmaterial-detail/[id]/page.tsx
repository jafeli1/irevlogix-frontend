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
  materialType?: MaterialType | null;
  description?: string | null;
  quantity?: number | null;
  unitOfMeasure?: string | null;
  qualityGrade?: string | null;
  location?: string | null;
  status?: string | null;
  processingLotId?: number | null;
};

export default function ProcessedMaterialDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params as { id?: string })?.id;
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
  }, []);

  const [data, setData] = useState<ProcessedMaterial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sales" | "qc" | "documents" | "financials">("sales");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterials/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const json = await res.json();
      setData(json);
      setStatus(json?.status || "");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const onSaveStatus = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterials/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      await fetchDetail();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onSaveFinancials = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        expectedSalesPrice: financialForm.expectedSalesPrice ? Number(financialForm.expectedSalesPrice) : null,
        actualSalesPrice: financialForm.actualSalesPrice ? Number(financialForm.actualSalesPrice) : null,
        saleDate: financialForm.saleDate || null,
        invoiceDate: financialForm.invoiceDate || null,
        dateInvoicePaid: financialForm.dateInvoicePaid || null,
        invoiceTotal: financialForm.invoiceTotal ? Number(financialForm.invoiceTotal) : null,
        invoiceStatus: financialForm.invoiceStatus || null,
      };
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterials/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      await fetchDetail();
      setEditingFinancials(false);
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
        <h1 className="text-2xl font-semibold">Processed Material Detail</h1>
        <div className="flex items-center gap-3">
          <select className="border rounded px-2 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Select Status</option>
            <option value="Available">Available</option>
            <option value="On Hold">On Hold</option>
            <option value="Reserved">Reserved</option>
            <option value="Sold">Sold</option>
          </select>
          <button onClick={onSaveStatus} className="px-3 py-2 bg-blue-600 text-white rounded" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border rounded p-4">
            <div>
              <div className="text-sm text-gray-500">Material Type</div>
              <div className="font-medium">{data.materialType?.name || ""}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Quantity</div>
              <div className="font-medium">{data.quantity ?? ""} {data.unitOfMeasure || ""}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Quality Grade</div>
              <div className="font-medium">{data.qualityGrade || ""}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Current Location</div>
              <div className="font-medium">{data.location || ""}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="font-medium">{data.status || ""}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Source Lot</div>
              {data.processingLotId ? (
                <Link className="text-blue-600 underline" href={`/processing/lot-detail/${data.processingLotId}`}>Lot #{data.processingLotId}</Link>
              ) : (
                <div className="font-medium">N/A</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 border-b">
            <button
              className={`px-4 py-2 ${activeTab === "sales" ? "border-b-2 border-blue-600" : ""}`}
              onClick={() => setActiveTab("sales")}
            >
              Sales &amp; Shipments
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "qc" ? "border-b-2 border-blue-600" : ""}`}
              onClick={() => setActiveTab("qc")}
            >
              Quality Control &amp; Testing
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "documents" ? "border-b-2 border-blue-600" : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              Documents
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "financials" ? "border-b-2 border-blue-600" : ""}`}
              onClick={() => setActiveTab("financials")}
            >
              Financials
            </button>
          </div>

          {activeTab === "sales" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">Sales Records</div>
                  <Link href="/downstream/processedmaterial-sales" className="px-3 py-2 bg-blue-600 text-white rounded">
                    Manage Sales Records
                  </Link>
                </div>
                <div className="text-gray-500">View and manage sales records in the dedicated sales section.</div>
              </div>
            </div>
          )}

          {activeTab === "qc" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Add New Test Result</div>
                <div className="text-gray-500">Form coming soon.</div>
              </div>
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Test Results</div>
                <div className="text-gray-500">No test results.</div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Upload Documents</div>
                <div className="text-gray-500">Upload feature coming soon.</div>
              </div>
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Documents</div>
                <div className="text-gray-500">No documents uploaded.</div>
              </div>
            </div>
          )}

          {activeTab === "financials" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Financial Summary</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Total Purchase/Processing Cost</div>
                    <div className="font-medium">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Revenue</div>
                    <div className="font-medium">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Net Profit/Loss</div>
                    <div className="font-medium">-</div>
                  </div>
                </div>
              </div>
              <div className="bg-white border rounded p-4">
                <div className="text-sm text-gray-400">[AI Suggestion Placeholder - insights coming soon]</div>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </AppLayout>
  );
}
