import React, { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { ApiPurchaseOrder, Supplier } from "../../types";
import { updatePurchaseStatus } from "../../services/Purchase/updatePurchaseStatus";
import { softDeletePurchase } from "../../services/Purchase/softDeletePurchase";
import { restorePurchase } from "../../services/Purchase/restorePurchase";
import { toast } from "sonner";
import { ConfirmModal } from "../Common/ConfirmModal";
import { useLanguage } from "../../context/LanguageContext";

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface PurchaseOrderListProps {
  poList: ApiPurchaseOrder[];
  deletedPOList: ApiPurchaseOrder[];
  suppliers: Supplier[];
  setIsCreateModalOpen: (isOpen: boolean) => void;
  loadPurchases: (
    page?: number,
    limit?: number,
    status?: "pending" | "arrived" | "deleted" | string,
    paymentType?: "all" | "paid" | "credit",
    paymentStatus?: "all" | "unpaid" | "partial" | "paid"
  ) => Promise<void>;
  loadDeletedPurchases: (
    page?: number,
    limit?: number,
    paymentType?: "all" | "paid" | "credit",
    paymentStatus?: "all" | "unpaid" | "partial" | "paid"
  ) => Promise<void>;
  onViewPO?: (po: ApiPurchaseOrder) => void;
  pagination: PaginationData;
  deletedPagination: PaginationData;
  onCreateGRN?: (po: ApiPurchaseOrder) => void;
}

export const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  poList,
  deletedPOList,
  suppliers,
  setIsCreateModalOpen,
  loadPurchases,
  loadDeletedPurchases,
  onViewPO,
  pagination,
  deletedPagination,
  onCreateGRN,
}) => {
  const { t } = useLanguage();
  const [poFilter, setPoFilter] = useState<"pending" | "arrived" | "deleted">(
    "pending",
  );
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<
    "all" | "paid" | "credit"
  >("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    "all" | "unpaid" | "partial" | "paid"
  >("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<ApiPurchaseOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use the filtered data from API instead of client-side filtering
  const displayList = poFilter === "deleted" ? deletedPOList : poList;

  useEffect(() => {
    if (poFilter === "deleted") {
      loadDeletedPurchases(
        deletedPagination.currentPage,
        deletedPagination.itemsPerPage,
        paymentTypeFilter,
        paymentStatusFilter
      );
    } else {
      // Load purchases with status and payment filters
      loadPurchases(
        pagination.currentPage,
        pagination.itemsPerPage,
        poFilter,
        paymentTypeFilter,
        paymentStatusFilter
      );
    }
  }, [poFilter, paymentTypeFilter, paymentStatusFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await updatePurchaseStatus(id, status);
      if (res.success) {
        toast.success("Status updated successfully");
        // Reload with current filter status
        loadPurchases(
          pagination.currentPage,
          pagination.itemsPerPage,
          poFilter === "arrived" ? "arrived" : "pending",
          paymentTypeFilter,
          paymentStatusFilter
        );
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Failed to update status", error);
      toast.error(error.message || "Failed to update status");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadPurchases(
        page,
        pagination.itemsPerPage,
        poFilter,
        paymentTypeFilter,
        paymentStatusFilter
      );
    }
  };

  const handleLimitChange = (newLimit: number) => {
    loadPurchases(
      1,
      newLimit,
      poFilter,
      paymentTypeFilter,
      paymentStatusFilter
    );
  };

  const handleSoftDelete = async (po: ApiPurchaseOrder) => {
    setPoToDelete(po);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!poToDelete) return;

    setIsDeleting(true);
    try {
      const res = await softDeletePurchase(poToDelete._id);
      if (res.success) {
        toast.success("Purchase order deleted successfully");
        loadPurchases(
          pagination.currentPage,
          pagination.itemsPerPage,
          "pending",
          paymentTypeFilter,
          paymentStatusFilter
        );
        setDeleteModalOpen(false);
        setPoToDelete(null);
      } else {
        toast.error(res.message || "Failed to delete purchase order");
      }
    } catch (error: any) {
      console.error("Failed to delete purchase order", error);
      toast.error(error.message || "Failed to delete purchase order");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setPoToDelete(null);
  };

  const handleRestore = async (po: ApiPurchaseOrder) => {
    if (
      !window.confirm(`Are you sure you want to restore PO ${po.poNumber}?`)
    ) {
      return;
    }

    try {
      const res = await restorePurchase(po._id);
      if (res.success) {
        toast.success("Purchase order restored successfully");
        loadPurchases(
          pagination.currentPage,
          pagination.itemsPerPage,
          "pending",
          paymentTypeFilter,
          paymentStatusFilter
        );
        loadDeletedPurchases(
          deletedPagination.currentPage,
          deletedPagination.itemsPerPage,
          paymentTypeFilter,
          paymentStatusFilter
        );
      } else {
        toast.error(res.message || "Failed to restore purchase order");
      }
    } catch (error: any) {
      console.error("Failed to restore purchase order", error);
      toast.error(error.message || "Failed to restore purchase order");
    }
  };

  const handleDeletedPageChange = (page: number) => {
    if (page >= 1 && page <= deletedPagination.totalPages) {
      loadDeletedPurchases(
        page,
        deletedPagination.itemsPerPage,
        paymentTypeFilter,
        paymentStatusFilter
      );
    }
  };

  const handleDeletedLimitChange = (newLimit: number) => {
    loadDeletedPurchases(
      1,
      newLimit,
      paymentTypeFilter,
      paymentStatusFilter
    );
  };

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

  const renderPaymentStatusBadge = (po: ApiPurchaseOrder) => {
    const status = getPaymentStatus(po);

    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
            Paid
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            Partial
          </span>
        );
      case "unpaid":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            Unpaid
          </span>
        );
    }
  };

  const renderPagination = () => {
    const currentPagination =
      poFilter === "deleted" ? deletedPagination : pagination;
    const { currentPage, totalPages, totalItems, itemsPerPage } =
      currentPagination;

    // Hide pagination if total items are 10 or less
    if (totalItems <= 10) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            Showing {startItem} to {endItem} of {totalItems} results
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                if (poFilter === "deleted") {
                  handleDeletedLimitChange(newLimit);
                } else {
                  handleLimitChange(newLimit);
                }
              }}
              className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-slate-600">entries</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (poFilter === "deleted") {
                handleDeletedPageChange(currentPage - 1);
              } else {
                handlePageChange(currentPage - 1);
              }
            }}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  if (poFilter === "deleted") {
                    handleDeletedPageChange(page);
                  } else {
                    handlePageChange(page);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  page === currentPage
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50 border"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (poFilter === "deleted") {
                handleDeletedPageChange(currentPage + 1);
              } else {
                handlePageChange(currentPage + 1);
              }
            }}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <h2 className="font-bold text-lg text-slate-800">
          Purchase Orders List
        </h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create New PO
        </button>
      </div>

      {/* Filter Tabs and Dropdowns */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setPoFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              poFilter === "pending"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 border"
            }`}
          >
            {t("purchasing.pending")}
          </button>
          <button
            onClick={() => setPoFilter("arrived")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              poFilter === "arrived"
                ? "bg-primary text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 border"
            }`}
          >
            {t("purchasing.arrived")}
          </button>
          <button
            onClick={() => setPoFilter("deleted")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              poFilter === "deleted"
                ? "bg-red-800 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 border"
            }`}
          >
            {t("purchasing.deleted")}
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Payment Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Payment Type:
            </label>
            <select
              value={paymentTypeFilter}
              onChange={(e) =>
                setPaymentTypeFilter(
                  e.target.value as "all" | "paid" | "credit",
                )
              }
              className="text-xs sm:text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer shadow-sm hover:border-slate-300"
            >
              <option value="all">All Types (အားလုံး)</option>
              <option value="paid">Paid (လက်ငင်း)</option>
              <option value="credit">Credit (အကြွေး)</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Payment Status:
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) =>
                setPaymentStatusFilter(
                  e.target.value as "all" | "unpaid" | "partial" | "paid",
                )
              }
              className="text-xs sm:text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer shadow-sm hover:border-slate-300"
            >
              <option value="all">All Statuses (အားလုံး)</option>
              <option value="unpaid">Unpaid (မပေးရသေး)</option>
              <option value="partial">Partial (တစ်စိတ်တစ်ပိုင်း)</option>
              <option value="paid">Paid (ပေးချေပြီး)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="h-[calc(100vh-370px)] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b sticky top-0 z-10">
              <tr>
                <th className="p-4">PO ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Note</th>
                <th className="p-4">Total Remaining</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No {poFilter} purchase orders found
                  </td>
                </tr>
              ) : (
                displayList.map((po) => {
                  const supplierName =
                    typeof po.supplierId === "object" && po.supplierId !== null
                      ? po.supplierId.supplierName
                      : suppliers.find(
                          (s) => (s.id || s._id) === po.supplierId,
                        )?.supplierName || "Unknown Supplier";

                  return (
                    <tr key={po._id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono font-medium text-slate-700">{po.poNumber}</td>
                      <td className="p-4">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {supplierName}
                      </td>
                      <td className="p-4 font-medium">
                        {po.totalAmount.toLocaleString()} MMK
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            po.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {po.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        {renderPaymentStatusBadge(po)}
                      </td>
                      <td className="p-4 text-slate-500 truncate max-w-xs">
                        {po.note || "-"}
                      </td>
                      <td className="p-4">{po.totalRemainingQuantity ?? 0}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {poFilter === "deleted" ? (
                            <>
                              <button
                                onClick={() => onViewPO?.(po)}
                                className="text-xs bg-primary/50 text-yellow-800 px-3 py-1.5 rounded hover:bg-yellow-100 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                              <button
                                onClick={() => handleRestore(po)}
                                className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 border border-green-200 font-medium transition-colors flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" /> Restore
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onViewPO?.(po)}
                                className="text-xs bg-primary/50 text-yellow-800 px-3 py-1.5 rounded hover:bg-yellow-100 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                              {po.status === "pending" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(po._id, "arrived")
                                  }
                                  className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 border border-green-200 font-medium transition-colors"
                                >
                                  Mark Arrived
                                </button>
                              )}
                              {(po.status === "arrived" ||
                                po.status === "received") &&
                                (po.totalRemainingQuantity ?? 0) > 0 && (
                                  <button
                                    onClick={() => onCreateGRN?.(po)}
                                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                                  >
                                    <PackageCheck className="w-3 h-3" />
                                    GRN
                                  </button>
                                )}
                              {po.status === "pending" && (
                                <button
                                  onClick={() => handleSoftDelete(po)}
                                  className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 border border-red-200 font-medium transition-colors flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Purchase Order"
        message={`Are you sure you want to delete PO ${poToDelete?.poNumber}? This action can be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
