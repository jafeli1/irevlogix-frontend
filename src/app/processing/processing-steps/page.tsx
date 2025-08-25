"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "../../../components/AppLayout";

type ProcessingLot = {
  id: number;
  lotNumber: string;
};

type User = {
  id: number;
  firstName: string;
  lastName: string;
};

type ProcessingStepListItem = {
  id: number;
  processingLotId: number;
  processingLot?: ProcessingLot | null;
  stepName: string;
  description?: string | null;
  stepOrder: number;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  responsibleUserId?: number | null;
  responsibleUser?: User | null;
  laborHours?: number | null;
  machineHours?: number | null;
  energyConsumption?: number | null;
  processingCostPerUnit?: number | null;
  totalStepCost?: number | null;
  notes?: string | null;
  equipment?: string | null;
  inputWeight?: number | null;
  outputWeight?: number | null;
  wasteWeight?: number | null;
};

const pageSizeOptions = [10, 25, 50];

function ProcessingStepsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lotId = searchParams.get('lotId');
  const [data, setData] = useState<ProcessingStepListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [processingLots, setProcessingLots] = useState<ProcessingLot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [createForm, setCreateForm] = useState({
    processingLotId: lotId || "",
    stepName: "",
    description: "",
    stepOrder: "",
    startTime: "",
    endTime: "",
    status: "Pending",
    responsibleUserId: "",
    laborHours: "",
    machineHours: "",
    energyConsumption: "",
    processingCostPerUnit: "",
    totalStepCost: "",
    notes: "",
    equipment: "",
    inputWeight: "",
    outputWeight: "",
    wasteWeight: "",
  });
  const [editForm, setEditForm] = useState(createForm);

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
  }, []);

  const fetchProcessingLots = async () => {
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingLots?page=1&pageSize=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const json = await res.json();
      setProcessingLots(json || []);
    } catch (e: unknown) {
      console.error("Failed to load processing lots:", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/Users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const json = await res.json();
      setUsers(json || []);
    } catch (e: unknown) {
      console.error("Failed to load users:", e);
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
      if (lotId) {
        params.append('lotId', lotId);
      }
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingSteps?${params}`, {
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
    fetchProcessingLots();
    fetchUsers();
  }, [token, page, pageSize, lotId]);

  const onExportCsv = async () => {
    try {
      const header = ["Id", "Processing Lot", "Step Name", "Description", "Step Order", "Start Time", "End Time", "Status", "Responsible User", "Labor Hours", "Machine Hours", "Equipment", "Notes"];
      const rows = data.map((row) => [
        row.id,
        row.processingLot?.lotNumber || "",
        row.stepName,
        row.description || "",
        row.stepOrder,
        row.startTime || "",
        row.endTime || "",
        row.status,
        row.responsibleUser ? `${row.responsibleUser.firstName} ${row.responsibleUser.lastName}` : "",
        row.laborHours ?? "",
        row.machineHours ?? "",
        row.equipment || "",
        row.notes || "",
      ]);
      const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "processing-steps.csv";
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
      processingLotId: lotId || "",
      stepName: "",
      description: "",
      stepOrder: "",
      startTime: "",
      endTime: "",
      status: "Pending",
      responsibleUserId: "",
      laborHours: "",
      machineHours: "",
      energyConsumption: "",
      processingCostPerUnit: "",
      totalStepCost: "",
      notes: "",
      equipment: "",
      inputWeight: "",
      outputWeight: "",
      wasteWeight: "",
    });
    setShowCreate(true);
  };

  const onSubmitCreate = async () => {
    try {
      const body = {
        processingLotId: createForm.processingLotId ? Number(createForm.processingLotId) : null,
        stepName: createForm.stepName,
        description: createForm.description || null,
        stepOrder: createForm.stepOrder ? Number(createForm.stepOrder) : 1,
        startTime: createForm.startTime || null,
        endTime: createForm.endTime || null,
        status: createForm.status,
        responsibleUserId: createForm.responsibleUserId ? Number(createForm.responsibleUserId) : null,
        laborHours: createForm.laborHours ? Number(createForm.laborHours) : null,
        machineHours: createForm.machineHours ? Number(createForm.machineHours) : null,
        energyConsumption: createForm.energyConsumption ? Number(createForm.energyConsumption) : null,
        processingCostPerUnit: createForm.processingCostPerUnit ? Number(createForm.processingCostPerUnit) : null,
        totalStepCost: createForm.totalStepCost ? Number(createForm.totalStepCost) : null,
        notes: createForm.notes || null,
        equipment: createForm.equipment || null,
        inputWeight: createForm.inputWeight ? Number(createForm.inputWeight) : null,
        outputWeight: createForm.outputWeight ? Number(createForm.outputWeight) : null,
        wasteWeight: createForm.wasteWeight ? Number(createForm.wasteWeight) : null,
      };
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingSteps`, {
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

  const onEdit = (item: ProcessingStepListItem) => {
    setEditForm({
      processingLotId: item.processingLotId.toString(),
      stepName: item.stepName,
      description: item.description || "",
      stepOrder: item.stepOrder.toString(),
      startTime: item.startTime || "",
      endTime: item.endTime || "",
      status: item.status,
      responsibleUserId: item.responsibleUserId?.toString() || "",
      laborHours: item.laborHours?.toString() || "",
      machineHours: item.machineHours?.toString() || "",
      energyConsumption: item.energyConsumption?.toString() || "",
      processingCostPerUnit: item.processingCostPerUnit?.toString() || "",
      totalStepCost: item.totalStepCost?.toString() || "",
      notes: item.notes || "",
      equipment: item.equipment || "",
      inputWeight: item.inputWeight?.toString() || "",
      outputWeight: item.outputWeight?.toString() || "",
      wasteWeight: item.wasteWeight?.toString() || "",
    });
    setEditingId(item.id);
    setShowEdit(true);
  };

  const onSubmitEdit = async () => {
    if (!editingId) return;
    try {
      const body = {
        stepName: editForm.stepName,
        description: editForm.description || null,
        stepOrder: editForm.stepOrder ? Number(editForm.stepOrder) : null,
        startTime: editForm.startTime || null,
        endTime: editForm.endTime || null,
        status: editForm.status,
        responsibleUserId: editForm.responsibleUserId ? Number(editForm.responsibleUserId) : null,
        laborHours: editForm.laborHours ? Number(editForm.laborHours) : null,
        machineHours: editForm.machineHours ? Number(editForm.machineHours) : null,
        energyConsumption: editForm.energyConsumption ? Number(editForm.energyConsumption) : null,
        processingCostPerUnit: editForm.processingCostPerUnit ? Number(editForm.processingCostPerUnit) : null,
        totalStepCost: editForm.totalStepCost ? Number(editForm.totalStepCost) : null,
        notes: editForm.notes || null,
        equipment: editForm.equipment || null,
        inputWeight: editForm.inputWeight ? Number(editForm.inputWeight) : null,
        outputWeight: editForm.outputWeight ? Number(editForm.outputWeight) : null,
        wasteWeight: editForm.wasteWeight ? Number(editForm.wasteWeight) : null,
      };
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingSteps/${editingId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to update: ${res.status}`);
      setShowEdit(false);
      setEditingId(null);
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update";
      setError(msg);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this processing step?")) return;
    try {
      const res = await fetch(`https://irevlogix-backend.onrender.com/api/ProcessingSteps/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to delete: ${res.status}`);
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete";
      setError(msg);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Processing Steps</h1>
        <div className="flex gap-3">
          {lotId && (
            <button
              onClick={() => router.push(`/processing/lot-detail/${lotId}`)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Lot Detail
            </button>
          )}
          <button onClick={onExportCsv} className="px-3 py-2 border rounded">Export CSV</button>
          <button onClick={onOpenCreate} className="px-3 py-2 bg-blue-600 text-white rounded">Create New Processing Step</button>
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Step Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Order</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Responsible User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Labor Hours</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Equipment</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{item.stepName}</td>
                    <td className="px-4 py-3 text-sm">{item.stepOrder}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.responsibleUser ? `${item.responsibleUser.firstName} ${item.responsibleUser.lastName}` : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.laborHours || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">{item.equipment || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => onEdit(item)} className="text-blue-600 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => onDelete(item.id)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </div>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New Processing Step</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">Processing Lot <span className="text-red-500">*</span></label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.processingLotId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, processingLotId: e.target.value }))}
                    disabled={!!lotId}
                  >
                    <option value="">Select Processing Lot</option>
                    {processingLots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.lotNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Step Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.stepName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, stepName: e.target.value }))}
                    placeholder="Enter step name"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Step Order</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.stepOrder}
                    onChange={(e) => setCreateForm((f) => ({ ...f, stepOrder: e.target.value }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Status</label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.status}
                    onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Responsible User</label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={createForm.responsibleUserId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, responsibleUserId: e.target.value }))}
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Equipment</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.equipment}
                    onChange={(e) => setCreateForm((f) => ({ ...f, equipment: e.target.value }))}
                    placeholder="Equipment used"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.startTime}
                    onChange={(e) => setCreateForm((f) => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.endTime}
                    onChange={(e) => setCreateForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Labor Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.laborHours}
                    onChange={(e) => setCreateForm((f) => ({ ...f, laborHours: e.target.value }))}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Machine Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.machineHours}
                    onChange={(e) => setCreateForm((f) => ({ ...f, machineHours: e.target.value }))}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Energy Consumption (kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.energyConsumption}
                    onChange={(e) => setCreateForm((f) => ({ ...f, energyConsumption: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Processing Cost Per Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.processingCostPerUnit}
                    onChange={(e) => setCreateForm((f) => ({ ...f, processingCostPerUnit: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Total Step Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.totalStepCost}
                    onChange={(e) => setCreateForm((f) => ({ ...f, totalStepCost: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Input Weight (lbs)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.inputWeight}
                    onChange={(e) => setCreateForm((f) => ({ ...f, inputWeight: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Output Weight (lbs)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.outputWeight}
                    onChange={(e) => setCreateForm((f) => ({ ...f, outputWeight: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Waste Weight (lbs)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={createForm.wasteWeight}
                    onChange={(e) => setCreateForm((f) => ({ ...f, wasteWeight: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    className="w-full border rounded px-2 py-2"
                    rows={3}
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the processing step..."
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm mb-1">Notes</label>
                  <textarea
                    className="w-full border rounded px-2 py-2"
                    rows={3}
                    value={createForm.notes}
                    onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional notes..."
                  />
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

      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Processing Step</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">Processing Lot <span className="text-red-500">*</span></label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={editForm.processingLotId}
                    onChange={(e) => setEditForm((f) => ({ ...f, processingLotId: e.target.value }))}
                    disabled
                  >
                    <option value="">Select Processing Lot</option>
                    {processingLots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.lotNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Step Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.stepName}
                    onChange={(e) => setEditForm((f) => ({ ...f, stepName: e.target.value }))}
                    placeholder="Enter step name"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Step Order</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.stepOrder}
                    onChange={(e) => setEditForm((f) => ({ ...f, stepOrder: e.target.value }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Status</label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Responsible User</label>
                  <select
                    className="w-full border rounded px-2 py-2"
                    value={editForm.responsibleUserId}
                    onChange={(e) => setEditForm((f) => ({ ...f, responsibleUserId: e.target.value }))}
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Equipment</label>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.equipment}
                    onChange={(e) => setEditForm((f) => ({ ...f, equipment: e.target.value }))}
                    placeholder="Equipment used"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Labor Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.laborHours}
                    onChange={(e) => setEditForm((f) => ({ ...f, laborHours: e.target.value }))}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Machine Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.machineHours}
                    onChange={(e) => setEditForm((f) => ({ ...f, machineHours: e.target.value }))}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Energy Consumption (kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.energyConsumption}
                    onChange={(e) => setEditForm((f) => ({ ...f, energyConsumption: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Processing Cost Per Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.processingCostPerUnit}
                    onChange={(e) => setEditForm((f) => ({ ...f, processingCostPerUnit: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Total Step Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.totalStepCost}
                    onChange={(e) => setEditForm((f) => ({ ...f, totalStepCost: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Input Weight (lbs)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.inputWeight}
                    onChange={(e) => setEditForm((f) => ({ ...f, inputWeight: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Output Weight (lbs)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.outputWeight}
                    onChange={(e) => setEditForm((f) => ({ ...f, outputWeight: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Waste Weight (lbs)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-2 py-2"
                    value={editForm.wasteWeight}
                    onChange={(e) => setEditForm((f) => ({ ...f, wasteWeight: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    className="w-full border rounded px-2 py-2"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the processing step..."
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm mb-1">Notes</label>
                  <textarea
                    className="w-full border rounded px-2 py-2"
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button onClick={() => setShowEdit(false)} className="px-3 py-2 border rounded">Cancel</button>
                <button onClick={onSubmitEdit} className="px-3 py-2 bg-blue-600 text-white rounded">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}

export default function ProcessingStepsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProcessingStepsContent />
    </Suspense>
  );
}
