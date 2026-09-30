import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Wrench, Trash2, Edit2, X, Check,
  RefreshCw, ChevronDown, ChevronUp, Layers,
  ArrowUpFromLine, ArrowDownToLine, CheckCircle2, AlertCircle, HelpCircle,
  Calendar, User
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
import { checkoutTool, checkinTool } from "../../services/ToolInventory/toolInventory.service";
import { fetchWorkers, Worker } from "../../services/Worker/worker.service";
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
  workerId: { _id?: string; name: string; position?: string; phone?: string };
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

  // Workers
  const [workers, setWorkers] = useState<Worker[]>([]);

  // Checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [coAllocationId, setCoAllocationId] = useState("");
  const [coWorkerId, setCoWorkerId] = useState("");
  const [coQty, setCoQty] = useState(1);
  const [coExpectedReturn, setCoExpectedReturn] = useState("");
  const [coSubmitting, setCoSubmitting] = useState(false);

  // Return modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [retTx, setRetTx] = useState<{
    tx: ToolTransaction;
    toolName: string;
    allocationId: string;
  } | null>(null);
  const [retGoodQty, setRetGoodQty] = useState(0);
  const [retDamagedQty, setRetDamagedQty] = useState(0);
  const [retLostQty, setRetLostQty] = useState(0);
  const [retNotes, setRetNotes] = useState("");
  const [retSubmitting, setRetSubmitting] = useState(false);

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

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchWorkers().then((res) => {
      if (res.success && res.data?.workers) {
        setWorkers(res.data.workers);
      }
    });
  }, []);

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

  // Open checkout modal
  const openCheckoutModal = (allocationId?: string) => {
    if (allocationId) {
      setCoAllocationId(allocationId);
    } else {
      const avail = allocations.find((a) => getAvailable(a) > 0);
      setCoAllocationId(avail ? avail._id : (allocations[0]?._id || ""));
    }
    setCoWorkerId("");
    setCoQty(1);
    setCoExpectedReturn("");
    setShowCheckoutModal(true);
  };

  // Submit checkout
  const handleCheckoutSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!coAllocationId) { toast.error("Please select a tool"); return; }
    if (!coWorkerId) { toast.error("Please select a worker"); return; }
    
    const selectedAlloc = allocations.find(a => a._id === coAllocationId);
    const available = selectedAlloc ? getAvailable(selectedAlloc) : 0;
    if (coQty < 1) { toast.error("Quantity must be at least 1"); return; }
    if (coQty > available) {
      toast.error(`Only ${available} unit(s) available for checkout`);
      return;
    }

    setCoSubmitting(true);
    try {
      await checkoutTool({
        allocationId: coAllocationId,
        workerId: coWorkerId,
        quantity: coQty,
        expectedReturnAt: coExpectedReturn || null,
      });
      toast.success("Tool checked out successfully");
      setShowCheckoutModal(false);
      await load();
      if (expandedId === coAllocationId) {
        const res = await fetchAllocationTransactions(coAllocationId);
        setTxMap((prev) => ({ ...prev, [coAllocationId]: res.data || [] }));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Checkout failed");
    } finally {
      setCoSubmitting(false);
    }
  };

  // Open return modal
  const openReturnModal = (tx: ToolTransaction, toolName: string, allocationId: string) => {
    setRetTx({ tx, toolName, allocationId });
    setRetGoodQty(tx.quantity);
    setRetDamagedQty(0);
    setRetLostQty(0);
    setRetNotes("");
    setShowReturnModal(true);
  };

  // Submit return
  const handleReturnSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!retTx) return;
    const total = retGoodQty + retDamagedQty + retLostQty;
    if (total !== retTx.tx.quantity) {
      toast.error(`Total breakdown (${total}) must equal checked-out quantity (${retTx.tx.quantity})`);
      return;
    }

    setRetSubmitting(true);
    try {
      await checkinTool({
        transactionId: retTx.tx._id,
        returnedQty: retGoodQty,
        damagedQty: retDamagedQty,
        lostQty: retLostQty,
        notes: retNotes,
      });
      toast.success("Tool returned successfully");
      const currentAllocId = retTx.allocationId;
      setShowReturnModal(false);
      setRetTx(null);
      await load();
      if (currentAllocId) {
        const res = await fetchAllocationTransactions(currentAllocId);
        setTxMap((prev) => ({ ...prev, [currentAllocId]: res.data || [] }));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Return failed");
    } finally {
      setRetSubmitting(false);
    }
  };

  const selectedAllocForCheckout = allocations.find(a => a._id === coAllocationId);
  const maxAvailableForCheckout = selectedAllocForCheckout ? getAvailable(selectedAllocForCheckout) : 1;

  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Project Tools</h3>
            <p className="text-xs text-slate-500">Manage tool allocations, worker check-outs, and condition tracking</p>
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
            onClick={() => openCheckoutModal()}
            disabled={allocations.length === 0 || !allocations.some(a => getAvailable(a) > 0)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowUpFromLine className="w-4 h-4" /> Check Out Tool
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#18181b] text-white hover:bg-[#09090b] text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Add Tool
          </button>
        </div>
      </div>

      {/* Summary Cards */}
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
              {allocations.map((a) => {
                const avail = getAvailable(a);
                return (
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
                        <span className={`font-bold ${avail > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                          {avail}
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
                        <div className="flex items-center justify-end gap-1.5">
                          {avail > 0 && (
                            <button
                              onClick={() => openCheckoutModal(a._id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 rounded-lg transition"
                              title="Check out to worker"
                            >
                              <ArrowUpFromLine className="w-3.5 h-3.5" />
                              <span>Check Out</span>
                            </button>
                          )}
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
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                  Checkout History
                                </p>
                                <span className="text-[11px] text-slate-400">
                                  {(txMap[a._id] || []).length} record(s)
                                </span>
                              </div>
                              <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
                                <table className="w-full text-xs">
                                  <thead className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/60 text-[10px] uppercase">
                                    <tr>
                                      <th className="px-3.5 py-2 text-left">Worker</th>
                                      <th className="px-3 py-2 text-center">Qty Out</th>
                                      <th className="px-3 py-2 text-center">Returned</th>
                                      <th className="px-3 py-2 text-center">Damaged</th>
                                      <th className="px-3 py-2 text-center">Lost</th>
                                      <th className="px-3.5 py-2 text-left">Check-out Date</th>
                                      <th className="px-3.5 py-2 text-left">Expected Return</th>
                                      <th className="px-3.5 py-2 text-left">Status</th>
                                      <th className="px-3.5 py-2 text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {(txMap[a._id] || []).map((tx) => (
                                      <tr key={tx._id} className="text-slate-600 hover:bg-slate-50/50">
                                        <td className="px-3.5 py-2.5 font-medium text-slate-900">
                                          <div>
                                            <p className="font-semibold text-slate-800">{tx.workerId?.name || "—"}</p>
                                            <p className="text-[10px] text-slate-400">{tx.workerId?.position || "Worker"}</p>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center font-bold text-slate-900">{tx.quantity}</td>
                                        <td className="px-3 py-2.5 text-center">{tx.returnedQty || "—"}</td>
                                        <td className="px-3 py-2.5 text-center text-amber-600 font-semibold">{tx.damagedQty || "—"}</td>
                                        <td className="px-3 py-2.5 text-center text-rose-600 font-semibold">{tx.lostQty || "—"}</td>
                                        <td className="px-3.5 py-2.5 text-slate-500">{fmtDate(tx.checkedOutAt)}</td>
                                        <td className="px-3.5 py-2.5 text-slate-500">{fmtDate(tx.expectedReturnAt)}</td>
                                        <td className="px-3.5 py-2.5">
                                          {tx.returnedAt ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                                              Returned
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                              Active
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3.5 py-2.5 text-right">
                                          {!tx.returnedAt ? (
                                            <button
                                              onClick={() => openReturnModal(tx, a.toolId?.name || "Tool", a._id)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition active:scale-95"
                                            >
                                              <ArrowDownToLine className="w-3 h-3" />
                                              <span>Return</span>
                                            </button>
                                          ) : (
                                            <span className="text-slate-300 text-xs">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Project End Summary Card */}
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

      {/* Checkout Tool Modal */}
      {showCheckoutModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowUpFromLine className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Check Out Tool</h2>
                  <p className="text-[11px] text-slate-400">Issue an allocated tool to a site worker</p>
                </div>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-4">
              {/* Select Tool Allocation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Select Tool *
                </label>
                <select
                  value={coAllocationId}
                  onChange={(e) => {
                    setCoAllocationId(e.target.value);
                    setCoQty(1);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                >
                  <option value="">-- Choose Tool --</option>
                  {allocations.map((a) => {
                    const avail = getAvailable(a);
                    return (
                      <option key={a._id} value={a._id} disabled={avail <= 0}>
                        {a.toolId?.name || "Tool"} ({avail} available of {a.allocatedQty})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Select Worker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Assign Worker *
                </label>
                <div className="relative">
                  <select
                    value={coWorkerId}
                    onChange={(e) => setCoWorkerId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                  >
                    <option value="">-- Choose Worker --</option>
                    {workers.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} {w.position ? `(${w.position})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Quantity *</label>
                  <span className="text-[11px] text-slate-400">
                    Max Available: <strong className="text-slate-700">{maxAvailableForCheckout}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={maxAvailableForCheckout}
                  value={coQty}
                  onChange={(e) => setCoQty(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                />
              </div>

              {/* Expected Return Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Expected Return Date (Optional)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={coExpectedReturn}
                    onChange={(e) => setCoExpectedReturn(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={coSubmitting || !coAllocationId || !coWorkerId || coQty < 1}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <ArrowUpFromLine className="w-4 h-4" />
                  {coSubmitting ? "Checking out..." : "Confirm Check Out"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Return Tool Modal */}
      {showReturnModal && retTx && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Return Tool</h2>
                  <p className="text-[11px] text-slate-400">Record check-in and condition tracking</p>
                </div>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-5 space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-900 text-sm">{retTx.toolName}</p>
                <p className="text-slate-500">
                  Worker: <strong className="text-slate-800">{retTx.tx.workerId?.name || "—"}</strong>
                </p>
                <p className="text-slate-500">
                  Total Checked-Out Qty: <strong className="text-slate-900">{retTx.tx.quantity} units</strong>
                </p>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                Breakdown must sum up to exactly <strong className="text-slate-900">{retTx.tx.quantity}</strong> units:
              </p>

              <div className="space-y-2.5">
                {[
                  { label: "Returned (Good condition)", val: retGoodQty, set: setRetGoodQty, color: "text-slate-800" },
                  { label: "Damaged",                   val: retDamagedQty,  set: setRetDamagedQty, color: "text-amber-600" },
                  { label: "Lost",                      val: retLostQty,     set: setRetLostQty, color: "text-rose-600" },
                ].map(({ label, val, set, color }) => (
                  <div key={label} className="flex items-center justify-between gap-3 p-2 bg-slate-50/50 border border-slate-100 rounded-xl">
                    <label className={`text-xs font-semibold ${color}`}>{label}</label>
                    <input
                      type="number"
                      min={0}
                      max={retTx.tx.quantity}
                      value={val}
                      onChange={(e) => set(Number(e.target.value))}
                      className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs"
                    />
                  </div>
                ))}
              </div>

              {/* Sum counter badge */}
              <div className="flex items-center justify-between text-xs px-1 pt-1">
                <span className="font-semibold text-slate-500">Sum Total:</span>
                <span className={`font-black tabular-nums px-2.5 py-1 rounded-md text-xs ${
                  retGoodQty + retDamagedQty + retLostQty === retTx.tx.quantity
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                    : "bg-rose-50 text-rose-700 border border-rose-200/70"
                }`}>
                  {retGoodQty + retDamagedQty + retLostQty} / {retTx.tx.quantity} units
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Condition Notes (Optional)
                </label>
                <textarea
                  value={retNotes}
                  onChange={(e) => setRetNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes about tool damage, wear, or location..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none shadow-xs"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    retSubmitting ||
                    retGoodQty + retDamagedQty + retLostQty !== retTx.tx.quantity
                  }
                  className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  {retSubmitting ? "Returning..." : "Confirm Return"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectToolsTab;
