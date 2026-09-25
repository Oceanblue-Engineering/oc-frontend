import React from "react";
import { FileText, Calendar, CreditCard } from "lucide-react";

export interface InvoiceItem {
  no?: string | number;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNo: string;
  invoiceDate: string;
  paymentTerms: string;
  billTo: {
    name: string;
    company?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: InvoiceItem[];
  subTotal: number;
  projectId?: string;
  discountOrTaxLabel?: string;
  discountOrTaxAmount?: number;
  deliveryFee?: number;
  totalAmount: number;
  remarks?: string[];
  paymentAccounts?: {
    type: "kbz" | "rainbow" | "aya" | "custom";
    title: string;
    phone: string;
    name: string;
  }[];
  preparedBy?: string;
  currency?: string;
}

export const DEFAULT_REMARKS = [
  "50 Years warranty for swimming pool structure.",
  "5 Years warranty for water proofing services.",
  "3 Years warranty for M&E accessories.",
  "One-time treatment and on-site Training also included.",
  "Prices can change according to time.",
  "This quotation only available within 2 weeks.",
];

export const DEFAULT_PAYMENT_ACCOUNTS = [
  {
    type: "kbz" as const,
    title: "KBZ PAY",
    phone: "09448799120",
    name: "Phyo Maung",
  },
  {
    type: "rainbow" as const,
    title: "KBZ PAY",
    phone: "09448799120",
    name: "Phyo Maung",
  },
  {
    type: "aya" as const,
    title: "AYA PAY",
    phone: "09448799120",
    name: "Phyo Maung",
  },
];

interface InvoiceDocumentProps {
  data: InvoiceData;
  className?: string;
}

export const InvoiceDocument = React.forwardRef<
  HTMLDivElement,
  InvoiceDocumentProps
>(({ data, className }, ref) => {
  const currency = data.currency || "MMK";
  const remarks =
    data.remarks && data.remarks.length > 0 ? data.remarks : DEFAULT_REMARKS;
  const paymentAccounts =
    data.paymentAccounts && data.paymentAccounts.length > 0
      ? data.paymentAccounts
      : DEFAULT_PAYMENT_ACCOUNTS;

  // Ensure minimum 4 items for full visual balance
  const displayItems: InvoiceItem[] = [...data.items];
  while (displayItems.length < 4) {
    displayItems.push({
      no: displayItems.length + 1,
      description: "",
      qty: 0,
      unitPrice: 0,
      amount: 0,
    });
  }

  const formatMoney = (val: number) => {
    if (!val && val !== 0) return "";
    return val.toLocaleString();
  };

  const effectiveDeliveryFee =
    data.deliveryFee != null && data.deliveryFee > 0
      ? data.deliveryFee
      : Math.max(
          0,
          Math.round(
            data.totalAmount -
              (data.subTotal -
                (data.discountOrTaxAmount || 0))
          )
        );

  return (
    <div
      ref={ref}
      id="invoice-document-root"
      className={`bg-white text-slate-900 font-sans p-10 w-[794px] min-h-[1123px] max-w-[794px] mx-auto shadow-lg print:shadow-none print:p-8 select-text flex flex-col justify-between ${
        className || ""
      }`}
      style={{
        width: "794px",
        minHeight: "1123px",
        boxSizing: "border-box",
      }}
    >
      {/* TOP & MAIN CONTENT */}
      <div>
        {/* 1. Header */}
        <div className="flex items-start justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
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
            <div>
              <div className="flex items-center gap-1.5 text-3xl font-black tracking-tight leading-none">
                <span className="text-[#0f2a4a]">OCEAN</span>
                <span className="text-[#00b4d8]">BLUE</span>
              </div>
              <p className="text-[10px] font-extrabold text-[#0f2a4a] tracking-wider uppercase mt-1">
                Swimming Pool Specialized Co.Ltd
              </p>
            </div>
          </div>

          {/* INVOICE Title */}
          <div className="text-right">
            <h1 className="text-4xl font-black tracking-tight text-[#1c3d73] leading-none">
              INVOICE
            </h1>
          </div>
        </div>

        {/* Dark Teal Accent Line */}
        <div className="h-[2px] bg-[#1e4d58] w-full mt-4 mb-6" />

        {/* 2. Bill To & Invoice Info */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Left: Bill To */}
          <div className="col-span-5">
            <h2 className="text-lg font-black text-[#1c3d73] mb-3">Bill To</h2>
            <div className="space-y-1.5 text-xs text-slate-800">
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-700">Name</span>
                <span className="col-span-3 font-medium">: {data.billTo.name || "-"}</span>
              </div>
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-700">Company</span>
                <span className="col-span-3 font-medium">: {data.billTo.company || "-"}</span>
              </div>
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-700">Address</span>
                <span className="col-span-3 font-medium">: {data.billTo.address || "-"}</span>
              </div>
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-700">Email</span>
                <span className="col-span-3 font-medium">: {data.billTo.email || "-"}</span>
              </div>
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-700">Phone</span>
                <span className="col-span-3 font-medium">: {data.billTo.phone || "-"}</span>
              </div>
            </div>
          </div>

          {/* Right: Invoice Meta with Icons */}
          <div className="col-span-7 pl-4 space-y-2.5 text-xs self-start">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <FileText className="w-4 h-4 text-[#1c3d73] shrink-0" />
              <span className="font-bold text-[#1c3d73] w-24 sm:w-28 shrink-0">Invoice No</span>
              <span className="font-bold text-slate-800 whitespace-nowrap">: {data.invoiceNo}</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Calendar className="w-4 h-4 text-[#1c3d73] shrink-0" />
              <span className="font-bold text-[#1c3d73] w-24 sm:w-28 shrink-0">Invoice Date</span>
              <span className="font-medium text-slate-800 whitespace-nowrap">: {data.invoiceDate}</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <CreditCard className="w-4 h-4 text-[#1c3d73] shrink-0" />
              <span className="font-bold text-[#1c3d73] w-24 sm:w-28 shrink-0">Payment Terms</span>
              <span className="font-medium text-slate-800 whitespace-nowrap">: {data.paymentTerms || "50% Advance, 50% on Completion"}</span>
            </div>
          </div>
        </div>

        {/* 3. ITEMS TABLE WITH CENTRAL WATERMARK */}
        <div className="relative">
          {/* Central Watermark Logo (Soft opacity) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
            <svg
              viewBox="0 0 100 100"
              className="w-72 h-72 text-slate-800"
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
                <th className="py-2.5 px-3 text-center border-r border-slate-300 w-14">No:</th>
                <th className="py-2.5 px-4 text-center border-r border-slate-300">Description:</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-300 w-16">Qty:</th>
                <th className="py-2.5 px-4 text-center border-r border-slate-300 w-36">Unit Price:</th>
                <th className="py-2.5 px-4 text-center w-36">Amount:</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 bg-transparent">
              {/* Product Rows (01, 02, 03, 04...) */}
              {displayItems.map((item, idx) => (
                <tr key={idx} className="h-11 border-b border-slate-300">
                  <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-300 align-middle">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2 px-4 border-r border-slate-300 align-middle font-medium">
                    {item.description}
                  </td>
                  <td className="py-2 px-3 text-center border-r border-slate-300 align-middle">
                    {item.qty > 0 ? item.qty : ""}
                  </td>
                  <td className="py-2 px-4 text-right border-r border-slate-300 align-middle">
                    {item.unitPrice > 0 ? formatMoney(item.unitPrice) : ""}
                  </td>
                  <td className="py-2 px-4 text-right font-bold align-middle">
                    {item.amount > 0 ? formatMoney(item.amount) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. ATTACHED SUMMARY SECTION (Clean Remarks on Left + Totals Grid on Right) */}
        <div className="flex items-stretch justify-between mt-[-1px] mb-6">
          {/* Left: Remarks (Clean plain background, no borders) */}
          <div className="flex-1 pr-6 pt-3">
            <h3 className="font-black text-[#00b4d8] text-xs sm:text-sm mb-2">
              Remarks:
            </h3>
            <ul className="space-y-1 text-[11px] text-slate-800 font-semibold leading-relaxed">
              {remarks.map((rem, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-slate-600 font-bold">*</span>
                  <span>{rem}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Totals Grid (Width 288px exact match to Unit Price w-36 + Amount w-36) */}
          <div className="w-[288px] shrink-0 border border-slate-300 border-t-0 text-xs font-semibold bg-white">
            {/* Sub-Total Row */}
            <div className="grid grid-cols-2 border-b border-slate-300 h-10 items-center">
              <span className="text-center font-bold text-slate-700 border-r border-slate-300 h-full flex items-center justify-center">
                Sub-Total
              </span>
              <span className="text-right pr-4 font-bold text-slate-900 h-full flex items-center justify-end">
                {formatMoney(data.subTotal)} {currency}
              </span>
            </div>

            {/* Discount / Tax Row */}
            <div className="grid grid-cols-2 border-b border-slate-300 h-10 items-center">
              <span className="text-center font-bold text-slate-700 border-r border-slate-300 h-full flex items-center justify-center">
                {data.discountOrTaxLabel || "Discount / Tax (%)"}
              </span>
              <span className="text-right pr-4 font-bold text-slate-900 h-full flex items-center justify-end">
                {data.discountOrTaxAmount
                  ? `${formatMoney(data.discountOrTaxAmount)} ${currency}`
                  : "-"}
              </span>
            </div>

            {/* Delivery Fee Row (if any) */}
            {effectiveDeliveryFee > 0 && (
              <div className="grid grid-cols-2 border-b border-slate-300 h-10 items-center">
                <span className="text-center font-bold text-slate-700 border-r border-slate-300 h-full flex items-center justify-center">
                  Delivery Fee
                </span>
                <span className="text-right pr-4 font-bold text-slate-900 h-full flex items-center justify-end">
                  +{formatMoney(effectiveDeliveryFee)} {currency}
                </span>
              </div>
            )}

            {/* Total Amount Row */}
            <div className="grid grid-cols-2 h-10 items-center">
              <span className="text-center font-black text-slate-900 border-r border-slate-300 h-full flex items-center justify-center">
                Total Amount:
              </span>
              <span className="text-right pr-4 font-black text-slate-900 text-sm h-full flex items-center justify-end">
                {formatMoney(data.totalAmount)} {currency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. FOOTER: PAYMENT METHOD & SIGNATURES */}
      <div className="pt-4 border-t border-slate-200 space-y-4">
        <div>
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider mb-1">
            Payment Method
          </h4>
          <div className="h-[2px] bg-slate-300 w-24 mb-2" />
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Payment Badges */}
          <div className="flex items-center gap-2.5">
            {paymentAccounts.map((acc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5"
              >
                {acc.type === "kbz" && (
                  <div className="w-7 h-7 rounded-lg bg-[#004b87] text-white flex flex-col items-center justify-center text-[7px] font-black leading-none shrink-0">
                    <span>KBZ</span>
                    <span>Pay</span>
                  </div>
                )}
                {acc.type === "rainbow" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-emerald-400 to-amber-400 text-white flex items-center justify-center text-[8px] font-black shrink-0">
                    🌈
                  </div>
                )}
                {acc.type === "aya" && (
                  <div className="w-7 h-7 rounded-lg bg-[#a61c1c] text-white flex flex-col items-center justify-center text-[6px] font-black leading-none shrink-0">
                    <span>AYA</span>
                    <span>PAY</span>
                  </div>
                )}
                {acc.type === "custom" && (
                  <div className="w-7 h-7 rounded-lg bg-ocean-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                    💳
                  </div>
                )}
                <div className="text-[10px] leading-tight">
                  <p className="font-extrabold text-slate-800">{acc.title}</p>
                  <p className="font-bold text-slate-700">{acc.phone}</p>
                  <p className="text-slate-500 font-medium text-[9px]">{acc.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div className="flex items-center gap-6 shrink-0 text-xs">
            <div className="text-center">
              <div className="w-28 border-b border-slate-700 mb-1.5" />
              <p className="font-bold text-slate-800 text-[11px]">
                {data.preparedBy || "Prepared By: Ocean Blue"}
              </p>
            </div>
            <div className="text-center">
              <div className="w-28 border-b border-slate-700 mb-1.5" />
              <p className="font-bold text-slate-800 text-[11px]">Client Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoiceDocument.displayName = "InvoiceDocument";
