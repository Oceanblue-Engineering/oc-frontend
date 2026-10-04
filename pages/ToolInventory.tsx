import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Wrench, Search, Plus, RefreshCw, AlertTriangle, Clock,
  Package, X, ArrowDownToLine, ArrowUpFromLine, History,
  Edit2, Trash2, CheckCircle2, ChevronRight, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import axios from "axios";
import {
  fetchTools, fetchOverdueTools, fetchTransactions, searchTools,
  createTool, updateTool, deleteTool, checkoutTool, checkinTool,
  ToolItem, ToolTransaction,
} from "../services/ToolInventory/toolInventory.service";
import {
  fetchAllocations, ProjectToolAllocation,
} from "../services/ProjectToolAllocation/projectToolAllocation.service";
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
} from "../components/ui";

interface Project { _id: string; siteName: string; customer: string; status: string; }
interface Worker  { _id: string; name: string; phone: string; position: string; }

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const isOverdue = (tx: ToolTransaction) =>
  !tx.returnedAt && tx.expectedReturnAt && new Date(tx.expectedReturnAt) < new Date();

// ─────────────────────────────────────────────────────────────────────────────
const ToolInventory: React.FC = () => {
  const { currentUser } = useApp();
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole  = adminData?.role || currentUser?.role;

  if (userRole !== "owner" && userRole !== "admin" && userRole !== "manager") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-slate-400">
        <Wrench className="w-12 h-12" />
        <p className="text-lg font-bold text-slate-800">Access Denied</p>
        <p className="text-xs text-slate-500">Only Owner, Admin, and Manager roles can access Tool Inventory.</p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<"tools" | "checkout" | "history" | "dashboard">("tools");

  // Data
  const [tools, setTools]                   = useState<ToolItem[]>([]);
  const [transactions, setTransactions]     = useState<ToolTransaction[]>([]);
  const [overdueList, setOverdueList]       = useState<ToolTransaction[]>([]);
  const [projects, setProjects]             = useState<Project[]>([]);
  const [workers, setWorkers]               = useState<Worker[]>([]);
  const [loading, setLoading]               = useState(false);

  // Filters
  const [toolSearch, setToolSearch]                 = useState("");
  const [toolCategoryFilter, setToolCategoryFilter] = useState("");
  const [txProjectFilter, setTxProjectFilter]       = useState("");
  const [txReturnedFilter, setTxReturnedFilter]     = useState("");

  // Modals
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [editTool, setEditTool]                 = useState<ToolItem | null>(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinTx, setCheckinTx]               = useState<ToolTransaction | null>(null);

  // Checkout form
  const [coProjectId, setCoProjectId]         = useState("");
  const [coAllocations, setCoAllocations]     = useState<ProjectToolAllocation[]>([]);
  const [coAllocLoading, setCoAllocLoading]   = useState(false);
  const [coAllocationId, setCoAllocationId]   = useState("");
  const [coWorkerId, setCoWorkerId]           = useState("");
  const [coQty, setCoQty]                     = useState(1);
  const [coExpected, setCoExpected]           = useState("");

  // Checkin form
  const [ciReturnedQty, setCiReturnedQty]     = useState(0);
  const [ciDamagedQty, setCiDamagedQty]       = useState(0);
  const [ciLostQty, setCiLostQty]             = useState(0);
  const [ciNotes, setCiNotes]                 = useState("");

  // Tool form
  const [toolForm, setToolForm] = useState({
    name: "", category: "", serialNumber: "", totalQuantity: 1, description: "",
  });

  // ── Loaders ────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    try {
      const res = await axios.get("/projects?limit=200");
      const d = res.data?.data;
      const list = Array.isArray(d?.clients) ? d.clients
        : Array.isArray(d) ? d
        : Array.isArray(res.data?.projects) ? res.data.projects : [];
      setProjects(list);
    } catch { /* ignore */ }
  }, []);

  const loadWorkers = useCallback(async () => {
    try {
      const res = await axios.get("/workers?limit=500");
      const d = res.data?.data;
      const list = Array.isArray(d) ? d
        : Array.isArray(d?.workers) ? d.workers
        : Array.isArray(res.data?.workers) ? res.data.workers : [];
      setWorkers(list);
    } catch { /* ignore */ }
  }, []);

  const loadTools = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTools({ search: toolSearch || undefined, category: toolCategoryFilter || undefined, limit: 200 });
      setTools(res.data || []);
    } catch { toast.error("Failed to load tools"); }
    finally { setLoading(false); }
  }, [toolSearch, toolCategoryFilter]);

  const loadTransactions = useCallback(async () => {
    try {
      const res = await fetchTransactions({ projectId: txProjectFilter || undefined, isReturned: (txReturnedFilter as any) || undefined, limit: 200 });
      setTransactions(res.data || []);
    } catch { /* ignore */ }
  }, [txProjectFilter, txReturnedFilter]);

  const loadOverdue = useCallback(async () => {
    try { const res = await fetchOverdueTools(); setOverdueList(res.data || []); } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadProjects(); loadWorkers(); loadOverdue(); }, []);
  useEffect(() => { if (activeTab === "tools") loadTools(); }, [activeTab, toolSearch, toolCategoryFilter]);
  useEffect(() => { if (activeTab === "history") loadTransactions(); }, [activeTab, txProjectFilter, txReturnedFilter]);
  useEffect(() => { if (activeTab === "dashboard") loadOverdue(); }, [activeTab]);

  // Load allocations for selected project in checkout tab
  useEffect(() => {
    if (!coProjectId) { setCoAllocations([]); setCoAllocationId(""); return; }
    setCoAllocLoading(true);
    fetchAllocations(coProjectId)
      .then((res) => {
        setCoAllocations(res.data || []);
        setCoAllocationId("");
      })
      .catch(() => { /* ignore */ })
      .finally(() => setCoAllocLoading(false));
  }, [coProjectId]);

  const getAvailable = (a: ProjectToolAllocation) =>
    Math.max(0, a.allocatedQty - a.checkedOutQty - a.returnedQty - a.damagedQty - a.lostQty);

  // ── Handlers ───────────────────────────────────────────
  const handleCheckout = async () => {
    if (!coAllocationId || !coWorkerId) { toast.error("Select a tool and worker"); return; }
    if (coQty < 1) { toast.error("Quantity must be at least 1"); return; }
    try {
      await checkoutTool({ allocationId: coAllocationId, workerId: coWorkerId, quantity: coQty, expectedReturnAt: coExpected || null });
      toast.success("Checked out successfully");
      setCoAllocationId(""); setCoWorkerId(""); setCoQty(1); setCoExpected("");
      if (coProjectId) { const res = await fetchAllocations(coProjectId); setCoAllocations(res.data || []); }
      loadOverdue();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Checkout failed"); }
  };

  const openCheckin = (tx: ToolTransaction) => {
    setCheckinTx(tx);
    setCiReturnedQty(tx.quantity);
    setCiDamagedQty(0); setCiLostQty(0); setCiNotes("");
    setShowCheckinModal(true);
  };

  const handleCheckin = async () => {
    if (!checkinTx) return;
    const total = ciReturnedQty + ciDamagedQty + ciLostQty;
    if (total !== checkinTx.quantity) {
      toast.error(`Total (${total}) must equal checked-out quantity (${checkinTx.quantity})`);
      return;
    }
    try {
      await checkinTool({ transactionId: checkinTx._id, returnedQty: ciReturnedQty, damagedQty: ciDamagedQty, lostQty: ciLostQty, notes: ciNotes });
      toast.success("Returned successfully");
      setShowCheckinModal(false); setCheckinTx(null);
      loadOverdue();
      if (activeTab === "history") loadTransactions();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Check-in failed"); }
  };

  const handleSaveTool = async () => {
    if (!toolForm.name || !toolForm.category) { toast.error("Name and Category are required"); return; }
    if (toolForm.totalQuantity < 1) { toast.error("Quantity must be at least 1"); return; }
    try {
      if (editTool) { await updateTool(editTool._id, toolForm); toast.success("Tool updated"); }
      else { await createTool(toolForm); toast.success("Tool created"); }
      setShowAddToolModal(false); setEditTool(null);
      setToolForm({ name: "", category: "", serialNumber: "", totalQuantity: 1, description: "" });
      loadTools();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Save failed"); }
  };

  const openEdit = (tool: ToolItem) => {
    setEditTool(tool);
    setToolForm({ name: tool.name, category: tool.category, serialNumber: tool.serialNumber, totalQuantity: tool.totalQuantity, description: tool.description });
    setShowAddToolModal(true);
  };

  const handleDelete = async (tool: ToolItem) => {
    if (!confirm(`Delete "${tool.name}"?`)) return;
    try { await deleteTool(tool._id); toast.success("Deleted"); loadTools(); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Delete failed"); }
  };

  const tabs = [
    { key: "tools",     label: "Tools",        icon: Package },
    { key: "checkout",  label: "Check-Out",    icon: ArrowUpFromLine },
    { key: "history",   label: "History",      icon: History },
    { key: "dashboard", label: "Overdue",      icon: Clock, badge: overdueList.length },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Standard Unified PageHeader */}
      <PageHeader
        title="Tool Inventory"
        subtitle="Manage master equipment stock, check-outs, returns, and overdue tracking"
        icon={<Wrench className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                loadOverdue();
                if (activeTab === "tools") loadTools();
                if (activeTab === "history") loadTransactions();
              }}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="default"
              onClick={() => {
                setEditTool(null);
                setToolForm({ name: "", category: "", serialNumber: "", totalQuantity: 1, description: "" });
                setShowAddToolModal(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Tool
            </Button>
          </div>
        }
      />

      {/* Overdue Banner — Subtle Warning */}
      {overdueList.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-amber-900 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>{overdueList.length}</strong> tool check-out{overdueList.length > 1 ? "s" : ""} currently overdue for return
            </span>
          </div>
          <button
            onClick={() => setActiveTab("dashboard")}
            className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1"
          >
            View Overdue <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Unified Segmented Tab Navigation */}
      <div className="bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs inline-flex gap-1 overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                isActive
                  ? "bg-[#18181b] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-amber-400 text-slate-900"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══ TAB 1: TOOLS (MASTER LIST) ══ */}
      {activeTab === "tools" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="flex flex-1 gap-2.5 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  placeholder="Search tools by name, category, or S/N..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition shadow-xs"
                />
              </div>
              <input
                value={toolCategoryFilter}
                onChange={(e) => setToolCategoryFilter(e.target.value)}
                placeholder="Category filter..."
                className="w-40 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition shadow-xs"
              />
            </div>
            <p className="text-xs text-slate-500 font-medium self-center sm:self-auto">
              Total <strong>{tools.length}</strong> tools in master stock
            </p>
          </div>

          {/* Tools Table */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
              <p className="text-xs font-semibold text-slate-400">Loading tools...</p>
            </div>
          ) : tools.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 shadow-xs">
              <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="font-bold text-slate-800 text-sm">No Tools in Inventory</p>
              <p className="text-xs text-slate-400 mt-1">Get started by creating your first tool.</p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddToolModal(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add First Tool
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="px-4 py-3.5 text-left">Tool Name</th>
                    <th className="px-4 py-3.5 text-left">Category</th>
                    <th className="px-4 py-3.5 text-center">Total Stock</th>
                    <th className="px-4 py-3.5 text-left">Serial No.</th>
                    <th className="px-4 py-3.5 text-left">Description</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tools.map((tool) => (
                    <tr key={tool._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">{tool.name}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant="neutral">{tool.category}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs tabular-nums">
                          {tool.totalQuantity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">
                        {tool.serialNumber || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 max-w-xs truncate">
                        {tool.description || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(tool)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="Edit tool"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tool)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete tool"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 2: CHECK-OUT ══ */}
      {activeTab === "checkout" && (
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-slate-700" />
                Tool Check-Out
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Issue allocated tools to workers on active project sites
              </p>
            </div>

            {/* Step 1: Project */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                1. Select Project *
              </label>
              <select
                value={coProjectId}
                onChange={(e) => setCoProjectId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition shadow-xs"
              >
                <option value="">Choose active project...</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.siteName} — {p.customer}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Tool from project allocations */}
            {coProjectId && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  2. Select Tool *
                </label>
                {coAllocLoading ? (
                  <p className="text-xs text-slate-400 py-2">Loading project tools...</p>
                ) : coAllocations.length === 0 ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600">
                    No tools allocated to this project yet. Go to the Project's Tools tab to add tools.
                  </div>
                ) : (
                  <select
                    value={coAllocationId}
                    onChange={(e) => { setCoAllocationId(e.target.value); setCoQty(1); }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition shadow-xs"
                  >
                    <option value="">Choose allocated tool...</option>
                    {coAllocations.map((a) => {
                      const avail = getAvailable(a);
                      return (
                        <option key={a._id} value={a._id} disabled={avail === 0}>
                          {a.toolId?.name || "Tool"} — Available: {avail} / {a.allocatedQty} units
                          {avail === 0 ? " (none available)" : ""}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            )}

            {/* Steps 3, 4, 5 */}
            {coAllocationId && (() => {
              const selAlloc = coAllocations.find((a) => a._id === coAllocationId);
              const avail = selAlloc ? getAvailable(selAlloc) : 0;
              return (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      3. Select Worker *
                    </label>
                    <select
                      value={coWorkerId}
                      onChange={(e) => setCoWorkerId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition shadow-xs"
                    >
                      <option value="">Choose worker...</option>
                      {workers.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.name} — {w.position}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        4. Quantity *{" "}
                        <span className="text-slate-400 font-normal lowercase">(max: {avail})</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={avail}
                        value={coQty}
                        onChange={(e) => setCoQty(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        5. Expected Return <span className="text-slate-400 font-normal lowercase">(optional)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={coExpected}
                        onChange={(e) => setCoExpected(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="secondary"
                      size="default"
                      onClick={handleCheckout}
                      className="w-full"
                      leftIcon={<ArrowUpFromLine className="w-4 h-4" />}
                    >
                      Confirm Check-Out ({coQty} unit{coQty > 1 ? "s" : ""})
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ══ TAB 3: HISTORY ══ */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2.5 items-center">
            <select
              value={txProjectFilter}
              onChange={(e) => setTxProjectFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.siteName}</option>
              ))}
            </select>
            <select
              value={txReturnedFilter}
              onChange={(e) => setTxReturnedFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
            >
              <option value="">All Statuses</option>
              <option value="false">Active (Not Returned)</option>
              <option value="true">Returned</option>
            </select>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3.5 text-left">Tool</th>
                  <th className="px-4 py-3.5 text-left">Worker</th>
                  <th className="px-4 py-3.5 text-left">Project</th>
                  <th className="px-4 py-3.5 text-center">Qty Out</th>
                  <th className="px-4 py-3.5 text-center">Ret</th>
                  <th className="px-4 py-3.5 text-center">Dmg</th>
                  <th className="px-4 py-3.5 text-center">Lost</th>
                  <th className="px-4 py-3.5 text-left">Checked Out</th>
                  <th className="px-4 py-3.5 text-left">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-14 text-slate-400 text-xs font-medium">
                      No check-out records found
                    </td>
                  </tr>
                ) : transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{tx.toolId?.name || "Tool"}</td>
                    <td className="px-4 py-3.5 text-slate-700">{tx.workerId?.name || "—"}</td>
                    <td className="px-4 py-3.5 text-slate-500">{tx.projectId?.siteName || "—"}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-800">{tx.quantity}</td>
                    <td className="px-4 py-3.5 text-center text-slate-700">{tx.returnedQty || "—"}</td>
                    <td className="px-4 py-3.5 text-center text-amber-600 font-semibold">{tx.damagedQty || "—"}</td>
                    <td className="px-4 py-3.5 text-center text-rose-600 font-semibold">{tx.lostQty || "—"}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">{fmtDate(tx.checkedOutAt)}</td>
                    <td className="px-4 py-3.5">
                      {tx.returnedAt ? (
                        <Badge variant="neutral">Returned</Badge>
                      ) : isOverdue(tx) ? (
                        <Badge variant="warning">Overdue</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {!tx.returnedAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCheckin(tx)}
                          leftIcon={<ArrowDownToLine className="w-3.5 h-3.5" />}
                        >
                          Return
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ TAB 4: OVERDUE ══ */}
      {activeTab === "dashboard" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Overdue Check-Outs</h3>
          </div>

          {overdueList.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 shadow-xs">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-600" />
              <p className="font-bold text-slate-800 text-sm">No Overdue Tools</p>
              <p className="text-xs text-slate-400 mt-1">All checked-out tools are within expected return dates.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="px-4 py-3.5 text-left">Tool</th>
                    <th className="px-4 py-3.5 text-left">Worker</th>
                    <th className="px-4 py-3.5 text-left">Project</th>
                    <th className="px-4 py-3.5 text-center">Qty</th>
                    <th className="px-4 py-3.5 text-left">Expected Return</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueList.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">{tx.toolId?.name || "Tool"}</td>
                      <td className="px-4 py-3.5 text-slate-700">{tx.workerId?.name || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-500">{tx.projectId?.siteName || "—"}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">{tx.quantity}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-rose-600">
                        {fmtDate(tx.expectedReturnAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCheckin(tx)}
                          leftIcon={<ArrowDownToLine className="w-3.5 h-3.5" />}
                        >
                          Return
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ MODAL: ADD/EDIT TOOL ══ */}
      {showAddToolModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-slate-900 text-base">{editTool ? "Edit Tool" : "Add New Tool"}</h2>
              <button
                onClick={() => { setShowAddToolModal(false); setEditTool(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Tool Name *",    key: "name",         placeholder: "e.g. Bosch Rotary Drill", type: "text" },
                { label: "Category *",    key: "category",     placeholder: "e.g. Power Tools",        type: "text" },
                { label: "Serial Number", key: "serialNumber", placeholder: "Optional S/N",             type: "text" },
                { label: "Description",   key: "description",  placeholder: "Optional notes",           type: "text" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(toolForm as any)[key]}
                    onChange={(e) => setToolForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition shadow-xs"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Total Quantity *</label>
                <input
                  type="number"
                  min={1}
                  value={toolForm.totalQuantity}
                  onChange={(e) => setToolForm((f) => ({ ...f, totalQuantity: Number(e.target.value) }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition shadow-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">Master stock quantity in warehouse</p>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2.5 bg-slate-50/50 rounded-b-2xl">
              <Button
                variant="outline"
                size="default"
                onClick={() => { setShowAddToolModal(false); setEditTool(null); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="default"
                onClick={handleSaveTool}
                className="flex-1"
              >
                {editTool ? "Update Tool" : "Create Tool"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══ MODAL: CHECK-IN / RETURN ══ */}
      {showCheckinModal && checkinTx && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-slate-900 text-base">Return Tool</h2>
              <button
                onClick={() => setShowCheckinModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-900 text-sm">{checkinTx.toolId?.name || "Tool"}</p>
                <p className="text-slate-500">Worker: <strong className="text-slate-700">{checkinTx.workerId?.name || "—"}</strong> · Qty: <strong className="text-slate-900">{checkinTx.quantity} units</strong></p>
                <p className="text-slate-500">Project: <strong className="text-slate-700">{checkinTx.projectId?.siteName || "—"}</strong></p>
              </div>

              <p className="text-[11px] text-slate-400">
                Breakdown must sum up to <strong>{checkinTx.quantity}</strong> units:
              </p>

              {[
                { label: "Returned (Good)", val: ciReturnedQty, set: setCiReturnedQty },
                { label: "Damaged",         val: ciDamagedQty,  set: setCiDamagedQty },
                { label: "Lost",            val: ciLostQty,     set: setCiLostQty },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <label className="text-xs font-semibold text-slate-700">{label}</label>
                  <input
                    type="number"
                    min={0}
                    max={checkinTx.quantity}
                    value={val}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                  />
                </div>
              ))}

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="font-semibold text-slate-500">Sum Total:</span>
                <span className={`font-black tabular-nums ${ciReturnedQty + ciDamagedQty + ciLostQty === checkinTx.quantity ? "text-emerald-600" : "text-rose-600"}`}>
                  {ciReturnedQty + ciDamagedQty + ciLostQty} / {checkinTx.quantity}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes</label>
                <textarea
                  value={ciNotes}
                  onChange={(e) => setCiNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional condition notes..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none shadow-xs"
                />
              </div>
            </div>
            <div className="p-4 border-t flex gap-2.5 bg-slate-50/50 rounded-b-2xl">
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowCheckinModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="default"
                onClick={handleCheckin}
                disabled={ciReturnedQty + ciDamagedQty + ciLostQty !== checkinTx.quantity}
                className="flex-1"
                leftIcon={<ArrowDownToLine className="w-4 h-4" />}
              >
                Confirm Return
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ToolInventory;
