import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Gift,
  RefreshCw,
  Loader2,
  Plus,
  Search,
  Edit,
  Trash2,
  Ticket,
  CheckCircle,
  Package,
  ChevronDown,
  X,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { ConfirmModal } from "../components/Common/ConfirmModal";

// Services
import {
  fetchPromotions,
  LuckyDrawPromotion,
} from "../services/LuckyDraw/fetchPromotions";
import { createPromotion } from "../services/LuckyDraw/createPromotion";
import { updatePromotion } from "../services/LuckyDraw/updatePromotion";
import { deletePromotion } from "../services/LuckyDraw/deletePromotion";
import {
  processRedemption,
} from "../services/LuckyDraw/processRedemption";
import {
  fetchRedemptions,
  LuckyDrawRedemption,
} from "../services/LuckyDraw/fetchRedemptions";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import { DateRangePicker } from "../components/Reports/DateRangePicker";

// ─── Types ──────────────────────────────────────────────────────
interface InventoryProduct {
  _id: string;
  id?: string;
  name?: string;
  productName?: string;
  productCode?: string;
  sellingPrice?: number;
}

type TabType = "promotions" | "redeem";
type StatusFilter = "all" | "active" | "inactive";

// ─── Component ──────────────────────────────────────────────────
export const LuckyDraw: React.FC = () => {
  const { t } = useLanguage();

  // ── Tab State ──
  const [activeTab, setActiveTab] = useState<TabType>("redeem");

  // ── Promotions State ──
  const [promotions, setPromotions] = useState<LuckyDrawPromotion[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [promotionsPagination, setPromotionsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // ── Products for dropdown ──
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // ── Storefronts for dropdown ──
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);

  // ── Promotion Modal State ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPromotion, setEditingPromotion] =
    useState<LuckyDrawPromotion | null>(null);
  const [formData, setFormData] = useState<{
    promotionName: string;
    ticketName: string;
    inventoryId: string;
    redemptionPrice: number | string;
    quantityPerRedeem: number;
    storefrontId: string;
  }>({
    promotionName: "",
    ticketName: "",
    inventoryId: "",
    redemptionPrice: "",
    quantityPerRedeem: 1,
    storefrontId: "",
  });
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // ── Redeem Modal State ── (အသစ်ထည့်ထားသော State)
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);

  // ── Delete State ──
  const [promotionToDelete, setPromotionToDelete] =
    useState<LuckyDrawPromotion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Redemption State ──
  const [redemptions, setRedemptions] = useState<LuckyDrawRedemption[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemForm, setRedeemForm] = useState({
    promotionId: "",
    storefrontId: "",
    ticketCode: "",
    customerName: "",
    note: "",
  });

  // ── Redemption Filter State ──
  const [redemptionSearch, setRedemptionSearch] = useState("");
  const [redemptionStartDate, setRedemptionStartDate] = useState<Date | null>(null);
  const [redemptionEndDate, setRedemptionEndDate] = useState<Date | null>(null);

  // ── Derived data for redemption form ──
  const selectedPromotion = promotions.find(
    (p) => p._id === redeemForm.promotionId
  );

  // ── Admin data ──
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  // ─── Effects ──────────────────────────────────────────────────
  useEffect(() => {
    loadPromotions();
    loadProducts();
    loadStorefronts();
  }, []);

  // Fetch redemptions when active tab is redeem or date filters change
  useEffect(() => {
    if (activeTab === "redeem") {
      loadRedemptions();
    }
  }, [activeTab, redemptionStartDate, redemptionEndDate]);

  // Close product dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-set storefrontId for cashier role
  useEffect(() => {
    if (userRole === "cashier" && adminData.locationId) {
      setRedeemForm((prev) => ({
        ...prev,
        storefrontId: adminData.locationId,
      }));
    }
  }, [userRole, adminData.locationId]);

  // ─── Data Loading ─────────────────────────────────────────────
  const loadPromotions = async (page = promotionsPagination.currentPage, limit = promotionsPagination.itemsPerPage) => {
    setLoadingPromotions(true);
    try {
      const response = await fetchPromotions(undefined, page, limit);
      if (response.success && response.data?.promotions) {
        setPromotions(response.data.promotions);
        if (response.pagination) {
          setPromotionsPagination(response.pagination);
        }
      } else {
        toast.error(response.message || t("luckyDraw.failedToLoadPromotions"));
      }
    } catch (error: any) {
      console.error("Error loading promotions:", error);
      toast.error(error.message || t("luckyDraw.failedToLoadPromotions"));
    } finally {
      setLoadingPromotions(false);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetchProducts();
      if (response.success && response.data) {
        setProducts(response.data as any);
      }
    } catch (error: any) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadStorefronts = async () => {
    try {
      const response = await fetchStorefrontProfiles();
      if (response.success && response.data) {
        setStorefronts(response.data);
      }
    } catch (error: any) {
      console.error("Error loading storefronts:", error);
    }
  };

  const loadRedemptions = async () => {
    setLoadingRedemptions(true);
    try {
      let startStr: string | null = null;
      let endStr: string | null = null;

      if (redemptionStartDate) {
        const start = new Date(redemptionStartDate);
        start.setHours(0, 0, 0, 0);
        startStr = start.toISOString();
      }

      if (redemptionEndDate) {
        const end = new Date(redemptionEndDate);
        end.setHours(23, 59, 59, 999);
        endStr = end.toISOString();
      }

      const response = await fetchRedemptions(startStr, endStr);
      if (response.success && response.data?.redemptions) {
        setRedemptions(response.data.redemptions);
      }
    } catch (error: any) {
      console.error("Error loading redemptions:", error);
      toast.error(error.message || t("luckyDraw.failedToLoadRedemptions"));
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const hasActiveRedemptionFilters =
    redemptionSearch.trim() !== "" ||
    redemptionStartDate !== null ||
    redemptionEndDate !== null;

  const handleClearRedemptionFilters = () => {
    setRedemptionSearch("");
    setRedemptionStartDate(null);
    setRedemptionEndDate(null);
  };

  // ─── Promotion CRUD Handlers ──────────────────────────────────
  const handleOpenCreate = () => {
    setEditingPromotion(null);
    setFormData({
      promotionName: "",
      ticketName: "",
      inventoryId: "",
      redemptionPrice: "",
      quantityPerRedeem: 1,
      storefrontId: "",
    });
    setProductSearch("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promotion: LuckyDrawPromotion) => {
    setEditingPromotion(promotion);
    setFormData({
      promotionName: promotion.promotionName,
      ticketName: promotion.ticketName,
      inventoryId: promotion.inventoryId?._id || "",
      redemptionPrice: promotion.redemptionPrice ?? 0,
      quantityPerRedeem: promotion.quantityPerRedeem,
      storefrontId: promotion.storefrontId?._id || "",
    });
    setProductSearch(promotion.inventoryId?.productName || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPromotion(null);
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const handleSubmitPromotion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.promotionName.trim()) {
      toast.error(t("luckyDraw.promotionNameRequired"));
      return;
    }
    if (!formData.ticketName.trim()) {
      toast.error(t("luckyDraw.ticketNameRequired"));
      return;
    }
    if (!formData.inventoryId) {
      toast.error(t("luckyDraw.productRequired"));
      return;
    }

    const parsedRedemptionPrice =
      formData.redemptionPrice === "" ||
        formData.redemptionPrice === null ||
        formData.redemptionPrice === undefined
        ? 0
        : Number(formData.redemptionPrice);

    if (isNaN(parsedRedemptionPrice) || parsedRedemptionPrice < 0) {
      toast.error(t("luckyDraw.priceCannotBeNegative"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPromotion) {
        const response = await updatePromotion(editingPromotion._id, {
          promotionName: formData.promotionName,
          ticketName: formData.ticketName,
          inventoryId: formData.inventoryId,
          redemptionPrice: parsedRedemptionPrice,
          quantityPerRedeem: formData.quantityPerRedeem,
          storefrontId: formData.storefrontId || undefined,
        });
        if (response.success) {
          toast.success(t("luckyDraw.promotionUpdated"));
          handleCloseModal();
          loadPromotions();
        } else {
          toast.error(response.message || t("luckyDraw.failedToUpdate"));
        }
      } else {
        const payload: any = {
          promotionName: formData.promotionName,
          ticketName: formData.ticketName,
          inventoryId: formData.inventoryId,
          redemptionPrice: parsedRedemptionPrice,
          quantityPerRedeem: formData.quantityPerRedeem,
        };
        if (formData.storefrontId) {
          payload.storefrontId = formData.storefrontId;
        }
        const response = await createPromotion(payload);
        if (response.success) {
          toast.success(t("luckyDraw.promotionCreated"));
          handleCloseModal();
          loadPromotions();
        } else {
          toast.error(response.message || t("luckyDraw.failedToCreate"));
        }
      }
    } catch (error: any) {
      console.error("Error saving promotion:", error);
      toast.error(error.message || t("luckyDraw.failedToSave"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!promotionToDelete) return;

    setIsDeleting(true);
    try {
      const response = await deletePromotion(promotionToDelete._id);
      if (response.success) {
        toast.success(t("luckyDraw.promotionDeleted"));
        setPromotionToDelete(null);
        loadPromotions();
      } else {
        toast.error(response.message || t("luckyDraw.failedToDelete"));
      }
    } catch (error: any) {
      console.error("Error deleting promotion:", error);
      toast.error(error.message || t("luckyDraw.failedToDelete"));
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Toggle Active Status ─────────────────────────────────────
  const handleToggleActive = async (promotion: LuckyDrawPromotion) => {
    try {
      const response = await updatePromotion(promotion._id, {
        isActive: !promotion.isActive,
      });
      if (response.success) {
        toast.success(
          promotion.isActive
            ? t("luckyDraw.promotionDeactivated")
            : t("luckyDraw.promotionActivated")
        );
        loadPromotions();
      } else {
        toast.error(response.message || t("luckyDraw.failedToUpdate"));
      }
    } catch (error: any) {
      toast.error(error.message || t("luckyDraw.failedToUpdate"));
    }
  };

  // ─── Redemption Handler ───────────────────────────────────────
  const handleSubmitRedemption = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!redeemForm.promotionId) {
      toast.error(t("luckyDraw.selectPromotion"));
      return;
    }
    if (!redeemForm.storefrontId) {
      toast.error(t("luckyDraw.selectStorefront"));
      return;
    }

    setIsRedeeming(true);
    try {
      const payload: any = {
        promotionId: redeemForm.promotionId,
        storefrontId: redeemForm.storefrontId,
      };
      if (redeemForm.ticketCode.trim()) {
        payload.ticketCode = redeemForm.ticketCode.trim();
      }
      if (redeemForm.customerName.trim()) {
        payload.customerName = redeemForm.customerName.trim();
      }
      if (redeemForm.note.trim()) {
        payload.note = redeemForm.note.trim();
      }

      const response = await processRedemption(payload);
      if (response.success) {
        toast.success(t("luckyDraw.redemptionSuccess"));
        // Reset form
        setRedeemForm((prev) => ({
          ...prev,
          promotionId: "",
          ticketCode: "",
          customerName: "",
          note: "",
        }));
        // Refresh redemption history
        loadRedemptions();
        // Form အောင်မြင်ရင် Modal ကိုပိတ်မယ် (အသစ်ထည့်ထားသော Code)
        setIsRedeemModalOpen(false);
      } else {
        toast.error(response.message || t("luckyDraw.redemptionFailed"));
      }
    } catch (error: any) {
      console.error("Error processing redemption:", error);
      // Show specific error messages from backend
      const msg = error.message || t("luckyDraw.redemptionFailed");
      toast.error(msg);
    } finally {
      setIsRedeeming(false);
    }
  };

  // ─── Filtering ────────────────────────────────────────────────
  const filteredPromotions = promotions.filter((promo) => {
    // Status filter
    if (statusFilter === "active" && !promo.isActive) return false;
    if (statusFilter === "inactive" && promo.isActive) return false;

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      const matchName = promo.promotionName
        .toLowerCase()
        .includes(searchLower);
      const matchTicket = promo.ticketName
        .toLowerCase()
        .includes(searchLower);
      const matchProduct = promo.inventoryId?.productName
        ?.toLowerCase()
        .includes(searchLower);
      return matchName || matchTicket || matchProduct;
    }
    return true;
  });

  const filteredProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const s = productSearch.toLowerCase();
    const name = (p.productName || p.name || "").toLowerCase();
    const code = (p.productCode || "").toLowerCase();
    return name.includes(s) || code.includes(s);
  });

  const activePromotions = promotions.filter((p) => p.isActive);

  // ─── Redemption Filtering ─────────────────────────────────────
  const filteredRedemptions = useMemo(() => {
    return redemptions.filter((r) => {
      // Date Range Filter: ensure 00:00:00 start of day and 23:59:59.999 end of day
      if (redemptionStartDate || redemptionEndDate) {
        const itemDate = new Date(r.createdAt);
        if (redemptionStartDate) {
          const start = new Date(redemptionStartDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }
        if (redemptionEndDate) {
          const end = new Date(redemptionEndDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
      }

      // Search Filter: redemptionNo, ticketCode, productName (or product.name)
      if (redemptionSearch.trim()) {
        const q = redemptionSearch.toLowerCase().trim();

        const redemptionNo = (
          r.redemptionNumber ||
          (r as any).redemptionNo ||
          ""
        ).toLowerCase();
        const ticketCode = (r.ticketCode || "").toLowerCase();
        const productName = (
          r.inventoryId?.productName ||
          (r.inventoryId as any)?.name ||
          (r as any)?.productName ||
          (r as any)?.product?.name ||
          ""
        ).toLowerCase();
        const productCode = (r.inventoryId?.productCode || "").toLowerCase();
        const promotionName = (
          r.promotionId?.promotionName || ""
        ).toLowerCase();
        const customerName = (r.customerName || "").toLowerCase();

        const storeName = (
          r.storefrontId?.locationName || ""
        ).toLowerCase();
        const storeCode = (
          r.storefrontId?.locationCode || ""
        ).toLowerCase();
        const noteText = (r.note || "").toLowerCase();

        const matchRedemptionNo = redemptionNo.includes(q);
        const matchTicketCode = ticketCode.includes(q);
        const matchProductName = productName.includes(q);
        const matchProductCode = productCode.includes(q);
        const matchPromotionName = promotionName.includes(q);
        const matchCustomerName = customerName.includes(q);
        const matchStore = storeName.includes(q) || storeCode.includes(q);
        const matchNote = noteText.includes(q);

        return (
          matchRedemptionNo ||
          matchTicketCode ||
          matchProductName ||
          matchProductCode ||
          matchPromotionName ||
          matchCustomerName ||
          matchStore ||
          matchNote
        );
      }

      return true;
    });
  }, [redemptions, redemptionSearch, redemptionStartDate, redemptionEndDate]);

  // ─── Helpers ──────────────────────────────────────────────────
  const getProductDisplayName = (product: InventoryProduct) => {
    const name = product.productName || product.name || "Unknown";
    return product.productCode ? `${name} (${product.productCode})` : name;
  };

  const getSelectedProductName = () => {
    const product = products.find(
      (p) => (p._id || p.id) === formData.inventoryId
    );
    if (product) return getProductDisplayName(product);
    return "";
  };

  const renderPromotionsPagination = () => {
    const { currentPage, totalPages, totalItems, itemsPerPage } = promotionsPagination;

    // Hide pagination if total items are 10 or less
    if (totalItems <= 10) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between px-5 py-4 bg-white border-t border-gray-100 rounded-b-2xl">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600 font-medium">
            Showing {startItem} to {endItem} of {totalItems} results
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPromotions(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => loadPromotions(page)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${page === currentPage
                  ? "bg-[#27272a] text-white shadow-md shadow-ocean-600/10"
                  : "text-slate-600 hover:bg-slate-50 border border-transparent"
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadPromotions(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
              <Gift className="w-6 h-6 text-[#27272a]" />
              {t("luckyDraw.title")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("luckyDraw.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (activeTab === "promotions") loadPromotions();
                else loadRedemptions();
              }}
              disabled={loadingPromotions || loadingRedemptions}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-ocean-200 text-[#27272a] bg-white hover:bg-ocean-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingPromotions || loadingRedemptions ? "animate-spin" : ""
                  }`}
              />
              <span>{t("storefront.refresh") || "Refresh"}</span>
            </button>

            {/* လဲလှယ်ရန် Tab ဖြစ်နေလျှင် ပေါ်မည့် "လဲလှယ်မယ့် ပစ္စည်းထည့်မည်" Button */}
            {activeTab === "redeem" && (
              <button
                onClick={() => setIsRedeemModalOpen(true)}
                className="px-5 py-2 text-sm font-semibold rounded-full bg-[#27272a] text-white hover:bg-[#27272a]/90 transition-all shadow-md shadow-ocean-600/10 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>လဲလှယ်မယ့် ပစ္စည်းထည့်မည်</span>
              </button>
            )}

            {/* Date Range Picker — visible on Redeem tab, positioned in header like Credit Orders */}
            {activeTab === "redeem" && (
              <DateRangePicker
                startDate={redemptionStartDate}
                endDate={redemptionEndDate}
                onChange={(newStart, newEnd) => {
                  setRedemptionStartDate(newStart);
                  setRedemptionEndDate(newEnd);
                }}
                className="px-5 py-2 text-sm font-semibold rounded-full bg-[#27272a] text-white hover:bg-[#27272a]/90 transition-all shadow-md shadow-ocean-600/10 flex items-center gap-2 cursor-pointer"
              />
            )}

            {/* ပရိုမိုးရှင်း Tab ဖြစ်နေလျှင် ပေါ်မည့် Button */}
            {activeTab === "promotions" && (
              <button
                onClick={handleOpenCreate}
                className="px-5 py-2 text-sm font-semibold rounded-full bg-[#27272a] text-white hover:bg-[#27272a]/90 transition-all shadow-md shadow-ocean-600/10 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("luckyDraw.addPromotion")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("redeem")}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${activeTab === "redeem"
              ? "bg-white text-[#27272a] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Gift className="w-4 h-4" />
            {t("luckyDraw.redeem")}

          </button>
          <button
            onClick={() => setActiveTab("promotions")}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${activeTab === "promotions"
              ? "bg-white text-[#27272a] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Ticket className="w-4 h-4" />
            {t("luckyDraw.promotions")}

          </button>
        </div>

        {/* ══════════════════ Tab 1: Promotions ══════════════════ */}
        {activeTab === "promotions" && (
          <>
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("luckyDraw.searchPlaceholder")}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200/80 rounded-full focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-xs sm:text-sm text-slate-700 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1.5 bg-gray-100 rounded-full p-1">
                {(["all", "active", "inactive"] as StatusFilter[]).map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer capitalize ${statusFilter === filter
                        ? "bg-white text-[#27272a] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      {t(`luckyDraw.${filter}`) || filter}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Promotions Table */}
            <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col min-h-0">
              {loadingPromotions ? (
                <div className="p-8 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-[#27272a] mx-auto mb-2" />
                  <p>{t("common.loading")}</p>
                </div>
              ) : filteredPromotions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>{t("luckyDraw.noPromotions")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[900px]">
                    <thead className="text-slate-500">
                      <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 whitespace-nowrap">
                          No
                        </th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 min-w-[180px] whitespace-nowrap">
                          {t("luckyDraw.promotionName")}
                        </th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 min-w-[180px] whitespace-nowrap">
                          {t("luckyDraw.ticketName")}
                        </th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 min-w-[200px] whitespace-nowrap">
                          {t("luckyDraw.linkedProduct")}
                        </th>
                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 whitespace-nowrap">
                          {t("luckyDraw.redemptionPrice")}
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 whitespace-nowrap">
                          {t("luckyDraw.qtyPerRedeem")}
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 whitespace-nowrap">
                          {t("common.status")}
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 whitespace-nowrap">
                          {t("common.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredPromotions.map((promo, index) => (
                        <tr
                          key={promo._id}
                          className="hover:bg-slate-50/40 transition-colors"
                        >
                          <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs whitespace-nowrap">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="px-4 py-4 min-w-[180px] whitespace-nowrap">
                            <div className="font-semibold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                              {promo.promotionName}
                            </div>
                          </td>
                          <td className="px-4 py-4 min-w-[180px] whitespace-nowrap">
                            <span className="text-xs bg-ocean-50 text-ocean-700 border border-ocean-200 px-3 py-1 rounded-full font-bold whitespace-nowrap inline-block">
                              {promo.ticketName}
                            </span>
                          </td>
                          <td className="px-4 py-4 min-w-[200px] whitespace-nowrap">
                            {promo.inventoryId ? (
                              <>
                                <div className="font-semibold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                                  {promo.inventoryId.productName}
                                </div>
                                {promo.inventoryId.productCode && (
                                  <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                    {promo.inventoryId.productCode}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400 font-medium text-xs whitespace-nowrap">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                            {promo.redemptionPrice.toLocaleString()}{" "}
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                              MMK
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-semibold text-slate-600 text-xs whitespace-nowrap">
                            {promo.quantityPerRedeem}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleActive(promo)}
                              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap ${promo.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                                }`}
                            >
                              {promo.isActive
                                ? t("luckyDraw.active")
                                : t("luckyDraw.inactive")}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                              <button
                                onClick={() => handleOpenEdit(promo)}
                                className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#27272a] hover:bg-[#27272a]/90 text-white shadow-sm flex items-center justify-center cursor-pointer transition-all whitespace-nowrap"
                              >
                                {t("common.edit")}
                              </button>
                              <button
                                onClick={() => setPromotionToDelete(promo)}
                                className="px-4 py-1.5 text-xs font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center justify-center cursor-pointer transition-all whitespace-nowrap"
                              >
                                {t("common.delete")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {filteredPromotions.length > 0 && renderPromotionsPagination()}
            </div>
          </>
        )}

        {/* ══════════════════ Tab 2: Redemption ══════════════════ */}
        {activeTab === "redeem" && (
          <div className="flex flex-col gap-6">
            {/* Search & Date Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("luckyDraw.redemptionSearchPlaceholder")}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200/80 rounded-full focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-xs sm:text-sm text-slate-700 bg-white"
                  value={redemptionSearch}
                  onChange={(e) => setRedemptionSearch(e.target.value)}
                />
              </div>

              {/* Clear Filters Button */}
              {hasActiveRedemptionFilters && (
                <button
                  onClick={handleClearRedemptionFilters}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-full border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {t("luckyDraw.clearFilters")}
                </button>
              )}
            </div>

            {/* Recent Redemptions Table */}
            <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col min-h-0">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {t("luckyDraw.recentRedemptions")}
                </h3>
              </div>
              {loadingRedemptions ? (
                <div className="p-8 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-[#27272a] mx-auto mb-2" />
                  <p>{t("common.loading")}</p>
                </div>
              ) : filteredRedemptions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>{t("luckyDraw.noRedemptions")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
                  <table className="w-full text-sm text-left min-w-[1300px]">
                    <thead className="text-slate-500">
                      <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 whitespace-nowrap">
                          No
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 whitespace-nowrap">
                          {t("luckyDraw.redemptionNo")}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 min-w-[140px] whitespace-nowrap">
                          {t("luckyDraw.storefront")}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 min-w-[140px] whitespace-nowrap">
                          {t("luckyDraw.customerName")}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 min-w-[180px] whitespace-nowrap">
                          {t("luckyDraw.promotionName")}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 min-w-[200px] whitespace-nowrap">
                          {t("luckyDraw.product")}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 min-w-[180px] whitespace-nowrap">
                          {t("luckyDraw.ticketCode")}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 whitespace-nowrap">
                          {t("common.quantity")}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 whitespace-nowrap">
                          {t("common.total")}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 whitespace-nowrap">
                          {t("luckyDraw.redeemedBy")}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 min-w-[150px] whitespace-nowrap">
                          {t("luckyDraw.note")}
                        </th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 whitespace-nowrap">
                          {t("common.date")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredRedemptions.map((r, index) => (
                        <tr
                          key={r._id}
                          className="hover:bg-slate-50/40 transition-colors"
                        >
                          <td className="px-4 py-3.5 text-center font-bold text-slate-400 text-xs whitespace-nowrap">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold whitespace-nowrap inline-block">
                              {r.redemptionNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">
                            {r.storefrontId ? (
                              <>
                                <div className="font-semibold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                                  {r.storefrontId.locationName}
                                </div>
                                {r.storefrontId.locationCode && (
                                  <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                    {r.storefrontId.locationCode}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400 font-medium text-xs whitespace-nowrap">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">
                            {r.customerName ? (
                              <span className="font-semibold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                                {r.customerName}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium text-xs whitespace-nowrap">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-800 text-xs sm:text-sm min-w-[180px] whitespace-nowrap">
                            {r.promotionId?.promotionName || "-"}
                          </td>
                          <td className="px-4 py-3.5 min-w-[200px] whitespace-nowrap">
                            {r.inventoryId ? (
                              <>
                                <div className="font-semibold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                                  {r.inventoryId.productName}
                                </div>
                                {r.inventoryId.productCode && (
                                  <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                    {r.inventoryId.productCode}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400 font-medium text-xs whitespace-nowrap">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-medium text-slate-600 min-w-[180px] whitespace-nowrap">
                            {r.ticketCode || "-"}
                          </td>
                          <td className="px-4 py-3.5 text-center font-semibold text-slate-600 text-xs whitespace-nowrap">
                            {r.quantity}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                            {r.totalAmount.toLocaleString()}{" "}
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                              MMK
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {r.redeemedBy ? (
                              <div className="font-semibold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                                {r.redeemedBy.name}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium text-xs whitespace-nowrap">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[150px] min-w-[150px] whitespace-nowrap">
                            {r.note ? (
                              <span
                                className="truncate block max-w-[150px]"
                                title={r.note}
                              >
                                {r.note}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium text-xs whitespace-nowrap">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 text-xs font-medium whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleDateString("en-US")}{" "}
                            {new Date(r.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════ Redeem (လဲလှယ်ရန်) Modal အသစ် ══════════════════ */}
      {isRedeemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#27272a]" />
                လဲလှယ်မယ့် ပစ္စည်းထည့်မည်
              </h2>
              <button
                onClick={() => setIsRedeemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <form
                onSubmit={handleSubmitRedemption}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {/* Promotion Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("luckyDraw.selectPromotion")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm text-slate-700 bg-white"
                    value={redeemForm.promotionId}
                    onChange={(e) =>
                      setRedeemForm({
                        ...redeemForm,
                        promotionId: e.target.value,
                      })
                    }
                  >
                    <option value="">{t("luckyDraw.choosePromotion")}</option>
                    {activePromotions.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.promotionName} — {p.ticketName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Storefront Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("luckyDraw.storefront")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={userRole === "cashier"}
                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm text-slate-700 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                    value={redeemForm.storefrontId}
                    onChange={(e) =>
                      setRedeemForm({
                        ...redeemForm,
                        storefrontId: e.target.value,
                      })
                    }
                  >
                    <option value="">{t("luckyDraw.chooseStorefront")}</option>
                    {storefronts.map((sf) => (
                      <option key={sf._id} value={sf._id}>
                        {sf.locationName} ({sf.locationCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-populated: Linked Product */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("luckyDraw.linkedProduct")}
                  </label>
                  <div className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 text-sm text-slate-600 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    {selectedPromotion?.inventoryId?.productName || (
                      <span className="text-slate-400 italic">
                        {t("luckyDraw.autoPopulated")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Auto-populated: Redemption Price */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("luckyDraw.redemptionPrice")}
                  </label>
                  <div className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 text-sm font-bold text-slate-800">
                    {selectedPromotion
                      ? `${selectedPromotion.redemptionPrice.toLocaleString()} MMK`
                      : "—"}
                  </div>
                </div>

                {/* Ticket Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("luckyDraw.ticketCode")}
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm text-slate-700 bg-white"
                    placeholder={t("luckyDraw.ticketCodePlaceholder")}
                    value={redeemForm.ticketCode}
                    onChange={(e) =>
                      setRedeemForm({
                        ...redeemForm,
                        ticketCode: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Redeemer Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("luckyDraw.customerName")}
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm text-slate-700 bg-white"
                    placeholder={t("luckyDraw.customerNamePlaceholder")}
                    value={redeemForm.customerName}
                    onChange={(e) =>
                      setRedeemForm({
                        ...redeemForm,
                        customerName: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Note */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("luckyDraw.noteOptional")}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm text-slate-700 bg-white"
                    placeholder={t("luckyDraw.notePlaceholder")}
                    value={redeemForm.note}
                    onChange={(e) =>
                      setRedeemForm({ ...redeemForm, note: e.target.value })
                    }
                  />
                </div>

                {/* Actions Button */}
                <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsRedeemModalOpen(false)}
                    className="px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isRedeeming ||
                      !redeemForm.promotionId ||
                      !redeemForm.storefrontId
                    }
                    className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-[#27272a] text-white hover:bg-[#27272a]/90 transition-all shadow-md shadow-ocean-600/10 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRedeeming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("luckyDraw.processing")}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {t("luckyDraw.submitRedemption")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ Create/Edit Promotion Modal ══════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#27272a]" />
                {editingPromotion
                  ? t("luckyDraw.editPromotion")
                  : t("luckyDraw.newPromotion")}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitPromotion} className="p-6 space-y-4">
              {/* Promotion Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("luckyDraw.promotionName")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm"
                  placeholder={t("luckyDraw.promotionNamePlaceholder")}
                  value={formData.promotionName}
                  onChange={(e) =>
                    setFormData({ ...formData, promotionName: e.target.value })
                  }
                />
              </div>

              {/* Ticket Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("luckyDraw.ticketName")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm"
                  placeholder={t("luckyDraw.ticketNamePlaceholder")}
                  value={formData.ticketName}
                  onChange={(e) =>
                    setFormData({ ...formData, ticketName: e.target.value })
                  }
                />
              </div>

              {/* Linked Product — Searchable Dropdown */}
              <div ref={productDropdownRef}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("luckyDraw.linkedProduct")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border rounded-lg p-2 pr-8 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm"
                    placeholder={t("luckyDraw.searchProduct")}
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                      if (!e.target.value) {
                        setFormData({ ...formData, inventoryId: "" });
                      }
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                  />
                  <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />

                  {showProductDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {loadingProducts ? (
                        <div className="p-3 text-center text-sm text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                          {t("common.loading")}
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="p-3 text-center text-sm text-slate-400">
                          {t("luckyDraw.noProductsFound")}
                        </div>
                      ) : (
                        filteredProducts.slice(0, 50).map((product) => {
                          const productId = product._id || product.id || "";
                          const isSelected = formData.inventoryId === productId;
                          return (
                            <button
                              key={productId}
                              type="button"
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-ocean-50 transition-colors cursor-pointer ${isSelected
                                ? "bg-ocean-50 text-[#27272a] font-semibold"
                                : "text-slate-700"
                                }`}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  inventoryId: productId,
                                });
                                setProductSearch(
                                  getProductDisplayName(product)
                                );
                                setShowProductDropdown(false);
                              }}
                            >
                              <div className="font-medium">
                                {product.productName || product.name}
                              </div>
                              {product.productCode && (
                                <div className="text-xs text-slate-400">
                                  {product.productCode}
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                {formData.inventoryId && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    ✓ {getSelectedProductName()}
                  </p>
                )}
              </div>

              {/* Redemption Price (Exchange Fee) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("luckyDraw.redemptionPrice")} (MMK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm"
                  placeholder="0"
                  value={formData.redemptionPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      redemptionPrice: e.target.value,
                    })
                  }
                />
                {formData.redemptionPrice !== "" &&
                  Number(formData.redemptionPrice) < 0 && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t("luckyDraw.priceCannotBeNegative")}
                    </p>
                  )}
              </div>

              {/* Quantity Per Redeem */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("luckyDraw.qtyPerRedeem")}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm"
                  value={formData.quantityPerRedeem}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantityPerRedeem: Number(e.target.value) || 1,
                    })
                  }
                />
              </div>

              {/* Storefront (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("luckyDraw.storefront")}{" "}
                  <span className="text-slate-400 text-xs font-normal">
                    ({t("luckyDraw.optional")})
                  </span>
                </label>
                <select
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm"
                  value={formData.storefrontId}
                  onChange={(e) =>
                    setFormData({ ...formData, storefrontId: e.target.value })
                  }
                >
                  <option value="">{t("luckyDraw.allStorefronts")}</option>
                  {storefronts.length > 0 ? (
                    storefronts.map((sf) => (
                      <option key={sf._id} value={sf._id}>
                        {sf.locationName} ({sf.locationCode})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="store-1">ဆိုင်ခွဲ ၁</option>
                      <option value="store-2">ဆိုင်ခွဲ ၂</option>
                    </>
                  )}
                </select>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#27272a] text-white rounded-lg hover:bg-[#27272a]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingPromotion
                        ? t("luckyDraw.updating")
                        : t("luckyDraw.creating")}
                    </>
                  ) : editingPromotion ? (
                    t("luckyDraw.updatePromotion")
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {t("luckyDraw.createPromotion")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!promotionToDelete}
        title={t("luckyDraw.deletePromotion")}
        message={
          promotionToDelete
            ? `${t("luckyDraw.confirmDeleteMessage")} "${promotionToDelete.promotionName}"?`
            : t("luckyDraw.confirmDelete")
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        confirmButtonColor="red"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPromotionToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};