import React, { useEffect, useState } from "react";
import { X, Save, Briefcase, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Project, createProject, updateProject, deleteProject } from "../../services/Project/project.service";
import { fetchCreditPersonas, CreditPersona } from "../../services/Credit/fetchCreditPersonas";
import { fetchWorkers, Worker as WorkerType } from "../../services/Worker/worker.service";
import { useLanguage } from "../../context/LanguageContext";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null; // null => create mode
  onSaved: () => void;
  onDeleted?: () => void; // optional: called after successful delete instead of onSaved
}

const PROJECT_STATUSES = ["Signed", "In-Development", "Delivered", "Completed"];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaved,
  onDeleted,
}) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<Partial<Project>>({
    siteName: "",
    description: "",
    customer: "",
    startDate: "",
    endDate: "",
    status: "Signed",
    workers: [],
  });
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [allWorkers, setAllWorkers] = useState<WorkerType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  const filteredPersonas = creditPersonas.filter((cp) => {
    const term = searchTerm.toLowerCase();
    return (
      cp.name.toLowerCase().includes(term) ||
      (cp.phone && cp.phone.includes(term))
    );
  });

  useEffect(() => {
    const loadCreditPersonas = async () => {
      try {
        const res = await fetchCreditPersonas();
        if (res.success) {
          setCreditPersonas(res.data || []);
        }
      } catch (err) {
        console.error("Failed to load credit personas", err);
      }
    };
    const loadWorkers = async () => {
      try {
        const res = await fetchWorkers();
        if (res.success) {
          setAllWorkers(res.data.workers || []);
        }
      } catch (err) {
        console.error("Failed to load workers", err);
      }
    };
    if (isOpen) {
      setIsOpenDropdown(false);
      setShowDeleteConfirm(false);
      setShowWorkerModal(false);
      loadCreditPersonas();
      loadWorkers();
      if (project) {
        setSearchTerm(project.customer || "");
        setForm({
          ...project,
          startDate: project.startDate ? project.startDate.split("T")[0] : "",
          endDate: project.endDate ? project.endDate.split("T")[0] : "",
          workers: project.workers ? project.workers.map((w: any) => typeof w === "string" ? w : w._id) : [],
        });
      } else {
        setSearchTerm("");
        setForm({
          siteName: "",
          description: "",
          customer: "",
          startDate: "",
          endDate: "",
          status: "Signed",
          workers: [],
        });
      }
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const set = (field: keyof Project, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleToggleWorker = (workerId: string) => {
    const current = form.workers || [];
    if (current.includes(workerId)) {
      set("workers", current.filter((id) => id !== workerId));
    } else {
      set("workers", [...current, workerId]);
    }
  };

  const handleSave = async () => {
    if (!form.siteName) {
      toast.error("Site name is required");
      return;
    }
    if (!form.customer) {
      toast.error("Customer name is required");
      return;
    }

    setSaving(true);
    try {
      if (project) {
        await updateProject(project._id, form);
        toast.success("Project updated successfully");
      } else {
        await createProject(form);
        toast.success("Project created successfully");
      }
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!project) return;
    setDeleting(true);
    try {
      await deleteProject(project._id);
      toast.success("Project deleted successfully");
      (onDeleted || onSaved)();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
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
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {project ? "Edit Project" : "Create Project"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Site Name</label>
            <input
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white font-semibold"
              placeholder="e.g. Parami Site A"
              value={form.siteName || ""}
              onChange={(e) => set("siteName", e.target.value)}
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Customer Name</label>
            <input
              type="text"
              placeholder="Search or type customer name..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white font-semibold"
              value={form.customer || ""}
              onChange={(e) => {
                set("customer", e.target.value);
                setSearchTerm(e.target.value);
                setIsOpenDropdown(true);
              }}
              onFocus={() => setIsOpenDropdown(true)}
              onBlur={() => setTimeout(() => setIsOpenDropdown(false), 200)}
            />
            {isOpenDropdown && filteredPersonas.length > 0 && (
              <div className="absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filteredPersonas.map((cp) => (
                  <button
                    key={cp._id}
                    type="button"
                    onClick={() => {
                      set("customer", cp.name);
                      setSearchTerm(cp.name);
                      setIsOpenDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-ocean-50 text-slate-700 font-medium transition-colors cursor-pointer border-none"
                  >
                    {cp.name} {cp.phone ? `(${cp.phone})` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white h-20 resize-none"
              placeholder="Describe project deliverables or notes..."
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white cursor-pointer"
                value={form.startDate || ""}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white cursor-pointer"
                value={form.endDate || ""}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Project Status</label>
            <select
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white font-semibold text-slate-700 cursor-pointer"
              value={form.status || "Signed"}
              onChange={(e) => set("status", e.target.value)}
            >
              {PROJECT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-400 uppercase">Assigned Workers</label>
              <button
                type="button"
                onClick={() => setShowWorkerModal(true)}
                className="text-xs font-bold text-ocean-600 hover:text-ocean-700 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
              >
                Manage Workers
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50/50 border border-slate-100 rounded-xl">
              {(form.workers || []).length === 0 ? (
                <span className="text-xs text-slate-400 italic">No workers assigned yet.</span>
              ) : (
                (form.workers || []).map((workerId) => {
                  const workerObj = allWorkers.find((w) => w._id === workerId);
                  return (
                    <span
                      key={workerId}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ocean-50 text-ocean-700 border border-ocean-100 flex items-center gap-1"
                    >
                      {workerObj?.name || "Loading worker..."}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3">
          {project ? (
            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-red-200 hover:bg-red-50 text-red-600 transition-all flex items-center gap-1 cursor-pointer"
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
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Project?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{project?.siteName}"</span>? This action cannot be undone.
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

      {showWorkerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-800">Assign Workers</h3>
              <button
                type="button"
                onClick={() => setShowWorkerModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {allWorkers.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No workers found in system.</p>
              ) : (
                allWorkers.map((w) => {
                  const checked = (form.workers || []).includes(w._id);
                  return (
                    <label
                      key={w._id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? "bg-ocean-50 border-ocean-200 text-ocean-700 font-semibold"
                          : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-semibold">{w.name} {w.position ? `(${w.position})` : ""}</span>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-ocean-600 focus:ring-ocean-500 cursor-pointer"
                        checked={checked}
                        onChange={() => handleToggleWorker(w._id)}
                      />
                    </label>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowWorkerModal(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-700 rounded-full shadow-md shadow-ocean-600/10 transition-all cursor-pointer"
              >
                Done
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
