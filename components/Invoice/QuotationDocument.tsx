import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { InvoiceData, InvoiceItem } from "./InvoiceDocument";

export interface QuotationCategorySection {
  title: string;
  items: InvoiceItem[];
}

export interface CategorizedQuotationData extends Partial<InvoiceData> {
  projectName?: string;
  location?: string;
  quotationDate?: string;
  categorySections?: QuotationCategorySection[];
}

export const DEFAULT_QUOTATION_SECTIONS: QuotationCategorySection[] = [
  {
    title: "Swimming Pool Shell",
    items: [
      {
        no: 1,
        description: "Excavation, Soil Compaction & Lean Concrete",
        qty: 1,
        unitPrice: 8500000,
        amount: 8500000,
      },
      {
        no: 2,
        description: "RCC Structure Pool Shell & Retaining Wall Works",
        qty: 1,
        unitPrice: 6500000,
        amount: 6500000,
      },
    ],
  },
  {
    title: "Tiling and Water Proofing",
    items: [
      {
        no: 1,
        description: "Polymer Cementitious Waterproofing Coating (3 Coats)",
        qty: 1,
        unitPrice: 2000000,
        amount: 2000000,
      },
      {
        no: 2,
        description: "Mosaic Glass Tile Laying & Epoxy Chemical Grouting",
        qty: 1,
        unitPrice: 1500000,
        amount: 1500000,
      },
    ],
  },
  {
    title: "M & E",
    items: [
      {
        no: 1,
        description: "Emaux High-Rate Sand Filter & Circulation Pump 2HP",
        qty: 1,
        unitPrice: 3000000,
        amount: 3000000,
      },
      {
        no: 2,
        description: "LED Underwater Lights, Salt Chlorinator & Piping Works",
        qty: 1,
        unitPrice: 1500000,
        amount: 1500000,
      },
    ],
  },
];

interface QuotationDocumentProps {
  data: CategorizedQuotationData;
  className?: string;
}

export const QuotationDocument = React.forwardRef<
  HTMLDivElement,
  QuotationDocumentProps
>(({ data, className }, ref) => {
  const currency = data.currency || "MMK";

  const projectName =
    data.projectName || data.billTo?.company || data.billTo?.name || "Novotal Swimming Pool Project";
  const location =
    data.location || data.billTo?.address || "No.12, Pyay Road, Yangon";
  const dateStr =
    data.quotationDate || data.invoiceDate || new Date().toISOString().split("T")[0];

  let sections: QuotationCategorySection[] = [];
  if (data.categorySections && data.categorySections.length > 0) {
    sections = data.categorySections;
  } else if (data.items && data.items.length > 0) {
    const poolShellItems: InvoiceItem[] = [];
    const tilingItems: InvoiceItem[] = [];
    const meItems: InvoiceItem[] = [];

    data.items.forEach((item, idx) => {
      const desc = (item.description || "").toLowerCase();
      if (desc.includes("water") || desc.includes("tile") || desc.includes("proof")) {
        tilingItems.push({ ...item, no: tilingItems.length + 1 });
      } else if (desc.includes("pump") || desc.includes("m&e") || desc.includes("filter") || desc.includes("light") || desc.includes("equipment")) {
        meItems.push({ ...item, no: meItems.length + 1 });
      } else {
        if (idx === 0) poolShellItems.push({ ...item, no: poolShellItems.length + 1 });
        else if (idx === 1) tilingItems.push({ ...item, no: tilingItems.length + 1 });
        else meItems.push({ ...item, no: meItems.length + 1 });
      }
    });

    const padItems = (list: InvoiceItem[]) => {
      const copy = [...list];
      while (copy.length < 2) {
        copy.push({
          no: copy.length + 1,
          description: "",
          qty: 0,
          unitPrice: 0,
          amount: 0,
        });
      }
      return copy;
    };

    sections = [
      { title: "Swimming Pool Shell", items: padItems(poolShellItems) },
      { title: "Tiling and Water Proofing", items: padItems(tilingItems) },
      { title: "M & E", items: padItems(meItems) },
    ];
  } else {
    sections = DEFAULT_QUOTATION_SECTIONS;
  }

  const formatMoney = (val?: number) => {
    if (!val && val !== 0) return "";
    return val.toLocaleString();
  };

  const calculatedGrandTotal = sections.reduce((grandSum, sec) => {
    const secSum = sec.items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    return grandSum + secSum;
  }, 0);

  const grandTotal = data.totalAmount || calculatedGrandTotal;

  return (
    <div
      ref={ref}
      id="quotation-document-root"
      className={`bg-white text-slate-900 font-sans p-8 w-[794px] min-h-[1123px] max-w-[794px] mx-auto shadow-lg print:shadow-none print:p-6 select-text flex flex-col justify-between relative ${
        className || ""
      }`}
      style={{
        width: "794px",
        minHeight: "1123px",
        boxSizing: "border-box",
      }}
    >
      {/* Central Watermark Logo (Soft opacity) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
        <svg
          viewBox="0 0 100 100"
          className="w-96 h-96 text-slate-800"
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

      {/* TOP & MAIN CONTENT (Includes Header, Meta, Tables, Prepared By & Total Amount) */}
      <div className="relative z-10 space-y-4">
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

          {/* QUOTATION Title */}
          <div className="text-right">
            <h1 className="text-4xl font-black tracking-tight text-[#1c3d73] leading-none">
              QUOTATION
            </h1>
          </div>
        </div>

        {/* Dark Teal Accent Line */}
        <div className="h-[2px] bg-[#1e4d58] w-full mt-1 mb-3" />

        {/* 2. Quotation Project & Location Meta */}
        <div className="space-y-1 text-xs font-bold text-[#1c3d73] mb-3">
          <div className="flex items-center justify-between">
            <div>
              <span>Quotation for project name: </span>
              <span className="font-extrabold text-slate-800">
                {projectName}
              </span>
            </div>
            <div>
              <span>Date: </span>
              <span className="font-extrabold text-slate-800">{dateStr}</span>
            </div>
          </div>
          <div>
            <span>Location: </span>
            <span className="font-extrabold text-slate-800">{location}</span>
          </div>
        </div>

        {/* 3. CATEGORIZED SECTIONS (Swimming Pool Shell, Tiling and Water Proofing, M & E) */}
        <div className="space-y-3">
          {sections.map((section, secIdx) => {
            const sectionSubTotal = section.items.reduce(
              (sum, it) => sum + (Number(it.amount) || 0),
              0
            );

            // Minimum 2 items per category table
            const displaySectionItems = [...section.items];
            while (displaySectionItems.length < 2) {
              displaySectionItems.push({
                no: displaySectionItems.length + 1,
                description: "",
                qty: 0,
                unitPrice: 0,
                amount: 0,
              });
            }

            return (
              <div key={secIdx} className="space-y-1">
                {/* Category Section Header Title */}
                <h3 className="text-xs sm:text-sm font-black text-[#1c3d73]">
                  {section.title}
                </h3>

                {/* Table */}
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-[#1c3d73] text-white font-bold h-6">
                      <th className="py-1 px-3 text-center border-r border-slate-300 w-14">
                        No:
                      </th>
                      <th className="py-1 px-4 text-center border-r border-slate-300">
                        Description:
                      </th>
                      <th className="py-1 px-3 text-center border-r border-slate-300 w-16">
                        Qty:
                      </th>
                      <th className="py-1 px-4 text-center border-r border-slate-300 w-36">
                        Unit Price:
                      </th>
                      <th className="py-1 px-4 text-center w-36">Amount:</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800">
                    {displaySectionItems.map((item, rowIdx) => (
                      <tr key={rowIdx} className="h-6 border-b border-slate-300">
                        <td className="py-1 px-3 text-center font-bold text-slate-600 border-r border-slate-300 align-middle">
                          {String(rowIdx + 1).padStart(2, "0")}
                        </td>
                        <td className="py-1 px-4 border-r border-slate-300 align-middle font-medium truncate max-w-[320px]">
                          {item.description}
                        </td>
                        <td className="py-1 px-3 text-center border-r border-slate-300 align-middle">
                          {item.qty > 0 ? item.qty : ""}
                        </td>
                        <td className="py-1 px-4 text-right border-r border-slate-300 align-middle">
                          {item.unitPrice > 0 ? formatMoney(item.unitPrice) : ""}
                        </td>
                        <td className="py-1 px-4 text-right font-bold align-middle">
                          {item.amount > 0 ? formatMoney(item.amount) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Attached Sub-Total Box on Right */}
                <div className="flex justify-end mt-[-1px]">
                  <div className="w-[288px] border border-slate-300 border-t-0 text-[11px] font-semibold bg-white">
                    <div className="grid grid-cols-2 h-6 items-center">
                      <span className="text-center font-bold text-slate-700 border-r border-slate-300 h-full flex items-center justify-center">
                        Sub-Total
                      </span>
                      <span className="text-right pr-4 font-bold text-slate-900 h-full flex items-center justify-end">
                        {sectionSubTotal > 0 ? `${formatMoney(sectionSubTotal)}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. PREPARED BY & TOTAL AMOUNT (Placed DIRECTLY BELOW the last table) */}
        <div className="pt-2 flex items-start justify-between">
          {/* Left Side: Prepared By Credentials right below table */}
          <div className="space-y-1 text-xs pt-1">
            <div className="w-56 border-b border-slate-700 mb-2" />
            <div className="flex items-start gap-3">
              <span className="font-bold text-slate-800">Prepared By:</span>
              <div className="text-left">
                <p className="font-black text-slate-900 text-xs sm:text-sm">
                  U Pyae Phyo Maung B.E (MC)
                </p>
                <p className="text-slate-600 text-[10px] italic">
                  Certified in Environmental Science
                </p>
                <p className="text-slate-600 text-[10px] italic">
                  Certified in SCI Engineering
                </p>
                <p className="text-[#0077b6] font-bold text-[10px] italic mt-0.5">
                  Founder at Ocean Blue
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Total Amount Box + Thank you note */}
          <div className="space-y-2 flex flex-col items-end">
            {/* Total Amount Box (Matching 288px width, right below M&E Sub-Total) */}
            <div className="w-[288px] border border-slate-300 text-xs font-bold bg-white">
              <div className="grid grid-cols-2 h-8 items-center">
                <span className="text-center font-black text-slate-900 border-r border-slate-300 h-full flex items-center justify-center">
                  Total Amount
                </span>
                <span className="text-right pr-4 font-black text-slate-900 text-sm h-full flex items-center justify-end">
                  {formatMoney(grandTotal)} {currency}
                </span>
              </div>
            </div>

            {/* Thank You Note */}
            <div className="text-right text-xs font-bold text-[#1c3d73] space-y-0.5 pr-2">
              <p>Thank you very much.</p>
              <p className="text-[#0077b6]">
                We look forward to working with you again.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM SOLID NAVY BLUE CONTACT BANNER */}
      <div className="relative z-10 pt-4">
        <div className="bg-[#1c3d73] text-white rounded-2xl px-5 py-3 flex items-center justify-between text-[11px] font-semibold">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-cyan-300" />
            <span>+959420190123</span>
          </div>
          <div className="h-3 w-px bg-white/30" />
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-cyan-300" />
            <span>info@oceanblue.com.mm</span>
          </div>
          <div className="h-3 w-px bg-white/30" />
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-300" />
            <span>10(A), Aung Mingala Street,Mingaladon, Yangon</span>
          </div>
        </div>
      </div>
    </div>
  );
});

QuotationDocument.displayName = "QuotationDocument";
