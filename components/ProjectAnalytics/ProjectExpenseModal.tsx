import React, { useState, useEffect } from "react";
import { X, Plus, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { createExpense } from "../../services/Expense/createExpense";
import {
  fetchLocationProfiles,
  LocationProfile,
} from "../../services/Location/fetchLocationProfiles";
import { useLanguage } from "../../context/LanguageContext";

interface ProjectExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  onExpenseCreated: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "materials", labelEn: "Materials", labelMy: "ပစ္စည်းဝယ်ယူစရိတ်" },
  { value: "labor", labelEn: "Labor / Wages", labelMy: "လုပ်အားခ / နေ့စားခ" },
  { value: "transportation", labelEn: "Transportation", labelMy: "သယ်ယူပို့ဆောင်ခ" },
  { value: "electricity", labelEn: "Electricity", labelMy: "မီးဖိုး" },
  { value: "water", labelEn: "Water", labelMy: "ရေဖိုး" },
  { value: "utilities", labelEn: "Utilities", labelMy: "အထွေထွေ အသုံးစရိတ်" },
  { value: "salary", labelEn: "Salary", labelMy: "လစာ" },
  { value: "maintenance", labelEn: "Maintenance", labelMy: "ပြုပြင်ထိန်းသိမ်းစရိတ်" },
  { value: "rent", labelEn: "Rent", labelMy: "အငှားခ" },
  { value: "other", labelEn: "Other", labelMy: "အခြား" },
];

export const ProjectExpenseModal: React.FC<ProjectExpenseModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onExpenseCreated,
}) => {
  const { t, language } = useLanguage();
  const [locations, setLocations] = useState<LocationProfile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category: "materials",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    notes: "",
    locationId: "",
  });

  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  useEffect(() => {
    if (isOpen) {
      loadLocations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadLocations = async () => {
    try {
      const response = await fetchLocationProfiles();
      if (response.success && response.data) {
        setLocations(response.data);
        if (response.data.length > 0 && !formData.locationId) {
          setFormData((prev) => ({
            ...prev,
            locationId: response.data[0]._id,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      category: "materials",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      notes: "",
      locationId: locations[0]?._id || "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || formData.amount <= 0 || !formData.date) {
      toast.error(t("expenses.fillRequiredFields") || "Please fill in all required fields");
      return;
    }

    if (userRole !== "cashier" && !formData.locationId) {
      toast.error("Please select a location");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        category: formData.category,
        amount: Number(formData.amount),
        date: formData.date,
        projectId: projectId,
        notes: formData.notes ? formData.notes.trim() : undefined,
      };

      if (userRole !== "cashier" && formData.locationId) {
        payload.locationId = formData.locationId;
      }

      const res = await createExpense(payload);

      if (res.success) {
        toast.success(t("projects.expenseAddedSuccess") || "Project expense recorded successfully");
        handleClose();
        onExpenseCreated();
      } else {
        toast.error(res.message || t("expenses.failedToCreate") || "Failed to record expense");
      }
    } catch (error: any) {
      console.error("Error creating project expense:", error);
      toast.error(error.message || t("expenses.failedToCreate") || "Failed to record expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ocean-50 border border-ocean-100 flex items-center justify-center text-ocean-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {t("projects.addExpense") || "Add Project Expense"}
              </h2>
              {projectName && (
                <p className="text-xs text-ocean-600 font-semibold truncate max-w-[240px]">
                  {projectName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t("expenses.category") || "Category"} <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all cursor-pointer"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {language === "my" ? cat.labelMy : cat.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t("expenses.amount") || "Amount"} (MMK) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-14 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: Number(e.target.value),
                  })
                }
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                MMK
              </span>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t("expenses.date") || "Date"} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all cursor-pointer"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>

          {/* Location (Admin / Owner) */}
          {userRole !== "cashier" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all cursor-pointer"
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
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t("expenses.notesOptional") || "Notes (Optional)"}
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder={t("expenses.notesPlaceholder") || "Enter expense details..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all resize-none"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {t("common.cancel") || "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-ocean-600 text-white hover:bg-ocean-700 transition-all shadow-md shadow-ocean-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("common.processing") || "Saving..."}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{t("common.save") || "Save Expense"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
