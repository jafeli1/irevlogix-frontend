"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "../../../../components/AppLayout";

type TabKey = "profile" | "data" | "coc" | "recycling" | "documents";

type AssetDocument = {
  id: number;
  assetId: number;
  fileName: string;
  filePath: string;
  contentType: string;
  description?: string | null;
  dateCreated?: string;
};

type Asset = {
  id: number;
  assetID?: string;
  assetId?: string;
  serialNumber?: string;
  assetCategory?: { name?: string };
  manufacturer?: string;
  model?: string;
  currentStatus?: { statusName?: string };
  estimatedResaleValue?: number;
  actualSalePrice?: number;
  costOfRecovery?: number;
  reuseDisposition?: boolean;
  resaleDisposition?: boolean;
  buyer?: string;
  recipient?: string;
  resalePlatform?: string;
  purpose?: string;
};


export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = Array.isArray(params?.assetId) ? params.assetId[0] : (params?.assetId as string | undefined);

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  const [asset, setAsset] = useState<Asset | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchAsset() {
      if (!assetId) return;
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/assets/${assetId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch asset");
        const data: Asset = await res.json();
        if (!ignore) setAsset(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load asset";
        if (!ignore) setError(msg);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    async function fetchDocuments() {
      if (!assetId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/assets/${assetId}/documents`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (res.ok) {
          const data: AssetDocument[] = await res.json();
          setDocuments(data);
        }
      } catch {}
    }
    fetchDocuments();

    fetchAsset();
    return () => {
      ignore = true;
    };
  }, [assetId, router]);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Asset Detail</h1>
        <p className="mt-2 text-gray-600">View and manage asset lifecycle information</p>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700">{error}</div>}
      {loading && <div className="mb-4 rounded-md bg-gray-50 p-3 text-gray-700">Loading...</div>}

      <div className="mb-6 rounded-md border bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm text-gray-500">Asset ID</div>
            <div className="font-medium text-gray-900">{asset?.assetID || asset?.assetId || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Serial Number</div>
            <div className="font-medium text-gray-900">{asset?.serialNumber || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Category</div>
            <div className="font-medium text-gray-900">{asset?.assetCategory?.name || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Manufacturer</div>
            <div className="font-medium text-gray-900">{asset?.manufacturer || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Model</div>
            <div className="font-medium text-gray-900">{asset?.model || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Current Status</div>
            <div className="font-medium text-gray-900">{asset?.currentStatus?.statusName || "-"}</div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setActiveTab("profile")} className={`px-4 py-2 rounded-md border ${activeTab === "profile" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-50"}`}>Asset Profile</button>
        <button onClick={() => setActiveTab("data")} className={`px-4 py-2 rounded-md border ${activeTab === "data" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-50"}`}>Data Destruction</button>
        <button onClick={() => setActiveTab("coc")} className={`px-4 py-2 rounded-md border ${activeTab === "coc" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-50"}`}>Chain of Custody</button>
        <button onClick={() => setActiveTab("recycling")} className={`px-4 py-2 rounded-md border ${activeTab === "recycling" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-50"}`}>Certified Recycling</button>
        <button onClick={() => setActiveTab("documents")} className={`px-4 py-2 rounded-md border ${activeTab === "documents" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-50"}`}>Documents</button>
      </div>

      <div className="rounded-md border bg-white p-4">
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Resale Value ($)</label>
                <input type="number" className="mt-1 w-full rounded-md border px-3 py-2" defaultValue={asset?.estimatedResaleValue || ""} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Actual Sale Price ($)</label>
                <input type="number" className="mt-1 w-full rounded-md border px-3 py-2" defaultValue={asset?.actualSalePrice || ""} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost Of Recovery ($)</label>
                <input type="number" className="mt-1 w-full rounded-md border px-3 py-2" defaultValue={asset?.costOfRecovery || ""} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Profit / Loss ($)</label>
                <input type="number" className="mt-1 w-full rounded-md border px-3 py-2" readOnly value={((asset?.actualSalePrice || 0) - (asset?.costOfRecovery || 0)) || 0} />
              </div>
            </div>

            <div className="rounded-md border bg-gray-50 p-3">
              <div className="text-sm font-medium text-gray-800">Reuse / Resale</div>
              <div className="mt-2 grid gap-4 md:grid-cols-3">
                <label className="inline-flex items-center gap-2 text-gray-700"><input type="checkbox" className="h-4 w-4" defaultChecked={!!asset?.reuseDisposition} />Reuse Disposition</label>
                <label className="inline-flex items-center gap-2 text-gray-700"><input type="checkbox" className="h-4 w-4" defaultChecked={!!asset?.resaleDisposition} />Resale Disposition</label>
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Buyer / Recipient</label>
                  <input className="mt-1 w-full rounded-md border px-3 py-2" defaultValue={asset?.buyer || asset?.recipient || ""} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Platform / Purpose</label>
                  <input className="mt-1 w-full rounded-md border px-3 py-2" defaultValue={asset?.resalePlatform || asset?.purpose || ""} />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        )}

        {activeTab === "data" && (
          <div className="space-y-4">
            <div className="rounded-md border bg-yellow-50 p-3 text-sm text-yellow-800">
              Compliance placeholder: If asset is data bearing and sanitization status is not completed, show alert.
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Method</label>
                <select className="mt-1 w-full rounded-md border px-3 py-2">
                  <option>DoD 5220.22-M</option>
                  <option>NIST 800-88</option>
                  <option>Physical Destruction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select className="mt-1 w-full rounded-md border px-3 py-2">
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data Destruction Cost ($)</label>
                <input type="number" className="mt-1 w-full rounded-md border px-3 py-2" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Certificate of Destruction</label>
                <input type="file" className="mt-1 w-full rounded-md border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Evidence Photo/Video</label>
                <input type="file" className="mt-1 w-full rounded-md border px-3 py-2" />
              </div>
            </div>

            <div className="flex justify-end">
              <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        )}

        {activeTab === "coc" && (
          <div className="space-y-4">
            <div className="rounded-md border bg-gray-50 p-3">
              <div className="text-sm font-medium text-gray-800 mb-2">Add Chain of Custody Record</div>
              <div className="grid gap-4 md:grid-cols-4">
                <input className="rounded-md border px-3 py-2" placeholder="Location" />
                <input className="rounded-md border px-3 py-2" placeholder="User" />
                <input className="rounded-md border px-3 py-2" placeholder="Status Change" />
                <input className="rounded-md border px-3 py-2" placeholder="Timestamp" />
              </div>
              <textarea className="mt-3 w-full rounded-md border px-3 py-2" rows={3} placeholder="Notes"></textarea>
              <div className="mt-3 flex justify-end">
                <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Add Entry</button>
              </div>
            </div>

            <div className="rounded-md border bg-white">
              <div className="border-b px-4 py-2 text-sm font-medium text-gray-700">Chain of Custody Log</div>
              <div className="p-4 text-sm text-gray-600">
                Placeholder for chronological CoC entries.
              </div>
            </div>
          </div>
        )}

        {activeTab === "recycling" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <input className="rounded-md border px-3 py-2" placeholder="Recycling Vendor" />
              <input className="rounded-md border px-3 py-2" placeholder="Recycling Date" />
              <input type="number" className="rounded-md border px-3 py-2" placeholder="Recycling Cost ($)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Certificate of Recycling</label>
              <input type="file" className="mt-1 w-full rounded-md border px-3 py-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className="rounded-md border px-3 py-2" placeholder="Processing Lot ID (optional)" />
            </div>
            <div className="flex justify-end">
              <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save</button>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="rounded-md border bg-gray-50 p-3">
              <div className="text-sm font-medium text-gray-800">Upload Documents</div>
              <input type="file" multiple className="mt-2 w-full rounded-md border px-3 py-2" />
            </div>
            <div className="rounded-md border bg-white">
              <div className="border-b px-4 py-2 text-sm font-medium text-gray-700">Documents</div>
              <div className="p-4 text-sm text-gray-600">Placeholder for documents list.</div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
