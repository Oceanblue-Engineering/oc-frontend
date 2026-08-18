import React, { useState } from "react";
import { DollarSign, Trash2, Loader2, Plus, Calendar, User, MapPin } from "lucide-react";
import { toast } from "sonner";
import { ProjectExpense } from "../../services/ProjectAnalytics/projectAnalytics.service";
import { deleteExpense } from "../../services/Expense/deleteExpense";
import { ConfirmModal } from "../Common/ConfirmModal";
import { useLanguage } from "../../context/LanguageContext";

interface ProjectExpensesTableProps {
  expenses: ProjectExpense[];
  isLoading?: boolean;
  onExpenseDeleted: () => void;
  onAddExpenseClick: () => void;
  formatCurrency: (amount: number) => string;
}

export const ProjectExpensesTable: React.FC<ProjectExpensesTableProps> = ({
  expenses = [],
  isLoading = false,
  onExpenseDeleted,
  onAddExpenseClick,
  formatCurrency,
}) => {
  const { t } = useLanguage();
  const [expenseToDelete, setExpenseToDelete] = useState<ProjectExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;

    setIsDeleting(true);
    try {
      const res = await deleteExpense(expenseToDelete._id);
      if (res.success) {
        toast.success(t("projects.expenseDeletedSuccess") || "Expense deleted successfully");
        setExpenseToDelete(null);
        onExpenseDeleted();
      } else {
        toast.error(res.message || "Failed to delete expense");
      }
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error(error.message || "Failed to delete expense");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-ocean-50 rounded-xl">
            <DollarSign className="w-5 h-5 text-ocean-600" />
          </div>
          <div>
            <h2 className="font-bold text-ocean-800 text-base">
              {t("projects.projectExpensesList") || "Project Expenses"}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {expenses.length} {t("projects.unitRecords") || "records"} • {t("projects.total")}:{" "}
              <span className="font-bold text-slate-700">{formatCurrency(totalAmount)}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onAddExpenseClick}
          className="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-ocean-600/10 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("projects.addExpense") || "Add Expense"}</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-ocean-600 mb-2" />
          <p className="text-xs font-medium">{t("common.loading") || "Loading..."}</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 text-slate-300">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            {t("projects.noProjectExpenses") || "No expenses recorded for this project"}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Click "+ Add Expense" to track material purchases, wages, or site costs.
          </p>
          <button
            onClick={onAddExpenseClick}
            className="mt-4 px-4 py-2 bg-ocean-50 text-ocean-700 hover:bg-ocean-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            {t("projects.addExpense") || "+ Add Expense"}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-center">No</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Notes</th>
                <th className="px-4 py-3.5">Recorded By</th>
                <th className="px-4 py-3.5 text-right">Amount</th>
                {userRole === "owner" && (
                  <th className="px-4 py-3.5 text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {expenses.map((exp, idx) => {
                const categoryName = exp.category || exp.expenseType || "other";
                const dateVal = exp.date || exp.expenseDate || exp.createdAt || "";

                return (
                  <tr key={exp._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* No */}
                    <td className="px-4 py-3.5 text-center text-xs font-bold text-slate-400">
                      {String(idx + 1).padStart(2, "0")}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {formatDate(dateVal)}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-purple-50 text-purple-700 border border-purple-200">
                        {categoryName}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-xs truncate" title={exp.notes || exp.description || ""}>
                      {exp.notes || exp.description || "-"}
                    </td>

                    {/* Recorded By */}
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                      {exp.adminId ? (
                        <div>
                          <p className="font-semibold text-slate-700">{exp.adminId.name}</p>
                          {exp.adminId.role && (
                            <p className="text-[10px] text-slate-400 capitalize">{exp.adminId.role}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 text-right font-bold text-red-600 text-xs sm:text-sm whitespace-nowrap">
                      {exp.amount?.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                    </td>

                    {/* Actions */}
                    {userRole === "owner" && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setExpenseToDelete(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={Boolean(expenseToDelete)}
        title={t("common.delete") || "Delete Expense"}
        message={
          expenseToDelete
            ? `Are you sure you want to delete this expense of ${expenseToDelete.amount?.toLocaleString()} MMK (${expenseToDelete.category || expenseToDelete.expenseType})?`
            : ""
        }
        confirmText={t("common.delete") || "Delete"}
        cancelText={t("common.cancel") || "Cancel"}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setExpenseToDelete(null)}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
};
