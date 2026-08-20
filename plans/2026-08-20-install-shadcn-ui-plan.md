# Plan: shadcn/ui Library & Radix UI Components Suite ထည့်သွင်းတပ်ဆင်ခြင်း

**Date:** 2026-08-20
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**App:** `OB-frontend`

---

## 1. Objective (ရည်ရွယ်ချက်)

`OB-frontend` ပရောဂျက်ထဲသို့ တရားဝင် **shadcn/ui** Library ၏ Core Primitives များ (`@radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`) ကို install ပြုလုပ်ပြီး `components.json` configuration နှင့် အတူ shadcn/ui Components များ (Button, Card, Dialog/Modal, Dropdown Menu, Tabs, Select, Input, Badge, Table, Popover) ကို အပြည့်အစုံ ထည့်သွင်းသတ်မှတ်ပေးရန်။

---

## 2. Dependencies to Install (ထည့်သွင်းမည့် Packages များ)

```bash
npm install clsx tailwind-merge class-variance-authority @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-popover @radix-ui/react-tooltip @radix-ui/react-checkbox @radix-ui/react-switch
```

---

## 3. Proposed Changes (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### အဆင့် ၁: shadcn/ui Configuration & Utilities
* **[NEW] [`components.json`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components.json):** shadcn CLI configuration file သတ်မှတ်ခြင်း။
* **[MODIFY] [`components/ui/cn.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/cn.ts):** `clsx` နှင့် `tailwind-merge` (`twMerge`) တို့ဖြင့် shadcn/ui standard `cn` utility သို့ ပြောင်းလဲခြင်း။

### အဆင့် ၂: shadcn/ui Component Primitives များ တပ်ဆင်ခြင်း (`components/ui/`)
* **[MODIFY] [`components/ui/button.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/button.tsx):** `class-variance-authority` (cva) နှင့် `@radix-ui/react-slot` (Slot / asChild support) ပါဝင်သော official shadcn button သို့ အဆင့်မြှင့်တင်ခြင်း။
* **[NEW] [`components/ui/dialog.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/dialog.tsx):** `@radix-ui/react-dialog` ကို အခြေခံထားသော Accessible Dialog / Modal component။
* **[NEW] [`components/ui/dropdown-menu.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/dropdown-menu.tsx):** `@radix-ui/react-dropdown-menu` အခြေခံ Dropdown component။
* **[NEW] [`components/ui/tabs.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/tabs.tsx):** `@radix-ui/react-tabs` အခြေခံ Accessible Tabs (List, Trigger, Content) component။
* **[NEW] [`components/ui/popover.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/popover.tsx):** `@radix-ui/react-popover` အခြေခံ Popover component။
* **[NEW] [`components/ui/tooltip.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/tooltip.tsx):** `@radix-ui/react-tooltip` အခြေခံ Tooltip component။
* **[MODIFY] [`components/ui/index.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/index.ts):** Component အသစ်များအားလုံးကို Export ထုတ်ပေးခြင်း။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Build Test:**
   * `npm run build` ဖြင့် TypeScript compile နှင့် bundling အောင်မြင်မှု ရှိ/မရှိ စစ်ဆေးခြင်း။
2. **Accessibility & Behavior Check:**
   * Radix UI primitives များဖြစ်သော Dialog, Dropdown Menu, Tabs, Popover များ Keyboard Navigation (Esc, Tab, Arrow keys) နှင့် Screen Readers တွင် အဆင်ပြေစွာ အလုပ်လုပ်ခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
3. **Existing Page Compatibility:**
   * ယခင် Refactor လုပ်ထားသော စာမျက်နှာများ (`Expenses`, `ClientProjects`, `ProjectDetailAnalytics`, `Orders`, `Credits`) တွင် လိုက်ဖက်ညီစွာ အလုပ်လုပ်ခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
