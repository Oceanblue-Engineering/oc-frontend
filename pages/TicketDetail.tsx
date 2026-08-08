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
import { useLanguage } from "../context/LanguageContext";

const statusColor: Record<string, string> = {
  Open: "bg-amber-50 text-amber-700 border border-amber-100",
  "In Progress": "bg-blue-50 text-blue-700 border border-blue-100",
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
  const [adminData, setAdminData] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("adminData");
    if (stored) {
      try {
        setAdminData(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const isAdminOrOwner = adminData?.role === "admin" || adminData?.role === "owner";

  const load = async () => {
    if (!id) return;
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (isAdminOrOwner) {
      fetchAdminAccounts().then((r) => {
        if (r.success && r.data) setAdmins(r.data.accounts);
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
    const res = await assignTicket(id, assignedTo || null);
    if (res.success) {
      toast.success(t("tickets.assigned"));
      load();
    } else {
      toast.error(res.message || t("tickets.assignFailed"));
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

  const handleDelete = async () => {
    if (!id || !window.confirm(t("tickets.deleteConfirm"))) return;
    const res = await deleteTicket(id);
    if (res.success) {
      toast.success(t("tickets.deleted"));
      navigate("/tickets");
    } else {
      toast.error(res.message || t("tickets.deleteFailed"));
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
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[ticket.status]}`}>
                      {ticket.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                      {ticket.priority}
                    </span>
                    {dispName(ticket.department_id) && (
                      <span className="text-xs text-slate-500">· {dispName(ticket.department_id)}</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-slate-600 mt-4 whitespace-pre-wrap text-sm">{ticket.description}</p>
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
                <h3 className="font-semibold text-ocean-800 text-sm mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-ocean-600" /> {t("tickets.assign")}
                </h3>
                <select
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none"
                  value={assignedId(ticket.assigned_to)}
                  onChange={(e) => handleAssign(e.target.value)}
                >
                  <option value="">—</option>
                  {admins.map((a) => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
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
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> {t("tickets.delete")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function assignedId(x: any) {
    return typeof x === "object" && x ? x._id : "";
  }
};