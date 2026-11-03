# Antigravity Prompt: Remove the 6 Default Remarks — Remarks Start Empty

**Plan:** `OB-frontend/plans/2026-11-03-empty-default-remarks-plan.md` (Status: Approved)
**Report to write:** `OB-frontend/reports/2026-11-03-empty-default-remarks-report.md`
**App:** `OB-frontend` (workspace is the repo root; all paths are relative to it)

## Read first
- The plan above (source of truth)
- `OB-frontend/CLAUDE.md`
- Files you will touch:
  - `OB-frontend/components/Invoice/InvoiceDocument.tsx`
  - `OB-frontend/components/Invoice/QuotationDocument.tsx`
  - `OB-frontend/components/Invoice/ReceiptDocument.tsx`
  - `OB-frontend/pages/InvoiceGenerator.tsx`
  - `OB-frontend/components/Orders/OrderDetailModal.tsx`

## Task
Every Quotation / Invoice / Receipt still shows 6 hard-coded swimming-pool remarks because `DEFAULT_REMARKS` is seeded into new documents, re-filled on load, used as a fallback in all three templates, and added to order invoices. Remove `DEFAULT_REMARKS` entirely: remarks start empty, the user adds them when needed, and the "Remarks:" heading is hidden on documents that have none.

## Steps
1. `OB-frontend/components/Invoice/InvoiceDocument.tsx`
   - Delete `export const DEFAULT_REMARKS = [...]` (line ~42).
   - Replace the fallback (line ~82) with `const remarks = (data.remarks || []).filter((r) => r.trim());`.
   - In the summary section (line ~259), wrap only the Remarks `<h3>` + `<ul>` inside the left `flex-1 pr-6 pt-3` column with `{remarks.length > 0 && (<>...</>)}`. Keep the left column `div` itself so the totals grid stays right-aligned.
2. `OB-frontend/components/Invoice/QuotationDocument.tsx`
   - Import: `import { InvoiceData, InvoiceItem } from "./InvoiceDocument";`
   - `const remarks = (data.remarks || []).filter((r) => r.trim());` (line ~150).
   - Wrap the whole `{/* 5. REMARKS */}` `<div className="pt-4">` block in `{remarks.length > 0 && (...)}`.
3. `OB-frontend/components/Invoice/ReceiptDocument.tsx`
   - Import: `import { InvoiceData, InvoiceItem } from "./InvoiceDocument";`
   - `const remarks = (data.remarks || []).filter((r) => r.trim());` (line ~20).
   - Wrap only the inner Remarks `<div>` (heading + `<ul>`, line ~190) in `{remarks.length > 0 && (...)}`. Leave the "Thank you" note and the left column unchanged.
4. `OB-frontend/pages/InvoiceGenerator.tsx`
   - Remove `DEFAULT_REMARKS` from the import (line ~40).
   - New-document state (line ~199): `remarks: [],`
   - Load saved document (lines ~757–760): `remarks: [...(inv.remarks || [])],`
   - `handleRemoveRemark`: delete the `length <= 1` guard and its `toast.error`.
   - Remarks card: when `(invoiceData.remarks || []).length === 0`, render `<p className="text-xs text-slate-400 italic">No remarks. They will not appear on the document.</p>` above the "+ Add Remark" button.
   - Leave the save-time trim/filter in `handleSaveInvoice` as is.
5. `OB-frontend/components/Orders/OrderDetailModal.tsx`
   - Remove `DEFAULT_REMARKS` from the import (line ~35).
   - Line ~131: ``remarks: ord.note && ord.note.trim() ? [`Note: ${ord.note.trim()}`] : [],``
6. Run `grep -rn "DEFAULT_REMARKS" OB-frontend/pages OB-frontend/components OB-frontend/utils` — must return nothing.

## Constraints
- Change only the 5 files listed. If another file must change, explain why in the report.
- No backend / API / model / database changes. Do not write a migration for old saved documents.
- Do not change any other layout, color, text, or spacing in the templates.
- Strict TypeScript, no `any`. No new dependencies. Do not commit or push unless the user asks.

## Verification
- `npm run build` in `OB-frontend` passes.
- `npx tsc --noEmit -p OB-frontend` shows no errors in the 5 changed files (report the real result; pre-existing errors elsewhere may remain).
- The grep in step 6 returns nothing.
- Manual:
  1. Invoice → Create New Document: Remarks card empty with the hint; Quotation / Invoice / Receipt previews have no "Remarks:" heading; totals stay in place.
  2. "+ Add Remark" and type text → "Remarks:" appears on all 3 previews; remove it → heading disappears.
  3. One filled + one blank remark, Save, reopen → only the filled one kept.
  4. Reset → remarks empty.
  5. Old saved quotation → stored remarks shown; can be removed and saved.
  6. Orders → order with a note → invoice shows only "Note: ..."; without note → no Remarks heading.
  7. Print / PNG / PDF match the preview.
  If you cannot run the manual checks, say so in the report instead of marking them done.

## When done
1. Write the report at the path above using the report template in `plans/rules/planning-rules.md`. Put `OB-frontend/prompts/2026-11-03-empty-default-remarks-prompt.md` in the `Prompt:` field.
2. Set the plan's Status to `Implemented` (or `Blocked`).
3. Tell the user in Myanmar what you did and where the report is.
