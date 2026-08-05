import React, { useEffect, useState } from "react";
import { Modal } from "../Modal";
import {
  fetchPurchaseById,
  PurchaseDetail,
} from "../../services/Purchase/fetchPurchaseById";
import {
  fetchPurchasePayments,
  SupplierPayment,
} from "../../services/Purchase/fetchPurchasePayments";
import { AddPaymentModal } from "./AddPaymentModal";
import { Supplier } from "../../types";
import {
  Package,
  Calendar,
  FileText,
  Hash,
  DollarSign,
  User,
  CheckCircle,
  Clock,
  CreditCard,
  Receipt,
  Plus,
} from "lucide-react";

interface PODetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string | null;
  suppliers: Supplier[];
  onPaymentSuccess?: () => void;
}

export const PODetailModal: React.FC<PODetailModalProps> = ({
  isOpen,
  onClose,
  purchaseId,
  suppliers,
  onPaymentSuccess,
}) => {
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && purchaseId) {
      loadPurchaseDetails();
      loadPaymentHistory();
    }
  }, [isOpen, purchaseId]);

  const loadPurchaseDetails = async () => {
    if (!purchaseId) return;
    setLoading(true);
    try {
      const res = await fetchPurchaseById(purchaseId);
      if (res.success && res.data) {
        setPurchase(res.data);
      }
    } catch (error) {
      console.error("Failed to load purchase details", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    if (!purchaseId) return;
    setPaymentsLoading(true);
    try {
      const res = await fetchPurchasePayments(purchaseId);
      if (res.success && Array.isArray(res.data)) {
        setPayments(res.data);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("Failed to load payment history", error);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const getSupplierName = (supplier: any) => {
    if (typeof supplier === "object" && supplier !== null && supplier.supplierName) {
      return supplier.supplierName;
    }
    const supplierId = typeof supplier === "string" ? supplier : supplier?._id || supplier?.id;
    const found = suppliers.find(
      (s) => s.id === supplierId || s._id === supplierId
    );
    return found ? found.supplierName : "Unknown Supplier";
  };

  const getProductStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "received":
        return "bg-green-100 text-green-700 border-green-300";
      case "partial":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "arrived":
        return "bg-green-100 text-green-700 border-green-300";
      case "received":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getPaymentStatus = (po: PurchaseDetail): "paid" | "partial" | "unpaid" => {
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

  const renderPaymentStatusBadge = (po: PurchaseDetail) => {
    const status = getPaymentStatus(po);

    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            Paid
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Partial
          </span>
        );
      case "unpaid":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            Unpaid
          </span>
        );
    }
  };

  const handleClose = () => {
    setPurchase(null);
    setPayments([]);
    setIsAddPaymentModalOpen(false);
    onClose();
  };

  const handlePaymentSuccess = async () => {
    await Promise.all([loadPurchaseDetails(), loadPaymentHistory()]);
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
  };

  const totalQuantity =
    purchase?.products.reduce((sum, p) => sum + p.purchaseQuantity, 0) || 0;

  const remainingBalance =
    purchase?.remainingBalance !== undefined
      ? purchase.remainingBalance
      : Math.max(0, (purchase?.totalAmount || 0) - (purchase?.paidAmount || 0));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Purchase Order Details">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-slate-500">Loading PO details...</span>
        </div>
      ) : purchase ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Hash className="w-4 h-4" />
                PO ID / Number
              </div>
              <div
                className="font-bold text-base text-blue-600 truncate font-mono"
                title={purchase.poNumber || purchase._id}
              >
                {purchase.poNumber || (purchase._id.length > 12 ? `${purchase._id.substring(0, 12)}...` : purchase._id)}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Created Date
              </div>
              <div className="font-bold text-base text-slate-800">
                {new Date(purchase.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                Total Amount
              </div>
              <div className="font-bold text-base text-green-600">
                {purchase.totalAmount.toLocaleString()} MMK
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <FileText className="w-4 h-4" />
                PO Status
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                  purchase.status
                )}`}
              >
                {purchase.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Financial Summary Section (Conditionally displayed for Credit purchases) */}
          {purchase.paymentType === "credit" ? (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-ocean-600" />
                  <h3 className="font-bold text-slate-800">
                    Financial Summary{" "}
                    <span className="text-xs font-normal text-slate-500">
                      (အကြွေးနှင့် ငွေပေးချေမှု အခြေအနေ)
                    </span>
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Payment Status:
                    </span>
                    {renderPaymentStatusBadge(purchase)}
                  </div>
                  {remainingBalance > 0 && (
                    <button
                      onClick={() => setIsAddPaymentModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Payment (ဆပ်ငွေထည့်မည်)
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Amount */}
                <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Total Amount (စုစုပေါင်း)
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {purchase.totalAmount.toLocaleString()}{" "}
                    <span className="text-xs font-normal text-slate-500">MMK</span>
                  </div>
                </div>

                {/* Paid Amount */}
                <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Paid Amount (ပေးချေပြီးငွေ)
                  </div>
                  <div className="text-lg font-bold text-emerald-600">
                    {(purchase.paidAmount || 0).toLocaleString()}{" "}
                    <span className="text-xs font-normal text-slate-500">MMK</span>
                  </div>
                </div>

                {/* Remaining Balance */}
                <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Remaining Balance (ကျန်ငွေ)
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      remainingBalance > 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {remainingBalance.toLocaleString()}{" "}
                    <span className="text-xs font-normal text-slate-500">MMK</span>
                  </div>
                </div>

                {/* Due Date */}
                <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due Date (နောက်ဆုံးပေးချေရမည့်ရက်)</span>
                  </div>
                  <div className="text-base font-bold text-slate-800">
                    {purchase.dueDate
                      ? new Date(purchase.dueDate).toLocaleDateString()
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium">
                  Payment Type: <strong className="text-slate-900">Paid (လက်ငင်း)</strong>
                </span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                Fully Paid (ပေးချေပြီး)
              </span>
            </div>
          )}

          {/* Purchased By Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 text-sm font-semibold mb-2">
                <User className="w-4 h-4" />
                Purchased By
              </div>
              <div className="text-green-800">
                <div className="font-medium text-base">
                  {purchase.purchasedBy?.name || "-"}
                </div>
                <div className="text-xs text-green-600 capitalize">
                  {purchase.purchasedBy?.role || ""}
                </div>
              </div>
            </div>

            {/* Supplier Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold mb-2">
                <User className="w-4 h-4" />
                Supplier Information
              </div>
              <div className="text-blue-800 font-medium text-base">
                {getSupplierName(purchase.supplierId)}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {purchase.products.length}
              </div>
              <div className="text-xs text-purple-600 font-medium">Total Products</div>
            </div>
            <div className="bg-ocean-50 p-4 rounded-lg border border-ocean-200 text-center">
              <div className="text-2xl font-bold text-ocean-600">
                {totalQuantity}
              </div>
              <div className="text-xs text-ocean-600 font-medium">Total Quantity</div>
            </div>
          </div>

          {/* Notes */}
          {purchase.note && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-2">
                <FileText className="w-4 h-4" />
                Notes
              </div>
              <p className="text-amber-800 text-sm">{purchase.note}</p>
            </div>
          )}

          {/* Products List */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Products ({purchase.products.length})
            </h3>
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 text-left">Product Name</th>
                    <th className="p-3 text-left">Product Code</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-center">Received</th>
                    <th className="p-3 text-right">Buying Price</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {purchase.products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium">{product.productName}</td>
                      <td className="p-3 text-slate-600 font-mono text-xs">
                        {product.productCode}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getProductStatusColor(
                            product.productStatus
                          )}`}
                        >
                          {product.productStatus === "received" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {product.productStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium text-xs">
                          {product.purchaseQuantity}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium text-xs">
                          {product.receivedQuantity}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {product.buyingPrice.toLocaleString()} MMK
                      </td>
                      <td className="p-3 text-right font-medium">
                        {(
                          product.buyingPrice * product.purchaseQuantity
                        ).toLocaleString()}{" "}
                        MMK
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t">
                  <tr>
                    <td colSpan={6} className="p-3 text-right font-semibold">
                      Total Amount:
                    </td>
                    <td className="p-3 text-right font-bold text-green-600">
                      {purchase.totalAmount.toLocaleString()} MMK
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment History Table Section */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-ocean-600" />
                Payment History (ဆပ်ငွေမှတ်တမ်း)
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                  {payments.length}
                </span>
              </h3>
              {purchase.paymentType === "credit" && remainingBalance > 0 && (
                <button
                  onClick={() => setIsAddPaymentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Record Payment
                </button>
              )}
            </div>

            {paymentsLoading ? (
              <div className="flex items-center justify-center py-8 bg-white rounded-lg border">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ocean-600"></div>
                <span className="ml-2 text-sm text-slate-500">
                  Loading payment history...
                </span>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">
                  No payments made yet
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  ဆပ်ငွေမှတ်တမ်း မရှိသေးပါ
                </p>
                {purchase.paymentType === "credit" && remainingBalance > 0 && (
                  <button
                    onClick={() => setIsAddPaymentModalOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Make First Payment
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden shadow-xs">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b text-slate-600 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-right">Paid Amount</th>
                      <th className="p-3 text-center">Payment Method</th>
                      <th className="p-3 text-left">Notes</th>
                      <th className="p-3 text-left">Added By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((payment) => {
                      const addedByName =
                        typeof payment.addedBy === "object" &&
                        payment.addedBy !== null
                          ? payment.addedBy.name
                          : typeof payment.addedBy === "string"
                          ? payment.addedBy
                          : "-";

                      const addedByRole =
                        typeof payment.addedBy === "object" &&
                        payment.addedBy !== null
                          ? payment.addedBy.role
                          : "";

                      return (
                        <tr
                          key={payment._id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                            <div>
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(payment.paymentDate).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                            {payment.paidAmount.toLocaleString()} MMK
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-ocean-50 text-ocean-700 border border-ocean-200 capitalize">
                              {payment.paymentMethod || "Cash"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">
                            {payment.notes || "-"}
                          </td>
                          <td className="p-3 text-slate-700 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium">{addedByName}</span>
                              {addedByRole && (
                                <span className="text-[10px] text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                  {addedByRole}
                                </span>
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

          {/* Footer Info */}
          <div className="flex justify-between text-xs text-slate-500 pt-4 border-t">
            <div>Created: {new Date(purchase.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(purchase.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          No purchase order data available
        </div>
      )}

      {/* Add Payment Modal */}
      {purchase && (
        <AddPaymentModal
          isOpen={isAddPaymentModalOpen}
          onClose={() => setIsAddPaymentModalOpen(false)}
          purchaseId={purchase._id}
          poNumber={purchase.poNumber}
          totalAmount={purchase.totalAmount}
          remainingBalance={remainingBalance}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </Modal>
  );
};
