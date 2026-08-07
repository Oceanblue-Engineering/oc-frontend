import React, { useEffect, useState } from "react";
import { X, User, Briefcase, Save, Plus, MessageSquare, History, Info, Send } from "lucide-react";
import { toast } from "sonner";
import { Client } from "../../services/Client/fetchClients";
import { createClient, CreateClientRequest } from "../../services/Client/createClient";
import { updateClient, UpdateClientRequest } from "../../services/Client/updateClient";
import { addClientLog } from "../../services/Client/addClientLog";
import { fetchClientById, AuditLog } from "../../services/Client/fetchClientById";
import { useLanguage } from "../../context/LanguageContext";
import { PIPELINES, initialStageFor, LeadType } from "../../config/clientPipelines";

export const POST_SALE_STATUSES = ["Signed", "In-Development", "Delivered"];

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null; // null => create mode
  defaultLeadType?: LeadType; // used to pre-select sales/service in create mode
  onSaved: (client: Client) => void;
}

/**
 * Shared client modal with tabbed view:
 *  - Details: editable fields (pre-sale or post-sale depending on isPostSale)
 *  - Conversation Logs: timeline of notes + "Add Log"
 *  - Audit Trail: activity history (CREATE / UPDATE / STATUS_CHANGE / LOG_ADDED)
 */
export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  client,
  defaultLeadType = "sales",
  onSaved,
}) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<any>(
    client
      ? { ...client }
      : { status: initialStageFor(defaultLeadType), isPostSale: false }
  );
  const [saving, setSaving] = useState(false);
  const [leadType, setLeadType] = useState<LeadType>(
    client?.leadType || defaultLeadType
  );
  const [isPostSale, setIsPostSale] = useState<boolean>(client?.isPostSale ?? false);
  const [activeTab, setActiveTab] = useState<"details" | "logs" | "audit">("details");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logText, setLogText] = useState("");
  const [addingLog, setAddingLog] = useState(false);

  // Reset on open + load audit trail + conversation logs
  useEffect(() => {
    if (isOpen) {
      const type = client?.leadType || defaultLeadType;
      setLeadType(type);
      setForm(
        client
          ? { ...client }
          : { status: initialStageFor(type), isPostSale: false }
      );
      setIsPostSale(client?.isPostSale ?? false);
      setActiveTab("details");
      setAuditLogs([]);
      if (client) {
        loadAudit(client._id);
      }
    }
  }, [isOpen, client, defaultLeadType]);

  if (!isOpen) return null;

  const set = (field: string, value: any) =>
    setForm((f: any) => ({ ...f, [field]: value }));

  const loadAudit = async (clientId: string) => {
    setLogsLoading(true);
    try {
      const res = await fetchClientById(clientId);
      if (res.success && res.data) {
        setAuditLogs(res.data.auditLogs || []);
        // refresh embedded conversation logs from server
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

    setSaving(true);
    try {
      if (client) {
        const payload: UpdateClientRequest = {
          name: form.name,
          phone: form.phone,
          address: form.address,
          email: form.email,
          companyName: form.companyName,
          businessName: form.businessName,
          industry: form.industry,
          leadType,
          status: form.status,
          desiredOutcome: form.desiredOutcome,
          currentProblems: form.currentProblems,
          projectId: form.projectId,
          projectStartDate: form.projectStartDate,
          projectDeliveryDate: form.projectDeliveryDate,
          deliverablesSummary: form.deliverablesSummary,
        };
        const res = await updateClient(client._id, payload);
        if (res.success && res.data) {
          toast.success(t("clients.updated"));
          onSaved(res.data.client);
          onClose();
        } else {
          toast.error(res.message || t("clients.updateFailed"));
        }
      } else {
        const payload: CreateClientRequest = {
          name: form.name,
          phone: form.phone,
          address: form.address,
          email: form.email,
          companyName: form.companyName,
          businessName: form.businessName,
          industry: form.industry,
          sourceChannel: form.sourceChannel,
          desiredOutcome: form.desiredOutcome,
          currentProblems: form.currentProblems,
          leadType,
        };
        const res = await createClient(payload);
        if (res.success && res.data) {
          toast.success(t("clients.created"));
          onSaved(res.data.client);
          onClose();
        } else {
          toast.error(res.message || t("clients.createFailed"));
        }
      }
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
        setForm((f: any) => ({ ...f, conversationLogs: res.data!.client.conversationLogs || [] }));
        loadAudit(client._id);
      } else {
        toast.error(res.message || t("clientLogs.addFailed"));
      }
    } finally {
      setAddingLog(false);
    }
  };

  // Status options: post-sale always shows post-sale stages; pre-sale shows the active pipeline's stages
  const availableStatuses = isPostSale
    ? POST_SALE_STATUSES
    : [...PIPELINES[leadType], "Signed"];
  const logs = form.conversationLogs || [];

  const renderDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none"
          placeholder={t("clients.name")}
          value={form.name || ""}
          onChange={(e) => set("name", e.target.value)}
        />
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none"
          placeholder={t("clients.phone")}
          value={form.phone || ""}
          onChange={(e) => set("phone", e.target.value)}
        />
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none"
          placeholder={t("clients.address")}
          value={form.address || ""}
          onChange={(e) => set("address", e.target.value)}
        />
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none"
          placeholder={t("clients.email")}
          value={form.email || ""}
          onChange={(e) => set("email", e.target.value)}
        />
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none"
          placeholder={t("clients.company")}
          value={form.companyName || ""}
          onChange={(e) => set("companyName", e.target.value)}
        />
        <input
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none"
          placeholder={t("clients.industry")}
          value={form.industry || ""}
          onChange={(e) => set("industry", e.target.value)}
        />
      </div>

      {!isPostSale && (
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1.5">
            {t("clients.leadType")}
          </label>
          <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
            {(["sales", "service"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setLeadType(type);
                  set("status", initialStageFor(type));
                }}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  leadType === type
                    ? "bg-ocean-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-white"
                }`}
              >
                {type === "sales" ? t("clients.tabSales") : t("clients.tabService")}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-500 mb-1.5">
          {t("clients.status")}
        </label>
        <select
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
          value={form.status || initialStageFor(leadType)}
          onChange={(e) => set("status", e.target.value)}
        >
          {availableStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {form.status === "Follow-up needed" && (
          <input
            type="date"
            className="mt-2 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
            value={form.nextActionDate || ""}
            onChange={(e) => set("nextActionDate", e.target.value)}
            placeholder={t("clients.nextAction")}
          />
        )}
      </div>

      {isPostSale ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-ocean-50/40 rounded-xl border border-ocean-100">
          <input
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
            placeholder={t("clients.projectId")}
            value={form.projectId || ""}
            onChange={(e) => set("projectId", e.target.value)}
          />
          <input
            type="date"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
            value={form.projectStartDate || ""}
            onChange={(e) => set("projectStartDate", e.target.value)}
          />
          <input
            type="date"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
            value={form.projectDeliveryDate || ""}
            onChange={(e) => set("projectDeliveryDate", e.target.value)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <textarea
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
            placeholder={t("clients.desiredOutcome")}
            value={form.desiredOutcome || ""}
            onChange={(e) => set("desiredOutcome", e.target.value)}
            rows={2}
          />
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-4">
      {client ? (
        <>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
              placeholder={t("clientLogs.placeholder")}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLog()}
            />
            <button
              onClick={handleAddLog}
              disabled={addingLog || !logText.trim()}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {t("clientLogs.add")}
            </button>
          </div>

          <div className="space-y-3">
            {logs.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">{t("clientLogs.empty")}</p>
            )}
            {[...logs].reverse().map((log: any, i: number) => (
              <div key={i} className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-ocean-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{log.text}</p>
                  <span className="text-xs text-slate-400">
                    {log.date ? new Date(log.date).toLocaleString() : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-center text-sm text-slate-400 py-8">
          {t("clientLogs.saveFirst")}
        </p>
      )}
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-3">
      {logsLoading ? (
        <p className="text-center text-sm text-slate-400 py-8">{t("common.loading")}</p>
      ) : auditLogs.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-8">{t("clientLogs.noActivity")}</p>
      ) : (
        auditLogs.map((log) => {
          const isStatus = log.action === "STATUS_CHANGE";
          return (
            <div key={log._id} className="flex gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-teal-500 flex-shrink-0" />
              <div className="flex-1 bg-slate-50 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-ocean-700">
                    {log.action}
                  </span>
                  <span className="text-xs text-slate-400">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                  </span>
                </div>
                {isStatus ? (
                  <p className="text-sm text-slate-700 mt-1">
                    {t("clientLogs.statusChanged")}{" "}
                    <span className="font-semibold text-slate-800">{log.details?.oldStatus}</span>
                    {" → "}
                    <span className="font-semibold text-ocean-700">{log.details?.newStatus}</span>
                  </p>
                ) : log.action === "LOG_ADDED" ? (
                  <p className="text-sm text-slate-700 mt-1">
                    {t("clientLogs.noteAdded")}: {log.details?.text}
                  </p>
                ) : (
                  <p className="text-sm text-slate-700 mt-1">
                    {log.action === "CREATE"
                      ? t("clientLogs.created")
                      : t("clientLogs.updated")}
                    {log.details?.fields?.length
                      ? ` (${log.details.fields.join(", ")})`
                      : ""}
                  </p>
                )}
                <span className="text-xs text-slate-400 mt-1 block">{t("clientLogs.by")}: {log.user}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-ocean-800 flex items-center gap-2">
            {client ? (
              <>
                <User className="w-5 h-5 text-ocean-600" /> {t("clients.editClient")}
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-ocean-600" /> {t("clients.newInquiry")}
              </>
            )}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-slate-100">
          {(
            [
              { id: "details", label: t("clientLogs.details"), icon: Info },
              { id: "logs", label: t("clientLogs.logs"), icon: MessageSquare },
              { id: "audit", label: t("clientLogs.audit"), icon: History },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-t-xl transition-colors cursor-pointer ${
                  active
                    ? "text-ocean-700 border-b-2 border-ocean-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "details" && renderDetails()}
        {activeTab === "logs" && renderLogs()}
        {activeTab === "audit" && renderAudit()}

        {/* Save (details only) */}
        {activeTab === "details" && (
          <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};