import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  RefreshCw,
  Search,
  User,
  CheckCircle,
  Users,
  Edit,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { createCreditPersona } from "../services/Credit/createCreditPersona";
import { updateCreditPersona } from "../services/Credit/updateCreditPersona";
import { useLanguage } from "../context/LanguageContext";
import {
  PageHeader,
  StatsCard,
  Input,
  Button,
  Badge,
  Modal,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
} from "../components/ui";

export const Credits: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add/Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    loadCreditPersonas();
  }, []);

  const loadCreditPersonas = async () => {
    setLoading(true);
    try {
      const response = await fetchCreditPersonas();
      if (response.success && response.data) {
        setCreditPersonas(response.data);
      } else {
        toast.error(response.message || t("credits.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading credit personas:", error);
      toast.error(t("credits.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadCreditPersonas();
    toast.success(t("credits.refreshed"));
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", phone: "", address: "" });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (persona: CreditPersona) => {
    setEditingId(persona._id);
    setFormData({
      name: persona.name,
      phone: persona.phone,
      address: persona.address || "",
    });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", phone: "", address: "" });
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t("credits.nameRequired"));
      return;
    }
    if (!formData.phone.trim()) {
      toast.error(t("credits.phoneRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const response = await updateCreditPersona(editingId, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim() || undefined,
        });

        if (response.success) {
          toast.success(t("credits.profileUpdated"));
          handleCloseAddModal();
          loadCreditPersonas();
        } else {
          toast.error(response.message || t("credits.failedToUpdate"));
        }
      } else {
        const response = await createCreditPersona({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim() || undefined,
        });

        if (response.success) {
          toast.success(t("credits.profileCreated"));
          handleCloseAddModal();
          loadCreditPersonas();
        } else {
          toast.error(response.message || t("credits.failedToCreate"));
        }
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
      toast.error(
        editingId
          ? t("credits.failedToUpdate")
          : t("credits.failedToCreate"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPersona = (persona: CreditPersona) => {
    navigate(`/credits/${persona._id}`);
  };

  const filteredPersonas = creditPersonas.filter((persona) => {
    const searchLower = search.toLowerCase();
    return (
      persona.name.toLowerCase().includes(searchLower) ||
      persona.phone.includes(search) ||
      (persona.address &&
        persona.address.toLowerCase().includes(searchLower))
    );
  });

  const totalPersonas = creditPersonas.length;
  const blacklistedCount = creditPersonas.filter((p) => p.blacklist).length;
  const activeCount = totalPersonas - blacklistedCount;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title={t("credits.title")}
        subtitle={t("credits.subtitle")}
        icon={<Users className="w-5 h-5" />}
        actions={
          <>
            <Button
              variant="outline"
              size="default"
              onClick={handleRefresh}
              disabled={loading}
              leftIcon={
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              }
            >
              {t("storefront.refresh")}
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={handleOpenAddModal}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              {t("credits.addProfile")}
            </Button>
          </>
        }
      />

      {/* Stats Cards & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        <StatsCard
          label={t("credits.totalProfiles")}
          value={`${totalPersonas} ယောက်`}
          icon={<User className="w-5 h-5" />}
          variant="ocean"
        />

        <StatsCard
          label="Active Customer"
          value={`${activeCount} ယောက်`}
          subValue={`${blacklistedCount} Blacklisted`}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="emerald"
        />

        <div className="flex items-end">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder={t("credits.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Credit Personas Table */}
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-center">No</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Create Date</TableHead>
              <TableHead className="text-center w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableEmpty
                colSpan={7}
                message={t("credits.loading")}
                icon={<RefreshCw className="w-6 h-6 animate-spin text-ocean-600" />}
              />
            ) : filteredPersonas.length === 0 ? (
              <TableEmpty
                colSpan={7}
                message={
                  search ? t("credits.noResults") : t("credits.noProfiles")
                }
                icon={<User className="w-6 h-6 text-slate-300" />}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAddModal}
                    leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                  >
                    {t("credits.addProfile")}
                  </Button>
                }
              />
            ) : (
              filteredPersonas.map((persona, index) => (
                <TableRow key={persona._id}>
                  <TableCell className="text-center font-bold text-slate-400 text-xs">
                    {String(index + 1).padStart(2, "0")}
                  </TableCell>

                  <TableCell className="font-bold text-slate-900 text-xs sm:text-sm">
                    {persona.name}
                  </TableCell>

                  <TableCell className="text-slate-700 text-xs font-semibold">
                    {persona.phone}
                  </TableCell>

                  <TableCell
                    className="text-slate-500 text-xs font-medium max-w-xs truncate"
                    title={persona.address || ""}
                  >
                    {persona.address || "-"}
                  </TableCell>

                  <TableCell>
                    {persona.blacklist ? (
                      <Badge variant="destructive">Blacklisted</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-slate-500 text-xs font-medium whitespace-nowrap">
                    {new Date(persona.createdAt).toLocaleDateString("en-US")}
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="subtle"
                        size="icon-sm"
                        onClick={() => handleOpenEditModal(persona)}
                        title={t("common.edit")}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="default"
                        size="icon-sm"
                        onClick={() => handleViewPersona(persona)}
                        title={t("common.checkItem")}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit Profile Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        title={
          editingId
            ? t("credits.editProfile") || "Edit Credit Profile"
            : t("credits.addProfile") || "New Credit Profile"
        }
        description="Fill in customer credit information"
        size="default"
      >
        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {t("credits.customerName") || "Customer Name"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. U Ba"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {t("credits.phoneNumber") || "Phone Number"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              required
              placeholder="09..."
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {t("credits.address") || "Address"}{" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/10 transition-all outline-none"
              placeholder="Customer address..."
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleCloseAddModal}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="default"
              size="default"
              isLoading={isSubmitting}
            >
              {editingId
                ? t("credits.saveChanges") || "Save Changes"
                : t("credits.createProfile") || "Create Profile"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
