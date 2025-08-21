"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type MaterialType = {
  id: number;
  name: string;
  description: string;
};

type ProcessedMaterialSalesListItem = {
  id: number;
  processedMaterialId: number;
  processedMaterial?: { id: number; description: string; materialType?: MaterialType | null } | null;
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

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params as { id?: string })?.id;

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
  }, []);

  const [data, setData] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sales" | "contracts" | "communications" | "financials" | "documents">("sales");

  const [salesData, setSalesData] = useState<ProcessedMaterialSalesListItem[]>([]);
  const [filteredSalesData, setFilteredSalesData] = useState<ProcessedMaterialSalesListItem[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterMaterialTypeId, setFilterMaterialTypeId] = useState("");
  
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize, setSalesPageSize] = useState(25);
  
  const pageSizeOptions = [10, 25, 50];

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

  const fetchSalesData = async () => {
    setSalesLoading(true);
    setSalesError(null);
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessedMaterialSales?page=1&pageSize=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = await res.json();
      setSalesData(json.items || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load sales data";
      setSalesError(msg);
    } finally {
      setSalesLoading(false);
    }
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

  useEffect(() => {
    if (!salesData.length || !id) return;
    
    let filtered = salesData.filter(sale => sale.vendorId === parseInt(id));
    
    if (startDate) {
      filtered = filtered.filter(sale => {
        const saleDate = sale.invoiceDate ? new Date(sale.invoiceDate) : null;
        return saleDate && saleDate >= new Date(startDate);
      });
    }
    
    if (endDate) {
      filtered = filtered.filter(sale => {
        const saleDate = sale.invoiceDate ? new Date(sale.invoiceDate) : null;
        return saleDate && saleDate <= new Date(endDate);
      });
    }
    
    if (filterMaterialTypeId) {
      filtered = filtered.filter(sale => 
        sale.processedMaterial?.materialType?.id === parseInt(filterMaterialTypeId)
      );
    }
    
    setFilteredSalesData(filtered);
    setSalesPage(1);
  }, [salesData, id, startDate, endDate, filterMaterialTypeId]);

  useEffect(() => {
    if (!token || !id) return;
    fetchDetail();
    fetchSalesData();
    fetchMaterialTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterMaterialTypeId("");
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vendor Detail</h1>
        <button
          onClick={() => router.push('/downstream/vendors')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Vendors
        </button>
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
              {/* Filters */}
              <div className="bg-white border rounded p-4">
                <div className="text-lg font-semibold mb-3">Sales History Filters</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filterMaterialTypeId}
                      onChange={(e) => setFilterMaterialTypeId(e.target.value)}
                    >
                      <option value="">All Material Types</option>
                      {materialTypes.map((mt) => (
                        <option key={mt.id} value={mt.id}>{mt.description}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Sales History Table */}
              <div className="bg-white border rounded">
                <div className="text-lg font-semibold p-4 border-b">Sales History</div>
                
                {salesLoading ? (
                  <div className="p-4">Loading sales data...</div>
                ) : salesError ? (
                  <div className="p-4 text-red-600">{salesError}</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Processed Material</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Material Type</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Sales Quantity</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Agreed Price/Unit</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Shipment Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Carrier</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tracking Number</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Freight Cost</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Loading Cost</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice ID</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date Invoice Paid</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice Total</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredSalesData
                            .slice((salesPage - 1) * salesPageSize, salesPage * salesPageSize)
                            .map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">{item.id}</td>
                              <td className="px-4 py-3 text-sm">{item.processedMaterial?.description || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.processedMaterial?.materialType?.name || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.salesQuantity?.toFixed(2) || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">${item.agreedPricePerUnit?.toFixed(2) || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.shipmentDate ? new Date(item.shipmentDate).toLocaleDateString() : "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.carrier || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.trackingNumber || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">${item.freightCost?.toFixed(2) || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">${item.loadingCost?.toFixed(2) || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.invoiceId || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString() : "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.dateInvoicePaid ? new Date(item.dateInvoicePaid).toLocaleDateString() : "N/A"}</td>
                              <td className="px-4 py-3 text-sm">${item.invoiceTotal?.toFixed(2) || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{item.invoiceStatus || "N/A"}</td>
                            </tr>
                          ))}
                          {filteredSalesData.length === 0 && (
                            <tr>
                              <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                                No sales history found for this vendor.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Show</span>
                        <select
                          className="border rounded px-2 py-1"
                          value={salesPageSize}
                          onChange={(e) => {
                            setSalesPageSize(Number(e.target.value));
                            setSalesPage(1);
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
                          onClick={() => setSalesPage(Math.max(1, salesPage - 1))}
                          disabled={salesPage <= 1}
                          className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-500">
                          Page {salesPage} of {Math.ceil(filteredSalesData.length / salesPageSize)} ({filteredSalesData.length} total)
                        </span>
                        <button
                          onClick={() => setSalesPage(Math.min(Math.ceil(filteredSalesData.length / salesPageSize), salesPage + 1))}
                          disabled={salesPage >= Math.ceil(filteredSalesData.length / salesPageSize)}
                          className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
