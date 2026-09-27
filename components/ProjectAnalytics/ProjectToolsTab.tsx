import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Wrench, Trash2, Edit2, X, Check,
  RefreshCw, ChevronDown, ChevronUp, Layers,
  ArrowUpFromLine, CheckCircle2, AlertCircle, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAllocations,
  updateAllocation,
  deleteAllocation,
  fetchAllocationTransactions,
  ProjectToolAllocation,
  AllocationSummary,
} from "../../services/ProjectToolAllocation/projectToolAllocation.service";
import AddToolToProjectModal from "./AddToolToProjectModal";

interface ToolTransaction {
  _id: string;
  quantity: number;
  returnedQty: number;
  damagedQty: number;
  lostQty: number;
  checkedOutAt: string;
  returnedAt?: string | null;
  expectedReturnAt?: string | null;
  workerId: { name: string; position: string };
  issuedBy?: { name: string };
  notes: string;
}

interface Props {
  projectId: string;
}

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const ProjectToolsTab: React.FC<Props> = ({ projectId }) => {
  const [allocations, setAllocations] = useState<ProjectToolAllocation[]>([]);
  const [summary, setSummary] = useState<AllocationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit allocation qty inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(1);

  // Expanded transaction rows
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [txMap, setTxMap] = useState<Record<string, ToolTransaction[]>>({});
  const [txLoading, setTxLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllocations(projectId);
      setAllocations(res.data || []);
      setSummary(res.summary || null);
    } catch {
      toast.error("Failed to load tool allocations");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (a: ProjectToolAllocation) => {
    if (a.checkedOutQty > 0) {
      toast.error(`Cannot remove — ${a.checkedOutQty} unit(s) still checked out`);
      return;
    }
    if (!confirm(`Remove "${a.toolId?.name || "this tool"}" from this project?`)) return;
    try {
      await deleteAllocation(a._id);
      toast.success("Tool removed from project");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const handleUpdateQty = async (a: ProjectToolAllocation) => {
    if (editQty < 1) { toast.error("Quantity must be at least 1"); return; }
    try {
      await updateAllocation(a._id, { allocatedQty: editQty });
      toast.success("Allocation updated");
      setEditingId(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const toggleExpand = async (a: ProjectToolAllocation) => {
    if (expandedId === a._id) { setExpandedId(null); return; }
    setExpandedId(a._id);
    if (!txMap[a._id]) {
      setTxLoading(a._id);
      try {
        const res = await fetchAllocationTransactions(a._id);
        setTxMap((prev) => ({ ...prev, [a._id]: res.data || [] }));
      } catch { /* ignore */ }
      finally { setTxLoading(null); }
    }
  };

  // Available = allocated - checkedOut - returned - damaged - lost
  const getAvailable = (a: ProjectToolAllocation) =>
    Math.max(0, a.allocatedQty - a.checkedOutQty - a.returnedQty - a.damagedQty - a.lostQty);

  return (
    <div className="space-y-6">
      {/* Header + Refresh + Add Tool */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Project Tools</h3>
            <p className="text-xs text-slate-500">Manage tool allocations and condition tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200/80 bg-white shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#18181b] text-white hover:bg-[#09090b] text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Add Tool
          </button>
        </div>
      </div>

      {/* Summary Cards — Clean Minimal Theme */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {[
            { label: "Allocated",   value: summary.totalAllocated,   icon: Layers },
            { label: "Checked Out", value: summary.totalCheckedOut,  icon: ArrowUpFromLine },
            { label: "Returned",    value: summary.totalReturned,    icon: CheckCircle2 },
            { label: "Damaged",     value: summary.totalDamaged,     icon: AlertCircle },
            { label: "Lost",        value: summary.totalLost,        icon: HelpCircle },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                </div>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{s.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Allocation Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading tools...</div>
      ) : allocations.length === 0 ? (
        <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
          <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-500" />
          <p className="font-semibold text-slate-700">No tools allocated yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "Add Tool" to allocate tools for this project</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3 text-left">Tool</th>
                <th className="px-4 py-3 text-center">Allocated</th>
                <th className="px-4 py-3 text-center">Available</th>
                <th className="px-4 py-3 text-center">Out</th>
                <th className="px-4 py-3 text-center">Returned</th>
                <th className="px-4 py-3 text-center">Damaged</th>
                <th className="px-4 py-3 text-center">Lost</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocations.map((a) => (
                <React.Fragment key={a._id}>
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    {/* Tool Name */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleExpand(a)}
                        className="flex items-center gap-2 text-left group"
                      >
                        <div className="text-slate-400 group-hover:text-slate-600 transition">
                          {expandedId === a._id
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-slate-700 transition">
                            {a.toolId?.name || "Unknown Tool"}
                          </p>
                          <p className="text-xs text-slate-400">{a.toolId?.category || "—"}</p>
                        </div>
                      </button>
                    </td>

                    {/* Allocated (editable) */}
                    <td className="px-4 py-3.5 text-center">
                      {editingId === a._id ? (
                        <div className="flex items-center gap-1.5 justify-center">
                          <input
                            type="number"
                            min={1}
                            value={editQty}
                            onChange={(e) => setEditQty(Number(e.target.value))}
                            className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-center text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                          <button
                            onClick={() => handleUpdateQty(a)}
                            className="p-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800">{a.allocatedQty}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-slate-800">
                        {getAvailable(a)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`font-semibold ${a.checkedOutQty > 0 ? "text-slate-800" : "text-slate-400"}`}>
                        {a.checkedOutQty}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`font-semibold ${a.returnedQty > 0 ? "text-slate-800" : "text-slate-400"}`}>
                        {a.returnedQty}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`font-semibold ${a.damagedQty > 0 ? "text-amber-600" : "text-slate-400"}`}>
                        {a.damagedQty}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`font-semibold ${a.lostQty > 0 ? "text-rose-600" : "text-slate-400"}`}>
                        {a.lostQty}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingId(a._id); setEditQty(a.allocatedQty); }}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Edit quantity"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove from project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded: transaction history for this allocation */}
                  {expandedId === a._id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-slate-50/70 border-y border-slate-100">
                        {txLoading === a._id ? (
                          <p className="text-xs text-slate-400 py-2">Loading transactions...</p>
                        ) : (txMap[a._id] || []).length === 0 ? (
                          <p className="text-xs text-slate-400 py-2">No checkout history yet</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Checkout History
                            </p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-slate-400 uppercase border-b border-slate-200/60 text-[10px]">
                                  <th className="pr-4 pb-1.5 text-left">Worker</th>
                                  <th className="pr-4 pb-1.5 text-center">Qty Out</th>
                                  <th className="pr-4 pb-1.5 text-center">Returned</th>
                                  <th className="pr-4 pb-1.5 text-center">Damaged</th>
                                  <th className="pr-4 pb-1.5 text-center">Lost</th>
                                  <th className="pr-4 pb-1.5 text-left">Date</th>
                                  <th className="pb-1.5 text-left">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(txMap[a._id] || []).map((tx) => (
                                  <tr key={tx._id} className="text-slate-600">
                                    <td className="pr-4 py-2 font-medium text-slate-800">{tx.workerId.name}</td>
                                    <td className="pr-4 py-2 text-center font-bold text-slate-800">{tx.quantity}</td>
                                    <td className="pr-4 py-2 text-center">{tx.returnedQty || "—"}</td>
                                    <td className="pr-4 py-2 text-center text-amber-600 font-semibold">{tx.damagedQty || "—"}</td>
                                    <td className="pr-4 py-2 text-center text-rose-600 font-semibold">{tx.lostQty || "—"}</td>
                                    <td className="pr-4 py-2 text-slate-400">{fmtDate(tx.checkedOutAt)}</td>
                                    <td className="py-2">
                                      {tx.returnedAt ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                                          Returned
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-white">
                                          Active
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Project End Summary Card — Clean Theme */}
      {allocations.length > 0 && summary && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-500" />
              Project Tool Summary
            </h4>
            {(summary.totalDamaged > 0 || summary.totalLost > 0) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                <AlertCircle className="w-3.5 h-3.5" />
                {summary.totalDamaged + summary.totalLost} unit(s) damaged or lost
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            <div>
              <p className="text-slate-500 text-xs font-medium">Total Allocated</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{summary.totalAllocated} units</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium">Returned (Good)</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{summary.totalReturned} units</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium">Damaged</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{summary.totalDamaged} units</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium">Lost</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{summary.totalLost} units</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Tool Modal */}
      {showAddModal && (
        <AddToolToProjectModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onAdded={load}
        />
      )}
    </div>
  );
};

export default ProjectToolsTab;
