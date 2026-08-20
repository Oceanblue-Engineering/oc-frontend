import React, { useState } from "react";
import { DollarSign, Trash2, Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { ProjectExpense } from "../../services/ProjectAnalytics/projectAnalytics.service";
import { deleteExpense } from "../../services/Expense/deleteExpense";
import { ConfirmModal } from "../Common/ConfirmModal";
import { useLanguage } from "../../context/LanguageContext";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
} from "../ui";

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
  const [expenseToDelete, setExpenseToDelete] = useState<ProjectExpense | null>(
    null
  );
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
        toast.success(
          t("projects.expenseDeletedSuccess") ||
            "Expense deleted successfully"
        );
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
    <Card className="space-y-4">
      {/* Header */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ocean-50 text-ocean-600 rounded-xl flex items-center justify-center border border-ocean-200/60 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              {t("projects.projectExpensesList") || "Project Expenses"}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {expenses.length} {t("projects.unitRecords") || "records"} •{" "}
              {t("projects.total")}:{" "}
              <span className="font-bold text-slate-700">
                {formatCurrency(totalAmount)}
              </span>
            </p>
          </div>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={onAddExpenseClick}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t("projects.addExpense") || "Add Expense"}
        </Button>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-0 sm:p-0">
        <TableContainer className="border-0 shadow-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-center">No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {userRole === "owner" && (
                  <TableHead className="text-center w-20">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableEmpty
                  colSpan={userRole === "owner" ? 7 : 6}
                  message={t("common.loading") || "Loading..."}
                />
              ) : expenses.length === 0 ? (
                <TableEmpty
                  colSpan={userRole === "owner" ? 7 : 6}
                  message={
                    t("projects.noProjectExpenses") ||
                    "No expenses recorded for this project"
                  }
                  icon={<Receipt className="w-6 h-6 text-slate-300" />}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAddExpenseClick}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      {t("projects.addExpense") || "Add Expense"}
                    </Button>
                  }
                />
              ) : (
                expenses.map((exp, idx) => {
                  const categoryName =
                    exp.category || exp.expenseType || "other";
                  const dateVal =
                    exp.date || exp.expenseDate || exp.createdAt || "";

                  return (
                    <TableRow key={exp._id}>
                      <TableCell className="text-center text-xs font-bold text-slate-400">
                        {String(idx + 1).padStart(2, "0")}
                      </TableCell>

                      <TableCell className="text-xs font-medium text-slate-600 whitespace-nowrap">
                        {formatDate(dateVal)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <Badge variant="purple" className="capitalize">
                          {categoryName}
                        </Badge>
                      </TableCell>

                      <TableCell
                        className="text-xs text-slate-600 max-w-xs truncate"
                        title={exp.notes || exp.description || ""}
                      >
                        {exp.notes || exp.description || "-"}
                      </TableCell>

                      <TableCell className="text-xs whitespace-nowrap">
                        {exp.adminId ? (
                          <div>
                            <p className="font-semibold text-slate-700">
                              {exp.adminId.name}
                            </p>
                            {exp.adminId.role && (
                              <p className="text-[10px] text-slate-400 capitalize">
                                {exp.adminId.role}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right font-black text-red-600 text-xs sm:text-sm whitespace-nowrap">
                        {exp.amount?.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-semibold">
                          MMK
                        </span>
                      </TableCell>

                      {userRole === "owner" && (
                        <TableCell className="text-center whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setExpenseToDelete(exp)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

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
        confirmButtonColor="red"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setExpenseToDelete(null)}
        isLoading={isDeleting}
      />
    </Card>
  );
};
