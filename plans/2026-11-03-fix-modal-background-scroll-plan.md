# Plan: Fix Background Page Scrolling While a Modal Is Open

**Date:** 2026-11-03
**Status:** Implemented
**App(s):** dashboard

## Objective
When a modal is open, scrolling (mouse wheel, trackpad, touch) inside or over the modal must not scroll the page behind it. The lock must survive nested modals (e.g. a `ConfirmModal` opened on top of another modal) and be released only when the last modal closes.

## Root Cause (findings)
1. **Most modals never lock the body.** Only 7 components lock scroll (`components/Modal.tsx`, `components/ui/modal.tsx`, `components/Common/ConfirmModal.tsx`, `components/Invoice/InvoiceModal.tsx`, `components/Orders/CreditPersonModal.tsx`, `components/Orders/OrderDetailModal.tsx`, `pages/ProjectAttendance.tsx`). About 30 other overlays are hand-written `fixed inset-0` divs with no lock, so wheel/touch events scroll the `<body>` behind them.
2. **The existing locks are not reference-counted.** Each one sets `document.body.style.overflow = "hidden"` on open and `"unset"` on close. When a nested modal closes (e.g. `ConfirmModal` inside a `Modal`), it resets `overflow` to `unset` while the parent modal is still open, so the background becomes scrollable again.
3. **Scroll chaining.** Modal scroll areas (`overflow-y-auto`) have no `overscroll-behavior: contain`, so once the inner list reaches its top/bottom, the scroll is passed to the page (trackpads and mobile browsers, where `body { overflow: hidden }` alone does not stop touch scrolling on iOS Safari).
4. Locking with `overflow: hidden` removes the scrollbar and causes a horizontal layout shift on desktop.

## Files to Create / Modify
- `OB-frontend/hooks/useBodyScrollLock.ts` — **new**. Shared, reference-counted body scroll lock hook.
- `OB-frontend/components/Modal.tsx` — use the hook; add `overscroll-contain` to the scroll body.
- `OB-frontend/components/ui/modal.tsx` — use the hook; add `overscroll-contain` to the content body.
- `OB-frontend/components/Common/ConfirmModal.tsx` — use the hook.
- `OB-frontend/components/Invoice/InvoiceModal.tsx`, `OB-frontend/components/Orders/CreditPersonModal.tsx`, `OB-frontend/components/Orders/OrderDetailModal.tsx`, `OB-frontend/pages/ProjectAttendance.tsx` — replace the hand-written `body.style.overflow` effect with the hook.
- Inline overlays with no lock — add `useBodyScrollLock(<isOpenFlag>)` for each modal overlay, and `overscroll-contain` on the overlay and its scrollable panel:
  - `components/Client/ClientModal.tsx`, `components/Inventory/ImportResultModal.tsx`, `components/Inventory/ProductDetailModal.tsx`, `components/Inventory/ProductModal.tsx`, `components/Lead/LeadModal.tsx`, `components/Orders/AddItemsToOrderModal.tsx`, `components/Orders/RemoveItemsFromOrderModal.tsx`, `components/Project/ProjectModal.tsx`, `components/ProjectAnalytics/AddToolToProjectModal.tsx`, `components/ProjectAnalytics/ProjectToolsTab.tsx`, `components/Purchasing/AddPaymentModal.tsx`, `components/Reports/DateRangePicker.tsx`, `components/Settings/ActivityLogsTab.tsx`, `components/Worker/WorkerModal.tsx`
  - `pages/AccountManagement.tsx`, `pages/ActivityLogs.tsx`, `pages/CreditDetail.tsx`, `pages/CreditOrders.tsx`, `pages/DailyReports.tsx`, `pages/Inventory.tsx`, `pages/InvoiceGenerator.tsx`, `pages/LuckyDraw.tsx`, `pages/OrderEditPOS.tsx`, `pages/POS.tsx`, `pages/Storefront.tsx`, `pages/StorefrontDetail.tsx`, `pages/Suppliers.tsx`, `pages/TicketDetail.tsx`, `pages/ToolInventory.tsx`, `pages/Warehouse.tsx`, `pages/WarehouseDetail.tsx`

## Implementation Steps
1. **Create `OB-frontend/hooks/useBodyScrollLock.ts`:**
   ```ts
   import { useEffect } from "react";

   let lockCount = 0;
   let saved = { overflow: "", paddingRight: "" };

   export function useBodyScrollLock(locked: boolean) {
     useEffect(() => {
       if (!locked) return;
       const body = document.body;
       if (lockCount === 0) {
         saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
         const scrollbar = window.innerWidth - document.documentElement.clientWidth;
         body.style.overflow = "hidden";
         if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
       }
       lockCount++;
       return () => {
         lockCount--;
         if (lockCount === 0) {
           body.style.overflow = saved.overflow;
           body.style.paddingRight = saved.paddingRight;
         }
       };
     }, [locked]);
   }
   ```
   - Module-level counter = nested modals keep the lock until the last one closes.
   - Restores the previous inline values instead of forcing `"unset"`.
   - Scrollbar-width compensation prevents layout shift.
2. **Shared modals** (`components/Modal.tsx`, `components/ui/modal.tsx`, `components/Common/ConfirmModal.tsx`): delete the `document.body.style.overflow` lines, call `useBodyScrollLock(isOpen)` at the top of the component (before any early `return null`, to obey hook rules). Keep the Escape-key listener as is. Add `overscroll-contain` to the `flex-1 overflow-y-auto` body div.
3. **Components with their own lock** (`InvoiceModal`, `CreditPersonModal`, `OrderDetailModal`, `ProjectAttendance`): replace the `useEffect` that touches `body.style.overflow` with `useBodyScrollLock(<open flag>)`.
4. **Inline overlays without a lock:** for each `fixed inset-0` element that is a modal backdrop, find the boolean state that renders it (e.g. `showPaymentModal`, `isOpen`) and call `useBodyScrollLock(thatFlag)` near the other hooks of the component. A component with several modals calls the hook once per flag (or once with `a || b || c`). Add `overscroll-contain` to the backdrop and to the modal's own `overflow-y-auto` panel.
   - **Do not lock** non-modal `fixed inset-0` elements: click-outside catchers for dropdowns (`ProductModal.tsx:424`, `POS.tsx:819`) and the mobile sidebar backdrop in `components/Sidebar.tsx` — leave them unchanged.
   - Components that only render inside a parent modal which is already locked need no extra call (the counter makes extra calls harmless, though).
5. Do not change modal visuals, z-index, sizing, or behavior other than scrolling.

## Data Model Changes
- None.

## API Changes
- None.

## Edge Cases & Considerations
- **Nested modals:** `ConfirmModal` over `Modal` — closing the confirm must keep the page locked. Covered by the counter.
- **Unmount while open** (route change with a modal open): the effect cleanup decrements the counter, so the page unlocks.
- **React StrictMode** double-mount in dev: mount/cleanup/mount stays balanced (count ends at 1).
- **Modal content must still scroll** — only the body is locked; inner `overflow-y-auto` panels keep working.
- **iOS Safari:** `overflow: hidden` on body does not fully stop touch scrolling; `overscroll-contain` on the overlay + panel limits chaining. If the user still sees it on iPhone, a follow-up can switch the lock to the `position: fixed; top: -scrollY` technique.
- Do not use `100vh`-dependent hacks; leave `components/Modal.tsx`'s existing `h-screen -top-6` classes alone (out of scope).

## Test Plan
- `npm run build` in `OB-frontend` passes with no TypeScript errors.
- Manual (desktop + mobile width) on a long page, scroll down first, then:
  1. Open a shared `Modal` (e.g. Expenses add) → wheel over modal and over backdrop → page does not move.
  2. Open an inline modal (Inventory → Product modal, Purchasing → Add Payment, POS checkout) → page does not move.
  3. Open a modal, then a `ConfirmModal` on top (e.g. Suppliers delete) → cancel the confirm → page is still locked; close the modal → page scrolls again and stays at the same position.
  4. Scroll a long list inside a modal to its end → page does not start scrolling.
  5. No horizontal jump of the page when a modal opens/closes on desktop (scrollbar visible).
  6. Open the mobile sidebar → page behavior unchanged.
