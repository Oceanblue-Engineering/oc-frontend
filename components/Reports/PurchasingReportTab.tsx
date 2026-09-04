import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Receipt,
  Wallet,
  Building2,
} from "lucide-react";
import { PurchasingReportData } from "../../services/Reports/fetchPurchasingReport";
import { useLanguage } from "../../context/LanguageContext";

interface PurchasingReportTabProps {
  data: PurchasingReportData | null;
  loading: boolean;
}

export const PurchasingReportTab: React.FC<PurchasingReportTabProps> = ({
  data,
  loading,
}) => {
  const { t } = useLanguage();
  const [productSearch, setProductSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  if (loading) {
    return (
      <div className="bg-white border border-gray-150 rounded-2xl p-16 text-center">
        <div className="w-8 h-8 border-3 border-ocean-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">
          {t("purchasingReport.loading") || "Loading purchasing report & profit analysis..."}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-gray-150 rounded-2xl p-16 text-center">
        <Truck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">
          {t("purchasingReport.noData") || "No purchasing data available for the selected period"}
        </p>
      </div>
    );
  }

  const { summary, productQuantities, supplierBreakdown, profitLoss } = data;

  const filteredProducts = (productQuantities?.products || []).filter(
    (p) =>
      p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.productCode.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredSuppliers = (supplierBreakdown || []).filter((s) =>
    s.supplierName.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString();
  };

  const isProfitable = profitLoss?.status === "PROFIT";

  return (
    <div className="space-y-6">
      {/* 1. PROFIT & LOSS FINANCIAL SUMMARY CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {t("purchasingReport.pnlTitle") || "Profit & Loss Analysis"}
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                isProfitable
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {isProfitable ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {isProfitable
                ? `${t("purchasingReport.profitable") || "Profitable"} (+${profitLoss.profitMargin}%)`
                : `${t("purchasingReport.loss") || "Loss"} (${profitLoss.profitMargin}%)`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sales Revenue */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">
                {t("purchasingReport.totalRevenue") || "Total Sales Revenue"}
              </p>
              <p className="text-lg font-black text-slate-800 mt-1 truncate">
                {formatCurrency(profitLoss.totalRevenue)}{" "}
                <span className="text-xs font-semibold text-slate-400">MMK</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {profitLoss.orderCount} {t("purchasingReport.completedOrders") || "completed orders"}
              </p>
            </div>
          </div>

          {/* Total Purchasing Cost */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl shrink-0">
              <Truck className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">
                {t("purchasingReport.totalPurchases") || "Purchasing Cost"}
              </p>
              <p className="text-lg font-black text-slate-800 mt-1 truncate">
                {formatCurrency(profitLoss.totalPurchasingCost)}{" "}
                <span className="text-xs font-semibold text-slate-400">MMK</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {summary.totalPOCount} {t("purchasingReport.purchaseOrders") || "purchase orders"}
              </p>
            </div>
          </div>

          {/* Operational Expenses */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-xl shrink-0">
              <Receipt className="w-5 h-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">
                {t("purchasingReport.totalExpenses") || "Operational Expenses"}
              </p>
              <p className="text-lg font-black text-slate-800 mt-1 truncate">
                {formatCurrency(profitLoss.totalExpenses)}{" "}
                <span className="text-xs font-semibold text-slate-400">MMK</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {profitLoss.expenseCount} {t("purchasingReport.recordedExpenses") || "recorded expenses"}
              </p>
            </div>
          </div>

          {/* Net Profit / Loss */}
          <div
            className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 ${
              isProfitable
                ? "bg-emerald-50/40 border-emerald-200/80"
                : "bg-rose-50/40 border-rose-200/80"
            }`}
          >
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isProfitable ? "bg-emerald-100/80" : "bg-rose-100/80"
              }`}
            >
              <Wallet
                className={`w-5 h-5 ${
                  isProfitable ? "text-emerald-700" : "text-rose-700"
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">
                {t("purchasingReport.netProfit") || "Net Profit / Loss"}
              </p>
              <p
                className={`text-lg font-black mt-1 truncate ${
                  isProfitable ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {profitLoss.netProfit >= 0 ? "+" : ""}
                {formatCurrency(profitLoss.netProfit)}{" "}
                <span className="text-xs font-semibold text-slate-400">MMK</span>
              </p>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                {t("purchasingReport.grossProfit") || "Gross"}: {formatCurrency(profitLoss.grossProfit)} MMK
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PURCHASING INVENTORY & CREDIT METRICS */}
      <div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 px-1">
          {t("purchasingReport.title") || "Purchasing Overview"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Purchased Amount */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-ocean-50 rounded-xl shrink-0">
              <DollarSign className="w-5 h-5 text-[#27272a]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">
                {t("purchasingReport.totalPurchasedAmount") || "Total Purchased Amount"}
              </p>
              <p className="text-lg font-black text-slate-800 mt-1 truncate">
                {formatCurrency(summary.totalPurchasedAmount)}{" "}
                <span className="text-xs font-semibold text-slate-400">MMK</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {summary.totalPOCount} {t("purchasingReport.ordersTotal") || "Total Orders"}
              </p>
            </div>
          </div>

          {/* Total Quantity Purchased */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-ocean-50 rounded-xl shrink-0">
              <Package className="w-5 h-5 text-[#27272a]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">
                {t("purchasingReport.totalQuantityPurchased") || "Total Qty Purchased"}
              </p>
              <p className="text-lg font-black text-slate-800 mt-1">
                {(productQuantities.totalOrderedQuantity || 0).toLocaleString()}{" "}
                <span className="text-xs font-semibold text-slate-400">
                  {t("purchasingReport.units") || "Units"}
                </span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {productQuantities.uniqueProductsCount} {t("purchasingReport.uniqueProducts") || "Unique Products"}
              </p>
            </div>
          </div>

          {/* Total Quantity Received */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-ocean-50 rounded-xl shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#27272a]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">
                {t("purchasingReport.totalQuantityReceived") || "Total Qty Received (GRN)"}
              </p>
              <p className="text-lg font-black text-slate-800 mt-1">
                {(productQuantities.totalReceivedQuantity || 0).toLocaleString()}{" "}
                <span className="text-xs font-semibold text-slate-400">
                  {t("purchasingReport.units") || "Units"}
                </span>
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                {productQuantities.totalOrderedQuantity > 0
                  ? Math.round(
                      (productQuantities.totalReceivedQuantity /
                        productQuantities.totalOrderedQuantity) *
                        100
                    )
                  : 0}
                % {t("purchasingReport.fulfillment") || "Fulfilled"}
              </p>
            </div>
          </div>

          {/* Remaining Supplier Payable */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-ocean-50 rounded-xl shrink-0">
              <Clock className="w-5 h-5 text-[#27272a]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">
                {t("purchasingReport.payableToSuppliers") || "Payable to Suppliers"}
              </p>
              <p className="text-lg font-black text-amber-600 mt-1 truncate">
                {formatCurrency(summary.totalRemainingBalance)}{" "}
                <span className="text-xs font-semibold text-slate-400">MMK</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {formatCurrency(summary.totalPaidAmount)} MMK {t("purchasingReport.paid") || "Paid"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT-WISE PURCHASING & QUANTITY BREAKDOWN TABLE */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-ocean-600" />
              {t("purchasingReport.productBreakdownTitle") || "Purchased Products & Quantity Breakdown"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {t("purchasingReport.productBreakdownSubtitle") ||
                "Detailed summary of each product purchased, received quantities, and total spending"}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("purchasingReport.searchProduct") || "Search product or code..."}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-ocean-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-gray-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t("purchasingReport.productName") || "Product Name"}</th>
                <th className="py-3.5 px-4">{t("purchasingReport.productCode") || "Code"}</th>
                <th className="py-3.5 px-4 text-center">{t("purchasingReport.qtyPurchased") || "Purchased Qty"}</th>
                <th className="py-3.5 px-4 text-center">{t("purchasingReport.qtyReceived") || "Received Qty"}</th>
                <th className="py-3.5 px-4 text-right">{t("purchasingReport.avgPrice") || "Avg Price"}</th>
                <th className="py-3.5 px-4 text-right">{t("purchasingReport.totalCost") || "Total Cost"}</th>
                <th className="py-3.5 px-4 text-center">{t("purchasingReport.spendShare") || "Share"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    {t("purchasingReport.noProducts") || "No purchased products found"}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const share =
                    summary.totalPurchasedAmount > 0
                      ? Math.round((p.totalCost / summary.totalPurchasedAmount) * 100)
                      : 0;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {p.productName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {p.productCode}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {(p.totalPurchaseQuantity || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                        {(p.totalReceivedQuantity || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        {formatCurrency(Math.round(p.avgBuyingPrice || 0))} MMK
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {formatCurrency(p.totalCost)} MMK
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded-md bg-ocean-50 text-ocean-700 border border-ocean-100">
                          {share}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. SUPPLIER-WISE PURCHASING SUMMARY TABLE */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-ocean-600" />
              {t("purchasingReport.supplierBreakdownTitle") || "Supplier Purchasing & Credit Analysis"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {t("purchasingReport.supplierBreakdownSubtitle") ||
                "Total purchase volumes, payments completed, and remaining credit per supplier"}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("purchasingReport.searchSupplier") || "Search supplier..."}
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-ocean-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-gray-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t("purchasingReport.supplierName") || "Supplier"}</th>
                <th className="py-3.5 px-4 text-center">{t("purchasingReport.poCount") || "PO Count"}</th>
                <th className="py-3.5 px-4 text-right">{t("purchasingReport.totalPurchased") || "Total Purchased"}</th>
                <th className="py-3.5 px-4 text-right">{t("purchasingReport.paidAmount") || "Paid Amount"}</th>
                <th className="py-3.5 px-4 text-right">{t("purchasingReport.remainingCredit") || "Payable Balance"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                    {t("purchasingReport.noSuppliers") || "No supplier data available"}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{s.supplierName}</p>
                      {s.supplierPhone && (
                        <p className="text-xs text-slate-400">{s.supplierPhone}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {s.poCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatCurrency(s.totalPurchased)} MMK
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(s.totalPaid)} MMK
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-amber-600">
                      {formatCurrency(s.remainingBalance)} MMK
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
