# Antigravity Prompt: Editable Remarks in the Quotation / Invoice / Receipt Generator

**Plan:** `OB-frontend/plans/2026-11-03-quotation-remarks-editor-plan.md` (Status: Approved)
**Report to write:** `OB-frontend/reports/2026-11-03-quotation-remarks-editor-report.md`
**App:** `OB-frontend` (workspace is the repo root; all paths are relative to it)

## Read first
- The plan above (source of truth)
- `OB-frontend/CLAUDE.md`
- File you will touch: `OB-frontend/pages/InvoiceGenerator.tsx`
- For reference only (do not modify): `OB-frontend/components/Invoice/InvoiceDocument.tsx`, `OB-frontend/components/Invoice/ReceiptDocument.tsx`

## Task
Every Quotation / Invoice / Receipt prints the same 6 hard-coded `DEFAULT_REMARKS` because the generator form has no remarks editor. The backend, the save call, the state, and the document templates already support `remarks: string[]`, and the handlers `handleRemarkChange` / `handleAddRemark` / `handleRemoveRemark` (lines ~619–633) exist but are unused. Add a "Remarks" card to the left form that uses these handlers, plus three small handler/save tweaks.

## Steps
1. In `OB-frontend/pages/InvoiceGenerator.tsx`, add a `{/* Remarks */}` `<Card>` in the left form column **right after** the "Document & Validity Settings" `</Card>` (line ~1539) and **before** `{/* DYNAMIC CATEGORY SECTIONS LINE ITEMS EDITOR */}`:
   - `CardHeader className="border-b border-slate-100 pb-3"` + `CardTitle className="text-sm"` with text `Remarks` (copy the "Document & Validity Settings" card header).
   - `CardContent className="pt-4 space-y-2"`: map `invoiceData.remarks || []` to rows: `*` marker, `<Input value={rem} placeholder="e.g. 5 Years warranty for water proofing services." onChange={(e) => handleRemarkChange(idx, e.target.value)} />`, and a remove button calling `handleRemoveRemark(idx)` that reuses the exact markup/classes and `Trash2` icon of the existing item-row remove button (the one calling `handleRemoveItemFromSection`, line ~1733).
   - Below the rows: `<Button type="button" variant="subtle" size="sm" onClick={handleAddRemark} leftIcon={<Plus className="w-3.5 h-3.5" />}>+ Add Remark</Button>` (same as the existing "+ Custom Item" button).
2. `handleAddRemark`: append `""` instead of `"New warranty / note"`.
3. `handleRemoveRemark`: if `(invoiceData.remarks || []).length <= 1`, call `toast.error("At least 1 remark is required")` and return.
4. `handleSaveInvoice` (`createInvoice({...})`, line ~644): add `remarks: (invoiceData.remarks || []).map((r) => r.trim()).filter(Boolean)` to the payload (after the spread, so it overrides).

## Constraints
- Change only `OB-frontend/pages/InvoiceGenerator.tsx`. If another file must change, explain why in the report.
- No backend / API / model changes. Do not change `DEFAULT_REMARKS`, `InvoiceDocument.tsx`, or `ReceiptDocument.tsx`.
- Reuse components and classes already used in this page (`Card*`, `Input`, `Button`, `Plus`, `Trash2` are already imported). No new styles, colors, or dependencies.
- Labels stay hard-coded English, matching the rest of this page.
- Strict TypeScript, no `any`. Do not commit or push unless the user asks.

## Verification
- `npm run build` in `OB-frontend` passes.
- `npx tsc --noEmit -p OB-frontend` shows no errors in `InvoiceGenerator.tsx` (`npm run build` does not type-check; pre-existing errors in other files may remain — report the real result).
- Manual on Invoice → Create New Document:
  1. Remarks card shows the 6 default remarks as editable rows.
  2. Editing a remark updates the Quotation, Invoice, and Receipt previews live.
  3. "+ Add Remark" adds an empty row with the placeholder.
  4. Removing down to 1 row, then removing again, shows the error toast.
  5. Leave one row blank, Save, reopen from Document List → blank row gone, others kept.
  6. Print Quotation / Download PNG / Download PDF include the custom remarks.
  7. Reset → defaults return.
  If you cannot run the manual checks, say so in the report instead of marking them done.

## When done
1. Write the report at the path above using the report template in `plans/rules/planning-rules.md`. Put `OB-frontend/prompts/2026-11-03-quotation-remarks-editor-prompt.md` in the `Prompt:` field.
2. Set the plan's Status to `Implemented` (or `Blocked`).
3. Tell the user in Myanmar what you did and where the report is.
