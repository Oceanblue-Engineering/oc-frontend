import React, { useEffect, useState, useCallback } from "react";
import { Plus, MapPin, Truck, Loader2, Pencil, Trash2, Power, Search } from "lucide-react";
import { toast } from "sonner";
import {
  fetchTownships,
  Township,
} from "../services/Township/fetchTownships";
import { createTownship } from "../services/Township/createTownship";
import { updateTownship } from "../services/Township/updateTownship";
import { deleteTownship } from "../services/Township/deleteTownship";
import {
  fetchDeliveryAnalytics,
  DeliveryAnalytics,
} from "../services/Delivery/fetchDeliveryAnalytics";
import { useLanguage } from "../context/LanguageContext";
import { Modal } from "../components/Modal";

interface FormState {
  name: string;
  deliveryFee: string;
  isActive: boolean;
}

const emptyForm: FormState = { name: "", deliveryFee: "", isActive: true };

/**
 * DeliveryManagement — township-based delivery fee CRUD.
 * Manages the townships used by the POS checkout delivery selector.
 */
export const DeliveryManagement: React.FC = () => {
  const { t } = useLanguage();
  const [townships, setTownships] = useState<Township[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<DeliveryAnalytics | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTownships();
      if (res.success) setTownships(res.data.townships);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    const res = await fetchDeliveryAnalytics();
    if (res.success && res.data) setAnalytics(res.data);
  }, []);

  useEffect(() => {
    load();
    loadAnalytics();
  }, [load, loadAnalytics]);

  const filtered = townships.filter((tw) =>
    tw.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (tw: Township) => {
    setEditingId(tw._id);
    setForm({
      name: tw.name,
      deliveryFee: String(tw.deliveryFee),
      isActive: tw.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t("delivery.nameRequired"));
      return;
    }
    const fee = Number(form.deliveryFee);
    if (isNaN(fee) || fee < 0) {
      toast.error(t("delivery.feeRequired"));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await updateTownship(editingId, {
          name: form.name.trim(),
          deliveryFee: fee,
          isActive: form.isActive,
        });
        if (res.success) {
          toast.success(t("delivery.updated"));
          setModalOpen(false);
          load();
          loadAnalytics();
        } else {
          toast.error(res.message || t("delivery.updateFailed"));
        }
      } else {
        const res = await createTownship({
          name: form.name.trim(),
          deliveryFee: fee,
          isActive: form.isActive,
        });
        if (res.success) {
          toast.success(t("delivery.created"));
          setModalOpen(false);
          load();
          loadAnalytics();
        } else {
          toast.error(res.message || t("delivery.createFailed"));
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (tw: Township) => {
    setBusyId(tw._id);
    try {
      const res = await updateTownship(tw._id, { isActive: !tw.isActive });
      if (res.success) {
        toast.success(res.data?.township?.isActive ? t("delivery.activated") : t("delivery.disabled"));
        load();
      } else {
        toast.error(res.message || t("delivery.updateFailed"));
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (tw: Township) => {
    if (!window.confirm(t("delivery.deleteConfirm"))) return;
    setBusyId(tw._id);
    try {
      const res = await deleteTownship(tw._id);
      if (res.success) {
        toast.success(t("delivery.deleted"));
        load();
      } else {
        toast.error(res.message || t("delivery.deleteFailed"));
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-ocean-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ocean-800 flex items-center gap-2">
              <Truck className="w-7 h-7 text-ocean-600" />
              {t("delivery.title")}
            </h1>
            <p className="text-ocean-600 mt-1 font-medium">{t("delivery.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 outline-none bg-white"
                placeholder={t("delivery.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={openAdd}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 shadow-md shadow-ocean-600/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t("delivery.addTownship")}
            </button>
          </div>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="mb-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{t("delivery.analytics.townships")}</p>
                <p className="text-2xl font-black text-ocean-800 mt-1">{townships.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{t("delivery.analytics.activeTownships")}</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {townships.filter((tw) => tw.isActive).length}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{t("delivery.analytics.totalOrders")}</p>
                <p className="text-2xl font-black text-ocean-800 mt-1">{analytics.totals.totalOrders}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{t("delivery.analytics.totalRevenue")}</p>
                <p className="text-2xl font-black text-ocean-600 mt-1">{analytics.totals.totalRevenue.toLocaleString()}</p>
                <p className="text-[10px] font-medium text-slate-400 -mt-0.5">MMK</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Township breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-semibold text-ocean-800 text-sm mb-3">{t("delivery.analytics.townshipBreakdown")}</h3>
                {analytics.byTownship.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">{t("delivery.empty")}</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.byTownship.map((tw) => (
                      <div key={tw.townshipName} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
                        <span className="font-medium text-slate-700">{tw.townshipName}</span>
                        <span className="text-slate-500 text-xs">
                          {tw.orders} {t("delivery.analytics.orders")} · <span className="font-semibold text-ocean-700">{tw.revenue.toLocaleString()} MMK</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-semibold text-ocean-800 text-sm mb-3">{t("delivery.analytics.statusBreakdown")}</h3>
                <div className="space-y-2">
                  {[
                    { key: "pending", color: "bg-amber-50 text-amber-700" },
                    { key: "processing", color: "bg-blue-50 text-blue-700" },
                    { key: "out_for_delivery", color: "bg-sky-50 text-sky-700" },
                    { key: "delivered", color: "bg-emerald-50 text-emerald-700" },
                    { key: "cancelled", color: "bg-red-50 text-red-600" },
                  ].map((s) => (
                    <div key={s.key} className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.color}`}>
                        {s.key.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <span className="text-sm font-black text-slate-700">
                        {analytics.byStatus[s.key] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> {t("common.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">{t("delivery.empty")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tw) => (
              <div
                key={tw._id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg hover:border-ocean-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tw.isActive
                          ? "bg-ocean-50 text-ocean-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ocean-800 text-sm">{tw.name}</h3>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tw.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {tw.isActive ? t("delivery.active") : t("delivery.inactive")}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-ocean-700 whitespace-nowrap">
                    {tw.deliveryFee.toLocaleString()} <span className="text-xs font-medium text-slate-400">MMK</span>
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEdit(tw)}
                    disabled={busyId === tw._id}
                    className="p-2 text-ocean-600 hover:bg-ocean-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                    title={t("delivery.edit")}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(tw)}
                    disabled={busyId === tw._id}
                    className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                    title={tw.isActive ? t("delivery.disable") : t("delivery.activate")}
                  >
                    {busyId === tw._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(tw)}
                    disabled={busyId === tw._id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                    title={t("delivery.delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t("delivery.editTownship") : t("delivery.addTownship")}
      >
        <div className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">{t("delivery.townshipName")}</label>
            <input
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">{t("delivery.deliveryFee")} (MMK)</label>
            <input
              type="number"
              min={0}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none"
              value={form.deliveryFee}
              onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 text-ocean-600"
            />
            <span className="text-sm font-medium text-slate-600">{t("delivery.activeLabel")}</span>
          </label>
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
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {t("common.save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};