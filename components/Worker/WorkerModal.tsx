import React, { useEffect, useState, useMemo } from "react";
import { X, Save, Users, Trash2, ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Worker,
  createWorker,
  updateWorker,
  deleteWorker,
} from "../../services/Worker/worker.service";
import { useLanguage } from "../../context/LanguageContext";

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null; // null => create mode
  existingPositions?: string[];
  onSaved: () => void;
}

const WORKER_POSITION_PRESETS = [
  {
    value: "T1",
    labelEn: "T1 (Senior Technician)",
    labelMy: "T1 (ကျွမ်းကျင်အဆင့် ၁)",
  },
  {
    value: "T2",
    labelEn: "T2 (Skilled Worker)",
    labelMy: "T2 (ကျွမ်းကျင်အဆင့် ၂)",
  },
  {
    value: "T3",
    labelEn: "T3 (Helper / General)",
    labelMy: "T3 (အကူလုပ်သား)",
  },
  {
    value: "Mason / Bricklayer",
    labelEn: "Mason / Bricklayer",
    labelMy: "ပန်းရံကျွမ်းကျင်",
  },
  {
    value: "Plumber / Piping Specialist",
    labelEn: "Plumber / Piping Specialist",
    labelMy: "ပိုက်လိုင်းကျွမ်းကျင်",
  },
  {
    value: "Electrician",
    labelEn: "Electrician",
    labelMy: "လျှပ်စစ်ကျွမ်းကျင်",
  },
  {
    value: "Tiler / Finisher",
    labelEn: "Tiler / Finisher",
    labelMy: "ကြွေပြားကပ်ကျွမ်းကျင်",
  },
  {
    value: "Waterproofing Specialist",
    labelEn: "Waterproofing Specialist",
    labelMy: "ရေလုံ ရေကာကျွမ်းကျင်",
  },
  {
    value: "Site Supervisor / Foreman",
    labelEn: "Site Supervisor / Foreman",
    labelMy: "ဆိုဒ်တာဝန်ခံ / ဖိုမင်",
  },
  {
    value: "General Labor",
    labelEn: "General Labor",
    labelMy: "အထွေထွေ အကူလုပ်သား",
  },
];

const STORAGE_KEY = "custom_worker_positions";

const getStoredWorkerPositions = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveWorkerPositionToStorage = (positionName: string) => {
  const trimmed = positionName.trim();
  if (!trimmed) return;
  try {
    const current = getStoredWorkerPositions();
    if (!current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [trimmed, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error("Failed to save custom worker position", err);
  }
};

export const WorkerModal: React.FC<WorkerModalProps> = ({
  isOpen,
  onClose,
  worker,
  existingPositions = [],
  onSaved,
}) => {
  const { language } = useLanguage();
  const isMy = language === "my";

  const [form, setForm] = useState<Partial<Worker>>({
    name: "",
    phone: "",
    position: "T2",
    dailyRate: 0,
    telegramId: "",
    remark: "",
  });

  // Combobox position states
  const [positionInput, setPositionInput] = useState("");
  const [positionShowDropdown, setPositionShowDropdown] = useState(false);
  const [customPositions, setCustomPositions] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      setCustomPositions(getStoredWorkerPositions());
      setPositionInput("");
      setPositionShowDropdown(false);

      if (worker) {
        setForm({
          name: worker.name || "",
          phone: worker.phone || "",
          position: worker.position || "T2",
          dailyRate: worker.dailyRate || 0,
          telegramId: worker.telegramId || "",
          remark: worker.remark || "",
        });
      } else {
        setForm({
          name: "",
          phone: "",
          position: "T2",
          dailyRate: 0,
          telegramId: "",
          remark: "",
        });
      }
    }
  }, [isOpen, worker]);

  // Build unique position list
  const allPositions = useMemo(() => {
    const map = new Map<
      string,
      { value: string; labelMy?: string; isCustom?: boolean }
    >();

    // 1. Presets
    WORKER_POSITION_PRESETS.forEach((preset) => {
      map.set(preset.value.toLowerCase(), {
        value: preset.value,
        labelMy: preset.labelMy,
        isCustom: false,
      });
    });

    // 2. Existing positions in the worker list
    if (existingPositions) {
      existingPositions.forEach((pos) => {
        const trimmed = pos.trim();
        if (trimmed && !map.has(trimmed.toLowerCase())) {
          map.set(trimmed.toLowerCase(), {
            value: trimmed,
            isCustom: true,
          });
        }
      });
    }

    // 3. User's saved custom positions from localStorage
    customPositions.forEach((pos) => {
      const trimmed = pos.trim();
      if (trimmed && !map.has(trimmed.toLowerCase())) {
        map.set(trimmed.toLowerCase(), {
          value: trimmed,
          isCustom: true,
        });
      }
    });

    return Array.from(map.values());
  }, [existingPositions, customPositions]);

  const filteredPositions = useMemo(() => {
    const q = (positionInput || form.position || "").toLowerCase().trim();
    if (!q) return allPositions;
    return allPositions.filter(
      (p) =>
        p.value.toLowerCase().includes(q) ||
        (p.labelMy && p.labelMy.toLowerCase().includes(q))
    );
  }, [allPositions, positionInput, form.position]);

  const isExactPositionMatch = useMemo(() => {
    const q = (positionInput || form.position || "").toLowerCase().trim();
    if (!q) return true;
    return allPositions.some((p) => p.value.toLowerCase() === q);
  }, [allPositions, positionInput, form.position]);

  const handleSelectPosition = (val: string) => {
    setForm((f) => ({ ...f, position: val }));
    setPositionInput("");
    setPositionShowDropdown(false);
  };

  const handleAddCustomPosition = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    saveWorkerPositionToStorage(trimmed);
    setCustomPositions(getStoredWorkerPositions());
    setForm((f) => ({ ...f, position: trimmed }));
    setPositionInput("");
    setPositionShowDropdown(false);
  };

  if (!isOpen) return null;

  const set = (field: keyof Worker, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast.error(isMy ? "လုပ်သားအမည် ထည့်သွင်းပါ" : "Name is required");
      return;
    }

    const selectedPosition = (form.position || "").trim();
    if (selectedPosition) {
      saveWorkerPositionToStorage(selectedPosition);
    }

    setSaving(true);
    try {
      const payload: Partial<Worker> = {
        name: form.name.trim(),
        phone: form.phone ? form.phone.trim() : "",
        position: selectedPosition || "T2",
        dailyRate: Number(form.dailyRate) || 0,
        telegramId: form.telegramId ? form.telegramId.trim() : "",
        remark: form.remark ? form.remark.trim() : "",
      };

      if (worker) {
        await updateWorker(worker._id, payload);
        toast.success(
          isMy ? "လုပ်သားအချက်အလက် ပြင်ဆင်ပြီးပါပြီ" : "Worker updated successfully"
        );
      } else {
        await createWorker(payload);
        toast.success(
          isMy ? "လုပ်သားသစ် ထည့်သွင်းပြီးပါပြီ" : "Worker created successfully"
        );
      }
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save worker");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!worker) return;
    setDeleting(true);
    try {
      await deleteWorker(worker._id);
      toast.success(
        isMy ? "လုပ်သား ပယ်ဖျက်ပြီးပါပြီ" : "Worker deleted successfully"
      );
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete worker");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-ocean-50 text-ocean-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {worker
                  ? isMy
                    ? "လုပ်သားအချက်အလက် ပြင်ဆင်မည်"
                    : "Edit Worker"
                  : isMy
                  ? "လုပ်သားသစ် ထည့်သွင်းမည်"
                  : "Create Worker"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer bg-transparent border-none"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              {isMy ? "လုပ်သား အမည်" : "Full Name"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white font-semibold"
              placeholder="e.g. Mg Mg"
              value={form.name || ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              {isMy ? "ဖုန်းနံပါတ်" : "Phone Number"}
            </label>
            <input
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white"
              placeholder="e.g. 09xxxxxxxxx"
              value={form.phone || ""}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          {/* Position / Trade Combobox */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                {isMy ? "ရာထူး / ကျွမ်းကျင်မှု" : "Position / Trade"}
              </label>
              <span className="text-[11px] text-slate-400 font-normal">
                {isMy ? "စိတ်ကြိုက် ရိုက်ထည့်နိုင်ပါသည်" : "Type custom or select"}
              </span>
            </div>

            <div className="relative">
              <div className="relative flex items-center">
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:border-ocean-600 focus:ring-2 focus:ring-ocean-600/10 transition-all outline-none font-semibold text-slate-800"
                  placeholder={
                    isMy
                      ? "ရာထူး ရွေးချယ်ပါ သို့မဟုတ် ရိုက်ထည့်ပါ..."
                      : "Type or select position (T1, T2, Plumber...)"
                  }
                  value={
                    positionInput !== "" ? positionInput : form.position || ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setPositionInput(val);
                    set("position", val);
                    setPositionShowDropdown(true);
                  }}
                  onFocus={() => setPositionShowDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setPositionShowDropdown(false), 220);
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setPositionShowDropdown((prev) => !prev)}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      positionShowDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {positionShowDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto p-1.5 space-y-1">
                  {/* Create custom position option */}
                  {(positionInput || form.position || "").trim() &&
                    !isExactPositionMatch && (
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddCustomPosition(
                            positionInput || form.position || ""
                          );
                        }}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-800 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {isMy
                              ? "ရာထူးအသစ် ထည့်မည်:"
                              : "Add custom position:"}{" "}
                            <strong className="underline">
                              "{(positionInput || form.position || "").trim()}"
                            </strong>
                          </span>
                        </span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                          + Add
                        </span>
                      </div>
                    )}

                  {/* Suggestions list */}
                  {filteredPositions.length > 0 ? (
                    filteredPositions.map((pos) => {
                      const currentVal =
                        positionInput !== ""
                          ? positionInput
                          : form.position || "";
                      const isSelected =
                        currentVal.toLowerCase().trim() ===
                        pos.value.toLowerCase().trim();

                      return (
                        <div
                          key={pos.value}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectPosition(pos.value);
                          }}
                          className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected
                              ? "bg-ocean-50 text-ocean-700 font-bold"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span className="truncate">
                            {pos.value}
                            {pos.labelMy && isMy && (
                              <span className="text-slate-400 font-normal ml-1.5">
                                ({pos.labelMy})
                              </span>
                            )}
                          </span>
                          {pos.isCustom && (
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
                        ? "ကိုက်ညီသော ရာထူး မရှိပါ"
                        : "No matching position"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Daily Rate & Telegram ID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {isMy ? "တစ်ရက် လုပ်ခ (ကျပ်)" : "Daily Rate (Ks)"}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white font-semibold"
                placeholder="e.g. 15000"
                value={form.dailyRate ?? 0}
                onChange={(e) => set("dailyRate", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Telegram ID
              </label>
              <input
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white font-mono"
                placeholder="e.g. 123456789"
                value={form.telegramId || ""}
                onChange={(e) => set("telegramId", e.target.value)}
              />
            </div>
          </div>

          {/* Remark / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              {isMy ? "မှတ်ချက် / အသေးစိတ်" : "Remark / Notes"}{" "}
              <span className="text-slate-400 font-normal lowercase">
                ({isMy ? "မဖြစ်မနေ မလိုပါ" : "optional"})
              </span>
            </label>
            <textarea
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white"
              placeholder={
                isMy
                  ? "ဥပမာ - ရေပိုက်လိုင်းကျွမ်းကျင် လုပ်သက် ၅ နှစ်၊ အရေးပေါ် ဆက်သွယ်ရန်..."
                  : "e.g. Specialized in swimming pool piping, 5 years experience..."
              }
              value={form.remark || ""}
              onChange={(e) => set("remark", e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3">
          {worker ? (
            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-red-200 hover:bg-red-50 text-red-600 transition-all flex items-center gap-1 cursor-pointer bg-transparent"
            >
              <Trash2 className="w-4 h-4" />
              {isMy ? "ဖျက်မည်" : "Delete"}
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
            >
              {isMy ? "ပယ်ဖျက်မည်" : "Cancel"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 shadow-md shadow-ocean-600/10 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isMy ? "သိမ်းဆည်းမည်" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {isMy ? "လုပ်သား ဖျက်ရန် သေချာပါသလား?" : "Delete Worker?"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {isMy ? (
                <>
                  <span className="font-semibold text-slate-800">
                    "{worker?.name}"
                  </span>{" "}
                  လုပ်သားကို ဖျက်ပစ်ပါမည်။ ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍ မရနိုင်ပါ။
                </>
              ) : (
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-800">
                    "{worker?.name}"
                  </span>
                  ? This action cannot be undone.
                </>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
              >
                {isMy ? "မဖျက်တော့ပါ" : "Cancel"}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full shadow-md shadow-red-600/10 transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting
                  ? isMy
                    ? "ဖျက်နေပါသည်..."
                    : "Deleting..."
                  : isMy
                  ? "ဖျက်မည်"
                  : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Loader2: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={`animate-spin ${className || "w-4 h-4"}`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
