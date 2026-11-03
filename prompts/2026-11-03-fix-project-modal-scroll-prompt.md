# Antigravity Prompt: Make the Project Create/Edit Modal Scrollable

**Plan:** `OB-frontend/plans/2026-11-03-fix-project-modal-scroll-plan.md` (Status: Approved)
**Report to write:** `OB-frontend/reports/2026-11-03-fix-project-modal-scroll-report.md`
**App:** `OB-frontend` (workspace is the repo root; all paths are relative to it)

## Read first
- The plan above (source of truth)
- `OB-frontend/CLAUDE.md`
- File you will touch: `OB-frontend/components/Project/ProjectModal.tsx`
- Pattern to follow: `OB-frontend/components/ui/modal.tsx` (panel `max-h-[90vh] flex flex-col`, body `flex-1 overflow-y-auto`, header/footer `shrink-0`)

## Task
In Client Projects → Edit/Create Project, the modal is taller than the viewport when the description is long or many workers are assigned. The header and footer (Delete / Cancel / Save) are cut off and the form cannot be scrolled, because the panel has no max height and the body has no `overflow-y-auto`. Fix it with Tailwind class changes only, so the modal fits the viewport, keeps header and footer visible, and scrolls the form body.

## Steps
1. In `OB-frontend/components/Project/ProjectModal.tsx`, main modal panel (line ~174, `bg-white rounded-3xl w-full max-w-lg ... overflow-hidden`): add `flex flex-col max-h-[90vh]`. Keep `overflow-hidden`.
2. Header (line ~176, `p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50`): add `shrink-0`.
3. Form body (line ~195, `p-6 space-y-4`): add `flex-1 min-h-0 overflow-y-auto overscroll-contain`.
4. Footer (line ~318, `p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3`): add `shrink-0`.
5. Do not touch the nested "Delete Project?" confirm (line ~352) or the "Assign Workers" picker (line ~378).

## Constraints
- Change only `OB-frontend/components/Project/ProjectModal.tsx`. If another file must change, explain why in the report.
- Class changes only — no logic, text, color, spacing, or hook changes. Keep `useBodyScrollLock(isOpen)` as is.
- Do not change the other modals listed as "out of scope" in the plan.
- No new dependencies. Do not commit or push unless the user asks.

## Verification
- `npm run build` in `OB-frontend` passes.
- `npx tsc --noEmit -p OB-frontend` shows no errors in `ProjectModal.tsx` (note: `npm run build` is `vite build` only and does not type-check; other pre-existing tsc errors elsewhere may remain — do not claim "0 TypeScript errors" unless tsc says so).
- Manual, Client Projects → open a project with a long description and 10+ workers:
  1. Window height ~700px: header and footer both visible; form body scrolls with wheel / trackpad / touch.
  2. Delete, Cancel, Save buttons are reachable and work.
  3. Page behind does not scroll.
  4. Create Project (empty form) looks the same as before.
  5. "Manage Workers" picker and "Delete Project?" confirm still open on top and work.
  If you cannot do the manual checks, say so in the report instead of marking them done.

## When done
1. Write the report at the path above using the report template in `plans/rules/planning-rules.md`. Put the prompt file path (`OB-frontend/prompts/2026-11-03-fix-project-modal-scroll-prompt.md`) in the `Prompt:` field.
2. Set the plan's Status to `Implemented` (or `Blocked`).
3. Tell the user in Myanmar what you did and where the report is.
