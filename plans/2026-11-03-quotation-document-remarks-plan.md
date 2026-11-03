# Plan: Show Remarks on the Quotation Document

**Date:** 2026-11-03
**Status:** Implemented
**App(s):** dashboard

## Objective
Remarks edited in the new Remarks card (`2026-11-03-quotation-remarks-editor-plan.md`) appear on the Invoice and Receipt previews, but **not on the Quotation** preview, print, PNG, or PDF. Render the remarks on the Quotation document too.

## Root Cause
There are three document templates, not two:
- `OB-frontend/components/Invoice/InvoiceDocument.tsx` — renders `data.remarks` (line ~259).
- `OB-frontend/components/Invoice/ReceiptDocument.tsx` — renders `data.remarks` (line ~186).
- `OB-frontend/components/Invoice/QuotationDocument.tsx` — **has no remarks block at all**. It is used by the live preview (`pages/InvoiceGenerator.tsx` line ~1945) and the saved-document modal (`components/Invoice/InvoiceModal.tsx` line ~214).

The previous plan wrongly assumed the quotation used `InvoiceDocument.tsx`; this plan closes that gap.

## Files to Create / Modify
- `OB-frontend/components/Invoice/QuotationDocument.tsx` — add a Remarks block.

## Implementation Steps
1. Import `DEFAULT_REMARKS` alongside the existing import: `import { InvoiceData, InvoiceItem, DEFAULT_REMARKS } from "./InvoiceDocument";`
2. Next to the other derived values (near `grandTotal`, line ~149), add the same fallback the other two templates use:
   `const remarks = data.remarks && data.remarks.length > 0 ? data.remarks : DEFAULT_REMARKS;`
3. Add a `{/* 5. REMARKS */}` block **inside the main content wrapper, directly after the "4. PREPARED BY & TOTAL AMOUNT" row** (that row ends at line ~359) and before the wrapper's closing `</div>` — so it sits above the navy contact banner. Full width, copying the heading/list markup of `InvoiceDocument.tsx` (lines ~263–273):
   ```tsx
   {/* 5. REMARKS */}
   <div className="pt-4">
     <h3 className="font-black text-[#00b4d8] text-xs sm:text-sm mb-2">Remarks:</h3>
     <ul className="space-y-1 text-[11px] text-slate-800 font-semibold leading-relaxed">
       {remarks.map((rem, idx) => (
         <li key={idx} className="flex items-start gap-1">
           <span className="text-slate-600 font-bold">*</span>
           <span>{rem}</span>
         </li>
       ))}
     </ul>
   </div>
   ```
4. Renumber the banner comment from `{/* 5. BOTTOM SOLID NAVY BLUE CONTACT BANNER */}` to `{/* 6. ... */}`.
5. No other layout, color, or content changes.

## Data Model Changes
- None.

## API Changes
- None.

## Edge Cases & Considerations
- **Saved quotations** created before the Remarks editor already store the 6 defaults (state was seeded with `DEFAULT_REMARKS`), so they will now show those 6 lines. Records with an empty array also show the defaults via the fallback — same behavior as Invoice/Receipt.
- **Page length:** the document is a single A4 page (`min-h-[1123px]`). Six remark lines add ~110px. Quotations with many items may grow past one A4 page in print/PDF — same as Invoice/Receipt today. Not changed here.
- Placement (below Prepared By / Total, above the banner) keeps the tables + totals together and matches the "terms after total" order of the other templates.
- **Out of scope:** making the "Prepared By" text or thank-you note editable; hiding remarks per document.

## Test Plan
- `npm run build` in `OB-frontend` passes; `npx tsc --noEmit -p OB-frontend` shows no errors in `QuotationDocument.tsx`.
- Manual on Invoice → Create New Document → Quotation Preview:
  1. "Remarks:" with the 6 default lines appears below Prepared By / Total Amount, above the blue contact banner.
  2. Edit / add / remove a remark in the Remarks card → Quotation preview updates live.
  3. Print Quotation, Download PNG, Download PDF → remarks included.
  4. Save, then open the quotation from Document List (InvoiceModal) → remarks shown.
  5. Invoice and Receipt previews unchanged.
