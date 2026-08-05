# Design System & UI Tokens

This ruleset outlines styling tokens and reusable UI specifications to keep layouts consistent, modern, and aligned with the **Ocean Blue Engineering** brand.

## 1. Color Palette Definitions
Use Tailwind classes corresponding to the brand palette. Avoid random inline hexadecimal values. The `ocean` scale is defined in `index.html` (inline Tailwind config):

| Brand role | Hex | Tailwind token |
|------------|-----|----------------|
| **Primary (Deep Navy)** | `#0F2A4A` | `ocean-800` — headers, primary typography, dark borders |
| **Secondary (Ocean Blue)** | `#0077B6` | `ocean-600` — primary action buttons, active nav |
| **Accent (Teal/Cyan Wave)** | `#00B4D8` / `#2DD4BF` | `ocean-500` / `teal` — highlights, badges, icons, hover gradients |
| **Background (Ice/Sky)** | `#F8FAFC` | `ocean-50/30` or `bg-slate-50` |
| **Card / Surface** | `#FFFFFF` | `bg-white` |
| **Text Muted** | `#64748B` | `slate-500` |

- **Primary filled:** `bg-ocean-600 hover:bg-ocean-700` (or gradient `bg-gradient-to-r from-ocean-600 to-ocean-500 hover:from-ocean-700 hover:to-ocean-600`)
- **Text highlights / active:** `text-ocean-600 hover:text-ocean-500`
- **Borders:** `border-ocean-200`, hover `border-ocean-300`
- **Secondary Accents:**
  - Teal / Success: `text-teal-700 bg-teal-50 border-teal-100`
  - Red / Danger: `text-red-600 bg-red-50 border-red-150`
  - Amber / Warning: `text-amber-600 bg-amber-50 border-amber-100`
- **Neutral Grays:**
  - Backgrounds: `bg-slate-50`, `bg-slate-100`
  - Typography: `text-slate-800` (main text), `text-slate-500` (subtitles/labels), `text-slate-400` (disabled/hints)
  - Borders: `border-slate-100`, `border-slate-200`

## 2. Typography & Spacing
- **Fonts**: Use Outfit/Inter weights. 
  - Main Page Headers: `text-2xl font-bold text-slate-800`
  - Subheaders/Cards: `text-base font-semibold text-slate-800`
  - Labels: `text-sm font-semibold text-slate-500`
- **Spacing**: Use uniform increments:
  - Inside card wrappers: `p-4 sm:p-6`
  - Form layout spacing: `space-y-4`, `space-y-6`
  - Gap utilities: `gap-3`, `gap-4`

## 3. Reusable UI Specifications
- **Action Buttons (Pill Style)**:
  - **Primary Filled**: `px-4 py-2 text-sm font-semibold rounded-full bg-ocean-600 text-white hover:bg-ocean-700 transition-all shadow-md shadow-ocean-600/10 flex items-center gap-1.5 cursor-pointer` (or gradient blue→teal)
  - **Secondary Bordered**: `px-4 py-2 text-sm font-semibold rounded-full border border-ocean-200 text-ocean-600 bg-white hover:bg-ocean-50/50 transition-all flex items-center gap-1.5 cursor-pointer`
  - **Danger Action**: `px-4 py-2 text-sm font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-all shadow-md shadow-red-600/10 flex items-center gap-1.5 cursor-pointer`
- **Card Patterns**:
  - Menu hub cards: `bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg hover:border-ocean-300 hover:-translate-y-1 transition-all`
  - Settings panels and cards: `bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm`
- **Inputs & Form Controls**:
  - Inputs, date pickers, select menus: `w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-ocean-600 focus:border-transparent outline-none transition-all`

## 4. Anti-Inline Styles Mandate
- Do **NOT** write arbitrary inline styles (`style={{ color: '#0077b6' }}`). Always prioritize Tailwind utility classes or custom CSS variables defined in global styles.
- Prefer the `ocean` scale over raw hex. If a hex not in the scale is needed, add it to the palette in `index.html` first.
