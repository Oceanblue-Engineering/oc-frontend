import React from "react";
import { FileText, Calendar, CreditCard, Phone, Mail, MapPin } from "lucide-react";
import { InvoiceData, InvoiceItem, DEFAULT_REMARKS } from "./InvoiceDocument";

export interface ReceiptData extends InvoiceData {
  paymentReceivedDate?: string;
  paymentMethod?: string;
}

interface ReceiptDocumentProps {
  data: ReceiptData;
  className?: string;
}

export const ReceiptDocument = React.forwardRef<
  HTMLDivElement,
  ReceiptDocumentProps
>(({ data, className }, ref) => {
  const currency = data.currency || "MMK";
  const remarks =
    data.remarks && data.remarks.length > 0 ? data.remarks : DEFAULT_REMARKS;

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

  const receiptDate =
    data.paymentReceivedDate || data.invoiceDate || new Date().toISOString().split("T")[0];

  return (
    <div
      ref={ref}
      id="receipt-document-root"
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

          {/* RECEIPT Title */}
          <div className="text-right">
            <h1 className="text-4xl font-black tracking-tight text-[#1c3d73] leading-none">
              RECEIPT
            </h1>
          </div>
        </div>

        {/* Dark Teal Accent Line */}
        <div className="h-[2px] bg-[#1e4d58] w-full mt-4 mb-6" />

        {/* 2. Received From & Receipt Info */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Left: Received From */}
          <div>
            <h2 className="text-lg font-black text-[#1c3d73] mb-3">Received From</h2>
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

          {/* Right: Receipt Meta with Icons */}
          <div className="pl-6 space-y-3 text-xs self-start">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#1c3d73] shrink-0" />
              <span className="font-bold text-[#1c3d73] w-32">Invoice No</span>
              <span className="font-bold text-slate-800">: {data.invoiceNo}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#1c3d73] shrink-0" />
              <span className="font-bold text-[#1c3d73] w-32">Invoice Date</span>
              <span className="font-medium text-slate-800">: {receiptDate}</span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-[#1c3d73] shrink-0" />
              <span className="font-bold text-[#1c3d73] w-32">Payment Method</span>
              <span className="font-medium text-slate-800">
                : {data.paymentMethod || data.paymentTerms || "KBZ Pay / AYA Pay"}
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

        {/* 4. ATTACHED SUMMARY SECTION (Remarks + Thank You on Left & Total Amount on Right) */}
        <div className="flex items-stretch justify-between mt-[-1px] mb-8">
          {/* Left: Remarks & Appreciation */}
          <div className="flex-1 pr-6 pt-3 space-y-4">
            <div>
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

            {/* Thank you note */}
            <div className="pt-2 text-xs font-bold text-[#0077b6] space-y-0.5">
              <p>Thank you very much.</p>
              <p>We look forward to working with you again.</p>
            </div>
          </div>

          {/* Right: Total Amount Grid (Width 288px exact match to Unit Price w-36 + Amount w-36) */}
          <div className="w-[288px] shrink-0 border border-slate-300 border-t-0 text-xs font-semibold bg-white self-start">
            <div className="grid grid-cols-2 h-12 items-center">
              <span className="text-center font-bold text-slate-900 border-r border-slate-300 h-full flex items-center justify-center">
                Total Amount:
              </span>
              <span className="text-right pr-4 font-black text-slate-900 text-sm sm:text-base h-full flex items-center justify-end">
                {formatMoney(data.totalAmount)} {currency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PREPARED BY CREDENTIALS & BOTTOM BLUE CONTACT BAR */}
      <div className="space-y-6">
        {/* Prepared By Credentials on Right */}
        <div className="flex justify-end pr-4">
          <div className="text-right space-y-1 text-xs">
            <div className="w-56 border-b border-slate-700 ml-auto mb-2" />
            <div className="flex items-start justify-end gap-3">
              <span className="font-bold text-slate-800">Prepared By:</span>
              <div className="text-left">
                <p className="font-black text-slate-900 text-sm">
                  U Pyae Phyo Maung B.E (MC)
                </p>
                <p className="text-slate-600 text-[10px] italic">
                  Certified in Environmental Science
                </p>
                <p className="text-slate-600 text-[10px] italic">
                  Maintenance and Chemical Handling
                </p>
                <p className="text-slate-600 text-[10px] italic">
                  Certified in SCI Engineering
                </p>
                <p className="text-[#0077b6] font-bold text-[10px] mt-0.5">
                  Founder at Ocean Blue
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Blue Contact Banner */}
        <div className="bg-[#1c3d73] text-white rounded-xl px-4 py-2.5 flex items-center justify-between text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-cyan-300" />
            <span>+959420190123</span>
          </div>
          <div className="h-3 w-px bg-white/30" />
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-cyan-300" />
            <span>info@oceanblue.com.mm</span>
          </div>
          <div className="h-3 w-px bg-white/30" />
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-300" />
            <span>10(A), Aung Mingala Street, Mingaladon, Yangon</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ReceiptDocument.displayName = "ReceiptDocument";
