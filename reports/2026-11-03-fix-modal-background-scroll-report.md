# Report: Fix Background Page Scrolling While a Modal Is Open

**Date:** 2026-11-03
**Plan:** `OB-frontend/plans/2026-11-03-fix-modal-background-scroll-plan.md`
**Prompt:** `Fix Background Page Scrolling While a Modal Is Open`
**Status:** Implemented

## Summary
Implemented a unified, reference-counted `useBodyScrollLock` hook with scrollbar width compensation to eliminate background scrolling behind modal dialogs and prevent desktop horizontal layout shift. Removed all scattered manual `document.body.style.overflow` assignments across components and pages, wiring the hook unconditionally into every modal dialog. Also added `overscroll-contain` to modal backdrop overlays and inner scrollable containers to stop scroll chaining on mobile and trackpads.

## Files Changed
- `OB-frontend/hooks/useBodyScrollLock.ts` — Created shared reference-counted hook tracking `lockCount` and compensating for scrollbar width.
- `OB-frontend/components/Modal.tsx` — Replaced manual `document.body.style.overflow` with `useBodyScrollLock(isOpen)` and added `overscroll-contain` to content panel.
- `OB-frontend/components/ui/modal.tsx` — Replaced manual `document.body.style.overflow` with `useBodyScrollLock(isOpen)` and added `overscroll-contain` to content panel.
- `OB-frontend/components/Common/ConfirmModal.tsx` — Replaced manual `document.body.style.overflow` with `useBodyScrollLock(isOpen)` and added `overscroll-contain` to backdrop.
- `OB-frontend/components/Invoice/InvoiceModal.tsx` — Replaced manual `document.body.style.overflow` effect with `useBodyScrollLock(isOpen)` and added `overscroll-contain` to document container.
- `OB-frontend/components/Orders/CreditPersonModal.tsx` — Replaced manual `document.body.style.overflow` effect with `useBodyScrollLock(isOpen)` and added `overscroll-contain`.
- `OB-frontend/components/Orders/OrderDetailModal.tsx` — Replaced manual `document.body.style.overflow` effect with `useBodyScrollLock(isOpen)` and added `overscroll-contain`.
- `OB-frontend/pages/ProjectAttendance.tsx` — Replaced manual `document.body.style.overflow` effect with `useBodyScrollLock(isModalOpen || !!recordToDelete)` and added `overscroll-contain`.
- `OB-frontend/components/Client/ClientModal.tsx` — Added `useBodyScrollLock(isOpen)` and `overscroll-contain`.
- `OB-frontend/components/Inventory/ImportResultModal.tsx` — Added `useBodyScrollLock(isOpen)` and `overscroll-contain`.
- `OB-frontend/components/Inventory/ProductDetailModal.tsx` — Added `useBodyScrollLock(isOpen)` and `overscroll-contain`.
- `OB-frontend/components/Inventory/ProductModal.tsx` — Added `useBodyScrollLock(isOpen)` and `overscroll-contain`. Intentionally skipped dropdown click-outside catcher at line 424.
- `OB-frontend/components/Lead/LeadModal.tsx` — Added `useBodyScrollLock(isOpen)` and `overscroll-contain`.
- `OB-frontend/components/Orders/AddItemsToOrderModal.tsx` — Added `useBodyScrollLock(isOpen)` and `overscroll-contain` to backdrop and panels.
- `OB-frontend/components/Orders/RemoveItemsFromOrderModal.tsx` — Added `useBodyScrollLock(isOpen)` and `overscroll-contain` to backdrop and panels.
- `OB-frontend/components/Project/ProjectModal.tsx` — Added `useBodyScrollLock(isOpen)` and `overscroll-contain` to all modal backdrops/panels.
- `OB-frontend/components/ProjectAnalytics/AddToolToProjectModal.tsx` — Added `useBodyScrollLock(true)` (conditionally rendered by parent) and `overscroll-contain`.
- `OB-frontend/components/ProjectAnalytics/ProjectToolsTab.tsx` — Added `useBodyScrollLock(showCheckoutModal || showReturnModal || showAddModal)` and `overscroll-contain`.
- `OB-frontend/components/Purchasing/AddPaymentModal.tsx` — Added `useBodyScrollLock(isOpen)` and `overscroll-contain`.
- `OB-frontend/components/Reports/DateRangePicker.tsx` — Added `useBodyScrollLock(isOpen)` and `overscroll-contain` to backdrop and calendar container.
- `OB-frontend/components/Settings/ActivityLogsTab.tsx` — Added `useBodyScrollLock(!!selectedLog)` and `overscroll-contain`.
- `OB-frontend/components/Worker/WorkerModal.tsx` — Added `useBodyScrollLock(isOpen)` and `overscroll-contain`.
- `OB-frontend/pages/AccountManagement.tsx` — Added `useBodyScrollLock` for edit, delete, hard-delete, and create modals; added `overscroll-contain`.
- `OB-frontend/pages/ActivityLogs.tsx` — Added `useBodyScrollLock(!!selectedLog)` and `overscroll-contain`.
- `OB-frontend/pages/CreditDetail.tsx` — Added `useBodyScrollLock(showAddPaymentModal || showAddCreditModal)` and `overscroll-contain`.
- `OB-frontend/pages/CreditOrders.tsx` — Added `useBodyScrollLock(showPaidAmountModal || showDeleteConfirmModal)` and `overscroll-contain`.
- `OB-frontend/pages/DailyReports.tsx` — Added `useBodyScrollLock(!!selectedReport)` and `overscroll-contain`.
- `OB-frontend/pages/Inventory.tsx` — Added `useBodyScrollLock` for transfer modals and `overscroll-contain` to backdrops and scroll containers.
- `OB-frontend/pages/InvoiceGenerator.tsx` — Added `useBodyScrollLock(isInventoryPickerOpen)` and `overscroll-contain`.
- `OB-frontend/pages/LuckyDraw.tsx` — Added `useBodyScrollLock(isRedeemModalOpen || isModalOpen)` and `overscroll-contain`.
- `OB-frontend/pages/OrderEditPOS.tsx` — Added `useBodyScrollLock` for checkout, credit persona, and discount modals; added `overscroll-contain`.
- `OB-frontend/pages/POS.tsx` — Added `useBodyScrollLock` for checkout, mobile cart, discount calculator, add credit persona, success modal, and processing state; added `overscroll-contain`. Intentionally skipped dropdown click-outside catcher at line 819.
- `OB-frontend/pages/Storefront.tsx` — Added `useBodyScrollLock(isModalOpen)` and `overscroll-contain`.
- `OB-frontend/pages/StorefrontDetail.tsx` — Added `useBodyScrollLock(isAdjustmentModalOpen || isTransferModalOpen)` and `overscroll-contain`.
- `OB-frontend/pages/Suppliers.tsx` — Added `useBodyScrollLock(isModalOpen)` and `overscroll-contain`.
- `OB-frontend/pages/TicketDetail.tsx` — Added `useBodyScrollLock(showDeleteConfirm)` and `overscroll-contain`.
- `OB-frontend/pages/ToolInventory.tsx` — Added `useBodyScrollLock(showAddToolModal || showCheckinModal)` and `overscroll-contain`.
- `OB-frontend/pages/Warehouse.tsx` — Added `useBodyScrollLock(isModalOpen)` and `overscroll-contain`.
- `OB-frontend/pages/WarehouseDetail.tsx` — Added `useBodyScrollLock(isTransferModalOpen || isAdjustmentModalOpen)` and `overscroll-contain`.

## Deviations from Plan
- None. All files identified in the plan have been updated exactly as specified. Click-outside catchers (`ProductModal.tsx:424` and `POS.tsx:819`) and mobile sidebar backdrop (`Sidebar.tsx`) were intentionally preserved without scroll locking as mandated.

## Verification
- `Get-ChildItem -Path "OB-frontend\components", "OB-frontend\pages" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "body\.style\.overflow"` — Returned 0 results. All direct DOM overflow manipulations across components and pages have been completely eliminated.
- `Get-ChildItem -Path "OB-frontend\hooks" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "body\.style\.overflow"` — Confirmed that only `OB-frontend/hooks/useBodyScrollLock.ts` manages body scroll.
- `npm --prefix OB-frontend run build` (`vite build`) — Passed successfully in 15.06s with 0 TypeScript errors.

## Known Issues / Not Done
- None.

## Follow-ups
- Optional: On iOS Safari touch devices, if body scroll chaining still exhibits edge cases under rapid touch momentum, consider adopting a `position: fixed; top: -scrollY` enhancement inside `useBodyScrollLock.ts` in a future iteration.
