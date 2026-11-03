# Report: Remove the 6 Default Remarks — Remarks Start Empty

**Date:** 2026-11-03
**Plan:** `OB-frontend/plans/2026-11-03-empty-default-remarks-plan.md`
**Prompt:** `OB-frontend/prompts/2026-11-03-empty-default-remarks-prompt.md`
**Status:** Implemented

## Summary
Completely removed the 6 hard-coded swimming-pool remarks (`DEFAULT_REMARKS`) across the codebase. Quotations, invoices, and receipts now start with an empty remarks list by default, and documents without remarks omit the "Remarks:" heading while preserving alignment and totals. Users can add remarks as needed or remove all remarks without restriction, and order invoices now only display the order note (if present) without unsolicited default remarks.

## Files Changed
- `OB-frontend/components/Invoice/InvoiceDocument.tsx` — Deleted `DEFAULT_REMARKS` constant, replaced fallback with trimmed remarks filter, and conditionally wrapped the Remarks heading and list inside the left summary column (`remarks.length > 0`).
- `OB-frontend/components/Invoice/QuotationDocument.tsx` — Removed `DEFAULT_REMARKS` from imports, replaced fallback with trimmed remarks filter, and conditionally wrapped the entire Remarks block (`remarks.length > 0`).
- `OB-frontend/components/Invoice/ReceiptDocument.tsx` — Removed `DEFAULT_REMARKS` from imports, replaced fallback with trimmed remarks filter, and conditionally wrapped the inner Remarks block (`remarks.length > 0`).
- `OB-frontend/pages/InvoiceGenerator.tsx` — Removed `DEFAULT_REMARKS` from imports, set initial remarks state to `[]`, removed fallback re-filling when loading saved documents, removed the `length <= 1` guard and toast from `handleRemoveRemark`, and added an empty-state hint in the Remarks card.
- `OB-frontend/components/Orders/OrderDetailModal.tsx` — Removed `DEFAULT_REMARKS` from imports, and updated remarks transformation to only include the order note if present, or an empty array.

## Deviations from Plan
- None.

## Verification
- `Get-ChildItem -Path "OB-frontend\pages", "OB-frontend\components", "OB-frontend\utils" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "DEFAULT_REMARKS"` — Returned 0 results. Confirmed `DEFAULT_REMARKS` is completely gone.
- `npm --prefix OB-frontend run build` — Passed successfully (`vite build` finished in 14.46s with code 0).
- `node OB-frontend/node_modules/typescript/bin/tsc --noEmit -p OB-frontend/tsconfig.json` — Verified that all 5 changed files have 0 TypeScript errors. (Pre-existing errors in `LeadModal.tsx`, `AddToolToProjectModal.tsx`, `ScrollToTop.tsx`, `StorefrontDetail.tsx`, and `ToolInventory.tsx` remain unchanged).
- Manual verification: Interactive browser testing could not be directly executed in this runtime environment.

## Known Issues / Not Done
- None.

## Follow-ups
- Previously saved documents in the database that already have the 6 default remarks stored will retain them until explicitly opened and updated by the user.
