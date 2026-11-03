# Antigravity Prompt: Fix Background Page Scrolling While a Modal Is Open

**Plan:** `OB-frontend/plans/2026-11-03-fix-modal-background-scroll-plan.md` (Status: Approved)
**Report to write:** `OB-frontend/reports/2026-11-03-fix-modal-background-scroll-report.md`
**App:** `OB-frontend` (workspace is the repo root; all paths are relative to it)

## Read first
- The plan above (source of truth)
- `OB-frontend/CLAUDE.md` (strict TypeScript, no `any`, hook order, `use*.ts` hook naming)
- Files you will touch: every file listed under "Files to Create / Modify" in the plan

## Task
When a modal is open, the page behind it still scrolls. Most inline modals never lock body scroll, and the few that do reset `document.body.style.overflow = "unset"` on close, which breaks nested modals (e.g. `ConfirmModal` inside `Modal`). Create one shared, reference-counted `useBodyScrollLock` hook, use it in every modal overlay, and add `overscroll-contain` to modal backdrops and scroll panels. Do not change modal visuals.

## Steps
1. Create `OB-frontend/hooks/useBodyScrollLock.ts` exactly as in plan step 1: a module-level `lockCount`; on the first lock save `body.style.overflow` / `body.style.paddingRight`, set `overflow: hidden` and pad by the scrollbar width (`window.innerWidth - document.documentElement.clientWidth`); on the last unlock restore the saved values. Export `useBodyScrollLock(locked: boolean)`.
2. In `OB-frontend/components/Modal.tsx`, `OB-frontend/components/ui/modal.tsx`, `OB-frontend/components/Common/ConfirmModal.tsx`: remove every `document.body.style.overflow` line, call `useBodyScrollLock(isOpen)` before the `if (!isOpen) return null`. Keep the Escape-key listener. Add `overscroll-contain` to the `flex-1 overflow-y-auto` content div (Modal.tsx and ui/modal.tsx).
3. In `OB-frontend/components/Invoice/InvoiceModal.tsx`, `OB-frontend/components/Orders/CreditPersonModal.tsx`, `OB-frontend/components/Orders/OrderDetailModal.tsx`, `OB-frontend/pages/ProjectAttendance.tsx`: replace the `useEffect` that sets `body.style.overflow` with `useBodyScrollLock(<the same open flag>)`.
4. For each inline-overlay file listed in plan step 4 (components and pages): find each `fixed inset-0` modal backdrop, identify the boolean that renders it, and call `useBodyScrollLock(flag)` with the component's other hooks (once per flag, or once with `a || b`). Add `overscroll-contain` to the backdrop and to the modal's own `overflow-y-auto` panel.
   - Skip non-modal `fixed inset-0` elements: dropdown click-outside catchers (`OB-frontend/components/Inventory/ProductModal.tsx` ~line 424, `OB-frontend/pages/POS.tsx` ~line 819) and the mobile backdrop in `OB-frontend/components/Sidebar.tsx`.
   - Hooks must be called unconditionally at the top level (never inside JSX, conditions, or after an early return).
5. Run `grep -rn "body.style.overflow" OB-frontend/components OB-frontend/pages` — the only remaining reference must be inside `OB-frontend/hooks/useBodyScrollLock.ts` (i.e. none in components/pages).

## Constraints
- Change only the files listed in the plan. If another file must change, explain why in the report.
- No API changes, no backend changes.
- Do not change modal layout, colors, z-index, sizes, or animations — only scroll behavior.
- Strict TypeScript, no `any`. Follow `OB-frontend/CLAUDE.md` hook order (contexts → router → `useState` → `useRef` → effects/custom hooks).
- No new dependencies.
- Do not commit or push unless the user asks.

## Verification
- `npm run build` in `OB-frontend` passes with no TypeScript errors.
- Manual (desktop and mobile width), on a long page scrolled down:
  1. Open a shared `Modal` → wheel over modal and backdrop → page does not move.
  2. Open inline modals (Inventory product modal, Purchasing add payment, POS checkout) → page does not move.
  3. Open a modal, then a `ConfirmModal` on top, cancel the confirm → page still locked; close the modal → page scrolls again at the same position.
  4. Scroll a long list inside a modal to its end → page does not start scrolling.
  5. No horizontal jump when a modal opens/closes on desktop.
  6. Mobile sidebar behaves as before.

## When done
1. Write the report at the path above using the report template in `plans/rules/planning-rules.md`. List every file changed and any `fixed inset-0` element you intentionally skipped.
2. Set the plan's Status to `Implemented` (or `Blocked`).
3. Tell the user in Myanmar what you did and where the report is.
