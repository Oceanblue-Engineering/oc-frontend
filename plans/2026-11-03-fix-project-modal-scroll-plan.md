# Plan: Make the Project Create/Edit Modal Scrollable

**Date:** 2026-11-03
**Status:** Implemented
**App(s):** dashboard

## Objective
In Client Projects → Edit/Create Project, the modal is taller than the viewport when the description is long or many workers are assigned. The top and the footer (Delete / Cancel / Save) are cut off and the modal body cannot be scrolled. The modal must fit the viewport, keep its header and footer visible, and scroll its form body.

## Root Cause
`OB-frontend/components/Project/ProjectModal.tsx`:
- Line 174 — panel: `bg-white rounded-3xl w-full max-w-lg ... overflow-hidden` — **no max height** and `overflow-hidden`, so content taller than the screen is clipped.
- Line 195 — form body: `p-6 space-y-4` — **no `overflow-y-auto`**, so nothing inside the modal can scroll.
- The backdrop is `fixed` and centered (`items-center`), so the overflow is clipped equally at the top and bottom, which matches the screenshot (header partly off-screen, footer buttons cut off).

This is not caused by the body scroll lock from `2026-11-03-fix-modal-background-scroll-plan.md`: a `fixed` overlay never moved with page scroll. The lock only removed the page movement that used to happen behind it.

The sibling `OB-frontend/components/Worker/WorkerModal.tsx` (same design) already handles this with `max-h-[75vh] overflow-y-auto` on its body (line 330). The shared `OB-frontend/components/ui/modal.tsx` uses the more robust flex-column pattern (panel `max-h-[90vh] flex flex-col`, body `flex-1 overflow-y-auto`, header/footer `shrink-0`).

## Files to Create / Modify
- `OB-frontend/components/Project/ProjectModal.tsx` — class changes only, on 4 elements of the main modal.

## Implementation Steps
1. Panel (line ~174): add `flex flex-col max-h-[90vh]`. Keep `overflow-hidden` (needed for the rounded corners).
2. Header (line ~176, `p-6 border-b ...`): add `shrink-0`.
3. Form body (line ~195, `p-6 space-y-4`): add `flex-1 min-h-0 overflow-y-auto overscroll-contain`.
4. Footer (line ~318, `p-6 border-t ...`): add `shrink-0`.
5. Do not change the nested "Delete Project?" confirm (line ~352) or the "Assign Workers" picker (line ~378) — the picker already uses `max-h-[80vh]` + a scrolling list; the confirm is small.
6. No logic, text, color, or spacing changes.

## Data Model Changes
- None.

## API Changes
- None.

## Edge Cases & Considerations
- Short content: modal keeps its natural height (`max-h` only caps it).
- Small screens / mobile keyboard open: body scrolls, header and Save button stay visible.
- `min-h-0` is required so the flex child can shrink below its content height and actually scroll.
- Native date pickers and the status `<select>` render outside the scroll box, so they are not clipped.
- **Out of scope (possible follow-up):** other form modals have the same "no max height" pattern and may clip on short screens — `pages/AccountManagement.tsx` (create/edit), `pages/LuckyDraw.tsx` (2), `pages/CreditDetail.tsx` (2), `pages/StorefrontDetail.tsx` (adjustment), `pages/WarehouseDetail.tsx` (adjustment), `pages/ToolInventory.tsx` (2), `components/ProjectAnalytics/ProjectToolsTab.tsx` (2), `components/Purchasing/AddPaymentModal.tsx`, `pages/OrderEditPOS.tsx` (credit persona), `pages/POS.tsx` (discount calculator). Not changed here unless the user asks.

## Test Plan
- `npm run build` in `OB-frontend` passes; `npx tsc --noEmit` shows no new errors in `ProjectModal.tsx`.
- Manual, Client Projects → open a project with a long description and 10+ workers:
  1. Window height ~700px: modal header and footer are both visible; the form body scrolls with mouse wheel / trackpad / touch.
  2. Delete, Cancel, Save buttons are reachable and work.
  3. Page behind does not scroll (lock still works).
  4. Create Project (empty form): modal looks the same as before.
  5. "Manage Workers" picker and "Delete Project?" confirm still open on top and work.
