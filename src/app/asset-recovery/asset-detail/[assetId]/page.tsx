"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedAsset, setEditedAsset] = useState<Partial<Asset>>({});

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
        if (!ignore) {
          setAsset(data);
          setEditedAsset(data);
        }
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

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/assets/${assetId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedAsset),
      });

      if (response.ok) {
        setAsset(editedAsset as Asset);
        setIsEditing(false);
      } else if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        setError('Failed to update asset');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  return (
    <AppLayout>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Asset Detail</h1>
              <p className="mt-1 text-sm text-gray-600">View and manage asset lifecycle information</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/asset-recovery/asset-tracking"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Assets
              </Link>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Edit
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedAsset(asset || {});
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
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

          <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Asset Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "data"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Data Destruction
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("coc")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "coc"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Chain of Custody
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recycling")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "recycling"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Certified Recycling
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "documents"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Documents
          </button>
        </nav>
      </div>

          <div className="rounded-md border bg-white p-4">
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Resale Value ($)</label>
                <input 
                  type="number" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.estimatedResaleValue || "") : (asset?.estimatedResaleValue || "")}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, estimatedResaleValue: parseFloat(e.target.value) || 0 }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Actual Sale Price ($)</label>
                <input 
                  type="number" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.actualSalePrice || "") : (asset?.actualSalePrice || "")}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, actualSalePrice: parseFloat(e.target.value) || 0 }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost Of Recovery ($)</label>
                <input 
                  type="number" 
                  className="mt-1 w-full rounded-md border px-3 py-2" 
                  value={isEditing ? (editedAsset?.costOfRecovery || "") : (asset?.costOfRecovery || "")}
                  onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, costOfRecovery: parseFloat(e.target.value) || 0 }))}
                  disabled={!isEditing}
                />
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
                  <input 
                    className="mt-1 w-full rounded-md border px-3 py-2" 
                    value={isEditing ? (editedAsset?.buyer || editedAsset?.recipient || "") : (asset?.buyer || asset?.recipient || "")}
                    onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, buyer: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Platform / Purpose</label>
                  <input 
                    className="mt-1 w-full rounded-md border px-3 py-2" 
                    value={isEditing ? (editedAsset?.resalePlatform || editedAsset?.purpose || "") : (asset?.resalePlatform || asset?.purpose || "")}
                    onChange={(e) => isEditing && setEditedAsset(prev => ({ ...prev, resalePlatform: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
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
        </div>
      </div>
    </AppLayout>
  );
}
