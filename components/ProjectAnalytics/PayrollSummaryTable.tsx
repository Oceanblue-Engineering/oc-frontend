import React from "react";
import { Users, Clock, DollarSign, Calendar, ChevronUp, ChevronDown } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export interface WorkerPayrollData {
  _id: string;
  name: string;
  position: string;
  dailyRate: number;
  hoursWorked: number;
  totalWage: number;
  attendanceCount: number;
}

interface PayrollSummaryTableProps {
  workers: WorkerPayrollData[];
  isLoading?: boolean;
  formatCurrency: (amount: number) => string;
  onWorkerClick?: (workerId: string) => void;
}

type SortField = "name" | "position" | "dailyRate" | "hoursWorked" | "totalWage" | "attendanceCount";
type SortDirection = "asc" | "desc";

const PayrollSummaryTable: React.FC<PayrollSummaryTableProps> = ({
  workers,
  isLoading = false,
  formatCurrency,
  onWorkerClick,
}) => {
  const { t } = useLanguage();
  const [sortField, setSortField] = React.useState<SortField>("totalWage");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedWorkers = React.useMemo(() => {
    if (!workers) return [];

    return [...workers].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [workers, sortField, sortDirection]);

  const paginatedWorkers = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedWorkers.slice(start, start + itemsPerPage);
  }, [sortedWorkers, currentPage]);

  const totalPages = Math.ceil(sortedWorkers.length / itemsPerPage);

  // Calculate totals
  const totals = React.useMemo(() => {
    return workers.reduce(
      (acc, worker) => ({
        totalWage: acc.totalWage + worker.totalWage,
        hoursWorked: acc.hoursWorked + worker.hoursWorked,
        attendanceCount: acc.attendanceCount + worker.attendanceCount,
        avgDailyRate: acc.avgDailyRate + worker.dailyRate,
      }),
      {
        totalWage: 0,
        hoursWorked: 0,
        attendanceCount: 0,
        avgDailyRate: 0,
      }
    );
  }, [workers]);

  const avgDailyRate = workers.length > 0 ? totals.avgDailyRate / workers.length : 0;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-semibold text-ocean-800 text-sm mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-ocean-600" /> {t("projects.workerPayrollList")}
        </h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!workers || workers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-semibold text-ocean-800 text-sm mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-ocean-600" /> {t("projects.workerPayrollList")}
        </h3>
        <div className="h-48 flex items-center justify-center bg-slate-50/50 border border-slate-100 rounded-xl">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">{t("projects.noWorkerData")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ocean-800 text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-ocean-600" /> {t("projects.workerPayrollList")}
        </h3>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
            {t("projects.count")}: {workers.length}
          </div>
          <div className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg">
            {t("projects.total")}: {formatCurrency(totals.totalWage)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th
                className="text-left py-3 px-3 text-xs font-semibold text-slate-500 cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  {t("projects.colName")}
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="text-left py-3 px-3 text-xs font-semibold text-slate-500 cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("position")}
              >
                <div className="flex items-center gap-1">
                  {t("projects.colPosition")}
                  <SortIcon field="position" />
                </div>
              </th>
              <th
                className="text-right py-3 px-3 text-xs font-semibold text-slate-500 cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("dailyRate")}
              >
                <div className="flex items-center justify-end gap-1">
                  {t("projects.colDailyRate")}
                  <SortIcon field="dailyRate" />
                </div>
              </th>
              <th
                className="text-right py-3 px-3 text-xs font-semibold text-slate-500 cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("hoursWorked")}
              >
                <div className="flex items-center justify-end gap-1">
                  {t("projects.colHours")}
                  <SortIcon field="hoursWorked" />
                </div>
              </th>
              <th
                className="text-right py-3 px-3 text-xs font-semibold text-slate-500 cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("attendanceCount")}
              >
                <div className="flex items-center justify-end gap-1">
                  {t("projects.colAttendance")}
                  <SortIcon field="attendanceCount" />
                </div>
              </th>
              <th
                className="text-right py-3 px-3 text-xs font-semibold text-slate-500 cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("totalWage")}
              >
                <div className="flex items-center justify-end gap-1">
                  {t("projects.total")}
                  <SortIcon field="totalWage" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedWorkers.map((worker, index) => (
              <tr
                key={worker._id}
                className={`border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer ${
                  onWorkerClick ? "" : ""
                }`}
                onClick={() => onWorkerClick?.(worker._id)}
              >
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-ocean-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-ocean-700">
                        {worker.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{worker.name}</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                    {worker.position || "General"}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-sm text-slate-700">{formatCurrency(worker.dailyRate)}</span>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-sm text-slate-700">{worker.hoursWorked}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-sm text-slate-700">{worker.attendanceCount}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-sm font-bold text-ocean-700">{formatCurrency(worker.totalWage)}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-ocean-50/30">
              <td className="py-3 px-3 text-xs font-bold text-ocean-800" colSpan={2}>
                {t("projects.total")}
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-xs font-semibold text-ocean-700">{formatCurrency(avgDailyRate)}</span>
                <span className="text-[10px] text-slate-400 block">{t("projects.average")}</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-xs font-semibold text-ocean-700">{totals.hoursWorked}</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-xs font-semibold text-ocean-700">{totals.attendanceCount}</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-xs font-bold text-ocean-800">{formatCurrency(totals.totalWage)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {`${t("projects.page")} ${currentPage} / ${totalPages}`}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("projects.prev")}
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    currentPage === page
                      ? "bg-ocean-600 text-white"
                      : "border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("projects.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollSummaryTable;