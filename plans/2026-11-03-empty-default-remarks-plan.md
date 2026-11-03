# Plan: Remove the 6 Default Remarks — Remarks Start Empty

**Date:** 2026-11-03
**Status:** Implemented
**App(s):** dashboard

## Objective
New Quotations / Invoices / Receipts must start with **no remarks**. The user adds remarks only when needed. When a document has no remarks, the "Remarks:" heading is not printed. The 6 hard-coded swimming-pool remarks (`DEFAULT_REMARKS`) are removed from the code.

## Root Cause
`DEFAULT_REMARKS` (`OB-frontend/components/Invoice/InvoiceDocument.tsx` line ~42) is injected in five places:
1. `pages/InvoiceGenerator.tsx` line ~199 — new document state is seeded with the 6 remarks.
2. `pages/InvoiceGenerator.tsx` lines ~757–760 — loading a saved document with no remarks re-fills the 6 remarks.
3. `components/Invoice/InvoiceDocument.tsx` line ~82, `ReceiptDocument.tsx` line ~20, `QuotationDocument.tsx` line ~150 — each template falls back to the 6 remarks when `data.remarks` is empty.
4. `components/Orders/OrderDetailModal.tsx` line ~131 — order invoices get the 6 remarks (+ the order note).

Also, `handleRemoveRemark` blocks removing the last remark (added earlier only to stop the fallback from bringing the defaults back) — no longer needed.

## Files to Create / Modify
- `OB-frontend/components/Invoice/InvoiceDocument.tsx` — delete `DEFAULT_REMARKS`; no fallback; hide Remarks block when empty.
- `OB-frontend/components/Invoice/QuotationDocument.tsx` — no fallback; hide Remarks block when empty; drop import.
- `OB-frontend/components/Invoice/ReceiptDocument.tsx` — no fallback; hide Remarks block when empty; drop import.
- `OB-frontend/pages/InvoiceGenerator.tsx` — empty initial remarks; no fallback on load; allow removing all; empty-state hint; drop import.
- `OB-frontend/components/Orders/OrderDetailModal.tsx` — remarks = order note only; drop import.

## Implementation Steps
1. **`InvoiceDocument.tsx`**
   - Delete the `export const DEFAULT_REMARKS = [...]` constant.
   - Replace the fallback with `const remarks = (data.remarks || []).filter((r) => r.trim());`.
   - Wrap only the inner Remarks heading + `<ul>` (inside the left `flex-1 pr-6 pt-3` column, line ~262) in `{remarks.length > 0 && (...)}`. **Keep the empty left column `div`** so the totals grid stays right-aligned.
2. **`QuotationDocument.tsx`**
   - Import back to `import { InvoiceData, InvoiceItem } from "./InvoiceDocument";`.
   - Same `const remarks = (data.remarks || []).filter((r) => r.trim());`.
   - Wrap the whole `{/* 5. REMARKS */}` `<div className="pt-4">` block in `{remarks.length > 0 && (...)}`.
3. **`ReceiptDocument.tsx`**
   - Import back to `import { InvoiceData, InvoiceItem } from "./InvoiceDocument";`.
   - Same `const remarks = ...filter(...)`.
   - Wrap only the inner Remarks `<div>` (heading + `<ul>`, line ~190) in `{remarks.length > 0 && (...)}`. Keep the "Thank you" note and the left column as they are.
4. **`InvoiceGenerator.tsx`**
   - Remove `DEFAULT_REMARKS` from the import (line ~40).
   - New document state (line ~199): `remarks: [],`.
   - Load saved document (lines ~757–760): `remarks: [...(inv.remarks || [])],`.
   - `handleRemoveRemark`: remove the `length <= 1` guard and its toast, so the last remark can be removed.
   - Remarks card: when `(invoiceData.remarks || []).length === 0`, show one line above the "+ Add Remark" button: `<p className="text-xs text-slate-400 italic">No remarks. They will not appear on the document.</p>` (same muted-italic style as "No workers assigned yet." in `components/Project/ProjectModal.tsx`).
   - Keep the save-time trim/filter (`handleSaveInvoice`) unchanged.
5. **`OrderDetailModal.tsx`**
   - Remove `DEFAULT_REMARKS` from the import (line ~35).
   - Line ~131: `remarks: ord.note && ord.note.trim() ? [`Note: ${ord.note.trim()}`] : [],`.
6. Run `grep -rn "DEFAULT_REMARKS" OB-frontend/pages OB-frontend/components OB-frontend/utils` → must return nothing.

## Data Model Changes
- None. Backend `remarks` already defaults to `[]`.

## API Changes
- None.

## Edge Cases & Considerations
- **Already-saved documents:** quotations/invoices saved before this change have the 6 default remarks **stored in MongoDB**, so they will still print them. The user can open such a document, remove the remarks, and save again. No database migration in this plan (could be a follow-up if the user wants old records cleaned).
- **Empty document:** no "Remarks:" heading, no blank space reserved in Quotation; Invoice/Receipt keep their two-column summary so totals do not move.
- **Whitespace-only remarks** (typed but not saved yet) are filtered in the templates, so the live preview never shows a blank `*` line.
- **Order invoices** (Orders → order detail → invoice) now show only the order note as a remark, or nothing.
- **Out of scope:** reusable remark templates / presets saved in Settings.

## Test Plan
- `npm run build` in `OB-frontend` passes; `npx tsc --noEmit -p OB-frontend` shows no errors in the 5 changed files.
- `grep DEFAULT_REMARKS` returns nothing.
- Manual:
  1. Invoice → Create New Document: Remarks card is empty with the hint; Quotation / Invoice / Receipt previews show no "Remarks:" heading; totals stay in place.
  2. "+ Add Remark", type text → "Remarks:" appears on all 3 previews. Remove it → heading disappears.
  3. Add a remark, leave another blank, Save, reopen → only the filled remark is kept.
  4. Reset → remarks empty again.
  5. Open an old saved quotation → its stored remarks are shown and can be removed and saved.
  6. Orders → open an order with a note → invoice shows only "Note: ..."; order without note → no Remarks heading.
  7. Print / PNG / PDF match the preview.
