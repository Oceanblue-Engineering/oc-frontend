# OB-frontend (OceanBlue CMS Dashboard) — Project Instructions

> **🗣️ ဘာသာစကား သတ်မှတ်ချက် (Language Requirement):**
> ဤ app တွင် Claude Code ၏ အကြောင်းပြန်ချက်များ၊ အခြေအနေ အသစ်ပြန်တင်မှုများနှင့် အကောင်အထည်ဖော်မှု အစီအစဉ်များကို **မြန်မာဘာသာဖြင့်** ရေးသားရမည်။ ကုဒ်နှင့် technical identifier များကိုမူ English အတိုင်း ထားရမည်။

**App role:** `dashboard` — the admin / POS single-page application for the OceanBlue monorepo.
**Physical directory:** `OB-frontend/`

---

## Tech Stack

- **Core Library:** React 19 (Vite-based SPA)
- **Language:** TypeScript (strict typing — no `any`)
- **Routing:** React Router 7 (`react-router-dom`)
- **Styling:** Tailwind CSS + custom CSS variables (anti-inline-styles)
- **State:** Context API (`AppContext`, `LanguageContext`) + custom hooks
- **HTTP:** axios (JWT Bearer from `localStorage.authToken`; 401 → auto-logout + redirect `/login`)
- **Icons:** Lucide React
- **Notifications:** Sonner (`toast`)
- **Charts / PDF / Dates:** Recharts, jsPDF + jspdf-autotable, date-fns

## Directory Structure

```
OB-frontend/
├── components/          # Reusable UI components
│   ├── Common/          # Shared modal, loaders, tables
│   ├── Settings/        # Shop settings cards, uploads
│   ├── Orders/          # Order components
│   ├── Print/           # Printing helpers & size selectors
│   ├── Reports/         # Report components
│   └── Purchasing/      # Purchasing components
├── context/             # Global contexts (AppContext, LanguageContext)
├── pages/               # Main route views (POS, Settings, DailyReports, ...)
├── services/            # API endpoints & network requests (axios)
├── translations/        # Translation mappings (en.ts, my.ts, index.ts)
├── utils/               # Formatting, calculations & utilities
├── rules/               # App-specific coding rules & patterns
├── plans/               # Implementation plan files (YYYY-MM-DD-*.md)
├── App.tsx              # Root component + routing
└── API_SERVICE.md       # Full endpoint reference (frontend ↔ backend contract)
```

## State Management

- **`LanguageProvider` / `LanguageContext`** wraps the app root; provides translation strings from `translations/` and the language switcher.
- **`AppProvider` / `AppContext`** holds global app state shared across pages.
- **Local state:** pages keep their own `useState`/`useReducer`; loading flags toggled inside `finally`.
- **No external state library** (no Redux/Zustand) — use Context API + hooks per the existing convention.
- **i18n:** text lives in `translations/en.ts` and `translations/my.ts`; never hardcode user-facing strings in components. Use `useLanguage()`.

## UI Patterns & Design System

- **Primary brand color:** Indigo/Blue `#2216a8` — use `bg-[#2216a8]`, `text-[#2216a8]`, `border-indigo-200` (Tailwind classes; **no inline `style={{}}`**).
- **Accents:** Emerald/success, Red/danger, Amber/warning (semantic Tailwind classes).
- **Action buttons (pill style):** primary filled, secondary bordered, danger — see `rules/design-system.md`.
- **Cards:** `bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm`.
- **Inputs:** `w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2216a8]`.
- **Typography:** page headers `text-2xl font-bold text-slate-800`; labels `text-sm font-semibold text-slate-500`.

## API / Error Handling Patterns

- **Never use `.then()`/`.catch()`** — always `async/await`.
- All service calls wrapped in `try/catch`; `setLoading(true/false)` placed in `finally`.
- User feedback via **Sonner**: `toast.success(msg)` / `toast.error(msg || "Default fallback")`.
- Irreversible actions (delete logo, remove inventory) must use a **confirm modal** (`ConfirmModal`).
- Log caught errors with a descriptive tag: `console.error("Context:", error)`; never log tokens/raw stack traces.
- Full endpoint reference: [`API_SERVICE.md`](API_SERVICE.md). Keep it in sync when endpoints change.

## NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | TypeScript + Vite production build |
| `npm run preview` | Preview the production build locally |

## Critical Rules

1. **Strict TypeScript:** never use `any`; use `unknown`, generics, or unions. Export explicit prop interfaces (`interface XProps { ... }`).
2. **Component naming:** `PascalCase.tsx`; folders `PascalCase` for component categories. Hooks `use*.ts` (camelCase); services/utils camelCase.
3. **Hook order** in components: contexts → router hooks → `useState` → `useRef` → `useCallback`/`useEffect`.
4. **Props:** `on*` for callbacks; internal methods `handle*`.
5. **Follow all rules in `rules/`** (code-style, design-system, error-handling) before starting any task. These override this file.
6. **Before writing code**, check `plans/`; if none, create one per the workflow below.

---

## Strict Workflow (MANDATORY)

1. **Language Requirement** — All responses, status updates, and implementation plans in this app MUST be written in **Myanmar (မြန်မာဘာသာ)**.
2. **Plan First Principle** — When asked to change/add/fix anything, **NEVER write or modify code directly**. First draft a detailed Implementation Plan in Myanmar.
3. **Auto-Save Plan Files** — Save every plan to `OB-frontend/plans/YYYY-MM-DD-short-description-plan.md` (e.g. `2026-08-05-fix-inventory-total-plan.md`) before implementing.
4. **Wait for Explicit Approval** — Show the plan in Myanmar. **DO NOT touch code or run file-modifying/executing commands** until the user explicitly says **"OK"** / **"Go ahead"** / gives permission. Only then implement, following the saved plan.
