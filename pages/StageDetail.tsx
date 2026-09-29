import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Plus,
  Target,
  Building2,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchLeads,
  updateLead,
  Lead,
} from "../services/Lead/lead.service";
import { LeadModal } from "../components/Lead/LeadModal";
import { useLanguage } from "../context/LanguageContext";
import { PIPELINES, LeadType } from "../config/clientPipelines";

export const StageDetail: React.FC = () => {
  const { stageName } = useParams<{ stageName: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const decodedStage = stageName ? decodeURIComponent(stageName) : "";
  const leadType = (searchParams.get("type") as LeadType) || "sales";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const loadData = useCallback(async () => {
    if (!decodedStage) return;
    setLoading(true);
    try {
      const res = await fetchLeads({
        status: decodedStage,
        leadType,
        search,
        page,
        limit: 15,
      });

      if (res.success && res.data) {
        setLeads(res.data.clients || []);
        if (res.pagination) {
          setPagination(res.pagination);
        } else {
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalItems: res.data.clients?.length || 0,
            itemsPerPage: 15,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load stage leads:", err);
      toast.error("Failed to load leads for this stage");
    } finally {
      setLoading(false);
    }
  }, [decodedStage, leadType, search, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Stage change quick handler
  const handleQuickStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await updateLead(leadId, { status: newStatus });
      if (res.success) {
        toast.success(`Moved to ${newStatus}`);
        loadData();
      } else {
        toast.error(res.message || "Failed to update stage");
      }
    } catch (error) {
      toast.error("An error occurred while moving stage");
    }
  };

  const handleNew = () => {
    setSelectedLead(null);
    setModalOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  const currentPipelineStages = PIPELINES[leadType] || [];

  return (
    <div className="min-h-screen bg-ocean-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/clients")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Pipeline</span>
          </button>
          <span className="text-slate-400">/</span>
          <span className="text-sm font-medium text-slate-500 capitalize">
            {leadType} Pipeline
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-sm font-bold text-ocean-800">{decodedStage}</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ocean-50 border border-ocean-100 flex items-center justify-center text-ocean-600">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-ocean-800">{decodedStage}</h1>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-ocean-50 text-ocean-700 border border-ocean-200/60">
                    {pagination.totalItems} leads
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed view of all client leads currently in the {decodedStage} stage
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads in this stage..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={handleNew}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 shadow-md shadow-ocean-600/10 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Inquiry</span>
            </button>
          </div>
        </div>

        {/* Content Table / List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-24 text-slate-500 text-sm">
              Loading leads...
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-24 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-ocean-50 text-ocean-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-700">No leads in {decodedStage}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {search
                  ? `No leads matched "${search}". Try searching with a different keyword.`
                  : `There are currently no leads at this pipeline stage. You can add a new lead inquiry below.`}
              </p>
              <button
                onClick={handleNew}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Lead in this Stage</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold text-xs">
                    <th className="py-3 px-4">Lead Name</th>
                    <th className="py-3 px-4">Company / Business</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Problems / Needs</th>
                    <th className="py-3 px-4">Stage Movement</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr
                      key={lead._id}
                      className="hover:bg-ocean-50/20 transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleEdit(lead)}
                          className="text-left font-semibold text-ocean-800 hover:text-ocean-600 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{lead.name}</span>
                          <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                        </button>
                        {lead.industry && (
                          <span className="inline-block text-[11px] text-slate-400 mt-0.5">
                            {lead.industry}
                          </span>
                        )}
                      </td>

                      {/* Company */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          {lead.companyName ? (
                            <>
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium text-xs truncate max-w-[180px]">
                                {lead.companyName}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {lead.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{lead.email}</span>
                            </div>
                          )}
                          {!lead.phone && !lead.email && (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* Problem / Desired Outcome */}
                      <td className="py-3.5 px-4">
                        <div className="max-w-xs">
                          {lead.currentProblems ? (
                            <p className="text-xs text-slate-600 truncate" title={lead.currentProblems}>
                              {lead.currentProblems}
                            </p>
                          ) : lead.desiredOutcome ? (
                            <p className="text-xs text-slate-500 italic truncate" title={lead.desiredOutcome}>
                              {lead.desiredOutcome}
                            </p>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* Quick Stage Move Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleQuickStatusChange(lead._id, e.target.value)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-ocean-600 outline-none cursor-pointer"
                        >
                          {currentPipelineStages.map((stg) => (
                            <option key={stg} value={stg}>
                              {stg}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleEdit(lead)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-ocean-50 text-ocean-700 hover:bg-ocean-100 transition-colors cursor-pointer"
                        >
                          View / Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
              <div>
                Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total leads)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      <LeadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        lead={selectedLead}
        defaultLeadType={leadType}
        onSaved={() => {
          setModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
export default StageDetail;
