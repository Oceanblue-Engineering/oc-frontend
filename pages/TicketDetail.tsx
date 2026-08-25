import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Send, Trash2, ArrowLeft, History, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { fetchTicketById, TicketComment, TicketHistoryLog } from "../services/Ticket/fetchTicketById";
import { Ticket } from "../services/Ticket/fetchTickets";
import { updateTicketStatus } from "../services/Ticket/updateTicketStatus";
import { assignTicket } from "../services/Ticket/assignTicket";
import { addTicketComment } from "../services/Ticket/addTicketComment";
import { deleteTicket } from "../services/Ticket/deleteTicket";
import { fetchAdminAccounts } from "../services/Admin/fetchAdminAccounts";
import { fetchWorkers, Worker as WorkerType } from "../services/Worker/worker.service";
import { useLanguage } from "../context/LanguageContext";

const statusColor: Record<string, string> = {
  Open: "bg-amber-50 text-amber-700 border border-amber-100",
  "In Progress": "bg-zinc-50 text-zinc-700 border border-zinc-100",
  Pending: "bg-slate-100 text-slate-600 border border-slate-200",
  Resolved: "bg-emerald-50 text-emerald-700 border border-emerald-100",
};
const STATUSES = ["Open", "In Progress", "Pending", "Resolved"];

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [history, setHistory] = useState<TicketHistoryLog[]>([]);
  const [admins, setAdmins] = useState<{ _id: string; name: string }[]>([]);
  const [workers, setWorkers] = useState<WorkerType[]>([]);
  const [adminData, setAdminData] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("adminData");
    if (stored) {
      try {
        setAdminData(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const isAdminOrOwner = adminData?.role === "admin" || adminData?.role === "owner";

  const load = async (showFullPageLoader = false) => {
    if (!id) return;
    if (showFullPageLoader) setLoading(true);
    try {
      const res = await fetchTicketById(id);
      if (res.success && res.data) {
        setTicket(res.data.ticket);
        setComments(res.data.comments);
        setHistory(res.data.history);
      } else {
        toast.error(res.message || t("tickets.loadFailed"));
      }
    } finally {
      if (showFullPageLoader) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (isAdminOrOwner) {
      fetchAdminAccounts().then((r) => {
        if (r.success && r.data) setAdmins(r.data.accounts);
      });
      fetchWorkers().then((r) => {
        if (r.success && r.data) setWorkers(r.data.workers);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminOrOwner]);

  const handleStatusChange = async (status: string) => {
    if (!id || !ticket || status === ticket.status) return;
    const res = await updateTicketStatus(id, status);
    if (res.success) {
      toast.success(t("tickets.statusUpdated"));
      load();
    } else {
      toast.error(res.message || t("tickets.updateFailed"));
    }
  };

  const handleAssign = async (assignedTo: string) => {
    if (!id) return;
    setAssigning(true);
    try {
      const res = await assignTicket(id, assignedTo || null);
      if (res.success) {
        toast.success(t("tickets.assigned"));
        load();
      } else {
        toast.error(res.message || t("tickets.assignFailed"));
      }
    } catch (err: any) {
      toast.error(err.message || t("tickets.assignFailed"));
    } finally {
      setAssigning(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || !commentText.trim()) return;
    setSavingComment(true);
    try {
      const res = await addTicketComment(id, commentText.trim());
      if (res.success) {
        setCommentText("");
        toast.success(t("tickets.commentAdded"));
        load();
      } else {
        toast.error(res.message || t("tickets.commentFailed"));
      }
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await deleteTicket(id);
      if (res.success) {
        toast.success(t("tickets.deleted"));
        navigate("/tickets");
      } else {
        toast.error(res.message || t("tickets.deleteFailed"));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete ticket");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-50/30">
        <Loader2 className="w-8 h-8 animate-spin text-ocean-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-50/30">
        <p className="text-slate-500">{t("tickets.notFound")}</p>
      </div>
    );
  }

  const dispName = (x: any) => (typeof x === "object" ? x?.name : "");

  return (
    <div className="min-h-screen bg-ocean-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/tickets")}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ocean-600 hover:text-ocean-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> {t("tickets.back")}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-ocean-800">{ticket.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      ticket.type === "Project"
                        ? "bg-zinc-50 text-zinc-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {ticket.type === "Project" ? t("tickets.project") : t("tickets.retailSale")}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[ticket.status]}`}>
                      {ticket.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 mt-4 whitespace-pre-wrap text-sm">{ticket.description}</p>

              {ticket.type !== "Project" && ticket.retail_details && (
                <div className="mt-4 p-4 bg-ocean-50/40 border border-ocean-100 rounded-xl space-y-2">
                  <h4 className="text-sm font-bold text-ocean-700">{t("tickets.retailDetails")}</h4>
                  {ticket.retail_details.deli_location && (
                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">{t("tickets.deliLocation")}: </span>{ticket.retail_details.deli_location}</p>
                  )}
                  {ticket.retail_details.deli_time && (
                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">{t("tickets.deliTime")}: </span>{new Date(ticket.retail_details.deli_time).toLocaleString()}</p>
                  )}
                  {ticket.retail_details.number_of_people != null && (
                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">{t("tickets.numberOfPeople")}: </span>{ticket.retail_details.number_of_people}</p>
                  )}
                  {ticket.retail_details.deli_expense != null && (
                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">{t("tickets.deliExpense")}: </span>{ticket.retail_details.deli_expense}</p>
                  )}
                  {ticket.retail_details.note && (
                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">{t("tickets.note")}: </span>{ticket.retail_details.note}</p>
                  )}
                </div>
              )}

              {ticket.type === "Project" && ticket.project_details && (
                <div className="mt-4 p-4 bg-zinc-50/50 border border-zinc-100 rounded-xl space-y-2">
                  <h4 className="text-sm font-bold text-zinc-700">{t("tickets.projectDetails")}</h4>
                  {ticket.project_details.project_name && (
                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">{t("tickets.projectName")}: </span>{ticket.project_details.project_name}</p>
                  )}
                  {ticket.project_details.time && (
                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">{t("tickets.time")}: </span>{new Date(ticket.project_details.time).toLocaleString()}</p>
                  )}
                  {ticket.project_details.desc && (
                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">{t("tickets.projectDesc")}: </span>{ticket.project_details.desc}</p>
                  )}
                  {ticket.project_details.number_of_worker != null && (
                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">{t("tickets.numberOfWorker")}: </span>{ticket.project_details.number_of_worker}</p>
                  )}
                  {ticket.project_details.time_duration && (
                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">{t("tickets.timeDuration")}: </span>{ticket.project_details.time_duration}</p>
                  )}
                  {ticket.project_details.note && (
                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-500">{t("tickets.note")}: </span>{ticket.project_details.note}</p>
                  )}
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h2 className="font-semibold text-ocean-800 text-sm mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-ocean-600" /> {t("tickets.comments")}
              </h2>
              <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                {comments.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">{t("tickets.noComments")}</p>
                )}
                {comments.map((c) => (
                  <div key={c._id} className="bg-slate-50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-ocean-700">
                        {dispName(c.user_id)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{c.message}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                  placeholder={t("tickets.commentPlaceholder")}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  onClick={handleAddComment}
                  disabled={savingComment || !commentText.trim()}
                  className="px-4 py-2 bg-ocean-600 text-white rounded-xl flex items-center gap-1.5 text-sm font-semibold hover:bg-ocean-700 disabled:opacity-50 cursor-pointer"
                >
                  {savingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t("common.save")}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status quick change */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-semibold text-ocean-800 text-sm mb-3">{t("tickets.changeStatus")}</h3>
              <div className="space-y-2">
                {STATUSES.filter((s) => s !== ticket.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:border-ocean-300 hover:bg-ocean-50 transition-all cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignment */}
            {isAdminOrOwner && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-semibold text-ocean-800 text-sm mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-ocean-600" /> {t("tickets.assign")}
                  </span>
                  {assigning && <Loader2 className="w-4 h-4 animate-spin text-ocean-600" />}
                </h3>
                <select
                  disabled={assigning}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  value={assignedId(ticket.assigned_to)}
                  onChange={(e) => handleAssign(e.target.value)}
                >
                  <option value="">—</option>
                  <optgroup label="System Users">
                    {admins.map((a) => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Workers">
                    {workers.map((w) => (
                      <option key={w._id} value={w._id}>{w.name} ({w.position || "General"})</option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-400 mt-2">{t("tickets.assignerNotify")}</p>
              </div>
            )}

            {/* History */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-semibold text-ocean-800 text-sm mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-ocean-600" /> {t("tickets.history")}
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {history.length === 0 && <p className="text-xs text-slate-400 text-center py-2">{t("tickets.noHistory")}</p>}
                {history.map((h) => (
                  <div key={h._id} className="border-l-2 border-ocean-100 pl-3">
                    <p className="text-xs text-slate-700">{h.action_performed}</p>
                    <p className="text-[10px] text-slate-400">
                      {dispName(h.user)} · {h.createdAt ? new Date(h.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delete */}
            {isAdminOrOwner && (
              <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
                <button
                  onClick={handleDeleteClick}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> {t("tickets.delete")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Ticket?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this ticket? This will permanently remove its comments and history. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full shadow-md shadow-red-600/10 transition-all cursor-pointer disabled:opacity-50 border-none"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function assignedId(x: any) {
    return typeof x === "object" && x ? x._id : "";
  }
};