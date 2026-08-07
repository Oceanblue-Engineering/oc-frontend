import React, { useEffect, useState, useCallback } from "react";
import { Briefcase, Calendar, CheckCircle2 } from "lucide-react";
import { fetchClients, Client } from "../services/Client/fetchClients";
import { ClientModal } from "../components/Client/ClientModal";
import { useLanguage } from "../context/LanguageContext";

/**
 * ClientProjects — Post-Sale view (isPostSale = true).
 * Shows active projects with deliverables, dates, and service status.
 */
export const ClientProjects: React.FC = () => {
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchClients({ isPostSale: true });
      if (res.success) setClients(res.data.clients);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEdit = (c: Client) => {
    setSelected(c);
    setModalOpen(true);
  };

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString() : t("clients.na");

  return (
    <div className="min-h-screen bg-ocean-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-ocean-800 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-ocean-600" />
            {t("clients.projectsTitle")}
          </h1>
          <p className="text-ocean-600 mt-1 font-medium">{t("clients.projectsSubtitle")}</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">{t("common.loading")}</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-20 text-slate-500">{t("clients.noProjects")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((c) => (
              <button
                key={c._id}
                onClick={() => handleEdit(c)}
                className="text-left bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg hover:border-ocean-300 hover:-translate-y-1 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ocean-50 text-ocean-600 rounded-xl flex items-center justify-center">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ocean-800 text-sm truncate">{c.name}</h3>
                      <span className="text-xs text-ocean-600">{c.status}</span>
                    </div>
                  </div>
                  {c.creditPersonId && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t("clients.synced")}
                    </span>
                  )}
                </div>

                {c.deliverablesSummary && (
                  <p className="text-xs text-slate-500 mt-2 leading-snug line-clamp-2">
                    {c.deliverablesSummary}
                  </p>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-ocean-600" />
                    {t("clients.start")}: {fmtDate(c.projectStartDate)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-ocean-600" />
                    {t("clients.delivery")}: {fmtDate(c.projectDeliveryDate)}
                  </div>
                </div>

                {c.purchasedServices && c.purchasedServices.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.purchasedServices.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                      >
                        {s.name}: {s.status}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <ClientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        client={selected}
        onSaved={load}
      />
    </div>
  );
};