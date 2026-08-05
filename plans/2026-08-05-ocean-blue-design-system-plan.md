# Plan: Ocean Blue Engineering — Brand Design System & Tailwind Palette Migration (Site-wide)

**Date:** 2026-08-05
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)
**Scope:** **Site-wide** — Tailwind config + files 39 ခုလုံးရှိ indigo `#2216a8` → ocean palette

---

## Objective

"Ocean Blue Engineering" အမှတ်တံဆိပ်၏ brand identity နှင့် ကိုက်ညီရန် design system နှင့် Tailwind palette ကို update ပြုလုပ်သည်။ လက်ရှိ indigo (`#2216a8`) အရောင်စနစ်ကို deep navy / ocean blue / teal-cyan palette ဖြင့် site-wide အစားထိုးမည်။

## Brand Palette Mapping

| Brand role | Hex | Tailwind token | Applies to |
|------------|-----|----------------|------------|
| **Primary (Deep Navy)** | `#0F2A4A` | `ocean-800` | Headers, primary typography, dark borders |
| **Secondary (Ocean Blue)** | `#0077B6` | `ocean-600` | Primary action buttons, active nav states |
| **Accent (Teal/Cyan)** | `#2DD4BF` / `#00B4D8` | `ocean-500` (+`teal`) | Highlights, badges, icons, hover gradients |
| **Background** | `#F8FAFC` | `ocean-50/30` or `slate-50` | Main page background |
| **Card / Surface** | `#FFFFFF` | `bg-white` | Menu cards, modals |
| **Text Muted** | `#64748B` | `slate-500` | Subtitles, secondary text |

### Old → New mapping (site-wide replace)
| Old (indigo) | New (ocean) |
|--------------|-------------|
| `#2216a8` (DEFAULT/500) | `ocean-600` (`#0077B6`) — buttons, active, text highlights |
| `#1d128e` (primary-600) | `ocean-700` (`#0369a1`) — hover darker |
| `#170e74` / `#1e1b4b` | `ocean-800` / `ocean-900` — deep navy |
| `bg-indigo-50` | `bg-ocean-50` |
| `border-indigo-200` | `border-ocean-200` |
| `shadow-indigo-600/*` | `shadow-ocean-600/*` |
| `ring-indigo-*` | `ring-ocean-*` |
| `hover:text-[#2216a8]` | `hover:text-ocean-600` |
| `hover:bg-[#2216a8]/90` | `hover:bg-ocean-700` |

---

## Files to Create / Modify

### Create
- `tailwind.config.js` (အသစ်) — repo တွင် မရှိပါ။ `index.html` ၏ inline config ကို **separate file** သို့ ရွှေ့ပြီး `ocean` palette ထည့်မည်။ (Optional: CDN config ကို ဆက်ထားလိုလျှင် inline ထဲ ထည့်မည် — အောက်တွင် ရွေးချယ်မှု ရှိသည်။)

> **အရေးကြီးသော note:** `OB-frontend` တွင် `tailwind.config.js` **မရှိပါ** — Tailwind ကို `index.html` အတွင်း CDN `<script>` + inline `tailwind.config = {...}` ဖြင့် အသုံးပြုသည်။ ထို့ကြောင့် palette ကို `index.html` ၏ inline config ၌သာ ထည့်နိုင်သည် (separate file ဖန်တီးရန် PostCSS build pipeline မရှိ၍ CDN config ကို ဆက်ထားရန် လိုသည်)။

### Modify (site-wide palette)
- `index.html` — inline `tailwind.config.theme.extend.colors` တွင် `ocean` scale ထည့်ခြင်း + `primary`/`btn`/`status` tokens ကို ocean hex ဖြင့် အပ်ဒိတ်ခြင်း။
- `App.tsx` — background `bg-[#f5f5f3]` → `bg-ocean-50/30` (သို့ `bg-slate-50`); Toaster classNames ရှိ `#2216a8` → `ocean-600`။
- `pages/Home.tsx` — header icon/logo `#2216a8` → `bg-ocean-600`; title → `text-ocean-800`; subtitle → `text-ocean-600`; card hover → `hover:border-ocean-300` + `shadow-ocean-500/10`; icon `text-ocean-600 hover:text-ocean-500`။
- `components/TopBar.tsx` — logo chip → `bg-ocean-600`; "Home" button → gradient/`border-ocean-200 text-ocean-600`; settings hover → `text-ocean-600`; avatar → `bg-ocean-600`။
- `config/navigation.ts` — `color` field ရှိ `text-[#2216a8]` → `text-ocean-600`; per-item accent colors ကို ocean/teal spectrum ဖြင့် ပြန်စီစဉ်ခြင်း။
- `.agent/rules/design-system.md` — brand palette documentation ကို ocean အရောင်များဖြင့် update ခြင်း။
- Files 35 ခု (POS, Inventory, Orders, Settings, Reports components, Sidebar, AIChat, etc.) — `#2216a8`, `#1d128e`, `bg-indigo-*`, `text-indigo-*`, `border-indigo-*`, `shadow-indigo-*` များကို ocean equivalent ဖြင့် site-wide replace ခြင်း။

---

## Implementation Steps

1. **Add `ocean` palette to `index.html` inline Tailwind config**:
   ```js
   colors: {
     ocean: {
       50: '#f0f9ff',
       100: '#e0f2fe',
       200: '#bae6fd',
       300: '#7dd3fc',
       400: '#38bdf8',
       500: '#00b4d8', // Accent cyan
       600: '#0077b6', // Secondary ocean blue
       700: '#0369a1',
       800: '#0f2a4a', // Primary deep navy
       900: '#0c1e36',
       DEFAULT: '#0077b6',
     },
     // ... existing primary/dark/btn/status tokens updated to ocean hex
   }
   ```
   - `primary` → `ocean` (DEFAULT `#0077b6`)
   - `btn.primary` → `#0077b6`, `primary-hover` → `#0369a1`
   - `status.info` → `#0077b6`
   - `boxShadow.glow` → ocean rgba

2. **Global background & Toaster (App.tsx)**: `bg-[#f5f5f3]` → `bg-ocean-50/30`; Toaster success/info classes `#2216a8` → `#0077b6`။

3. **Home.tsx**: brand header + menu cards → ocean colors, gradients on hover, `hover:border-ocean-300`။

4. **TopBar.tsx**: branding chip, Home button (blue→teal gradient), settings hover, avatar → ocean။

5. **navigation.ts**: icon color classes → ocean/teal spectrum (e.g. `bg-ocean-50 text-ocean-600`, `bg-teal-50 text-teal-600`…)။

6. **Site-wide replace (35 files)**: `#2216a8`→`#0077b6`, `#1d128e`→`#0369a1`, `bg-indigo-*`→`bg-ocean-*`, `text-indigo-*`→`text-ocean-*`, `border-indigo-*`→`border-ocean-*`, `shadow-indigo-*`→`shadow-ocean-*`, `ring-indigo-*`→`ring-ocean-*` — **build ပြီးတိုင်း verify**။

7. **Update `.agent/rules/design-system.md`**: palette docs → ocean brand tokens။

---

## Data / API Changes

- မရှိပါ။ Frontend styling/theme refactor သာဖြစ်ပြီး backend/data မပြောင်းပါ။

---

## Edge Cases & Considerations

- **Tailwind CDN vs build:** `index.html` CDN Tailwind ဖြင့် ပြောင်းလဲမှုများကို **runtime** တွင် dynamic generate လုပ်သည်။ `ocean` palette ထည့်ပြီးနောက် `bg-ocean-*` class များ ချက်ချင်း အလုပ်လုပ်မည်။ Separate `tailwind.config.js` မလိုပါ။
- **Contrast (WCAG AA):** `ocean-600` (`#0077b6`) နှင့် `ocean-800` (`#0F2A4A`) သည် white text အတွက် AA ကိုက်ညီသည်။ Muted text `slate-500` (`#64748B`) ကို ဆက်သုံးမည်။
- **Custom colors ကို ထိန်းသိမ်း:** navigation.ts တွင် per-item accent (emerald/amber/rose စသည်) များသည် semantic status အရောင် များဖြစ်သည် — ၎င်းတို့ကို မဖျက်ဘဲ အပြာရောင်အုပ်စုကိုသာ ocean/teal သို့ ပြောင်းမည် (feature differentiation ထိန်းသိမ်းရန်)။
- **Build verify:** Site-wide replace ပြီးနောက် `npm run build` ကို run ပြီး broken class/Tailwind purge issue မရှိကြောင်း စစ်ဆေးမည်။
- **Print pages:** `/mobile-print`, `/print-receipt` — receipt styling ကို မထိခိုက်စေရန် သတိထားမည် (ThermalReceipt ကို brand palette မှ ဖယ်ထား)။

---

## Test Plan

- `npm run build` — အောင်မြင်ရန်။
- Manual (visual):
  - Home hub: deep-navy title, ocean-blue icons, teal-cyan hover glow, white cards, `ocean-50` background။
  - TopBar: ocean logo chip, gradient Home button, ocean avatar။
  - POS / Inventory / Orders / Settings / Reports: primary buttons `ocean-600`/`ocean-700`, active states `ocean-800`, borders `ocean-200`။
  - Contrast: white text on `ocean-600`/`ocean-800` ရှင်းရှင်းဖတ်ရသည်။
  - Receipt print pages မပြောင်း။

---

## Notes / Deviations

- Request တွင် `tailwind.config.js` ဖော်ပြသော်လည်း repo သည် CDN + inline config ကို သုံး၍ `index.html` အတွင်းတွင် palette ထည့်မည်။
- Request ၏ accent `#2DD4BF` (teal) ကို `ocean-500` cyan `#00B4D8` နှင့် hover gradient များတွင် ပေါင်းစပ်သုံးမည်။
- Site-wide (files 39) — user ရွေးချယ်ချက်အရ။
