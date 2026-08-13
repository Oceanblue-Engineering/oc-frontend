import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, Plus, User } from "lucide-react";
import { fetchProjects, Project } from "../services/Project/project.service";
import { ProjectModal } from "../components/Project/ProjectModal";
import { useLanguage } from "../context/LanguageContext";

/**
 * ClientProjects — Renders a list of active projects using the dedicated Project model.
 * Supports full CRUD capabilities.
 */
export const ClientProjects: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);

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
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (p: Project) => {
    setSelected(p);
    setModalOpen(true);
  };

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString() : "N/A";

  return (
    <div className="min-h-screen bg-ocean-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ocean-800 flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-ocean-600" />
              Client Projects
            </h1>
            <p className="text-ocean-600 mt-1 font-medium">Manage active customer sites and construction projects</p>
          </div>
          <button
            onClick={handleNew}
            className="px-4 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 shadow-md shadow-ocean-600/10 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">{t("common.loading")}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No active projects found. Create one to get started!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg hover:border-ocean-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-ocean-50 text-ocean-600 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-ocean-800 text-sm truncate">{p.siteName}</h3>
                        <span className="text-xs text-ocean-600">{p.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <User className="w-3.5 h-3.5 text-ocean-600" />
                    <span className="font-semibold text-slate-700">Client:</span>
                    <span className="truncate">{p.customer}</span>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-500 mt-3 leading-snug line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-ocean-600" />
                      Start: {fmtDate(p.startDate)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-ocean-600" />
                      End: {fmtDate(p.endDate)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50 flex gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="flex-1 text-center py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-slate-100"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={() => navigate(`/projects/${p._id}/attendance`)}
                    className="flex-1 text-center py-2 px-3 bg-ocean-50 hover:bg-ocean-100 text-ocean-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        project={selected}
        onSaved={load}
      />
    </div>
  );
};