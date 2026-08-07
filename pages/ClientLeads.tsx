import React, { useEffect, useState, useCallback } from "react";
import { Plus, Target, CheckCircle2, Search } from "lucide-react";
import { fetchClients, Client } from "../services/Client/fetchClients";
import { ClientModal } from "../components/Client/ClientModal";
import { useLanguage } from "../context/LanguageContext";
import { PIPELINES, TABS, LeadType } from "../config/clientPipelines";

/**
 * ClientLeads — Pre-Sale Pipeline view (isPostSale = false).
 * Tabbed Sales / Service pipeline. Each tab renders its own stage columns.
 */
export const ClientLeads: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<LeadType>("sales");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchClients({
        isPostSale: false,
        leadType: activeTab,
        search,
      });
      if (res.success) setClients(res.data.clients);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Stages for the active tab only
  const stages = PIPELINES[activeTab];

  const handleNew = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (c: Client) => {
    setSelected(c);
    setModalOpen(true);
  };

  const handleSaved = () => {
    load();
  };

  return (
    <div className="min-h-screen bg-ocean-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ocean-800 flex items-center gap-2">
              <Target className="w-7 h-7 text-ocean-600" />
              {t("clients.leadsTitle")}
            </h1>
            <p className="text-ocean-600 mt-1 font-medium">{t("clients.leadsSubtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none bg-white"
                placeholder={t("clients.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={handleNew}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 shadow-md shadow-ocean-600/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t("clients.newInquiry")}
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 mb-6 gap-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  active
                    ? "bg-ocean-600 text-white shadow-md shadow-ocean-600/20"
                    : "text-ocean-600 hover:bg-ocean-50"
                }`}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Pipeline columns — active tab stages only */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">{t("common.loading")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stages.map((stage) => {
              const stageClients = clients.filter((c) => c.status === stage);
              return (
                <div
                  key={stage}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-ocean-800 text-sm">{stage}</h3>
                    <span className="text-xs font-semibold text-ocean-600 bg-ocean-50 px-2 py-0.5 rounded-full">
                      {stageClients.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {stageClients.length === 0 && (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        {t("clients.noLeads")}
                      </p>
                    )}
                    {stageClients.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => handleEdit(c)}
                        className="w-full text-left bg-ocean-50/40 hover:bg-ocean-50 border border-ocean-100 rounded-xl p-3 transition-all hover:border-ocean-300 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 text-sm truncate">
                            {c.name}
                          </span>
                          {c.creditPersonId && (
                            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                          )}
                        </div>
                        {c.companyName && (
                          <p className="text-xs text-slate-500 mt-1 truncate">{c.companyName}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {c.phone || c.email || "—"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ClientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        client={selected}
        defaultLeadType={activeTab}
        onSaved={handleSaved}
      />
    </div>
  );
};