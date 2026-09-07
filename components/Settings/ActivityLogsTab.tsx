import React, { useState, useEffect } from "react";
import {
  Activity,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Laptop,
  Layers,
  AlertTriangle,
  Loader2,
  PlusCircle,
  Edit3,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchActivityLogs,
  fetchActivityLogStats,
  ActivityLog,
  ActivityLogStats,
} from "../../services/ActivityLog/fetchActivityLogs";
import { useLanguage } from "../../context/LanguageContext";

export const ActivityLogsTab: React.FC = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Filter & Pagination States
  const [search, setSearch] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const limit = 10;

  const modulesList = [
    "ALL",
    "Orders",
    "Inventory",
    "Warehouse",
    "Storefront",
    "Purchasing",
    "Credits",
    "Expenses",
    "Clients",
    "Leads",
    "Projects",
    "Tickets",
    "Workers",
    "Attendance",
    "Invoice",
    "Suppliers",
    "Delivery",
    "Auth",
    "Settings",
    "Lucky Draw",
  ];

  const methodsList = ["ALL", "POST", "PUT", "PATCH", "DELETE"];

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetchActivityLogStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Error loading activity log stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadLogs = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await fetchActivityLogs({
        page: targetPage,
        limit,
        search: search.trim() || undefined,
        module: selectedModule,
        method: selectedMethod,
        status: selectedStatus,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.success && res.data) {
        setLogs(res.data);
        if (res.pagination) {
          setPage(res.pagination.currentPage);
          setTotalPages(res.pagination.totalPages);
          setTotalItems(res.pagination.totalItems);
        }
      } else {
        toast.error(res.message || "Failed to load activity logs");
      }
    } catch (err) {
      console.error("Error loading activity logs:", err);
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedModule, selectedMethod, selectedStatus, startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      loadLogs(newPage);
    }
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getMethodBadge = (method: string) => {
    switch (method?.toUpperCase()) {
      case "POST":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PUT":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PATCH":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "DELETE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "admin":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "cashier":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getActionTypeInfo = (method: string, action: string) => {
    const m = (method || "").toUpperCase();
    const act = (action || "").toLowerCase();

    if (m === "POST" || act.includes("create") || act.includes("add") || act.includes("record")) {
      return {
        type: "CREATE",
        myanmarType: "အသစ်ထည့်သွင်းခြင်း (Create)",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        cardBg: "bg-emerald-50/60 border-emerald-200",
        icon: PlusCircle,
        iconColor: "text-emerald-600",
      };
    }
    if (m === "DELETE" || act.includes("delete") || act.includes("remove") || act.includes("cancel")) {
      return {
        type: "DELETE",
        myanmarType: "ဖျက်သိမ်းခြင်း (Delete)",
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
        cardBg: "bg-rose-50/60 border-rose-200",
        icon: Trash2,
        iconColor: "text-rose-600",
      };
    }
    return {
      type: "UPDATE",
      myanmarType: "ပြင်ဆင်ခြင်း (Update)",
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      cardBg: "bg-blue-50/60 border-blue-200",
      icon: Edit3,
      iconColor: "text-blue-600",
    };
  };

  const getTargetName = (body: any): string => {
    if (!body || typeof body !== "object") return "";
    return (
      body.storefrontName ||
      body.warehouseName ||
      body.productName ||
      body.name ||
      body.clientName ||
      body.supplierName ||
      body.workerName ||
      body.recipientName ||
      body.title ||
      body.invoiceNumber ||
      body.transferNumber ||
      ""
    );
  };

  return (
    <div className="space-y-6 flex flex-col min-h-0">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t("activityLogs.totalLogs") || "Total Actions"}
            </p>
            <p className="text-xl font-black text-slate-900">
              {statsLoading ? "..." : (stats?.totalLogs ?? totalItems).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t("activityLogs.todayLogs") || "Actions Today"}
            </p>
            <p className="text-xl font-black text-emerald-600">
              {statsLoading ? "..." : (stats?.logsToday ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t("activityLogs.methodsBreakdown") || "By Method"}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                POST: {stats?.methodBreakdown.POST ?? 0}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                PUT: {stats?.methodBreakdown.PUT ?? 0}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                DEL: {stats?.methodBreakdown.DELETE ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t("activityLogs.topAdmin") || "Top Active User"}
            </p>
            <p className="text-sm font-black text-slate-900 truncate">
              {statsLoading
                ? "..."
                : stats?.topUsers && stats.topUsers.length > 0
                ? `${stats.topUsers[0].name} (${stats.topUsers[0].count})`
                : "No data"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, endpoint, status..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#27272a] focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Module Filter */}
          <div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#27272a] focus:border-transparent outline-none cursor-pointer"
            >
              {modulesList.map((m) => (
                <option key={m} value={m}>
                  Module: {m}
                </option>
              ))}
            </select>
          </div>

          {/* Method Filter */}
          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#27272a] focus:border-transparent outline-none cursor-pointer"
            >
              {methodsList.map((m) => (
                <option key={m} value={m}>
                  Method: {m}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#27272a] focus:border-transparent outline-none cursor-pointer"
            >
              <option value="ALL">Status: ALL</option>
              <option value="SUCCESS">SUCCESS (2xx)</option>
              <option value="FAILED">FAILED (4xx/5xx)</option>
            </select>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/50 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Date Range:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-[#27272a] outline-none"
            />
            <span className="text-slate-400 font-bold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-[#27272a] outline-none"
            />
            {(startDate || endDate || search || selectedModule !== "ALL" || selectedMethod !== "ALL" || selectedStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedModule("ALL");
                  setSelectedMethod("ALL");
                  setSelectedStatus("ALL");
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
          <div className="ml-auto">
            <button
              onClick={() => {
                loadLogs(1);
                loadStats();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Module & Action</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-xs">Loading activity logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-2 border border-slate-200/60">
                      <Activity className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-600 text-xs">No activity logs found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search or filter parameters.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    {/* Timestamp */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                      {formatDateTime(log.createdAt)}
                    </td>

                    {/* User */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] uppercase border border-slate-200">
                          {log.user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate max-w-[130px] text-xs">
                            {log.user?.name || "System"}
                          </p>
                          <span
                            className={`inline-block px-1 py-0.1 rounded text-[9px] font-bold border uppercase ${getRoleBadge(
                              log.user?.role
                            )}`}
                          >
                            {log.user?.role || "anonymous"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Module & Action */}
                    <td className="py-2.5 px-4">
                      <div>
                        <span className="inline-block text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mr-1.5">
                          {log.module}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          {log.action}
                        </span>
                      </div>
                    </td>

                    {/* Endpoint */}
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-500 truncate max-w-[160px]">
                      {log.endpoint}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {log.status === "SUCCESS" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Success
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Failed ({log.statusCode})
                          </>
                        )}
                      </span>
                    </td>

                    {/* View Details Action */}
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="View Action Summary"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1">
            <span>
              Showing <span className="font-bold text-slate-800">{logs.length}</span> of{" "}
              <span className="font-bold text-slate-800">{totalItems}</span> actions
            </span>
            {selectedModule !== "ALL" && (
              <span className="text-slate-400">
                (filtered by <span className="font-bold">{selectedModule}</span>)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">
              Page {page} of {totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || loading}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Detail Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black border font-mono ${getMethodBadge(
                    selectedLog.method
                  )}`}
                >
                  {selectedLog.method}
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-800">
                    {selectedLog.action}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Module: <span className="text-slate-700 font-bold">{selectedLog.module}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
              {/* Action Banner (Create / Update / Delete) */}
              {(() => {
                const actionInfo = getActionTypeInfo(selectedLog.method, selectedLog.action);
                const ActionIcon = actionInfo.icon;
                const targetName = getTargetName(selectedLog.requestBody);

                return (
                  <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${actionInfo.cardBg}`}>
                    <div className={`p-2.5 rounded-xl bg-white shadow-xs shrink-0 ${actionInfo.iconColor}`}>
                      <ActionIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border uppercase tracking-wide ${actionInfo.badgeBg}`}>
                          {actionInfo.myanmarType}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                          {selectedLog.module}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                        {selectedLog.action}
                      </h4>
                      {targetName && (
                        <p className="text-xs text-slate-700 font-bold mt-1.5 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/80 inline-block shadow-2xs">
                          Target: <span className="text-slate-900">{targetName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* User Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {selectedLog.user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">လုပ်ဆောင်ခဲ့သူ (User)</p>
                    <p className="font-black text-slate-800 text-xs sm:text-sm truncate">
                      {selectedLog.user?.name || "System"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold capitalize">
                      {selectedLog.user?.email || selectedLog.user?.role || "User"}
                    </p>
                  </div>
                </div>

                {/* Time & Status Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Clock className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">အချိန် (Date & Time)</p>
                    <p className="font-bold text-slate-800 text-xs sm:text-sm">
                      {formatDateTime(selectedLog.createdAt)}
                    </p>
                    <div className="mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                          selectedLog.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {selectedLog.status === "SUCCESS" ? "✓ အောင်မြင်သည် (Success)" : "✕ မအောင်မြင်ပါ (Failed)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message if Failed */}
              {selectedLog.errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs">Error Description:</p>
                    <p className="text-xs mt-0.5">{selectedLog.errorMessage}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t bg-slate-50/80 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3.5 py-1.5 bg-[#27272a] hover:bg-[#18181b] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
