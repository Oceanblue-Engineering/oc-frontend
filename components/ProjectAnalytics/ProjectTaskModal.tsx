import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ChevronDown, Plus, CheckSquare } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { Modal, Button, Input } from "../ui";
import {
  ProjectTask,
  createProjectTask,
  updateProjectTask,
} from "../../services/ProjectTask/projectTask.service";

interface ProjectTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  existingCategories?: string[];
  taskToEdit?: ProjectTask | null;
  onTaskSaved: () => void;
}

const TASK_CATEGORY_PRESETS = [
  {
    value: "Structure & Concrete",
    labelEn: "Structure & Concrete",
    labelMy: "ကွန်ကရစ်နှင့် ဖွဲ့စည်းတည်ဆောက်မှု",
  },
  {
    value: "Excavation & Earthwork",
    labelEn: "Excavation & Earthwork",
    labelMy: "မြေတူးခြင်းနှင့် အောက်ခြေလုပ်ငန်း",
  },
  {
    value: "Waterproofing",
    labelEn: "Waterproofing",
    labelMy: "ရေလုံ ရေကာလုပ်ငန်း",
  },
  {
    value: "Piping & Plumbing",
    labelEn: "Piping & Plumbing",
    labelMy: "ပိုက်လိုင်းနှင့် ရေပိုက်စနစ်",
  },
  {
    value: "Tiling & Finishing",
    labelEn: "Tiling & Finishing",
    labelMy: "ကြွေပြားကပ်ခြင်းနှင့် အချောသတ်လုပ်ငန်း",
  },
  {
    value: "Electrical & Lighting",
    labelEn: "Electrical & Lighting",
    labelMy: "လျှပ်စစ်နှင့် မီးအလှဆင်လုပ်ငန်း",
  },
  {
    value: "Filtration & Pump System",
    labelEn: "Filtration & Pump System",
    labelMy: "ရေစစ်စနစ်နှင့် မော်တာတပ်ဆင်ခြင်း",
  },
  {
    value: "Chemical Treatment",
    labelEn: "Chemical Treatment",
    labelMy: "ရေကူးကန် ဆေးခတ်ခြင်း/စစ်ဆေးခြင်း",
  },
  {
    value: "Testing & Inspection",
    labelEn: "Testing & Inspection",
    labelMy: "စမ်းသပ်စစ်ဆေးခြင်း",
  },
  {
    value: "Cleaning & Handover",
    labelEn: "Cleaning & Handover",
    labelMy: "သန့်ရှင်းရေးနှင့် လုပ်ငန်းအပ်နှံခြင်း",
  },
  {
    value: "General Maintenance",
    labelEn: "General Maintenance",
    labelMy: "အထွေထွေ ပြုပြင်ထိန်းသိမ်းမှု",
  },
  {
    value: "Other",
    labelEn: "Other",
    labelMy: "အခြား",
  },
];

const TASK_STORAGE_KEY = "custom_project_task_categories";

const getStoredTaskCategories = (): string[] => {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveTaskCategoryToStorage = (categoryName: string) => {
  const trimmed = categoryName.trim();
  if (!trimmed) return;
  try {
    const current = getStoredTaskCategories();
    if (!current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [trimmed, ...current];
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error("Failed to save custom task category", err);
  }
};

export const ProjectTaskModal: React.FC<ProjectTaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  existingCategories = [],
  taskToEdit,
  onTaskSaved,
}) => {
  const { language } = useLanguage();
  const isMy = language === "my";

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combobox states
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryShowDropdown, setCategoryShowDropdown] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    taskName: "",
    date: new Date().toISOString().split("T")[0],
    category: "Structure & Concrete",
    remark: "",
  });

  useEffect(() => {
    if (isOpen) {
      setCustomCategories(getStoredTaskCategories());
      if (taskToEdit) {
        setFormData({
          taskName: taskToEdit.taskName || "",
          date: taskToEdit.date
            ? new Date(taskToEdit.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          category: taskToEdit.category || "Structure & Concrete",
          remark: taskToEdit.remark || "",
        });
      } else {
        setFormData({
          taskName: "",
          date: new Date().toISOString().split("T")[0],
          category: "Structure & Concrete",
          remark: "",
        });
      }
      setCategoryInput("");
      setCategoryShowDropdown(false);
    }
  }, [isOpen, taskToEdit]);

  // Build unique category list
  const allCategories = useMemo(() => {
    const map = new Map<
      string,
      { value: string; labelMy?: string; isCustom?: boolean }
    >();

    // 1. Presets
    TASK_CATEGORY_PRESETS.forEach((preset) => {
      map.set(preset.value.toLowerCase(), {
        value: preset.value,
        labelMy: preset.labelMy,
        isCustom: false,
      });
    });

    // 2. Existing categories from project tasks
    if (existingCategories) {
      existingCategories.forEach((cat) => {
        const trimmed = cat.trim();
        if (trimmed && !map.has(trimmed.toLowerCase())) {
          map.set(trimmed.toLowerCase(), {
            value: trimmed,
            isCustom: true,
          });
        }
      });
    }

    // 3. User's saved custom categories
    customCategories.forEach((cat) => {
      const trimmed = cat.trim();
      if (trimmed && !map.has(trimmed.toLowerCase())) {
        map.set(trimmed.toLowerCase(), {
          value: trimmed,
          isCustom: true,
        });
      }
    });

    return Array.from(map.values());
  }, [existingCategories, customCategories]);

  const filteredCategories = useMemo(() => {
    const q = (categoryInput || formData.category || "").toLowerCase().trim();
    if (!q) return allCategories;
    return allCategories.filter(
      (c) =>
        c.value.toLowerCase().includes(q) ||
        (c.labelMy && c.labelMy.toLowerCase().includes(q))
    );
  }, [allCategories, categoryInput, formData.category]);

  const isExactCategoryMatch = useMemo(() => {
    const q = (categoryInput || formData.category || "").toLowerCase().trim();
    if (!q) return true;
    return allCategories.some((c) => c.value.toLowerCase() === q);
  }, [allCategories, categoryInput, formData.category]);

  const handleSelectCategory = (val: string) => {
    setFormData((prev) => ({ ...prev, category: val }));
    setCategoryInput("");
    setCategoryShowDropdown(false);
  };

  const handleAddCustomCategory = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    saveTaskCategoryToStorage(trimmed);
    setCustomCategories(getStoredTaskCategories());
    setFormData((prev) => ({ ...prev, category: trimmed }));
    setCategoryInput("");
    setCategoryShowDropdown(false);
  };

  const resetForm = () => {
    setFormData({
      taskName: "",
      date: new Date().toISOString().split("T")[0],
      category: "Structure & Concrete",
      remark: "",
    });
    setCategoryInput("");
    setCategoryShowDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCategory = (formData.category || "").trim();
    if (!formData.taskName.trim() || !selectedCategory || !formData.date) {
      toast.error(
        isMy
          ? "လုပ်ငန်းအမည်၊ နေ့စွဲ နှင့် အမျိုးအစားတို့ကို ဖြည့်စွက်ပါ"
          : "Please fill in all required fields"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      saveTaskCategoryToStorage(selectedCategory);

      if (taskToEdit) {
        await updateProjectTask(taskToEdit._id, {
          taskName: formData.taskName.trim(),
          date: formData.date,
          category: selectedCategory,
          remark: formData.remark.trim(),
          status: "completed",
        });
        toast.success(
          isMy
            ? "ပြီးစီးသွားသော လုပ်ငန်းမှတ်တမ်း ပြင်ဆင်ပြီးပါပြီ"
            : "Finished task updated successfully"
        );
      } else {
        await createProjectTask(projectId, {
          taskName: formData.taskName.trim(),
          date: formData.date,
          category: selectedCategory,
          remark: formData.remark.trim(),
          status: "completed",
        });
        toast.success(
          isMy
            ? "ပြီးစီးသွားသော လုပ်ငန်းအသစ် ထည့်သွင်းပြီးပါပြီ"
            : "Finished task recorded successfully"
        );
      }

      handleClose();
      onTaskSaved();
    } catch (error: any) {
      console.error("Error saving task:", error);
      toast.error(error.message || "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        taskToEdit
          ? isMy
            ? "ပြီးစီးသွားသော လုပ်ငန်းမှတ်တမ်း ပြင်ဆင်မည်"
            : "Edit Finished Task"
          : isMy
          ? "ပြီးစီးသွားသော လုပ်ငန်းသစ် မှတ်တမ်းတင်မည်"
          : "Record Finished Task"
      }
      description={
        projectName
          ? `${isMy ? "လုပ်ငန်းခွင်" : "Project"}: ${projectName}`
          : undefined
      }
      size="default"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Name */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            {isMy ? "လုပ်ငန်းအမည်" : "Task Name"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            required
            placeholder={
              isMy
                ? "ဥပမာ - ရေကန်အောက်ခြေ ဖောင်ဒေးရှင်း လောင်းခြင်း"
                : "e.g. Foundation concrete pouring..."
            }
            value={formData.taskName}
            onChange={(e) =>
              setFormData({ ...formData, taskName: e.target.value })
            }
          />
        </div>

        {/* Date */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            {isMy ? "ပြီးစီးသည့် နေ့စွဲ" : "Completion Date"}{" "}
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

        {/* Category Combobox */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              {isMy ? "လုပ်ငန်းအမျိုးအစား" : "Task Category"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-normal">
              {isMy ? "စိတ်ကြိုက် ရိုက်ထည့်နိုင်ပါသည်" : "Type custom or select"}
            </span>
          </div>

          <div className="relative">
            <div className="relative flex items-center">
              <input
                type="text"
                required
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/10 transition-all outline-none"
                placeholder={
                  isMy
                    ? "အမျိုးအစား ရွေးချယ်ပါ သို့မဟုတ် ရိုက်ထည့်ပါ..."
                    : "Type or select category..."
                }
                value={categoryInput !== "" ? categoryInput : formData.category}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategoryInput(val);
                  setFormData((prev) => ({ ...prev, category: val }));
                  setCategoryShowDropdown(true);
                }}
                onFocus={() => setCategoryShowDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setCategoryShowDropdown(false), 220);
                }}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setCategoryShowDropdown((prev) => !prev)}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    categoryShowDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {categoryShowDropdown && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto p-1.5 space-y-1">
                {/* Create custom category option */}
                {(categoryInput || formData.category).trim() &&
                  !isExactCategoryMatch && (
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddCustomCategory(
                          categoryInput || formData.category
                        );
                      }}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-800 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {isMy
                            ? "အမျိုးအစားအသစ် ထည့်မည်:"
                            : "Add custom category:"}{" "}
                          <strong className="underline">
                            "{(categoryInput || formData.category).trim()}"
                          </strong>
                        </span>
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                        + Add
                      </span>
                    </div>
                  )}

                {/* Suggestions list */}
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => {
                    const currentVal =
                      categoryInput !== ""
                        ? categoryInput
                        : formData.category;
                    const isSelected =
                      currentVal.toLowerCase().trim() ===
                      cat.value.toLowerCase().trim();

                    return (
                      <div
                        key={cat.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCategory(cat.value);
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between ${
                          isSelected
                            ? "bg-ocean-50 text-ocean-700 font-bold"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span className="truncate">
                          {cat.value}
                          {cat.labelMy && isMy && (
                            <span className="text-slate-400 font-normal ml-1.5">
                              ({cat.labelMy})
                            </span>
                          )}
                        </span>
                        {cat.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60 font-medium">
                            Custom
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-400 text-center">
                    {isMy
                      ? "ကိုက်ညီသော အမျိုးအစား မရှိပါ"
                      : "No matching category"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Remark */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            {isMy ? "မှတ်ချက် / အသေးစိတ်" : "Remark / Details"}{" "}
            <span className="text-slate-400 font-normal">
              ({isMy ? "မဖြစ်မနေ မလိုပါ" : "Optional"})
            </span>
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/10 transition-all outline-none"
            placeholder={
              isMy
                ? "လုပ်ငန်းဆောင်ရွက်ခဲ့မှု အသေးစိတ်မှတ်ချက် ရေးသွင်းပါ..."
                : "Enter any notes or progress remarks..."
            }
            value={formData.remark}
            onChange={(e) =>
              setFormData({ ...formData, remark: e.target.value })
            }
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleClose}
          >
            {isMy ? "ပယ်ဖျက်မည်" : "Cancel"}
          </Button>
          <Button
            type="submit"
            variant="default"
            size="default"
            isLoading={isSubmitting}
            leftIcon={<CheckSquare className="w-4 h-4" />}
          >
            {taskToEdit
              ? isMy
                ? "သိမ်းဆည်းမည်"
                : "Save Changes"
              : isMy
              ? "မှတ်တမ်းတင်မည်"
              : "Record Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
