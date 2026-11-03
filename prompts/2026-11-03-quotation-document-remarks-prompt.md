# Antigravity Prompt: Show Remarks on the Quotation Document

**Plan:** `OB-frontend/plans/2026-11-03-quotation-document-remarks-plan.md` (Status: Approved)
**Report to write:** `OB-frontend/reports/2026-11-03-quotation-document-remarks-report.md`
**App:** `OB-frontend` (workspace is the repo root; all paths are relative to it)

## Read first
- The plan above (source of truth)
- `OB-frontend/CLAUDE.md`
- File you will touch: `OB-frontend/components/Invoice/QuotationDocument.tsx`
- Markup to copy (do not modify): the Remarks block in `OB-frontend/components/Invoice/InvoiceDocument.tsx` (lines ~263–273)

## Task
Remarks edited in the generator's Remarks card show on the Invoice and Receipt documents but not on the Quotation, because `QuotationDocument.tsx` has no remarks block. Add one, using the same fallback and markup as `InvoiceDocument.tsx`, placed below the "Prepared By & Total Amount" row and above the navy contact banner.

## Steps
1. In `OB-frontend/components/Invoice/QuotationDocument.tsx`, change the import to `import { InvoiceData, InvoiceItem, DEFAULT_REMARKS } from "./InvoiceDocument";`.
2. Near `const grandTotal = ...` (line ~149), add:
   `const remarks = data.remarks && data.remarks.length > 0 ? data.remarks : DEFAULT_REMARKS;`
3. Directly after the `{/* 4. PREPARED BY & TOTAL AMOUNT ... */}` row closes (line ~359) and before the main content wrapper's closing `</div>`, add:
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
4. Rename the banner comment `{/* 5. BOTTOM SOLID NAVY BLUE CONTACT BANNER */}` to `{/* 6. BOTTOM SOLID NAVY BLUE CONTACT BANNER */}`.

## Constraints
- Change only `OB-frontend/components/Invoice/QuotationDocument.tsx`. If another file must change, explain why in the report.
- Do not change `InvoiceDocument.tsx`, `ReceiptDocument.tsx`, `InvoiceGenerator.tsx`, `InvoiceModal.tsx`, `DEFAULT_REMARKS`, or any backend file.
- No other layout, color, text, or spacing changes in the quotation.
- Strict TypeScript, no `any`. No new dependencies. Do not commit or push unless the user asks.

## Verification
- `npm run build` in `OB-frontend` passes.
- `npx tsc --noEmit -p OB-frontend` shows no errors in `QuotationDocument.tsx` (report the real result; pre-existing errors elsewhere may remain).
- Manual on Invoice → Create New Document → Quotation Preview:
  1. "Remarks:" with the default lines appears below Prepared By / Total Amount, above the blue contact banner.
  2. Editing / adding / removing in the Remarks card updates the Quotation preview live.
  3. Print Quotation, Download PNG, Download PDF include the remarks.
  4. Save, then open the quotation from Document List → remarks shown.
  5. Invoice and Receipt previews unchanged.
  If you cannot run the manual checks, say so in the report instead of marking them done.

## When done
1. Write the report at the path above using the report template in `plans/rules/planning-rules.md`. Put `OB-frontend/prompts/2026-11-03-quotation-document-remarks-prompt.md` in the `Prompt:` field.
2. Set the plan's Status to `Implemented` (or `Blocked`).
3. Tell the user in Myanmar what you did and where the report is.
