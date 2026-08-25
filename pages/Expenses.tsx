import React, { useState, useEffect } from "react";
import {
  PieChart,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Search,
  Receipt,
  Building2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { fetchExpenses, Expense } from "../services/Expense/fetchExpenses";
import { createExpense } from "../services/Expense/createExpense";
import { updateExpense } from "../services/Expense/updateExpense";
import { deleteExpense } from "../services/Expense/deleteExpense";
import {
  fetchLocationProfiles,
  LocationProfile,
} from "../services/Location/fetchLocationProfiles";
import { useLanguage } from "../context/LanguageContext";
import { fetchProjects, Project } from "../services/Project/project.service";
import { ConfirmModal } from "../components/Common/ConfirmModal";
import { DateRangePicker } from "../components/Reports/DateRangePicker";
import {
  DATE_RANGE_STORAGE_KEYS,
  createDateRangeInitializer,
  saveStoredDateRange,
} from "../utils/dateRangeStorage";
import {
  PageHeader,
  StatsCard,
  Input,
  Select,
  Button,
  Badge,
  Modal,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
} from "../components/ui";

export const Expenses: React.FC = () => {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<LocationProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");

  // Date filter — restored from sessionStorage on mount
  const [dateRange, setDateRange] = useState(
    createDateRangeInitializer(DATE_RANGE_STORAGE_KEYS.expenses),
  );
  const { startDate, endDate } = dateRange;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "electricity",
    amount: 0,
    date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
    notes: "",
    locationId: "",
    projectId: "",
  });

  // Delete Confirmation Modal State
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    loadLocations();
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetchProjects();
      if (response.success && response.data) {
        setProjects(response.data.clients || []);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await fetchLocationProfiles();
      if (response.success && response.data) {
        setLocations(response.data);
      } else {
        toast.error(response.message || "Failed to load locations");
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      toast.error("Failed to load locations");
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetchExpenses(startDate, endDate);
      if (response.success && response.data) {
        setExpenses(response.data);
      } else {
        toast.error(response.message || t("expenses.fetchFailed"));
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast.error(t("expenses.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingId(expense._id);
    setFormData({
      category: expense.category,
      amount: expense.amount,
      date: new Date(expense.date).toISOString().split("T")[0],
      notes: expense.notes || "",
      locationId: expense.locationId ? expense.locationId._id : "",
      projectId: expense.projectId ? expense.projectId._id : "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      category: "electricity",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      notes: "",
      locationId: "",
      projectId: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.amount || !formData.date) {
      toast.error(t("expenses.fillRequired"));
      return;
    }

    if (userRole !== "cashier" && !formData.locationId) {
      toast.error("Please select a location");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        const response = await updateExpense(editingId, {
          category: formData.category,
          amount: formData.amount,
          date: formData.date,
          notes: formData.notes,
          locationId: formData.locationId,
          projectId: formData.projectId || undefined,
        });

        if (response.success) {
          toast.success(t("expenses.updateSuccess"));
          handleCloseModal();
          loadExpenses();
        } else {
          toast.error(response.message || t("expenses.updateFailed"));
        }
      } else {
        const payload: any = {
          category: formData.category,
          amount: formData.amount,
          date: formData.date,
          notes: formData.notes,
          projectId: formData.projectId || undefined,
        };

        if (formData.locationId) {
          payload.locationId = formData.locationId;
        }

        const response = await createExpense(payload);

        if (response.success) {
          toast.success(t("expenses.createSuccess"));
          handleCloseModal();
          loadExpenses();
        } else {
          toast.error(response.message || t("expenses.createFailed"));
        }
      }
    } catch (error) {
      console.error("Error submitting expense:", error);
      toast.error(
        editingId ? t("expenses.updateFailed") : t("expenses.createFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      setIsDeleting(true);
      const response = await deleteExpense(expenseToDelete._id);
      if (response.success) {
        toast.success(t("expenses.deleteSuccess"));
        setExpenseToDelete(null);
        loadExpenses();
      } else {
        toast.error(response.message || t("expenses.deleteFailed"));
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error(t("expenses.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const filteredExpenses = expenses.filter((expense) => {
    const query = search.toLowerCase();
    return (
      expense.category.toLowerCase().includes(query) ||
      (expense.notes && expense.notes.toLowerCase().includes(query)) ||
      (expense.locationId &&
        expense.locationId.locationName.toLowerCase().includes(query)) ||
      (expense.projectId &&
        expense.projectId.siteName.toLowerCase().includes(query)) ||
      (expense.adminId &&
        expense.adminId.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title={t("expenses.title")}
        subtitle={t("expenses.subtitle")}
        icon={<Receipt className="w-5 h-5" />}
        actions={
          <>
            <Button
              variant="outline"
              size="default"
              onClick={loadExpenses}
              disabled={loading}
              leftIcon={
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              }
            >
              {t("storefront.refresh")}
            </Button>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(newStartDate, newEndDate) => {
                if (!newStartDate || !newEndDate) return;
                setDateRange({
                  startDate: newStartDate,
                  endDate: newEndDate,
                });
                saveStoredDateRange(
                  DATE_RANGE_STORAGE_KEYS.expenses,
                  newStartDate,
                  newEndDate,
                );
              }}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            />
            <Button
              variant="default"
              size="default"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t("expenses.addExpense")}
            </Button>
          </>
        }
      />

      {/* KPI Stats Row & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        <StatsCard
          label={t("expenses.totalExpenses")}
          value={`${totalExpenses.toLocaleString()} MMK`}
          subValue={`${expenses.length} Records in selected period`}
          icon={<PieChart className="w-5 h-5" />}
          variant="rose"
        />

        <div className="md:col-span-2 flex items-end">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder={t("credits.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Data Table */}
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-center">No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableEmpty
                colSpan={9}
                message={t("expenses.loading")}
                icon={<RefreshCw className="w-6 h-6 animate-spin text-ocean-600" />}
              />
            ) : filteredExpenses.length === 0 ? (
              <TableEmpty
                colSpan={9}
                message={t("expenses.noExpenses")}
                icon={<Receipt className="w-6 h-6 text-slate-300" />}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    {t("expenses.addExpense")}
                  </Button>
                }
              />
            ) : (
              filteredExpenses.map((expense, index) => (
                <TableRow key={expense._id}>
                  <TableCell className="text-center font-bold text-slate-400 text-xs">
                    {String(index + 1).padStart(2, "0")}
                  </TableCell>

                  <TableCell className="text-xs font-medium whitespace-nowrap text-slate-600">
                    {new Date(expense.date).toLocaleDateString("en-US")}{" "}
                    <span className="text-slate-400">
                      {new Date(expense.date).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="purple" className="capitalize">
                      {expense.category}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {expense.locationId ? (
                      <div>
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {expense.locationId.locationName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {expense.locationId.locationCode}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">
                        {t("expenses.noLocation")}
                      </span>
                    )}
                  </TableCell>

                  <TableCell
                    className="text-slate-500 text-xs max-w-xs truncate"
                    title={expense.notes || ""}
                  >
                    {expense.notes || "-"}
                  </TableCell>

                  <TableCell>
                    {expense.projectId ? (
                      <Badge variant="default">
                        {expense.projectId.siteName}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {expense.adminId ? (
                      <div>
                        <div className="font-semibold text-slate-800 text-xs">
                          {expense.adminId.name}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {expense.adminId.role}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right font-black text-red-600 text-xs sm:text-sm whitespace-nowrap">
                    {expense.amount.toLocaleString()}{" "}
                    <span className="text-[10px] text-slate-400 font-semibold">
                      MMK
                    </span>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="subtle"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(expense)}
                        title={t("common.edit")}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(expense)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title={t("common.delete") || "Delete"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          editingId ? t("expenses.editExpense") : t("expenses.newExpense")
        }
        description="Fill in expense details to record expenditure"
        size="default"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {t("expenses.category")} <span className="text-red-500">*</span>
            </label>
            <Select
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option value="electricity">{t("expenses.electricity")}</option>
              <option value="water">{t("expenses.water")}</option>
              <option value="utilities">{t("expenses.utilities")}</option>
              <option value="salary">{t("expenses.salary")}</option>
              <option value="maintenance">{t("expenses.maintenance")}</option>
              <option value="rent">{t("expenses.rent")}</option>
              <option value="other">{t("expenses.other")}</option>
            </Select>
          </div>

          {userRole !== "cashier" && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Location <span className="text-red-500">*</span>
              </label>
              <Select
                required
                value={formData.locationId}
                onChange={(e) =>
                  setFormData({ ...formData, locationId: e.target.value })
                }
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.locationName} ({location.locationCode})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Optional Project Link */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Link to Project{" "}
              <span className="text-slate-400 text-xs font-normal">
                (Optional)
              </span>
            </label>
            <Select
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
            >
              <option value="">— No Project —</option>
              {projects.map((project: any) => (
                <option key={project._id} value={project._id}>
                  {project.siteName}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {t("expenses.amount")} (MMK){" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0"
              value={formData.amount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {t("expenses.date")} <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {t("expenses.notesOptional")}
            </label>
            <textarea
              rows={3}
              maxLength={500}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/10 transition-all outline-none"
              placeholder={t("expenses.notesPlaceholder")}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleCloseModal}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="default"
              isLoading={isSubmitting}
            >
              {editingId
                ? t("expenses.updateExpense")
                : t("expenses.createExpense")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        title={t("expenses.deleteExpense") || "Delete Expense"}
        message={
          expenseToDelete
            ? t("expenses.confirmDeleteMessage")?.replace(
                "{amount}",
                expenseToDelete.amount.toLocaleString(),
              ) ||
              `Are you sure you want to delete this expense of ${expenseToDelete.amount.toLocaleString()} MMK? This action cannot be undone.`
            : t("expenses.confirmDelete") ||
              "Are you sure you want to delete this expense?"
        }
        confirmText={t("common.delete") || "Delete"}
        cancelText={t("common.cancel") || "Cancel"}
        confirmButtonColor="red"
        onConfirm={handleConfirmDelete}
        onCancel={() => setExpenseToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
