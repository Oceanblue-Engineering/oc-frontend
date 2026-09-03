import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Home,
  Package,
  ShoppingBag,
  Loader2,
  Search,
  Calendar,
  Hash,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  CreditCard,
  Receipt,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Supplier, Product, ApiPurchaseOrder } from "../types";
import { fetchSupplierById } from "../services/Supplier/fetchSupplierById";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { fetchSupplierPurchasingStats, SupplierPurchasingStatistics } from "../services/Supplier/fetchSupplierPurchasingStats";
import { AddPaymentModal } from "../components/Purchasing/AddPaymentModal";
import { PODetailModal } from "../components/Purchasing/PODetailModal";
import { useLanguage } from "../context/LanguageContext";

export const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // Get supplier info from location state if available (for instant display)
  const supplierInfo = location.state as {
    supplierName?: string;
    contactNumber?: string;
  } | null;

  // State
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<ApiPurchaseOrder[]>([]);
  const [purchasingStats, setPurchasingStats] =
    useState<SupplierPurchasingStatistics>({
      totalPurchasedAmount: 0,
      totalPaidAmount: 0,
      totalDebt: 0,
    });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPOForPayment, setSelectedPOForPayment] =
    useState<ApiPurchaseOrder | null>(null);
  const [isPODetailModalOpen, setIsPODetailModalOpen] = useState(false);
  const [selectedPOForDetail, setSelectedPOForDetail] =
    useState<ApiPurchaseOrder | null>(null);
  const [isLoadingSupplier, setIsLoadingSupplier] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingPOs, setIsLoadingPOs] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load supplier details
  useEffect(() => {
    if (!id) return;
    loadSupplierDetail();
    loadRelatedProducts();
    loadPurchasingStats();
  }, [id]);

  const loadSupplierDetail = async () => {
    if (!id) return;
    setIsLoadingSupplier(true);
    setError(null);
    try {
      const response = await fetchSupplierById(id);
      if (response.success && response.data) {
        setSupplier(response.data);
      } else {
        setError(t("suppliers.failedToLoadDetails"));
      }
    } catch (err: any) {
      console.error("Failed to load supplier:", err);
      setError(err.message || t("suppliers.failedToLoadDetails"));
      toast.error(t("suppliers.failedToLoadDetails"));
    } finally {
      setIsLoadingSupplier(false);
    }
  };

  const loadRelatedProducts = async () => {
    if (!id) return;
    setIsLoadingProducts(true);
    try {
      const response = await fetchProducts({ supplier: id });
      if (response.success && response.data) {
        const mappedProducts: Product[] = response.data.map((item: any) => ({
          id: item.id || item._id || "",
          _id: item._id,
          name: item.productName || item.name || "",
          productName: item.productName || item.name || "",
          productCode: item.productCode || "",
          category: item.category || "",
          costPrice: item.buyingPrice ?? item.costPrice ?? 0,
          sellingPrice: item.sellingPrice ?? 0,
          status: item.status || "active",
          stockWarehouse: item.stockWarehouse || 0,
          stockShop: item.stockShop || 0,
          lowStockThreshold: item.reorderPoint || 0,
          suppliers: item.suppliers || [],
        }));
        setRelatedProducts(mappedProducts);
      } else {
        setRelatedProducts([]);
      }
    } catch (err: any) {
      console.error("Failed to load products:", err);
      toast.error(t("suppliers.failedToLoadProducts"));
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadPurchasingStats = async () => {
    if (!id) return;
    setIsLoadingPOs(true);
    try {
      const response = await fetchSupplierPurchasingStats(id);
      if (response.success && response.data) {
        setPurchasingStats(
          response.data.statistics || {
            totalPurchasedAmount: 0,
            totalPaidAmount: 0,
            totalDebt: 0,
          }
        );
        setPurchaseOrders(response.data.purchaseOrders || []);
      } else {
        setPurchaseOrders([]);
      }
    } catch (err: any) {
      console.error("Failed to load supplier purchasing stats:", err);
      toast.error(t("suppliers.failedToLoadPOs"));
      setPurchaseOrders([]);
    } finally {
      setIsLoadingPOs(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"overview" | "products" | "purchases">("overview");
  const [poSearchTerm, setPoSearchTerm] = useState("");

  // Filter products by search
  const filteredProducts = relatedProducts.filter((product) => {
    const name = product.name || product.productName || "";
    const code = product.productCode || "";
    const term = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(term) || code.toLowerCase().includes(term)
    );
  });

  // Filter POs by search
  const filteredPOs = purchaseOrders.filter((po) => {
    const poNum = po.poNumber || po._id || "";
    const note = po.note || "";
    const term = poSearchTerm.toLowerCase();
    return (
      poNum.toLowerCase().includes(term) || note.toLowerCase().includes(term)
    );
  });

  // Calculate summary stats
  const totalProducts = relatedProducts.length;
  const totalPOs = purchaseOrders.length;
  const totalPOValue = purchasingStats.totalPurchasedAmount;

  const displayName =
    supplier?.supplierName || supplierInfo?.supplierName || "Supplier";

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US").format(amount);
  };

  // Calculate payment status
  const getPaymentStatus = (
    po: ApiPurchaseOrder
  ): "paid" | "partial" | "unpaid" => {
    if (po.paymentStatus) {
      const status = po.paymentStatus.toLowerCase();
      if (status === "paid" || status === "partial" || status === "unpaid") {
        return status;
      }
    }
    if (po.paymentType === "paid") {
      return "paid";
    }
    const paid = po.paidAmount ?? 0;
    const total = po.totalAmount ?? 0;
    if (paid >= total && total > 0) return "paid";
    if (paid > 0) return "partial";
    return "unpaid";
  };

  // Get Payment Status Badge
  const renderPaymentStatusBadge = (po: ApiPurchaseOrder) => {
    const status = getPaymentStatus(po);

    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
            Paid
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            Partial
          </span>
        );
      case "unpaid":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            Unpaid
          </span>
        );
    }
  };

  // Get PO status badge
  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "arrived" || statusLower === "received") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
          <CheckCircle2 className="w-3 h-3" />
          {status}
        </span>
      );
    }
    if (statusLower === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        {status || "Pending"}
      </span>
    );
  };

  // Error state
  if (error && !supplier && !isLoadingSupplier) {
    return (
      <div className="p-4 sm:p-6">
        <button
          onClick={() => navigate("/suppliers")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">{t("suppliers.backToSuppliers")}</span>
        </button>
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            {t("suppliers.failedToLoadDetails")}
          </h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={loadSupplierDetail}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t("common.retry") || "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/suppliers")}
          className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title={t("suppliers.backToSuppliers")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              {isLoadingSupplier ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("suppliers.loadingDetails")}
                </span>
              ) : (
                displayName
              )}
            </h1>
            {supplier && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  supplier.isDeleted
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    supplier.isDeleted ? "bg-red-500" : "bg-green-500"
                  }`}
                />
                {supplier.isDeleted
                  ? t("suppliers.inactive")
                  : t("suppliers.active")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border p-1.5 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-ocean-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t("suppliers.contactInfo") || "Contact Information"}</span>
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "products"
              ? "bg-ocean-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{t("suppliers.relatedProducts")}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === "products"
                ? "bg-white/20 text-white"
                : "bg-slate-200/80 text-slate-700"
            }`}
          >
            {isLoadingProducts ? "..." : totalProducts}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("purchases")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "purchases"
              ? "bg-ocean-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t("suppliers.purchaseHistory")}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === "purchases"
                ? "bg-white/20 text-white"
                : "bg-slate-200/80 text-slate-700"
            }`}
          >
            {isLoadingPOs ? "..." : totalPOs}
          </span>
        </button>
      </div>

      {/* Tab 1: Contact Information & Overview Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Supplier Info Card */}
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <User className="w-4 h-4 text-ocean-600" />
              {t("suppliers.contactInfo")}
            </h2>
            {isLoadingSupplier ? (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {t("suppliers.loadingDetails")}
              </div>
            ) : supplier ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-start gap-3 p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
                  <div className="w-9 h-9 bg-ocean-50 rounded-lg flex items-center justify-center flex-shrink-0 text-ocean-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">
                      {t("suppliers.name")}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {supplier.supplierName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">
                      {t("suppliers.contact")}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {supplier.contactNumber || "-"}
                    </p>
                  </div>
                </div>

                {supplier.township && (
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 text-emerald-600">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-medium">
                        Township
                      </p>
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {supplier.township}
                      </p>
                    </div>
                  </div>
                )}

                {supplier.address && (
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
                    <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 text-amber-600">
                      <Home className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-medium">
                        {t("suppliers.address")}
                      </p>
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {supplier.address}
                      </p>
                    </div>
                  </div>
                )}

                {supplier.createdAt && (
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
                    <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 text-purple-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-medium">
                        {t("suppliers.added")}
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {new Date(supplier.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* KPI Stat Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-ocean-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-ocean-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  {t("suppliers.totalProducts")}
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {isLoadingProducts ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    totalProducts
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  {t("suppliers.totalPurchaseOrders")}
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {isLoadingPOs ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    totalPOs
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  {t("suppliers.totalPurchaseValue")}
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {isLoadingPOs ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>{formatCurrency(totalPOValue)} MMK</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Purchasing Financial Summary Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-ocean-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-6 h-6 text-ocean-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium truncate">
                  {t("suppliers.totalPurchasedAmount")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
                  {isLoadingPOs ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `${formatCurrency(purchasingStats.totalPurchasedAmount)} MMK`
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium truncate">
                  {t("suppliers.totalPaidAmount")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-700 truncate">
                  {isLoadingPOs ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `${formatCurrency(purchasingStats.totalPaidAmount)} MMK`
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  purchasingStats.totalDebt > 0 ? "bg-red-50" : "bg-slate-100"
                }`}
              >
                <AlertCircle
                  className={`w-6 h-6 ${
                    purchasingStats.totalDebt > 0
                      ? "text-red-600"
                      : "text-slate-500"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium truncate">
                  {t("suppliers.totalDebt")}
                </p>
                <p
                  className={`text-xl sm:text-2xl font-bold truncate ${
                    purchasingStats.totalDebt > 0
                      ? "text-red-600"
                      : "text-slate-800"
                  }`}
                >
                  {isLoadingPOs ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `${formatCurrency(purchasingStats.totalDebt)} MMK`
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Related Products Content */}
      {activeTab === "products" && (
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-ocean-600" />
                {t("suppliers.relatedProducts")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Products supplied by {displayName}
              </p>
            </div>

            {relatedProducts.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("suppliers.searchProducts")}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 outline-none w-full sm:w-72 bg-slate-50/50 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>

          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2 text-ocean-600" />
              <span>{t("common.loading")}</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700">
                {searchTerm
                  ? t("suppliers.noSearchResults")
                  : t("suppliers.noRelatedProducts")}
              </p>
              {!searchTerm && (
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {t("suppliers.noRelatedProductsDesc")}
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/80 text-xs uppercase tracking-wider text-slate-600">
                    <th className="text-left py-3.5 px-4 font-bold">
                      {t("suppliers.productName")}
                    </th>
                    <th className="text-left py-3.5 px-4 font-bold hidden sm:table-cell">
                      {t("suppliers.productCode")}
                    </th>
                    <th className="text-left py-3.5 px-4 font-bold hidden md:table-cell">
                      {t("suppliers.category")}
                    </th>
                    <th className="text-right py-3.5 px-4 font-bold">
                      {t("suppliers.costPrice")}
                    </th>
                    <th className="text-right py-3.5 px-4 font-bold hidden sm:table-cell">
                      {t("suppliers.sellingPrice")}
                    </th>
                    <th className="text-center py-3.5 px-4 font-bold hidden lg:table-cell">
                      {t("suppliers.status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id || product._id}
                      className="hover:bg-ocean-50/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {product.name || product.productName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 hidden sm:table-cell">
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60 font-medium">
                          {product.productCode || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 hidden md:table-cell">
                        {product.category || "-"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900 font-semibold">
                        {formatCurrency(product.costPrice)} Ks
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 font-medium hidden sm:table-cell">
                        {formatCurrency(product.sellingPrice)} Ks
                      </td>
                      <td className="py-3 px-4 text-center hidden lg:table-cell">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            product.status === "active"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {product.status === "active"
                            ? t("suppliers.active")
                            : t("suppliers.inactive")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Purchase Orders Content */}
      {activeTab === "purchases" && (
        <div className="space-y-6">
          {/* Supplier Purchasing Statistics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-ocean-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-6 h-6 text-ocean-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium truncate">
                  {t("suppliers.totalPurchasedAmount")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
                  {isLoadingPOs ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `${formatCurrency(purchasingStats.totalPurchasedAmount)} MMK`
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium truncate">
                  {t("suppliers.totalPaidAmount")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-700 truncate">
                  {isLoadingPOs ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `${formatCurrency(purchasingStats.totalPaidAmount)} MMK`
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  purchasingStats.totalDebt > 0 ? "bg-red-50" : "bg-slate-100"
                }`}
              >
                <AlertCircle
                  className={`w-6 h-6 ${
                    purchasingStats.totalDebt > 0
                      ? "text-red-600"
                      : "text-slate-500"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium truncate">
                  {t("suppliers.totalDebt")}
                </p>
                <p
                  className={`text-xl sm:text-2xl font-bold truncate ${
                    purchasingStats.totalDebt > 0
                      ? "text-red-600"
                      : "text-slate-800"
                  }`}
                >
                  {isLoadingPOs ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `${formatCurrency(purchasingStats.totalDebt)} MMK`
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Purchase Order History Table Card */}
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  {t("suppliers.purchaseHistory")}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  All purchase orders placed with this supplier
                </p>
              </div>

              {purchaseOrders.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search PO number, note..."
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500 outline-none w-full sm:w-72 bg-slate-50/50 focus:bg-white transition-all"
                    value={poSearchTerm}
                    onChange={(e) => setPoSearchTerm(e.target.value)}
                  />
                </div>
              )}
            </div>

            {isLoadingPOs ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2 text-ocean-600" />
                <span>{t("common.loading")}</span>
              </div>
            ) : filteredPOs.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-700">
                  {poSearchTerm ? "No purchase orders match your search" : t("suppliers.noPurchaseOrders")}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {t("suppliers.noPurchaseOrdersDesc")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/80 text-xs uppercase tracking-wider text-slate-600">
                      <th className="text-left py-3.5 px-4 font-bold">
                        {t("suppliers.poNumber")}
                      </th>
                      <th className="text-left py-3.5 px-4 font-bold hidden sm:table-cell">
                        {t("suppliers.poDate")}
                      </th>
                      <th className="text-right py-3.5 px-4 font-bold">
                        {t("suppliers.poTotal")}
                      </th>
                      <th className="text-right py-3.5 px-4 font-bold">
                        {t("suppliers.poPaidAmount")}
                      </th>
                      <th className="text-center py-3.5 px-4 font-bold">
                        {t("suppliers.poStatus")}
                      </th>
                      <th className="text-center py-3.5 px-4 font-bold">
                        {t("suppliers.poPaymentStatus")}
                      </th>
                      <th className="text-center py-3.5 px-4 font-bold">
                        {t("suppliers.actions") || t("common.actions") || "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPOs.map((po) => {
                      const total = po.totalAmount || 0;
                      const paid = po.paidAmount || 0;
                      const remaining =
                        po.remainingBalance !== undefined
                          ? po.remainingBalance
                          : Math.max(0, total - paid);
                      const paymentStatus = getPaymentStatus(po);
                      const canAddPayment =
                        remaining > 0 &&
                        (paymentStatus === "unpaid" || paymentStatus === "partial");

                      return (
                        <tr
                          key={po._id}
                          className="hover:bg-ocean-50/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                setSelectedPOForDetail(po);
                                setIsPODetailModalOpen(true);
                              }}
                              className="font-mono text-xs bg-ocean-50 text-ocean-700 hover:bg-ocean-100 hover:text-ocean-800 border border-ocean-200/80 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                              title="Click to view details"
                            >
                              {po.poNumber || po._id?.slice(-6)}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-slate-600 hidden sm:table-cell">
                            {po.createdAt
                              ? new Date(po.createdAt).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {formatCurrency(po.totalAmount || 0)} MMK
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                            {formatCurrency(po.paidAmount || 0)} MMK
                          </td>
                          <td className="py-3 px-4 text-center">
                            {getStatusBadge(po.status)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {renderPaymentStatusBadge(po)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => {
                                  setSelectedPOForDetail(po);
                                  setIsPODetailModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-ocean-50 text-ocean-700 hover:bg-ocean-100 hover:text-ocean-800 border border-ocean-200/80 rounded-lg text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                                title="View Purchase Order Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              {canAddPayment && (
                                <button
                                  onClick={() => {
                                    setSelectedPOForPayment(po);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                                  title={t("suppliers.addPayment") || "Add Payment"}
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>
                                    {t("suppliers.addPayment") || "Add Payment"}
                                  </span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PO Detail Modal */}
      {isPODetailModalOpen && selectedPOForDetail && (
        <PODetailModal
          isOpen={isPODetailModalOpen}
          onClose={() => {
            setIsPODetailModalOpen(false);
            setSelectedPOForDetail(null);
          }}
          purchaseId={selectedPOForDetail._id}
          suppliers={supplier ? [supplier] : []}
          onPaymentSuccess={async () => {
            await loadPurchasingStats();
          }}
        />
      )}

      {/* Add Payment Modal */}
      {selectedPOForPayment && (
        <AddPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPOForPayment(null);
          }}
          purchaseId={selectedPOForPayment._id}
          poNumber={selectedPOForPayment.poNumber}
          totalAmount={selectedPOForPayment.totalAmount || 0}
          remainingBalance={
            selectedPOForPayment.remainingBalance !== undefined
              ? selectedPOForPayment.remainingBalance
              : Math.max(
                  0,
                  (selectedPOForPayment.totalAmount || 0) -
                    (selectedPOForPayment.paidAmount || 0)
                )
          }
          onPaymentSuccess={async () => {
            await loadPurchasingStats();
          }}
        />
      )}
    </div>
  );
};
