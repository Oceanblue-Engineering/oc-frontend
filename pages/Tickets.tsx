import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Ticket as TicketIcon, Search, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { fetchTickets, Ticket } from "../services/Ticket/fetchTickets";
import { createTicket } from "../services/Ticket/createTicket";
import { assignTicket } from "../services/Ticket/assignTicket";
import { fetchAdminAccounts } from "../services/Admin/fetchAdminAccounts";
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
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    type: "Retail Sale",
    project_details: {
      project_name: "",
      time: "",
      desc: "",
      number_of_worker: "",
      time_duration: "",
      note: "",
    },
    retail_details: {
      deli_location: "",
      deli_time: "",
      number_of_people: "",
      deli_expense: "",
      note: "",
    },
  });
  const [saving, setSaving] = useState(false);
  const [admins, setAdmins] = useState<{ _id: string; name: string }[]>([]);
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("adminData");
    if (stored) {
      try {
        setAdminData(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const isAdminOrOwner =
    adminData?.role === "admin" || adminData?.role === "owner";

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
    if (isAdminOrOwner) {
      fetchAdminAccounts().then((r) => {
        if (r.success && r.data) setAdmins(r.data.accounts);
      });
    }
  }, [isAdminOrOwner]);

  const handleAssign = async (ticketId: string, value: string) => {
    const res = await assignTicket(ticketId, value || null);
    if (res.success) {
      toast.success(t("tickets.assigned"));
      load();
    } else {
      toast.error(res.message || t("tickets.assignFailed"));
    }
  };

  const assignedId = (a: any) =>
    typeof a === "object" && a ? a._id : "";
  const assignedName = (a: any) =>
    typeof a === "object" && a ? a.name : "";

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
        type: form.type,
        ...(form.type === "Project"
          ? {
              project_details: {
                project_name: form.project_details.project_name,
                time: form.project_details.time || undefined,
                desc: form.project_details.desc,
                number_of_worker: form.project_details.number_of_worker
                  ? Number(form.project_details.number_of_worker)
                  : undefined,
                time_duration: form.project_details.time_duration,
                note: form.project_details.note,
              },
            }
          : {}),
        ...(form.type !== "Project"
          ? {
              retail_details: {
                deli_location: form.retail_details.deli_location,
                deli_time: form.retail_details.deli_time || undefined,
                number_of_people: form.retail_details.number_of_people
                  ? Number(form.retail_details.number_of_people)
                  : undefined,
                deli_expense: form.retail_details.deli_expense
                  ? Number(form.retail_details.deli_expense)
                  : undefined,
                note: form.retail_details.note,
              },
            }
          : {}),
      });
      if (res.success) {
        toast.success(t("tickets.created"));
        setModalOpen(false);
        setForm({
          title: "",
          description: "",
          priority: "Medium",
          type: "Retail Sale",
          project_details: {
            project_name: "",
            time: "",
            desc: "",
            number_of_worker: "",
            time_duration: "",
            note: "",
          },
          retail_details: {
            deli_location: "",
            deli_time: "",
            number_of_people: "",
            deli_expense: "",
            note: "",
          },
        });
        load();
      } else {
        toast.error(res.message || t("tickets.createFailed"));
      }
    } finally {
      setSaving(false);
    }
  };

  
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
                  <th className="px-4 py-3 font-bold">{t("tickets.titleLabel")}</th>
                  <th className="px-4 py-3 font-bold hidden sm:table-cell">{t("tickets.type")}</th>
                  <th className="px-4 py-3 font-bold">{t("tickets.status")}</th>
                  <th className="px-4 py-3 font-bold hidden sm:table-cell">{t("tickets.priority")}</th>
                  <th className="px-4 py-3 font-bold hidden lg:table-cell">{t("tickets.assignedTo")}</th>
                  <th className="px-4 py-3 font-bold text-center">{t("tickets.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tickets.map((tk) => (
                  <tr key={tk._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div
                        className="font-semibold text-ocean-800 hover:text-ocean-600 hover:underline cursor-pointer"
                        onClick={() => navigate(`/tickets/${tk._id}`)}
                      >
                        {tk.title}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{tk.description}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          tk.type === "Project"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tk.type === "Project" ? t("tickets.project") : t("tickets.retailSale")}
                      </span>
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
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {isAdminOrOwner ? (
                        <select
                          className="w-full min-w-[120px] px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-ocean-600 outline-none bg-white cursor-pointer"
                          value={assignedId(tk.assigned_to)}
                          onChange={(e) => handleAssign(tk._id, e.target.value)}
                        >
                          <option value="">{t("tickets.unassigned")}</option>
                          {admins.map((a) => (
                            <option key={a._id} value={a._id}>{a.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-slate-600">
                          {assignedName(tk.assigned_to) || "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/tickets/${tk._id}`)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-full bg-ocean-600 hover:bg-ocean-700 text-white shadow-sm inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t("tickets.detail")}
                      </button>
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
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">{t("tickets.titleLabel")} *</label>
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
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">{t("tickets.type")}</label>
            <div className="inline-flex bg-slate-100 rounded-xl p-1 w-full">
              {[
                { id: "Retail Sale", label: t("tickets.retailSale") },
                { id: "Project", label: t("tickets.project") },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm({ ...form, type: opt.id })}
                  className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    form.type === opt.id
                      ? "bg-ocean-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
          </div>

          {form.type !== "Project" && (
            <div className="space-y-3 p-4 border border-ocean-100 bg-ocean-50/40 rounded-xl">
              <h4 className="text-sm font-bold text-ocean-700">{t("tickets.retailDetails")}</h4>
              <input
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                placeholder={t("tickets.deliLocation")}
                value={form.retail_details.deli_location}
                onChange={(e) =>
                  setForm({ ...form, retail_details: { ...form.retail_details, deli_location: e.target.value } })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                  value={form.retail_details.deli_time}
                  onChange={(e) =>
                    setForm({ ...form, retail_details: { ...form.retail_details, deli_time: e.target.value } })
                  }
                />
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                  placeholder={t("tickets.numberOfPeople")}
                  value={form.retail_details.number_of_people}
                  onChange={(e) =>
                    setForm({ ...form, retail_details: { ...form.retail_details, number_of_people: e.target.value } })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                  placeholder={t("tickets.deliExpense")}
                  value={form.retail_details.deli_expense}
                  onChange={(e) =>
                    setForm({ ...form, retail_details: { ...form.retail_details, deli_expense: e.target.value } })
                  }
                />
              </div>
              <textarea
                rows={2}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                placeholder={t("tickets.note")}
                value={form.retail_details.note}
                onChange={(e) =>
                  setForm({ ...form, retail_details: { ...form.retail_details, note: e.target.value } })
                }
              />
            </div>
          )}

          {form.type === "Project" && (
            <div className="space-y-3 p-4 border border-ocean-100 bg-ocean-50/40 rounded-xl">
              <h4 className="text-sm font-bold text-ocean-700">{t("tickets.projectDetails")}</h4>
              <input
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                placeholder={t("tickets.projectName")}
                value={form.project_details.project_name}
                onChange={(e) =>
                  setForm({ ...form, project_details: { ...form.project_details, project_name: e.target.value } })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                  value={form.project_details.time}
                  onChange={(e) =>
                    setForm({ ...form, project_details: { ...form.project_details, time: e.target.value } })
                  }
                />
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                  placeholder={t("tickets.numberOfWorker")}
                  value={form.project_details.number_of_worker}
                  onChange={(e) =>
                    setForm({ ...form, project_details: { ...form.project_details, number_of_worker: e.target.value } })
                  }
                />
              </div>
              <textarea
                rows={2}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                placeholder={t("tickets.projectDesc")}
                value={form.project_details.desc}
                onChange={(e) =>
                  setForm({ ...form, project_details: { ...form.project_details, desc: e.target.value } })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                  placeholder={t("tickets.timeDuration")}
                  value={form.project_details.time_duration}
                  onChange={(e) =>
                    setForm({ ...form, project_details: { ...form.project_details, time_duration: e.target.value } })
                  }
                />
                <input
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                  placeholder={t("tickets.note")}
                  value={form.project_details.note}
                  onChange={(e) =>
                    setForm({ ...form, project_details: { ...form.project_details, note: e.target.value } })
                  }
                />
              </div>
            </div>
          )}
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