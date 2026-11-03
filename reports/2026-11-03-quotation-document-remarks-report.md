# Report: Show Remarks on the Quotation Document

**Date:** 2026-11-03
**Plan:** `OB-frontend/plans/2026-11-03-quotation-document-remarks-plan.md`
**Prompt:** `OB-frontend/prompts/2026-11-03-quotation-document-remarks-prompt.md`
**Status:** Implemented

## Summary
Rendered the remarks list on the Quotation document (`QuotationDocument.tsx`) using the same fallback logic and visual styling as `InvoiceDocument.tsx`. Remarks now appear directly below the "Prepared By & Total Amount" summary section and above the bottom navy contact banner on quotation previews, printouts, PNG, and PDF exports.

## Files Changed
- `OB-frontend/components/Invoice/QuotationDocument.tsx` — Imported `DEFAULT_REMARKS`, derived `remarks` with fallback to `DEFAULT_REMARKS`, added the `{/* 5. REMARKS */}` section directly below the Prepared By / Total Amount block, and renumbered the contact banner comment to `{/* 6. ... */}`.

## Deviations from Plan
- None.

## Verification
- `npm --prefix OB-frontend run build` — Passed successfully (`vite build` finished in 24.87s with code 0).
- `node OB-frontend/node_modules/typescript/bin/tsc --noEmit -p OB-frontend/tsconfig.json` — Verified that `QuotationDocument.tsx` has 0 TypeScript errors. (Pre-existing errors in `LeadModal.tsx`, `AddToolToProjectModal.tsx`, `ScrollToTop.tsx`, `StorefrontDetail.tsx`, and `ToolInventory.tsx` remain unchanged).
- Manual verification: Interactive browser testing could not be executed directly in this runtime environment.

## Known Issues / Not Done
- None.

## Follow-ups
- None.
