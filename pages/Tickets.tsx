import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Ticket as TicketIcon, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchTickets, Ticket } from "../services/Ticket/fetchTickets";
import { createTicket } from "../services/Ticket/createTicket";
import { fetchDepartments, Department } from "../services/Ticket/fetchDepartments";
import { Modal } from "../components/Modal";
import { useLanguage } from "../context/LanguageContext";

const statusColor: Record<string, string> = {
  Open: "bg-amber-50 text-amber-700 border border-amber-100",
  "In Progress": "bg-blue-50 text-blue-700 border border-blue-100",
  Pending: "bg-slate-100 text-slate-600 border border-slate-200",
  Resolved: "bg-emerald-50 text-emerald-700 border border-emerald-100",
};

const priorityColor: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-yellow-50 text-yellow-700",
  High: "bg-red-50 text-red-600",
};

export const Tickets: React.FC = () => {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium", department_id: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTickets({ search, status: statusFilter || undefined });
      if (res.success) setTickets(res.data.tickets);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchDepartments().then((r) => {
      if (r.success) setDepartments(r.data.departments);
    });
  }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error(t("tickets.titleDescRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await createTicket({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        department_id: form.department_id || undefined,
      });
      if (res.success) {
        toast.success(t("tickets.created"));
        setModalOpen(false);
        setForm({ title: "", description: "", priority: "Medium", department_id: "" });
        load();
      } else {
        toast.error(res.message || t("tickets.createFailed"));
      }
    } finally {
      setSaving(false);
    }
  };

  const dispDepartment = (d: any) => (typeof d === "object" ? d?.name : "");
  const dispAssignee = (a: any) => (typeof a === "object" ? a?.name : "");

  return (
    <div className="min-h-screen bg-ocean-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ocean-800 flex items-center gap-2">
              <TicketIcon className="w-7 h-7 text-ocean-600" />
              {t("tickets.title")}
            </h1>
            <p className="text-ocean-600 mt-1 font-medium">{t("tickets.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none bg-white"
                placeholder={t("tickets.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-ocean-600 outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t("tickets.allStatus")}</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 shadow-md shadow-ocean-600/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t("tickets.newTicket")}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> {t("common.loading")}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 text-slate-500">{t("tickets.empty")}</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-bold">{t("tickets.title")}</th>
                  <th className="px-4 py-3 font-bold hidden md:table-cell">{t("tickets.department")}</th>
                  <th className="px-4 py-3 font-bold">{t("tickets.status")}</th>
                  <th className="px-4 py-3 font-bold hidden sm:table-cell">{t("tickets.priority")}</th>
                  <th className="px-4 py-3 font-bold hidden lg:table-cell">{t("tickets.assignedTo")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tickets.map((tk) => (
                  <tr key={tk._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/tickets/${tk._id}`} onClick={(e) => e.preventDefault()} className="cursor-default">
                        <div
                          className="font-semibold text-ocean-800 hover:text-ocean-600 hover:underline cursor-pointer"
                          onDoubleClick={() => (window.location.href = `/tickets/${tk._id}`)}
                        >
                          {tk.title}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{tk.description}</p>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                      {dispDepartment(tk.department_id) || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[tk.status] || "bg-slate-100 text-slate-600"}`}>
                        {tk.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${priorityColor[tk.priority] || "bg-slate-100 text-slate-600"}`}>
                        {tk.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">
                      {dispAssignee(tk.assigned_to) || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={t("tickets.newTicket")}>
        <div className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">{t("tickets.title")} *</label>
            <input
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">{t("tickets.description")} *</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">{t("tickets.priority")}</label>
              <select
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1.5">{t("tickets.department")}</label>
              <select
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              >
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t("common.save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};