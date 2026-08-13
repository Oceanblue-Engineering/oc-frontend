import React, { useState, useEffect } from "react";
import {
  Users,
  RefreshCw,
  User,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { fetchWorkers, Worker as WorkerType } from "../services/Worker/worker.service";
import { WorkerModal } from "../components/Worker/WorkerModal";
import { useLanguage } from "../context/LanguageContext";

export const WorkerManagement: React.FC = () => {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<WorkerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerType | null>(null);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const response = await fetchWorkers();
      if (response.success && response.data) {
        setWorkers(response.data.workers);
      } else {
        toast.error(response.message || "Failed to load workers");
      }
    } catch (error) {
      console.error("Error loading workers:", error);
      toast.error("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const term = search.toLowerCase();
    return (
      w.name.toLowerCase().includes(term) ||
      (w.position && w.position.toLowerCase().includes(term)) ||
      (w.phone && w.phone.includes(term))
    );
  });

  return (
    <div className="w-full lg:h-[calc(100vh-2rem)] p-6">
      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6 lg:h-full lg:overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t("sidebar.workerManagement")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              Manage site workers, positions, and daily rate wages
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setSelectedWorker(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 transition-all shadow-md shadow-ocean-600/10 flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" /> <span>Create Worker</span>
            </button>
            <button
              onClick={loadWorkers}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-ocean-200 text-ocean-600 bg-white hover:bg-ocean-50/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1 no-scrollbar">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-ocean-50 rounded-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-ocean-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-500">Total Workers</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-800">{workers.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workers by name, position, or phone..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean-600 focus:border-ocean-600 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="text-sm text-slate-500 whitespace-nowrap">
                Showing {filteredWorkers.length} of {workers.length} workers
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-ocean-600 mx-auto mb-2" />
              <p className="text-slate-500">Loading workers...</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No workers found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Telegram ID</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWorkers.map((w) => (
                      <tr key={w._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">{w.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{w.phone || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <span className="px-2.5 py-1 rounded-full bg-ocean-50 text-ocean-700 text-xs font-bold">
                            {w.position || "General"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-bold">{w.dailyRate.toLocaleString()} Ks</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{w.telegramId || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedWorker(w);
                              setIsModalOpen(true);
                            }}
                            className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-200 border border-slate-200 font-semibold transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <WorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        worker={selectedWorker}
        onSaved={loadWorkers}
      />
    </div>
  );
};
