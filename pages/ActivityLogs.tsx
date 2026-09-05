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
} from "../services/ActivityLog/fetchActivityLogs";
import { useLanguage } from "../context/LanguageContext";

export const ActivityLogs: React.FC = () => {
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
  const limit = 15;

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
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-ocean-600 rounded-2xl shadow-sm text-white">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {t("activityLogs.title") || "Activity Logs"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {t("activityLogs.subtitle") ||
                  "Audit trail of all administrative mutating actions (POST, PUT, PATCH, DELETE)"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              loadLogs(1);
              loadStats();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {t("common.refresh") || "Refresh"}
          </button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("activityLogs.totalLogs") || "Total Actions"}
            </p>
            <p className="text-2xl font-black text-slate-900">
              {statsLoading ? "..." : (stats?.totalLogs ?? totalItems).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("activityLogs.todayLogs") || "Actions Today"}
            </p>
            <p className="text-2xl font-black text-emerald-600">
              {statsLoading ? "..." : (stats?.logsToday ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t("activityLogs.methodsBreakdown") || "By Method"}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                POST: {stats?.methodBreakdown.POST ?? 0}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                PUT: {stats?.methodBreakdown.PUT ?? 0}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                DEL: {stats?.methodBreakdown.DELETE ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("activityLogs.topAdmin") || "Top Active User"}
            </p>
            <p className="text-sm font-black text-slate-800 truncate">
              {stats?.topUsers?.[0]?.name || "N/A"}
            </p>
            {stats?.topUsers?.[0] && (
              <p className="text-[11px] text-purple-600 font-semibold">
                {stats.topUsers[0].count} operations
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("activityLogs.searchPlaceholder") || "Search action, endpoint, user..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Module Filter */}
          <div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all cursor-pointer"
            >
              <option value="ALL">All Modules</option>
              {modulesList
                .filter((m) => m !== "ALL")
                .map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
            </select>
          </div>

          {/* Method Filter */}
          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all cursor-pointer"
            >
              <option value="ALL">All Methods</option>
              {methodsList
                .filter((m) => m !== "ALL")
                .map((met) => (
                  <option key={met} value={met}>
                    {met}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success Only (2xx)</option>
              <option value="FAILED">Failed Only (4xx/5xx)</option>
            </select>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Date Filter:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 outline-none focus:border-ocean-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 outline-none focus:border-ocean-500"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-2 py-1 text-slate-500 hover:text-red-600 text-xs font-semibold cursor-pointer"
              >
                Clear Dates
              </button>
            )}
          </div>

          <div className="text-slate-500 font-semibold">
            Showing <span className="text-slate-900 font-bold">{logs.length}</span> of{" "}
            <span className="text-slate-900 font-bold">{totalItems}</span> activities
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Module & Action</th>
                <th className="py-3.5 px-4">Endpoint</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-ocean-600 mx-auto mb-2" />
                    <p className="font-semibold">Loading activity logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2 border border-slate-200/60">
                      <Activity className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-600">No activity logs found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
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
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                      {formatDateTime(log.createdAt)}
                    </td>

                    {/* User */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase border border-slate-200">
                          {log.user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate max-w-[140px]">
                            {log.user?.name || "System"}
                          </p>
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase ${getRoleBadge(
                              log.user?.role
                            )}`}
                          >
                            {log.user?.role || "anonymous"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Module & Action */}
                    <td className="py-3 px-4">
                      <div>
                        <span className="inline-block text-[11px] font-bold text-ocean-700 bg-ocean-50 px-2 py-0.5 rounded-md border border-ocean-200/60 mr-1.5">
                          {log.module}
                        </span>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">
                          {log.action}
                        </span>
                      </div>
                    </td>

                    {/* Endpoint */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 truncate max-w-[180px]">
                      {log.endpoint}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {log.status === "SUCCESS" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        )}
                        {log.statusCode}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-ocean-50 hover:text-ocean-700 text-slate-600 border border-slate-200/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <p className="text-xs text-slate-500 font-semibold">
              Page <span className="text-slate-900 font-bold">{page}</span> of{" "}
              <span className="text-slate-900 font-bold">{totalPages}</span> (
              {totalItems} total logs)
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity Log Detail Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black border font-mono ${getMethodBadge(
                    selectedLog.method
                  )}`}
                >
                  {selectedLog.method}
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-800">
                    {selectedLog.action}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Module: <span className="text-ocean-700 font-bold">{selectedLog.module}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
              {/* Action Banner (Create / Update / Delete) */}
              {(() => {
                const actionInfo = getActionTypeInfo(selectedLog.method, selectedLog.action);
                const ActionIcon = actionInfo.icon;
                const targetName = getTargetName(selectedLog.requestBody);

                return (
                  <div className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-4 ${actionInfo.cardBg}`}>
                    <div className={`p-3 rounded-xl bg-white shadow-xs shrink-0 ${actionInfo.iconColor}`}>
                      <ActionIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-black border uppercase tracking-wide ${actionInfo.badgeBg}`}>
                          {actionInfo.myanmarType}
                        </span>
                        <span className="text-xs font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                          {selectedLog.module}
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {selectedLog.action}
                      </h4>
                      {targetName && (
                        <p className="text-xs sm:text-sm text-slate-700 font-bold mt-2 bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/80 inline-block shadow-2xs">
                          Target: <span className="text-ocean-700">{targetName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* User Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                    {selectedLog.user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">လုပ်ဆောင်ခဲ့သူ (User)</p>
                    <p className="font-black text-slate-800 text-sm truncate">
                      {selectedLog.user?.name || "System"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold capitalize">
                      {selectedLog.user?.email || selectedLog.user?.role || "User"}
                    </p>
                  </div>
                </div>

                {/* Time & Status Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Clock className="w-5 h-5 text-ocean-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">အချိန် (Date & Time)</p>
                    <p className="font-bold text-slate-800 text-xs sm:text-sm">
                      {formatDateTime(selectedLog.createdAt)}
                    </p>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
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
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs">Error Description:</p>
                    <p className="text-xs mt-0.5">{selectedLog.errorMessage}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-slate-50/80 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
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
