import React, { useEffect, useState } from "react";
import { X, Save, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Worker, createWorker, updateWorker, deleteWorker } from "../../services/Worker/worker.service";

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null; // null => create mode
  onSaved: () => void;
}

export const WorkerModal: React.FC<WorkerModalProps> = ({
  isOpen,
  onClose,
  worker,
  onSaved,
}) => {
  const [form, setForm] = useState<Partial<Worker>>({
    name: "",
    phone: "",
    position: "",
    dailyRate: 0,
    telegramId: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      if (worker) {
        setForm({ ...worker });
      } else {
        setForm({
          name: "",
          phone: "",
          position: "",
          dailyRate: 0,
          telegramId: "",
        });
      }
    }
  }, [isOpen, worker]);

  if (!isOpen) return null;

  const set = (field: keyof Worker, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      if (worker) {
        await updateWorker(worker._id, form);
        toast.success("Worker updated successfully");
      } else {
        await createWorker(form);
        toast.success("Worker created successfully");
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
      toast.success("Worker deleted successfully");
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
                {worker ? "Edit Worker" : "Create Worker"}
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

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
            <input
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white font-semibold"
              placeholder="e.g. Mg Mg"
              value={form.name || ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone Number</label>
            <input
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white"
              placeholder="e.g. 09xxxxxxxxx"
              value={form.phone || ""}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Position / Trade</label>
            <select
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white font-semibold"
              value={form.position || ""}
              onChange={(e) => set("position", e.target.value)}
            >
              <option value="" disabled>Select Position (T1, T2, T3)</option>
              <option value="T1">T1</option>
              <option value="T2">T2</option>
              <option value="T3">T3</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Daily Rate (Ks)</label>
              <input
                type="number"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white"
                placeholder="e.g. 15000"
                value={form.dailyRate || 0}
                onChange={(e) => set("dailyRate", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telegram ID</label>
              <input
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white"
                placeholder="e.g. 123456789"
                value={form.telegramId || ""}
                onChange={(e) => set("telegramId", e.target.value)}
              />
            </div>
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
              Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 shadow-md shadow-ocean-600/10 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Worker?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{worker?.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full shadow-md shadow-red-600/10 transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Loader2: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className || "w-4 h-4"}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);
