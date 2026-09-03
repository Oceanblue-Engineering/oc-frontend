import React from "react";
import { PrintShopBranding } from "../../utils/printShopBranding";
import { PrintPaperSize } from "../../utils/printPaperSize";
import { FileText, Calendar, CreditCard, Phone, Mail, MapPin } from "lucide-react";
import logo from "../../public/mmah.png";
import address from "../../public/address.jpg";

export interface VoucherReceiptItem {
  name: string;
  code?: string;
  qty: number;
  price: number;
}

export interface VoucherReceiptData {
  invoiceNumber: string;
  storefrontName: string;
  date: string;
  items: VoucherReceiptItem[];
  subtotal: number;
  discountPercent: number;
  total: number;
  paymentMethod: string;
  paidAmount?: number;
  change?: number;
  note?: string;
  serviceCharge?: number;
  tax?: number;
  receiptSequenceNumber?: number;
  cashierName?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
}

interface VoucherContentProps {
  receiptData: VoucherReceiptData;
  shopBranding: PrintShopBranding;
  paperSize: PrintPaperSize;
  formatDate: (dateString: string) => string;
}

export const VoucherContent: React.FC<VoucherContentProps> = ({
  receiptData,
  shopBranding,
  paperSize,
  formatDate,
}) => {
  const isThermal = paperSize.startsWith("thermal");

  if (isThermal) {
    return (
      <div className="voucher-container" data-paper={paperSize}>
        {/* Header */}
        <div className="text-center mb-2">
          <img src={logo} alt="MMAH" className="mx-auto" />
          <img src={address} alt="Address" className="mx-auto" />
          {shopBranding.address && (
            <p className="voucher-address text-slate-600 mt-1 whitespace-pre-line">
              {shopBranding.address}
            </p>
          )}
          {shopBranding.phone && (
            <p className="voucher-address text-slate-600 mt-1">
              Tel: {shopBranding.phone}
            </p>
          )}
        </div>

        {/* Dashed separator */}
        <div className="voucher-dashed-separator" />

        {/* Customer Info */}
        {(receiptData.customerName || receiptData.customerPhone) && (
          <div className="mb-2" style={{ fontSize: "11px" }}>
            {receiptData.customerName && (
              <div>
                <span>Customer:</span> {receiptData.customerName}
              </div>
            )}
            {receiptData.customerPhone && (
              <div>
                <span>Phone:</span> {receiptData.customerPhone}
              </div>
            )}
            {receiptData.customerAddress && (
              <div>
                <span>Address:</span> {receiptData.customerAddress}
              </div>
            )}
          </div>
        )}

        {/* Items header */}
        <div className="voucher-thermal-header">
          <div>Description</div>
          <div className="text-right">Price</div>
          <div className="text-center">Qty</div>
          <div className="text-center">Total</div>
        </div>

        {/* Items */}
        <div className="voucher-thermal-items">
          {receiptData.items.map((item, index) => (
            <div key={index} className="voucher-thermal-item">
              <div className="break-words">
                {item.code ? `${item.code} ` : ""}
                {item.name}
              </div>
              <div className="text-right">{item.price.toLocaleString()}</div>
              <div className="text-center">{item.qty}</div>
              <div className="text-center font-semibold">
                {(item.price * item.qty).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Dashed separator */}
        <div className="voucher-dashed-separator" />

        {/* Summary - right aligned */}
        <div className="voucher-thermal-summary">
          <div className="voucher-summary-row">
            <span>Gross</span>
            <span>{receiptData.subtotal.toLocaleString()}</span>
          </div>
          {receiptData.discountPercent > 0 && (
            <div className="voucher-summary-row">
              <span>Discount ({receiptData.discountPercent}%)</span>
              <span>
                -
                {(
                  (receiptData.subtotal * receiptData.discountPercent) /
                  100
                ).toLocaleString()}
              </span>
            </div>
          )}
          <div className="voucher-summary-row">
            <span>Service charge</span>
            <span>{(receiptData.serviceCharge || 0).toLocaleString()}</span>
          </div>
          <div className="voucher-summary-row">
            <span>Tax</span>
            <span>{(receiptData.tax || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Dashed separator */}
        <div className="voucher-dashed-separator" />

        {/* Total - large */}
        <div className="voucher-thermal-total">
          <span className="voucher-total-label">TOTAL</span>
          <span className="voucher-total-amount">
            {receiptData.total.toLocaleString()} {shopBranding.currency || "MMK"}
          </span>
        </div>

        {/* Dashed separator */}
        <div className="voucher-dashed-separator" />

        {/* Note */}
        {receiptData.note && (
          <div className="voucher-thermal-note">
            <p className="italic">Note: {receiptData.note}</p>
          </div>
        )}

        {/* Receipt info */}
        <div className="voucher-thermal-receipt-info">
          <div className="flex justify-between">
            <span>Receipt:</span>
            <span>{receiptData.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>{formatDate(receiptData.date)}</span>
            <span>Thank you!</span>
          </div>
        </div>

        {/* Double line separator */}
        <div className="voucher-double-line" />

        {/* Receipt sequence number */}
        {receiptData.receiptSequenceNumber != null && (
          <div className="voucher-thermal-sequence">
            #{String(receiptData.receiptSequenceNumber).padStart(4, "0")}
          </div>
        )}

        {/* Printed by */}
        {receiptData.cashierName && (
          <div className="voucher-thermal-printed-by">
            Printed by: {receiptData.cashierName}
          </div>
        )}
      </div>
    );
  }

  // A4 / A5 Layout - Styled identically to InvoiceDocument.tsx
  const currency = shopBranding.currency || "MMK";

  // Ensure minimum 4 items for visual balance
  const displayItems: VoucherReceiptItem[] = [...receiptData.items];
  while (displayItems.length < 4) {
    displayItems.push({
      name: "",
      qty: 0,
      price: 0,
    });
  }

  const formatMoney = (val: number) => {
    if (!val && val !== 0) return "";
    return val.toLocaleString();
  };

  const discountAmount =
    receiptData.discountPercent > 0
      ? (receiptData.subtotal * receiptData.discountPercent) / 100
      : 0;

  return (
    <div
      className="voucher-container bg-white text-slate-900 font-sans p-8 sm:p-10 select-text flex flex-col justify-between"
      data-paper={paperSize}
      style={{
        boxSizing: "border-box",
      }}
    >
      {/* TOP & MAIN CONTENT */}
      <div>
        {/* 1. Header */}
        <div className="flex items-start justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            {shopBranding.logo ? (
              <img
                src={shopBranding.logo}
                alt={shopBranding.shopName}
                className="w-12 h-12 object-contain shrink-0"
              />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 100 100"
                  className="w-12 h-12 text-[#0077b6]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#0077b6"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="210 60"
                    transform="rotate(-135 50 50)"
                  />
                  <rect
                    x="45"
                    y="15"
                    width="10"
                    height="40"
                    rx="5"
                    fill="#0077b6"
                  />
                </svg>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black tracking-tight leading-none">
                <span className="text-[#0f2a4a]">OCEAN</span>
                <span className="text-[#00b4d8]">BLUE</span>
              </div>
              <p className="text-[10px] font-extrabold text-[#0f2a4a] tracking-wider uppercase mt-1">
                Swimming Pool Specialized Co.Ltd
              </p>
              {receiptData.storefrontName && (
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                  Store: {receiptData.storefrontName}
                </p>
              )}
            </div>
          </div>

          {/* INVOICE Title */}
          <div className="text-right">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#1c3d73] leading-none">
              INVOICE
            </h1>
          </div>
        </div>

        {/* Dark Teal Accent Line */}
        <div className="h-[2px] bg-[#1e4d58] w-full mt-4 mb-6" />

        {/* 2. Bill To & Invoice Info */}
        <div className="grid grid-cols-2 gap-6 sm:gap-8 mb-6">
          {/* Left: Bill To */}
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#1c3d73] mb-3">
              Bill To
            </h2>
            <div className="space-y-1.5 text-xs text-slate-800">
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-700">Name</span>
                <span className="col-span-3 font-medium">
                  : {receiptData.customerName || "Walk-in Customer"}
                </span>
              </div>
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-700">Phone</span>
                <span className="col-span-3 font-medium">
                  : {receiptData.customerPhone || "-"}
                </span>
              </div>
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-700">Address</span>
                <span className="col-span-3 font-medium">
                  : {receiptData.customerAddress || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Invoice Meta with Icons */}
          <div className="pl-2 sm:pl-6 space-y-3 text-xs self-start">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#1c3d73] shrink-0" />
              <span className="font-bold text-[#1c3d73] w-28 sm:w-32">
                Invoice No
              </span>
              <span className="font-bold text-slate-800">
                : {receiptData.invoiceNumber}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#1c3d73] shrink-0" />
              <span className="font-bold text-[#1c3d73] w-28 sm:w-32">
                Invoice Date
              </span>
              <span className="font-medium text-slate-800">
                : {formatDate(receiptData.date)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-[#1c3d73] shrink-0" />
              <span className="font-bold text-[#1c3d73] w-28 sm:w-32">
                Payment Method
              </span>
              <span className="font-medium text-slate-800 capitalize">
                : {receiptData.paymentMethod || "Cash"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. ITEMS TABLE WITH CENTRAL WATERMARK */}
        <div className="relative">
          {/* Central Watermark Logo (Soft opacity) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
            <svg
              viewBox="0 0 100 100"
              className="w-64 h-64 sm:w-72 sm:h-72 text-slate-800"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="210 60"
                transform="rotate(-135 50 50)"
              />
              <rect
                x="45"
                y="15"
                width="10"
                height="40"
                rx="5"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-[#1c3d73] text-white font-bold h-10">
                <th className="py-2.5 px-3 text-center border-r border-slate-300 w-14">
                  No:
                </th>
                <th className="py-2.5 px-4 text-center border-r border-slate-300">
                  Description:
                </th>
                <th className="py-2.5 px-3 text-center border-r border-slate-300 w-16">
                  Qty:
                </th>
                <th className="py-2.5 px-4 text-center border-r border-slate-300 w-32 sm:w-36">
                  Unit Price:
                </th>
                <th className="py-2.5 px-4 text-center w-32 sm:w-36">
                  Amount:
                </th>
              </tr>
            </thead>
            <tbody className="text-slate-800 bg-transparent">
              {displayItems.map((item, idx) => (
                <tr key={idx} className="h-11 border-b border-slate-300">
                  <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-300 align-middle">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2 px-4 border-r border-slate-300 align-middle font-medium">
                    {item.code ? `${item.code} - ` : ""}
                    {item.name}
                  </td>
                  <td className="py-2 px-3 text-center border-r border-slate-300 align-middle">
                    {item.qty > 0 ? item.qty : ""}
                  </td>
                  <td className="py-2 px-4 text-right border-r border-slate-300 align-middle">
                    {item.price > 0 ? formatMoney(item.price) : ""}
                  </td>
                  <td className="py-2 px-4 text-right font-bold align-middle">
                    {item.qty > 0 ? formatMoney(item.price * item.qty) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. ATTACHED SUMMARY SECTION (Remarks on Left + Totals Grid on Right) */}
        <div className="flex items-stretch justify-between mt-[-1px] mb-6">
          {/* Left: Remarks & Payment Status */}
          <div className="flex-1 pr-4 sm:pr-6 pt-3">
            <h3 className="font-black text-[#00b4d8] text-xs sm:text-sm mb-2">
              Remarks:
            </h3>
            <ul className="space-y-1 text-[11px] text-slate-800 font-semibold leading-relaxed">
              <li className="flex items-start gap-1">
                <span className="text-slate-600 font-bold">*</span>
                <span>50 Years warranty for swimming pool structure.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-slate-600 font-bold">*</span>
                <span>5 Years warranty for water proofing services.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-slate-600 font-bold">*</span>
                <span>3 Years warranty for M&E accessories.</span>
              </li>
              {receiptData.note && (
                <li className="flex items-start gap-1 text-slate-700 italic">
                  <span className="text-slate-600 font-bold">*</span>
                  <span>Note: {receiptData.note}</span>
                </li>
              )}
            </ul>

            {(receiptData.paidAmount != null || receiptData.change != null) && (
              <div className="mt-3 text-xs text-slate-700 space-y-0.5 font-medium">
                {receiptData.paidAmount != null && (
                  <p>
                    <span className="font-bold">Paid:</span>{" "}
                    {formatMoney(receiptData.paidAmount)} {currency}
                  </p>
                )}
                {receiptData.change != null && receiptData.change > 0 && (
                  <p>
                    <span className="font-bold">Change:</span>{" "}
                    {formatMoney(receiptData.change)} {currency}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: Totals Grid */}
          <div className="w-[260px] sm:w-[288px] shrink-0 border border-slate-300 border-t-0 text-xs font-semibold bg-white">
            {/* Sub-Total Row */}
            <div className="grid grid-cols-2 border-b border-slate-300 h-10 items-center">
              <span className="text-center font-bold text-slate-700 border-r border-slate-300 h-full flex items-center justify-center">
                Sub-Total
              </span>
              <span className="text-right pr-4 font-bold text-slate-900 h-full flex items-center justify-end">
                {formatMoney(receiptData.subtotal)} {currency}
              </span>
            </div>

            {/* Discount Row (if any) */}
            {discountAmount > 0 && (
              <div className="grid grid-cols-2 border-b border-slate-300 h-10 items-center">
                <span className="text-center font-bold text-slate-700 border-r border-slate-300 h-full flex items-center justify-center">
                  Discount ({receiptData.discountPercent}%)
                </span>
                <span className="text-right pr-4 font-bold text-red-600 h-full flex items-center justify-end">
                  -{formatMoney(discountAmount)} {currency}
                </span>
              </div>
            )}

            {/* Tax Row (if any) */}
            {receiptData.tax != null && receiptData.tax > 0 && (
              <div className="grid grid-cols-2 border-b border-slate-300 h-10 items-center">
                <span className="text-center font-bold text-slate-700 border-r border-slate-300 h-full flex items-center justify-center">
                  Tax
                </span>
                <span className="text-right pr-4 font-bold text-slate-900 h-full flex items-center justify-end">
                  {formatMoney(receiptData.tax)} {currency}
                </span>
              </div>
            )}

            {/* Service Charge (if any) */}
            {receiptData.serviceCharge != null && receiptData.serviceCharge > 0 && (
              <div className="grid grid-cols-2 border-b border-slate-300 h-10 items-center">
                <span className="text-center font-bold text-slate-700 border-r border-slate-300 h-full flex items-center justify-center">
                  Service Charge
                </span>
                <span className="text-right pr-4 font-bold text-slate-900 h-full flex items-center justify-end">
                  {formatMoney(receiptData.serviceCharge)} {currency}
                </span>
              </div>
            )}

            {/* Total Amount Row */}
            <div className="grid grid-cols-2 h-11 items-center bg-slate-50/50">
              <span className="text-center font-black text-slate-900 border-r border-slate-300 h-full flex items-center justify-center">
                Total Amount:
              </span>
              <span className="text-right pr-4 font-black text-slate-900 text-sm sm:text-base h-full flex items-center justify-end">
                {formatMoney(receiptData.total)} {currency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. FOOTER: PAYMENT METHOD & SIGNATURES & BOTTOM CONTACT BANNER */}
      <div className="pt-4 border-t border-slate-200 space-y-4">
        <div>
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider mb-1">
            Payment Method
          </h4>
          <div className="h-[2px] bg-slate-300 w-24 mb-2" />
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Payment Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#004b87] text-white flex flex-col items-center justify-center text-[7px] font-black leading-none shrink-0">
                <span>KBZ</span>
                <span>Pay</span>
              </div>
              <div className="text-[10px] leading-tight">
                <p className="font-extrabold text-slate-800">KBZ PAY</p>
                <p className="font-bold text-slate-700">09448799120</p>
                <p className="text-slate-500 font-medium text-[9px]">Phyo Maung</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#a61c1c] text-white flex flex-col items-center justify-center text-[6px] font-black leading-none shrink-0">
                <span>AYA</span>
                <span>PAY</span>
              </div>
              <div className="text-[10px] leading-tight">
                <p className="font-extrabold text-slate-800">AYA PAY</p>
                <p className="font-bold text-slate-700">09448799120</p>
                <p className="text-slate-500 font-medium text-[9px]">Phyo Maung</p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex items-center gap-6 shrink-0 text-xs">
            <div className="text-center">
              <div className="w-24 sm:w-28 border-b border-slate-700 mb-1.5" />
              <p className="font-bold text-slate-800 text-[10px] sm:text-[11px]">
                Prepared By
              </p>
            </div>
            <div className="text-center">
              <div className="w-24 sm:w-28 border-b border-slate-700 mb-1.5" />
              <p className="font-bold text-slate-800 text-[10px] sm:text-[11px]">
                Authorised Sign
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Blue Contact Banner */}
        <div className="bg-[#1c3d73] text-white rounded-xl px-4 py-2.5 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold mt-4">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-cyan-300" />
            <span>{shopBranding.phone || "+959420190123"}</span>
          </div>
          <div className="h-3 w-px bg-white/30" />
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-cyan-300" />
            <span>info@oceanblue.com.mm</span>
          </div>
          <div className="h-3 w-px bg-white/30" />
          <div className="flex items-center gap-1.5 truncate max-w-[280px]">
            <MapPin className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="truncate">
              {shopBranding.address || "10(A), Aung Mingala Street, Mingaladon, Yangon"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
