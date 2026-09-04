import React, { useState } from "react";
import {
  X,
  RefreshCw,
  Receipt,
  Store,
  Calendar,
  CreditCard,
  Package,
  UserCircle,
  User,
  Plus,
  Minus,
  Printer,
  FileText,
  Truck,
  MapPin,
} from "lucide-react";
import { Order } from "../../services/Order/fetchOrders";
import {
  getStatusColor,
  getPaymentTypeLabel,
  getPaymentMethodLabel,
  getPaymentTypeColor,
  formatDate,
} from "./orderUtils";
import { useLanguage } from "../../context/LanguageContext";
import { getSavedPrintPaperSize } from "../../utils/printPaperSize";
import { detectDevice } from "../../utils/deviceDetect";
import { useNavigate } from "react-router-dom";
import { AddItemsToOrderModal } from "./AddItemsToOrderModal";
import { RemoveItemsFromOrderModal } from "./RemoveItemsFromOrderModal";
import { InvoiceModal } from "../Invoice/InvoiceModal";
import {
  InvoiceData,
  DEFAULT_REMARKS,
  DEFAULT_PAYMENT_ACCOUNTS,
} from "../Invoice/InvoiceDocument";
import { Button } from "../ui/button";

interface OrderDetailModalProps {
  isOpen: boolean;
  loading: boolean;
  order: Order | null;
  onClose: () => void;
  onOrderUpdate?: () => void;
  onRefresh?: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  loading,
  order,
  onClose,
  onOrderUpdate,
  onRefresh,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [showRemoveItemsModal, setShowRemoveItemsModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const getInvoiceDataFromOrder = (ord: Order): InvoiceData => {
    const rawDate = ord.createdAt || ord.date || new Date().toISOString();
    const formattedDate = new Date(rawDate).toISOString().split("T")[0];

    const customerName =
      (typeof ord.creditPersonId === "object" ? ord.creditPersonId?.name : "") ||
      ord.customer ||
      "Customer";
    const customerPhone =
      (typeof ord.creditPersonId === "object"
        ? ord.creditPersonId?.phone
        : "") || "";
    const customerAddress =
      (typeof ord.creditPersonId === "object"
        ? ord.creditPersonId?.address
        : "") ||
      ord.deliveryDetails?.deliveryAddress ||
      "";

    const items =
      ord.ordersProducts && ord.ordersProducts.length > 0
        ? ord.ordersProducts.map((item, idx) => ({
            no: idx + 1,
            description:
              item.inventoryId?.productName || "Product Item",
            qty: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            amount: (item.quantity || 1) * (item.unitPrice || 0),
          }))
        : (ord.items || []).map((item, idx) => ({
            no: idx + 1,
            description:
              item.productId?.productName || "Product Item",
            qty: item.quantity || 1,
            unitPrice: item.price || 0,
            amount: (item.quantity || 1) * (item.price || 0),
          }));

    return {
      invoiceNo: ord.orderNumber || ord.voucherNo || "INV-001",
      invoiceDate: formattedDate,
      paymentTerms: `${getPaymentTypeLabel(ord.paymentType)} • ${getPaymentMethodLabel(ord.paymentMethod)}`,
      billTo: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        company: ord.storefrontId?.name || "",
      },
      items,
      subTotal: ord.subTotal || ord.finalAmount || 0,
      discountOrTaxLabel: ord.discount
        ? `Discount (${ord.discount.toLocaleString()} MMK)`
        : "Discount / Tax (%)",
      discountOrTaxAmount: ord.discount || 0,
      totalAmount: ord.finalAmount || 0,
      remarks: [...DEFAULT_REMARKS],
      paymentAccounts: [...DEFAULT_PAYMENT_ACCOUNTS],
      preparedBy: `Prepared By: ${adminData.name || "Ocean Blue"}`,
      currency: "MMK",
    };
  };

  const handlePrintOrder = () => {
    if (!order) return;

    // Transform order data to receipt format
    const receiptData = {
      invoiceNumber: order.orderNumber,
      storefrontName: "HONGCHI Myanmar",
      date: order.createdAt,
      items:
        order.ordersProducts?.map((item) => ({
          name: item.inventoryId?.productName || "Unknown Product",
          code: item.inventoryId?.productCode,
          qty: item.quantity,
          price: item.unitPrice || 0,
        })) || [],
      subtotal: order.subTotal || 0,
      discountPercent: order.discount
        ? (order.discount / (order.subTotal || 1)) * 100
        : 0,
      total: order.finalAmount || 0,
      paymentMethod: getPaymentMethodLabel(order.paymentMethod),
      paidAmount: order.paidAmount,
      change: order.extraChange,
      note: order.note,
      serviceCharge: 0,
      tax: 0,
      receiptSequenceNumber:
        parseInt(order.orderNumber?.split("/").pop() || "0", 10) ||
        Date.now() % 10000,
      cashierName:
        JSON.parse(localStorage.getItem("adminData") || "{}").name ||
        "Cashier",
      customerName:
        typeof order.creditPersonId === "object"
          ? order.creditPersonId?.name
          : "",
      customerPhone:
        typeof order.creditPersonId === "object"
          ? order.creditPersonId?.phone
          : "",
      customerAddress:
        typeof order.creditPersonId === "object"
          ? order.creditPersonId?.address || ""
          : "",
    };

    // Save receipt data to localStorage for A4 printing
    const receiptId = `receipt_${receiptData.invoiceNumber}`;
    localStorage.setItem(receiptId, JSON.stringify(receiptData));

    // Navigate to A4 print page for all devices
    navigate(
      `/print-receipt/${receiptData.invoiceNumber}?size=${getSavedPrintPaperSize()}`
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b bg-slate-50/80 shrink-0">
          <h3 className="font-black text-base sm:text-lg text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-ocean-600" />
            Order Details
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {order && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowInvoiceModal(true)}
                  leftIcon={<FileText className="w-4 h-4" />}
                >
                  Official Invoice (A4)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintOrder}
                  leftIcon={<Printer className="w-4 h-4" />}
                  title="Print Thermal Receipt"
                >
                  Thermal Receipt
                </Button>
              </>
            )}
            {order && userRole === "owner" && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRemoveItemsModal(true)}
                  leftIcon={<Minus className="w-3.5 h-3.5" />}
                >
                  {t("orders.removeItems") || "Remove"}
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setShowAddItemsModal(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  {t("orders.addItems") || "Add"}
                </Button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-ocean-600 mb-3" />
              <p className="text-slate-500 font-semibold">
                Loading order details...
              </p>
            </div>
          ) : order ? (
            <>
              {/* Order Info Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {order.storefrontId && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200/60 font-semibold">
                      <Store className="w-3.5 h-3.5 text-ocean-600" />
                      {order.storefrontId.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer & Credit Person Info */}
              {(order.creditPersonId || order.customer) && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center border border-ocean-200/60 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Customer / Client
                    </p>
                    <p className="text-sm font-black text-slate-800">
                      {typeof order.creditPersonId === "object"
                        ? order.creditPersonId?.name
                        : order.customer || "General Customer"}
                      {typeof order.creditPersonId === "object" &&
                      order.creditPersonId?.phone
                        ? ` (${order.creditPersonId.phone})`
                        : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery Details Info */}
              {order.deliveryDetails &&
                (Boolean(order.deliveryDetails.deliveryFee) ||
                  Boolean(order.deliveryDetails.townshipName) ||
                  Boolean(order.deliveryDetails.deliveryAddress) ||
                  Boolean(order.deliveryDetails.recipientName)) && (
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                            Delivery Details
                          </p>
                          {order.deliveryStatus && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 capitalize border border-blue-200">
                              {order.deliveryStatus.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          {order.deliveryDetails.townshipName || "Delivery Service"}
                          {order.deliveryDetails.recipientName
                            ? ` • ${order.deliveryDetails.recipientName}`
                            : ""}
                          {order.deliveryDetails.recipientPhone
                            ? ` (${order.deliveryDetails.recipientPhone})`
                            : ""}
                        </p>
                        {order.deliveryDetails.deliveryAddress && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {order.deliveryDetails.deliveryAddress}
                          </p>
                        )}
                      </div>
                    </div>

                    {(order.deliveryDetails.deliveryFee ?? 0) > 0 && (
                      <div className="sm:text-right sm:border-l sm:border-blue-200/60 sm:pl-4">
                        <p className="text-[11px] text-slate-500 font-medium">Delivery Fee</p>
                        <p className="text-sm font-black text-blue-600">
                          +{order.deliveryDetails.deliveryFee?.toLocaleString()} MMK
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* Items Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-ocean-600" />
                  Order Items (
                  {order.ordersProducts?.length || order.items?.length || 0})
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(order.ordersProducts || order.items || []).map(
                        (item: any, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-800">
                              {item.inventoryId?.productName ||
                                item.productId?.productName ||
                                item.productName ||
                                "Product Item"}
                              {(item.inventoryId?.productCode ||
                                item.productId?.productCode) && (
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  {item.inventoryId?.productCode ||
                                    item.productId?.productCode}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-700">
                              {item.quantity || 1}
                            </td>
                            <td className="p-3 text-right text-slate-600">
                              {(item.unitPrice || item.price || 0).toLocaleString()}{" "}
                              MMK
                            </td>
                            <td className="p-3 text-right font-black text-slate-900">
                              {(
                                (item.quantity || 1) *
                                (item.unitPrice || item.price || 0)
                              ).toLocaleString()}{" "}
                              MMK
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-ocean-600" />
                  Payment Summary
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">
                      {order.subTotal?.toLocaleString()} MMK
                    </span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount</span>
                      <span>-{order.discount.toLocaleString()} MMK</span>
                    </div>
                  )}
                  {(order.deliveryDetails?.deliveryFee ?? 0) > 0 && (
                    <div className="flex justify-between text-blue-600 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        Delivery Fee
                        {order.deliveryDetails?.townshipName
                          ? ` (${order.deliveryDetails.townshipName})`
                          : ""}
                      </span>
                      <span>
                        +{order.deliveryDetails?.deliveryFee?.toLocaleString()} MMK
                      </span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax</span>
                      <span className="font-semibold">
                        +{order.tax.toLocaleString()} MMK
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2.5 flex justify-between font-black text-base sm:text-lg text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-ocean-700">
                      {order.finalAmount?.toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Official A4 Invoice Preview Modal */}
      {showInvoiceModal && order && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          invoiceData={getInvoiceDataFromOrder(order)}
        />
      )}

      {/* Add Items Modal */}
      <AddItemsToOrderModal
        isOpen={showAddItemsModal}
        order={order}
        onClose={() => setShowAddItemsModal(false)}
        onSuccess={() => {
          setShowAddItemsModal(false);
          (onOrderUpdate || onRefresh)?.();
        }}
      />

      {/* Remove Items Modal */}
      <RemoveItemsFromOrderModal
        isOpen={showRemoveItemsModal}
        order={order}
        onClose={() => setShowRemoveItemsModal(false)}
        onSuccess={() => {
          setShowRemoveItemsModal(false);
          (onOrderUpdate || onRefresh)?.();
        }}
      />
    </div>
  );
};
