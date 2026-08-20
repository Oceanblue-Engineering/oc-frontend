# Plan: Premium SaaS "Zinc" Refactor (Whole Dashboard)

**Date:** 2026-08-20
**Status:** Draft (approval စောင့်ဆိုင်းဆဲ)
**App:** Dashboard (`OB-frontend`)

---

## 1. Objective (ရည်ရွယ်ချက်)

Dashboard တစ်ခုလုံးကို generic "AI slop" အသွင်မှ ဖယ်ရှား၍ **premium SaaS** အသွင် (Vercel / Linear ပုံစံ) သို့ ပြောင်းရန်။ အဓိက အချက် ၄ ခု:

1. **Monochrome Zinc palette** — ရှိပြီးသား ocean cyan/navy အရောင်အားလုံးကို zinc (neutral gray) သို့ ပြောင်း၊ accent color မထား။
2. **Subtle borders** — hairline `zinc-200` border များ + soft shadow။
3. **Satoshi font** — English UI အတွက် (Myanmar `lang-my` ကို Z06-Walone ဆက်ထား)။
4. **Staggered entry animations** — card/grid များ page load တွင် အဆင့်လိုက် (fade-in-up) ပေါ်လာစေရန်။

### Locked Decisions (Q&A မှ အတည်ဖြစ်ပြီး)
| ဆုံးဖြတ်ချက် | ရွေးချယ်မှု |
|---|---|
| **Scope** | Entire dashboard (chrome + page အားလုံး) |
| **Theme** | Light (zinc-50/white bg, zinc border, dark text) |
| **Accent** | Monochrome zinc (accent color မထား၊ primary action = zinc-900/800) |
| **Font** | Satoshi (Fontshare CDN) — English only |

---

## 2. လက်ရှိ Setup (Findings)

- **Tailwind = Play CDN** (`cdn.tailwindcss.com`) + inline `tailwind.config` ကို [index.html](../index.html) ထဲ ရေးထား → color / font / keyframes token များကို **ဒီဖိုင်တစ်ခုတည်း** မှာ ပြင်လို့ရ။ Tailwind ၏ built-in `zinc-*` က ရပြီးသား။
- **Migration surface:**
  - `ocean-*` utility classes — **419 ကြိမ် / 68 file** (token remap ဖြင့် ဖမ်းမိ)။
  - Hardcoded hex (`#0077b6`, `#0f2a4a`, `#00b4d8`, `#0369a1`, `#0c1e36`, `#38bdf8`, `#7dd3fc`) — **202 ကြိမ် / 33 file** (hex-map sweep ဖြင့်သာ ဖမ်းမိ)။
- **Fonts:** `.lang-en` / `.lang-my` CSS block များက element တိုင်းကို `!important` ဖြင့် font သတ်မှတ်ထား → `fontFamily.sans` ပြောင်းရုံဖြင့် မလုံလောက်၊ **`.lang-en` block ကိုပါ Satoshi ဦးစား ပြင်ရမည်**။
- **Layout:** `App.tsx` → `AppLayout` = `<TopBar/>` + full-width `<main>` (Hub-and-Spoke, sidebar မပါ)။ Chrome = **TopBar**။
- **Shared primitives:** `components/ui/` (card, button, badge, input, select, table, modal, page-header, stats-card, tabs, dropdown-menu, dialog) — CVA-based, `ocean-*`/`slate-*`/hardcoded hex သုံး။

---

## 3. Strategy (ချဉ်းကပ်နည်း)

လက်ဖြင့် ၄၁၉ + ၂၀၂ = ၆၂၁ ကြိမ် ပြင်မည့်အစား **token-first** ချဉ်းကပ်မည်:

1. **Token remap (backbone)** — index.html ရှိ `ocean` (+ `primary`, `btn`, `status.info`) scale ကို zinc-toned ဖြင့် redefine + `slate` ကို zinc values ဖြင့် align → file ၆၈ ခုလုံး config တစ်ခုတည်းဖြင့် recolor။ **Component edit မလို။**
2. **Hardcoded-hex sweep** — dashboard file ၃၃ ခုရှိ hex string များကို deterministic map ဖြင့် replace (print/receipt/invoice ချန်)။
3. **Font swap** — Fontshare Satoshi link + `fontFamily.sans` + `.lang-en` block။
4. **Animation** — inline config keyframes + `.stagger-children` utility (nth-child delay) + grid container များတွင် class ထည့်။
5. **Primitive & chrome polish** — Card/StatsCard/Button/TopBar ကို hairline border + premium finish အတွက် targeted ပြင်။

---

## 4. Color Mapping (တိကျ)

### 4.1 `ocean` + `primary` scale remap (index.html inline config)
| token | old (ocean) | **new hex** | zinc | role |
|---|---|---|---|---|
| 50  | #f0f9ff | **#fafafa** | 50  | lightest tint / page bg |
| 100 | #e0f2fe | **#f4f4f5** | 100 | tint bg |
| 200 | #bae6fd | **#e4e4e7** | 200 | border / tint |
| 300 | #7dd3fc | **#d4d4d8** | 300 | border |
| 400 | #38bdf8 | **#a1a1aa** | 400 | muted |
| 500 | #00b4d8 | **#71717a** | 500 | secondary text / icon |
| 600 | #0077b6 | **#27272a** | 800 | **PRIMARY action / active** |
| 700 | #0369a1 | **#18181b** | 900 | hover (darker) |
| 800 | #0f2a4a | **#18181b** | 900 | headings / dark text |
| 900 | #0c1e36 | **#09090b** | 950 | deepest |
| DEFAULT | #0077b6 | **#27272a** | 800 | |

> Monotonic (darkness တိုးသွား) → gradient (`from-ocean-600 to-ocean-500`) များ banded မဖြစ်။ `hover:bg-ocean-700` က `bg-ocean-600` ထက် ပိုမှောင် → hover semantics မှန်။

### 4.2 `slate` → zinc align (index.html) — *recommended*
`slate` ကို zinc values ဖြင့် override (blue-tint ဖယ်၍ neutral zinc): 50 `#fafafa` · 100 `#f4f4f5` · 200 `#e4e4e7` · 300 `#d4d4d8` · 400 `#a1a1aa` · 500 `#71717a` · 600 `#52525b` · 700 `#3f3f46` · 800 `#27272a` · 900 `#18181b` · 950 `#09090b`. (config-only, immediate revert နိုင်။)

### 4.3 Hardcoded hex → hex map (33 dashboard files, print ချန်)
| old hex | **new hex** | note |
|---|---|---|
| `#0077b6` | **`#27272a`** | ocean-600 primary |
| `#0369a1` | **`#18181b`** | ocean-700 hover |
| `#0f2a4a` | **`#18181b`** | navy heading/secondary |
| `#0c1e36` | **`#09090b`** | deepest navy |
| `#00b4d8` | **`#52525b`** | accent cyan → zinc-600 |
| `#38bdf8` | **`#a1a1aa`** | → zinc-400 |
| `#7dd3fc` | **`#d4d4d8`** | → zinc-300 |

### 4.4 Semantic colors — **ဆက်ထား** (မ neutralize)
success (emerald), danger (red), warning (amber), status pill (Signed/Delivered…) များ — meaning သယ်ဆောင်၍ ဆက်ထား (premium monochrome တွင်လည်း status အရောင် ခွင့်ပြု)။ Decorative-only tint (ဥပမာ StatsCard `ocean` variant) များသာ zinc သို့ ကျဆင်း။

---

## 5. Files to Modify (ပြင်ဆင်မည့် ဖိုင်များ)

| # | File(s) | ပြင်ဆင်ချက် |
|---|---|---|
| 1 | `index.html` | (a) `ocean`+`primary`+`btn`+`status.info` remap; (b) `slate`→zinc; (c) `boxShadow.glow` rgba → neutral `rgba(24,24,27,…)`; (d) Fontshare Satoshi `<link>`; (e) `fontFamily.sans`=`["Satoshi","Inter",…]`; (f) body + `.lang-en` block → Satoshi ဦးစား; (g) keyframes `fade-in-up` + animation; (h) `.stagger-children` CSS + `prefers-reduced-motion` guard |
| 2 | `components/ui/*` (card, stats-card, button, badge, input, select, table, modal, page-header) | hairline border `slate-100`→`zinc-200/70`; StatsCard decorative variant → neutral; Button `secondary` variant hex (`#0f2a4a`) → token; focus ring neutral |
| 3 | `components/TopBar.tsx` | logo gradient (`from-ocean-600 to-ocean-500`) → charcoal zinc; border/hover polish (token ဖြင့် auto ဖြစ်ပြီးသား၊ finish စစ်) |
| 4 | `components/Sidebar.tsx` | token + hex-map ဖြင့် recolor (finish စစ်) |
| 5 | **Hex sweep (33 files)** — pages/ + components/ (Reports, Settings, Orders, POS, Inventory, Storefront, AIChat, LuckyDraw, DailyReports, AccountManagement, CreditOrders …) | §4.3 map ဖြင့် string replace |
| 6 | `App.tsx` | Toaster `#0077b6` → `#27272a` (hex map) |
| 7 | **Grid/list containers** (Home hub, ClientProjects, Inventory, Storefront, Warehouse, Suppliers, Tickets, Orders, Reports cards, StatsCard rows …) | wrapper တွင် `stagger-children` class ထည့် |

### Exclusions (မထိ — printed brand artifacts)
`components/ThermalReceipt.tsx`, `components/Invoice/ReceiptDocument.tsx`, `components/Invoice/InvoiceDocument.tsx`, `components/Print/VoucherContent.tsx`, `pages/PrintReceipt.tsx`, `pages/MobilePrint.tsx` — hex sweep မှ ချန်လှပ်။

---

## 6. Implementation Phases (အဆင့်လိုက်)

- **Phase 0 — Tokens & font (index.html):** §4.1/4.2 remap + Satoshi + keyframes + stagger CSS + reduced-motion + glow soften။ → `npm run build`။ *(ဒီအဆင့်တစ်ခုတည်းက `ocean-*`/`slate-*` အားလုံး recolor + font swap — အကြီးမားဆုံး visual jump၊ edit အနည်းဆုံး။)*
- **Phase 1 — Hex sweep:** §4.3 map ကို dashboard files (print ချန်) ပေါ် apply (per-hex replace)၊ App.tsx Toaster အပါ။ → build။
- **Phase 2 — Primitive polish:** ui/ card/stats-card/button/badge border+variant finish။ → build။
- **Phase 3 — Chrome:** TopBar/Sidebar finish။
- **Phase 4 — Stagger classes:** grid/list container များတွင် `stagger-children` ထည့်။
- **Phase 5 — Verify:** full build + route-by-route visual check (browser preview) + adjust။

---

## 7. Animation Detail

**inline config (`theme.extend`):**
```js
keyframes: {
  'fade-in-up': { '0%': { opacity: '0', transform: 'translateY(8px)' },
                  '100%': { opacity: '1', transform: 'translateY(0)' } },
},
animation: { 'fade-in-up': 'fade-in-up .5s cubic-bezier(.16,1,.3,1) both' },
```
**`<style>` (stagger, per-index delay — inline style မလို):**
```css
.stagger-children > * { opacity: 0; animation: fade-in-up .5s cubic-bezier(.16,1,.3,1) both; }
.stagger-children > *:nth-child(1){animation-delay:.04s}
/* … 2..12 = index*40–50ms … */
.stagger-children > *:nth-child(n+13){animation-delay:.5s}
@media (prefers-reduced-motion: reduce){
  .stagger-children > *{animation:none;opacity:1}
}
```

---

## 8. Edge Cases (အထူးအခြေအနေ)

1. **Myanmar font** — `.lang-my` (Z06-Walone) မထိ (Satoshi က မြန်မာစာ မ support)။ `.lang-en` ကိုသာ Satoshi။
2. **Print/receipt/invoice** — §5 Exclusions အတိုင်း brand color ဆက်ထား (printed output မပျက်)။
3. **prefers-reduced-motion** — stagger animation ကို media query ဖြင့် ပိတ်။
4. **Hover semantics** — remap monotonic ဖြစ်၍ `hover:bg-ocean-700` ပိုမှောင် (မှန်)။
5. **Gradients** — `from-ocean-*`/`to-ocean-*` များ charcoal ramp ဖြစ်၍ premium look။
6. **Semantic colors** — success/danger/warning + status pill ဆက်ထား (§4.4)။
7. **Focus ring** — `ring-ocean-500` → zinc-500 (accessible contrast စစ်)။
8. **Satoshi load fail** — fallback `Inter` → `system-ui` chain ထား၍ FOUT/မပေါ်မှု မဖြစ်။
9. **shadcn Toaster inline style** — `App.tsx` classNames ရှိ hex map ဖြင့် ဖြေ။

---

## 9. Test Approach (စမ်းသပ်နည်း)

1. **Build:** အဆင့်တိုင်း `npm run build` — compile/parse error မရှိ။
2. **Visual (browser preview):** route အဓိကများ — `/` (hub), `/client-projects`, `/projects/:id/analytics`, `/pos`, `/inventory`, `/reports`, `/settings`, `/tickets` — တွင်:
   - blue/cyan/navy လုံးဝ မကျန် (zinc သာ)၊ status အရောင်သာ ကျန်။
   - card border = hairline zinc; page load တွင် card stagger ပေါ်။
   - English → Satoshi; Myanmar → Z06-Walone (font စစ်)။
3. **i18n:** `en`/`my` နှစ်ခုလုံး font + layout မှန်။
4. **Print:** `/print-receipt`, `/mobile-print` — brand color မပျက် (excluded)။
5. **Reduced motion:** OS setting ဖွင့်ထားစဉ် animation ပိတ်။

---

## 10. Rollback

အဓိက ပြောင်းလဲမှုများ (colors/font/animation) index.html config ထဲ စုစည်းထား၍ Phase 0 ကို revert ရုံဖြင့် အသွင်အများစု ပြန်ရ။ Hex sweep ကို git diff ဖြင့် ပြန်ကြည့်/revert နိုင် (repo git မဟုတ်လျှင် backup မှတ်)။

---

## 11. Summary

- **Backbone:** index.html token remap → 419 `ocean-*` + slate အားလုံး တစ်ချက်တည်း zinc ဖြစ်။
- **Sweep:** hardcoded hex 202 ကို deterministic map (print ချန်)။
- **Font:** Satoshi (English), Myanmar မထိ။
- **Motion:** `.stagger-children` nth-child stagger + reduced-motion guard။
- **Polish:** hairline zinc border + charcoal primary — premium monochrome SaaS look။
