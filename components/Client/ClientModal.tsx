import React, { useEffect, useState } from "react";
import { X, User, Save, Plus, MessageSquare, History, Info, Send, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Client } from "../../services/Client/fetchClients";
import { updateClient, UpdateClientRequest } from "../../services/Client/updateClient";
import { addClientLog } from "../../services/Client/addClientLog";
import { fetchClientById, AuditLog } from "../../services/Client/fetchClientById";
import { useLanguage } from "../../context/LanguageContext";

export const POST_SALE_STATUSES = ["Signed", "In-Development", "Delivered"];

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSaved: (client: Client) => void;
}

/**
 * Simplified post-sale client modal focused on active projects
 */
export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onSaved,
}) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<any>(
    client ? { ...client } : { status: "Signed" }
  );
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "logs" | "audit">("details");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logText, setLogText] = useState("");
  const [addingLog, setAddingLog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(client ? { ...client } : { status: "Signed" });
      setActiveTab("details");
      setAuditLogs([]);
      if (client) {
        loadAudit(client._id);
      }
    }
  }, [isOpen, client]);

  if (!isOpen) return null;

  const set = (field: string, value: any) =>
    setForm((f: any) => ({ ...f, [field]: value }));

  const loadAudit = async (clientId: string) => {
    setLogsLoading(true);
    try {
      const res = await fetchClientById(clientId);
      if (res.success && res.data) {
        setAuditLogs(res.data.auditLogs || []);
        setForm((f: any) => ({ ...f, conversationLogs: res.data!.client.conversationLogs || [] }));
      }
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error(t("clients.nameRequired"));
      return;
    }
    if (!client) return; // Client Projects modal is edit-only since projects are born from converted leads

    setSaving(true);
    try {
      const payload: UpdateClientRequest = {
        name: form.name,
        phone: form.phone,
        address: form.address,
        email: form.email,
        companyName: form.companyName,
        businessName: form.businessName,
        industry: form.industry,
        status: form.status,
        projectId: form.projectId,
        projectStartDate: form.projectStartDate,
        projectDeliveryDate: form.projectDeliveryDate,
        deliverablesSummary: form.deliverablesSummary,
        purchasedServices: form.purchasedServices,
      };
      const res = await updateClient(client._id, payload);
      if (res.success && res.data) {
        toast.success(t("clients.updated"));
        onSaved(res.data.client);
        onClose();
      } else {
        toast.error(res.message || t("clients.updateFailed"));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save project details");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLog = async () => {
    if (!client || !logText.trim()) {
      toast.error(t("clientLogs.enterNote"));
      return;
    }
    setAddingLog(true);
    try {
      const res = await addClientLog(client._id, logText.trim());
      if (res.success && res.data) {
        toast.success(t("clientLogs.added"));
        setLogText("");
        loadAudit(client._id);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add note");
    } finally {
      setAddingLog(false);
    }
  };

  const handleAddService = () => {
    const services = form.purchasedServices || [];
    set("purchasedServices", [...services, { name: "", type: "", status: "pending" }]);
  };

  const handleServiceChange = (idx: number, field: string, value: string) => {
    const services = [...(form.purchasedServices || [])];
    services[idx] = { ...services[idx], [field]: value };
    set("purchasedServices", services);
  };

  const handleRemoveService = (idx: number) => {
    const services = [...(form.purchasedServices || [])];
    services.splice(idx, 1);
    set("purchasedServices", services);
  };

  const logs = form.conversationLogs || [];

  const renderDetails = () => (
    <div className="space-y-4">
      {/* Identity Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white font-semibold"
          placeholder={t("clients.name")}
          value={form.name || ""}
          onChange={(e) => set("name", e.target.value)}
        />
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white"
          placeholder={t("clients.phone")}
          value={form.phone || ""}
          onChange={(e) => set("phone", e.target.value)}
        />
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white"
          placeholder={t("clients.address")}
          value={form.address || ""}
          onChange={(e) => set("address", e.target.value)}
        />
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white"
          placeholder={t("clients.email")}
          value={form.email || ""}
          onChange={(e) => set("email", e.target.value)}
        />
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white"
          placeholder={t("clients.company")}
          value={form.companyName || ""}
          onChange={(e) => set("companyName", e.target.value)}
        />
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white"
          placeholder={t("clients.industry")}
          value={form.industry || ""}
          onChange={(e) => set("industry", e.target.value)}
        />
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Project Specifics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Project Status</label>
            <select
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white font-semibold text-slate-700 cursor-pointer"
              value={form.status || "Signed"}
              onChange={(e) => set("status", e.target.value)}
            >
              {POST_SALE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Project Code/ID</label>
            <input
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white"
              placeholder="e.g. PJ-101"
              value={form.projectId || ""}
              onChange={(e) => set("projectId", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white cursor-pointer"
              value={form.projectStartDate ? form.projectStartDate.split("T")[0] : ""}
              onChange={(e) => set("projectStartDate", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Delivery Date</label>
            <input
              type="date"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white cursor-pointer"
              value={form.projectDeliveryDate ? form.projectDeliveryDate.split("T")[0] : ""}
              onChange={(e) => set("projectDeliveryDate", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Deliverables Summary</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none bg-white h-20 resize-none"
            placeholder="Summarize key contract deliverables..."
            value={form.deliverablesSummary || ""}
            onChange={(e) => set("deliverablesSummary", e.target.value)}
          />
        </div>
      </div>

      {/* Services Milestones */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">Milestone Tasks / Purchased Services</h3>
          <button
            type="button"
            onClick={handleAddService}
            className="text-xs font-bold text-ocean-600 hover:text-ocean-700 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>

        <div className="space-y-2">
          {(!form.purchasedServices || form.purchasedServices.length === 0) ? (
            <p className="text-xs text-slate-400 italic">No milestones defined yet.</p>
          ) : (
            form.purchasedServices.map((s: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <input
                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white"
                  placeholder="Task/Service name"
                  value={s.name || ""}
                  onChange={(e) => handleServiceChange(idx, "name", e.target.value)}
                />
                <input
                  className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white"
                  placeholder="Type"
                  value={s.type || ""}
                  onChange={(e) => handleServiceChange(idx, "type", e.target.value)}
                />
                <select
                  className="w-28 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none font-semibold text-slate-700 cursor-pointer"
                  value={s.status || "pending"}
                  onChange={(e) => handleServiceChange(idx, "status", e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveService(idx)}
                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const formatAuditDetails = (audit: any) => {
    const { action, details } = audit;
    if (!details) return "";

    if (action === "CREATE") {
      const parts = [];
      if (details.name) parts.push(`Name: ${details.name}`);
      if (details.message) parts.push(details.message);
      return parts.join(", ") || "Project Created";
    }

    if (action === "STATUS_CHANGE") {
      return `Status changed from "${details.oldStatus || "N/A"}" to "${details.newStatus || "N/A"}"`;
    }

    if (action === "LOG_ADDED") {
      return `Added note: "${details.text || ""}"`;
    }

    if (action === "UPDATE") {
      if (Array.isArray(details.fields)) {
        return `Updated fields: ${details.fields.join(", ")}`;
      }
      return "Profile updated";
    }

    return JSON.stringify(details);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-ocean-50 text-ocean-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Edit Client Project Details
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

        <div className="flex border-b border-slate-100 bg-slate-50/30 px-6">
          {(["details", "logs", "audit"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab
                  ? "border-ocean-600 text-ocean-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab === "details" && <Info className="w-4 h-4" />}
              {tab === "logs" && <MessageSquare className="w-4 h-4" />}
              {tab === "audit" && <History className="w-4 h-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {activeTab === "details" && renderDetails()}

          {activeTab === "logs" && (
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-ocean-500 bg-white"
                  placeholder={t("clientLogs.placeholder")}
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                />
                <button
                  onClick={handleAddLog}
                  disabled={addingLog}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  {addingLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{t("common.add")}</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {logs.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-10">No conversation notes yet.</p>
                ) : (
                  [...logs].reverse().map((log: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.text}</p>
                      <span className="block text-[10px] text-slate-400 mt-1 font-semibold">
                        {new Date(log.date).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-3">
              {logsLoading ? (
                <div className="text-center py-10 text-slate-400">Loading audit history...</div>
              ) : auditLogs.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-10">No activity logged.</p>
              ) : (
                auditLogs.map((audit) => (
                  <div key={audit._id} className="flex gap-3 text-xs bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex-1">
                      <span className="font-bold text-slate-700 block uppercase text-[10px] text-ocean-600 mb-0.5">{audit.action}</span>
                      <p className="text-slate-600">{formatAuditDetails(audit)}</p>
                      <span className="text-[10px] text-slate-400 font-medium">By: {audit.user}</span>
                    </div>
                    <span className="text-slate-400 whitespace-nowrap">{new Date(audit.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {activeTab === "details" && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 shadow-md shadow-ocean-600/10 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t("common.save")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Loader2: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className || "w-4 h-4"}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);