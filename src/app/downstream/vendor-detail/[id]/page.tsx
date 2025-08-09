"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "../../../../components/AppLayout";

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
};

export default function VendorDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params as { id?: string })?.id;

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
  }, []);

  const [data, setData] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sales" | "contracts" | "communications" | "financials" | "documents">("sales");

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/Vendors/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = await res.json();
      setData(json);
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

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vendor Detail</h1>
        <div className="text-sm text-gray-500">Vendor Performance Scorecard [Placeholder]</div>
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
              <div className="text-sm text-gray-500">Vendor Name</div>
              <div className="font-medium">{data.vendorName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Contact</div>
              <div className="font-medium">{data.contactPerson || ""}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium">{data.email || ""}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium">{data.phone || ""}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Address</div>
              <div className="font-medium">
                {[data.address, data.city, data.state, data.postalCode, data.country].filter(Boolean).join(", ")}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Vendor Rating</div>
              <div className="font-medium">{data.vendorRating ?? ""}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b">
            <button className={`px-4 py-2 ${activeTab === "sales" ? "border-b-2 border-blue-600" : ""}`} onClick={() => setActiveTab("sales")}>Sales History</button>
            <button className={`px-4 py-2 ${activeTab === "contracts" ? "border-b-2 border-blue-600" : ""}`} onClick={() => setActiveTab("contracts")}>Contracts &amp; Pricing</button>
            <button className={`px-4 py-2 ${activeTab === "communications" ? "border-b-2 border-blue-600" : ""}`} onClick={() => setActiveTab("communications")}>Communications Log</button>
            <button className={`px-4 py-2 ${activeTab === "financials" ? "border-b-2 border-blue-600" : ""}`} onClick={() => setActiveTab("financials")}>Financial Summary</button>
            <button className={`px-4 py-2 ${activeTab === "documents" ? "border-b-2 border-blue-600" : ""}`} onClick={() => setActiveTab("documents")}>Documents</button>
          </div>

          {activeTab === "sales" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Sales History</div>
                <div className="text-gray-500">No sales yet.</div>
              </div>
            </div>
          )}

          {activeTab === "contracts" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Contracts &amp; Pricing</div>
                <div className="text-gray-500">Upload and pricing management coming soon.</div>
              </div>
            </div>
          )}

          {activeTab === "communications" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Communications Log</div>
                <div className="text-gray-500">No communications logged.</div>
              </div>
            </div>
          )}

          {activeTab === "financials" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Financial Summary</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Total Revenue</div>
                    <div className="font-medium">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Average Days to Pay</div>
                    <div className="font-medium">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Outstanding Invoices</div>
                    <div className="font-medium">-</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Documents</div>
                <div className="text-gray-500">Upload and listing coming soon.</div>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </AppLayout>
  );
}
