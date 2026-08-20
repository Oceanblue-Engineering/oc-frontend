import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, Plus, User, ArrowRight, Activity } from "lucide-react";
import { fetchProjects, Project } from "../services/Project/project.service";
import { ProjectModal } from "../components/Project/ProjectModal";
import { useLanguage } from "../context/LanguageContext";
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardHeader,
  CardContent,
} from "../components/ui";

/**
 * ClientProjects — Renders a list of active projects using the dedicated Project model.
 * Upgraded with OceanBlue Unified Design System.
 */
export const ClientProjects: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchProjects();
      if (res.success) setProjects(res.data.clients);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleNew = () => {
    setModalOpen(true);
  };

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString() : "N/A";

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "active" || s === "in progress") {
      return <Badge variant="success">{status}</Badge>;
    }
    if (s === "completed") {
      return <Badge variant="default">{status}</Badge>;
    }
    if (s === "pending" || s === "on hold") {
      return <Badge variant="warning">{status}</Badge>;
    }
    return <Badge variant="neutral">{status || "Unknown"}</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title="Client Projects"
        subtitle="Manage active customer sites, construction projects and analytics"
        icon={<Briefcase className="w-5 h-5" />}
        actions={
          <Button
            variant="default"
            size="default"
            onClick={handleNew}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Project
          </Button>
        }
      />

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-ocean-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">
            {t("common.loading")}
          </p>
        </div>
      ) : projects.length === 0 ? (
        <Card className="py-16 text-center border-dashed">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center border border-ocean-200/60">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No Active Projects Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Start by creating your first client project to track budgets, expenses, and payroll.
            </p>
            <div className="pt-2">
              <Button
                variant="default"
                size="default"
                onClick={handleNew}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create First Project
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <Card
              key={p._id}
              hoverable
              onClick={() => navigate(`/projects/${p._id}/analytics`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/projects/${p._id}/analytics`);
                }
              }}
              role="button"
              tabIndex={0}
              className="flex flex-col justify-between cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ocean-50 text-ocean-600 rounded-xl flex items-center justify-center shrink-0 border border-ocean-200/50 group-hover:scale-105 transition-transform">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-ocean-600 transition-colors line-clamp-1">
                        {p.siteName}
                      </h3>
                      <div className="mt-0.5">{getStatusBadge(p.status)}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <User className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
                  <span className="font-bold text-slate-700">Client:</span>
                  <span className="truncate font-medium">{p.customer}</span>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {p.description}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Start: {fmtDate(p.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">End: {fmtDate(p.endDate)}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-bold text-ocean-600 group-hover:translate-x-0.5 transition-transform">
                  <span>View Analytics & Expenses</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {modalOpen && (
        <ProjectModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
};