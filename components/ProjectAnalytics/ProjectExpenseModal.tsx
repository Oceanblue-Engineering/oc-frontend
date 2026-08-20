import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { createExpense } from "../../services/Expense/createExpense";
import {
  fetchLocationProfiles,
  LocationProfile,
} from "../../services/Location/fetchLocationProfiles";
import { useLanguage } from "../../context/LanguageContext";
import { Modal, Button, Input, Select } from "../ui";

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
  {
    value: "transportation",
    labelEn: "Transportation",
    labelMy: "သယ်ယူပို့ဆောင်ခ",
  },
  { value: "electricity", labelEn: "Electricity", labelMy: "မီးဖိုး" },
  { value: "water", labelEn: "Water", labelMy: "ရေဖိုး" },
  {
    value: "utilities",
    labelEn: "Utilities",
    labelMy: "အထွေထွေ အသုံးစရိတ်",
  },
  { value: "salary", labelEn: "Salary", labelMy: "လစာ" },
  {
    value: "maintenance",
    labelEn: "Maintenance",
    labelMy: "ပြုပြင်ထိန်းသိမ်းစရိတ်",
  },
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
      toast.error(
        t("expenses.fillRequiredFields") ||
          "Please fill in all required fields"
      );
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
        toast.success(
          t("projects.expenseAddedSuccess") ||
            "Project expense recorded successfully"
        );
        handleClose();
        onExpenseCreated();
      } else {
        toast.error(
          res.message ||
            t("expenses.failedToCreate") ||
            "Failed to record expense"
        );
      }
    } catch (error: any) {
      console.error("Error creating project expense:", error);
      toast.error(
        error.message ||
          t("expenses.failedToCreate") ||
          "Failed to record expense"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("projects.addExpense") || "Add Project Expense"}
      description={
        projectName ? `Recording expense for: ${projectName}` : undefined
      }
      size="default"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            {t("expenses.category") || "Category"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Select
            required
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
          </Select>
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            {t("expenses.amount") || "Amount"} (MMK){" "}
            <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            required
            min="1"
            step="any"
            placeholder="0"
            rightIcon={<span className="text-xs font-bold text-slate-400">MMK</span>}
            value={formData.amount || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: Number(e.target.value),
              })
            }
          />
        </div>

        {/* Date */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            {t("expenses.date") || "Date"}{" "}
            <span className="text-red-500">*</span>
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

        {/* Location (Admin / Owner) */}
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

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            {t("expenses.notes") || "Notes"}{" "}
            <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            maxLength={500}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/10 transition-all outline-none"
            placeholder={
              t("expenses.notesPlaceholder") ||
              "e.g. 50 bags of cement, transportation invoice..."
            }
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleClose}
          >
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            type="submit"
            variant="default"
            size="default"
            isLoading={isSubmitting}
          >
            {t("projects.addExpense") || "Record Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
