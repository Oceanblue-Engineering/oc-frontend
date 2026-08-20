import React, { useState, useEffect } from "react";
import { RefreshCw, Receipt } from "lucide-react";
import { toast } from "sonner";
import { fetchOrders, Order } from "../services/Order/fetchOrders";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { fetchOrdersByStorefront } from "../services/Order/fetchOrdersByStorefront";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { assignCreditPerson } from "../services/Order/assignCreditPerson";
import { OrdersFilters } from "../components/Orders/OrdersFilters";
import { OrdersTable } from "../components/Orders/OrdersTable";
import { OrderDetailModal } from "../components/Orders/OrderDetailModal";
import { CreditPersonModal } from "../components/Orders/CreditPersonModal";
import { useLanguage } from "../context/LanguageContext";
import { DateRangePicker } from "../components/Reports/DateRangePicker";
import {
  DATE_RANGE_STORAGE_KEYS,
  createDateRangeInitializer,
  saveStoredDateRange,
} from "../utils/dateRangeStorage";
import { PageHeader, Button } from "../components/ui";

export const Orders: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] =
    useState<string>("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<string>("all");
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [showCreditPersonModal, setShowCreditPersonModal] = useState(false);
  const [selectedOrderForCredit, setSelectedOrderForCredit] =
    useState<Order | null>(null);
  const [assigningCreditPerson, setAssigningCreditPerson] = useState(false);
  const [dateRange, setDateRange] = useState(
    createDateRangeInitializer(DATE_RANGE_STORAGE_KEYS.orders),
  );
  const { startDate, endDate } = dateRange;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStorefrontId, startDate, endDate]);

  const loadInitialData = async () => {
    try {
      const sfResponse = await fetchStorefrontProfiles();
      if (sfResponse.success && sfResponse.data) {
        setStorefronts(sfResponse.data.reverse());
      }
    } catch (error) {
      console.error("Error loading storefronts:", error);
    }

    try {
      const cpResponse = await fetchCreditPersonas();
      if (cpResponse.success && cpResponse.data) {
        setCreditPersonas(cpResponse.data.filter((p) => !p.blacklist));
      }
    } catch (error) {
      console.error("Error loading credit personas:", error);
    }
  };

  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);

      let response;
      if (selectedStorefrontId === "all") {
        response = await fetchOrders(startDateStr, endDateStr);
      } else {
        response = await fetchOrdersByStorefront(
          selectedStorefrontId,
          startDateStr,
          endDateStr,
        );
      }

      if (response.success && response.data) {
        const sortedOrders = [...response.data].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
        setOrders(sortedOrders);
      } else {
        toast.error(response.message || t("orders.failedToLoadOrders"));
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error(t("orders.failedToLoadOrders"));
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId: string) => {
    setLoadingDetail(true);
    try {
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      } else {
        toast.error(response.message || t("orders.failedToLoadOrderDetails"));
      }
    } catch (error) {
      console.error("Error loading order detail:", error);
      toast.error(t("orders.failedToLoadOrderDetails"));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRefreshOrderDetails = async () => {
    if (!selectedOrder?._id) return;
    try {
      const response = await fetchOrderById(selectedOrder._id);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      }
    } catch (error) {
      console.error("Error refreshing order detail:", error);
    }
  };

  const handleOpenCreditPersonModal = (order: Order) => {
    setSelectedOrderForCredit(order);
    setShowCreditPersonModal(true);
  };

  const handleAssignCreditPerson = async (
    orderId: string,
    creditPersonId: string,
  ) => {
    setAssigningCreditPerson(true);
    try {
      const response = await assignCreditPerson(orderId, creditPersonId);
      if (response.success && response.data) {
        toast.success(t("orders.creditPersonAssignedSuccess"));
        setShowCreditPersonModal(false);
        setSelectedOrderForCredit(null);
        await loadOrders();
      } else {
        toast.error(response.message || t("orders.failedToAssignCreditPerson"));
      }
    } catch (error) {
      console.error("Error assigning credit person:", error);
      toast.error(t("orders.failedToAssignCreditPerson"));
    } finally {
      setAssigningCreditPerson(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const query = search.toLowerCase().trim();

    if (query) {
      const matchesVoucher = order.voucherNo.toLowerCase().includes(query);
      const matchesCustomer =
        order.customer && order.customer.toLowerCase().includes(query);
      const matchesStorefront =
        order.storefrontId?.name &&
        order.storefrontId.name.toLowerCase().includes(query);

      const matchesItems = order.items.some((item) => {
        const nameMatches = item.productId.productName
          .toLowerCase()
          .includes(query);
        const codeMatches = item.productId.productCode
          .toLowerCase()
          .includes(query);
        const colorMatches = item.colorName
          ? item.colorName.toLowerCase().includes(query)
          : false;
        return nameMatches || codeMatches || colorMatches;
      });

      const matchesDate = new Date(order.date)
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        .toLowerCase()
        .includes(query);

      const matchesCreditPerson =
        order.creditPersonId &&
        (order.creditPersonId.name.toLowerCase().includes(query) ||
          order.creditPersonId.phone.toLowerCase().includes(query) ||
          order.creditPersonId.creditCode?.toLowerCase().includes(query));

      if (
        !matchesVoucher &&
        !matchesCustomer &&
        !matchesStorefront &&
        !matchesItems &&
        !matchesDate &&
        !matchesCreditPerson
      ) {
        return false;
      }
    }

    if (paymentTypeFilter !== "all" && order.paymentType !== paymentTypeFilter) {
      return false;
    }

    if (
      paymentMethodFilter !== "all" &&
      order.paymentMethod !== paymentMethodFilter
    ) {
      return false;
    }

    if (deliveryStatusFilter !== "all") {
      const isDelivered = order.isDelivered || false;
      if (deliveryStatusFilter === "delivered" && !isDelivered) {
        return false;
      }
      if (deliveryStatusFilter === "not_delivered" && isDelivered) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title={t("orders.title")}
        subtitle={t("orders.subtitle")}
        icon={<Receipt className="w-5 h-5" />}
        actions={
          <>
            <Button
              variant="outline"
              size="default"
              onClick={loadOrders}
              disabled={loading}
              leftIcon={
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              }
            >
              {t("storefront.refresh")}
            </Button>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(newStartDate, newEndDate) => {
                if (!newStartDate || !newEndDate) return;
                setDateRange({
                  startDate: newStartDate,
                  endDate: newEndDate,
                });
                saveStoredDateRange(
                  DATE_RANGE_STORAGE_KEYS.orders,
                  newStartDate,
                  newEndDate,
                );
              }}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            />
          </>
        }
      />

      {/* Filters */}
      <OrdersFilters
        search={search}
        onSearchChange={setSearch}
        storefronts={storefronts}
        selectedStorefrontId={selectedStorefrontId}
        onStorefrontChange={setSelectedStorefrontId}
        paymentTypeFilter={paymentTypeFilter}
        onPaymentTypeChange={setPaymentTypeFilter}
        paymentMethodFilter={paymentMethodFilter}
        onPaymentMethodChange={setPaymentMethodFilter}
        deliveryStatusFilter={deliveryStatusFilter}
        onDeliveryStatusChange={setDeliveryStatusFilter}
        orders={orders}
        filteredOrders={filteredOrders}
      />

      {/* Orders Table */}
      <OrdersTable
        loading={loading}
        orders={filteredOrders}
        onViewOrder={handleViewOrder}
        onOpenCreditPersonModal={handleOpenCreditPersonModal}
        onOrderDeleted={async () => {
          await loadOrders();
        }}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!(selectedOrder || loadingDetail)}
        loading={loadingDetail}
        order={selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setLoadingDetail(false);
        }}
        onOrderUpdate={async () => {
          await loadOrders();
          await handleRefreshOrderDetails();
        }}
      />

      {/* Credit Person Selection Modal */}
      <CreditPersonModal
        isOpen={showCreditPersonModal}
        order={selectedOrderForCredit}
        creditPersonas={creditPersonas}
        assigning={assigningCreditPerson}
        onClose={() => {
          setShowCreditPersonModal(false);
          setSelectedOrderForCredit(null);
        }}
        onAssign={handleAssignCreditPerson}
      />
    </div>
  );
};
