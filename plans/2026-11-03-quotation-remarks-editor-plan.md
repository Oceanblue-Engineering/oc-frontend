# Plan: Editable Remarks in the Quotation / Invoice / Receipt Generator

**Date:** 2026-11-03
**Status:** Implemented
**App(s):** dashboard

## Objective
Let the user edit, add, and remove the "Remarks" lines that print on Quotations, Invoices, and Receipts. Today every document prints the same 6 hard-coded swimming-pool remarks (`DEFAULT_REMARKS`) because the form has no remarks editor.

## Findings
- **Backend already supports it:** `OB-backend/src/models/invoice.model.js` has `remarks: [String]`; `createInvoice` and `updateInvoice` in `OB-backend/src/controllers/invoice.controller.js` save it. No backend change.
- **Documents already render it:** `OB-frontend/components/Invoice/InvoiceDocument.tsx` (line ~259) and `ReceiptDocument.tsx` (line ~186) print `data.remarks`, falling back to `DEFAULT_REMARKS` when the array is empty.
- **State + save already wired:** `invoiceData.remarks` is initialised with `DEFAULT_REMARKS` (`pages/InvoiceGenerator.tsx` line ~199), loaded from saved documents (line ~752), and sent by `handleSaveInvoice` (`createInvoice({...invoiceData})`, line ~644).
- **Missing piece:** `handleRemarkChange`, `handleAddRemark`, `handleRemoveRemark` exist at `pages/InvoiceGenerator.tsx` lines 619–633 but are **never used in JSX**.

## Files to Create / Modify
- `OB-frontend/pages/InvoiceGenerator.tsx` — add a "Remarks" card to the left form; small tweaks to the add/remove handlers and save payload.

## Implementation Steps
1. **Add a "Remarks" card** in the left form column, directly **after the "Document & Validity Settings" card** (ends at line ~1539) and **before** the `{/* DYNAMIC CATEGORY SECTIONS LINE ITEMS EDITOR */}` block. Remarks print next to the totals, so they sit with the terms/discount settings. Follow the existing card markup of that file exactly:
   ```tsx
   {/* Remarks */}
   <Card>
     <CardHeader className="border-b border-slate-100 pb-3">
       <CardTitle className="text-sm">Remarks</CardTitle>
     </CardHeader>
     <CardContent className="pt-4 space-y-2">
       {(invoiceData.remarks || []).map((rem, idx) => (
         <div key={idx} className="flex items-center gap-2">
           <span className="text-xs font-bold text-slate-400 w-4 shrink-0">*</span>
           <Input
             value={rem}
             placeholder="e.g. 5 Years warranty for water proofing services."
             onChange={(e) => handleRemarkChange(idx, e.target.value)}
           />
           {/* remove button, same style as the item-row remove (Trash2) buttons used in the section editor */}
         </div>
       ))}
       <Button type="button" variant="subtle" size="sm" onClick={handleAddRemark}
         leftIcon={<Plus className="w-3.5 h-3.5" />}>
         + Add Remark
       </Button>
     </CardContent>
   </Card>
   ```
   - Reuse the remove-button markup/classes of the existing `handleRemoveItemFromSection` button (line ~1733) with the `Trash2` icon — do not invent a new style.
   - `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Input`, `Button`, `Plus`, `Trash2` are already imported in this file.
2. **`handleAddRemark`** (line ~625): append `""` instead of `"New warranty / note"`, so the new row shows the placeholder instead of text the user must delete.
3. **`handleRemoveRemark`** (line ~630): if only 1 remark is left, `toast.error("At least 1 remark is required")` and return — same pattern as `handleRemoveItemFromSection` ("Section must have at least 1 item"). Reason: an empty `remarks` array makes both documents fall back to `DEFAULT_REMARKS`, so "remove all" would silently bring the 6 defaults back.
4. **Save payload** (`handleSaveInvoice`, line ~644): send trimmed, non-empty remarks only:
   `remarks: (invoiceData.remarks || []).map((r) => r.trim()).filter(Boolean)`.
   Empty rows never print as a blank `*` line. (If every row is empty, the array is empty and the documents show `DEFAULT_REMARKS`, as today.)
5. Live preview needs no change — it already renders `invoiceData.remarks`, so edits appear instantly in the Quotation / Invoice / Receipt preview tabs, Print, PNG, and PDF.
6. Text in this page is hard-coded English (the page does not use `useLanguage()`); keep that convention for the new labels.

## Data Model Changes
- None.

## API Changes
- None. `remarks: string[]` is already accepted by `POST /api/v1/invoices` and `PATCH/PUT` update.

## Edge Cases & Considerations
- **Reset / Create New Document:** state reset already re-seeds `DEFAULT_REMARKS` (line ~199) — unchanged.
- **Loading a saved document:** remarks load from the record (line ~752); saved records with an empty array still show defaults — unchanged behavior.
- **Blank rows in the live preview** before save will render a blank `*` line in the preview only; they are stripped on save (step 4). Acceptable; do not add filtering to `InvoiceDocument.tsx`/`ReceiptDocument.tsx` in this task.
- Long remarks wrap in the A4 document as they do today; no max length enforced (backend has none).
- `key={idx}` is acceptable here (same as the documents' existing remark list); focus stays correct because rows are only appended or removed with an explicit click.
- **Out of scope:** changing `DEFAULT_REMARKS` text, per-document-type default remarks, saving remark templates to the backend.

## Test Plan
- `npm run build` in `OB-frontend` passes; `npx tsc --noEmit -p OB-frontend` shows no new errors in `InvoiceGenerator.tsx`.
- Manual on Invoice → Create New Document:
  1. The Remarks card shows the 6 default remarks as editable rows.
  2. Edit a remark → Quotation preview updates live; switch to Invoice and Receipt previews → same remarks.
  3. "+ Add Remark" adds an empty row with a placeholder; type text → appears in preview.
  4. Remove rows down to 1 → removing the last one shows the error toast.
  5. Leave one row blank and Save → reopen the saved document from Document List → blank row is gone, other remarks kept.
  6. Print Quotation, Download PNG, Download PDF → custom remarks appear.
  7. Reset → defaults return.
