# Plan: OceanBlue Dashboard တခုလုံးအတွက် Unified Design System & shadcn/ui-Style Component Library တည်ဆောက်ခြင်း

**Date:** 2026-08-20
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**App:** `OB-frontend`

---

## 1. Objective (ရည်ရွယ်ချက်)

Dashboard ရှိ စာမျက်နှာအားလုံးတွင် ခလုတ် (Buttons)၊ ကတ်ပြား (Cards)၊ ဇယား (Tables)၊ Input များ၊ Badge များနှင့် Page Layout များ တစ်ခုနှင့်တစ်ခု ပုံစံမတူဘဲ ကွဲလွဲနေခြင်းကို ဖြေရှင်းရန်အတွက် **OceanBlue Unified Design System** ကို တည်ဆောက်ပြီး **shadcn/ui-style Reusable Component Library** ဖြင့် Dashboard တစ်ခုလုံးအား အဆင့်မီ၊ ညီညာသပ်ရပ်သော Theme နှင့် Layout အဖြစ် ပြောင်းလဲသတ်မှတ်ရန်။

---

## 2. Design System Architecture & Specifications

### 2.1 Design Tokens (CSS Variables)
* **Primary (Ocean Blue):** `#0077b6` (Main actions, primary buttons, active tabs)
* **Primary Hover / Active:** `#026094`
* **Primary Light (Subtle):** `#f0f9ff` (Soft badges, light container highlights)
* **Secondary (Deep Navy):** `#0f2a4a` (Brand titles, dark accents)
* **Background:** `#f8fafc` (Clean neutral slate background)
* **Surface / Card:** `#ffffff` (Borders: `rgba(226, 232, 240, 0.8)`, Shadows: `shadow-sm` / `hover:shadow-md`)
* **Destructive (Red):** `#ef4444` (Delete, alerts, debts)
* **Success (Emerald):** `#10b981` (Paid, active, completed)
* **Warning (Amber):** `#f59e0b` (Pending, caution)
* **Border Radius Scale:** `rounded-xl` (12px - inputs, buttons) / `rounded-2xl` (16px - cards) / `rounded-full` (badges, pills)

---

## 3. Proposed Changes (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### အဆင့် ၁: Core Utility & Component Library တည်ဆောက်ခြင်း (`components/ui/`)

#### [NEW] [`components/ui/cn.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/cn.ts)
* Classname merging utility function (`cn(...)`)

#### [NEW] [`components/ui/button.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/button.tsx)
* Standardized Button Component:
  * **Variants:** `default` (Ocean Blue), `secondary` (Navy), `outline` (Bordered), `ghost` (Hover only), `destructive` (Red), `subtle` (Light Blue), `success` (Green)
  * **Sizes:** `sm` (Table/compact actions), `default` (Standard), `lg` (Big CTA), `icon` (Square icon button)
  * **States:** `isLoading` (Spinner auto-render), `disabled`, `focus-ring`

#### [NEW] [`components/ui/card.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/card.tsx)
* Standard Card primitives: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

#### [NEW] [`components/ui/badge.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/badge.tsx)
* Standard Status Badges: `default`, `secondary`, `success`, `warning`, `destructive`, `purple`, `outline`

#### [NEW] [`components/ui/input.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/input.tsx) & [`components/ui/select.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/select.tsx)
* Standardized Form Controls (12px radius, focus ocean ring, placeholder styling)

#### [NEW] [`components/ui/page-header.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/page-header.tsx)
* Page Title, Subtitle, Breadcrumb/Back link နှင့် Action buttons row ကို စာမျက်နှာတိုင်းတွင် တညီတညွတ်တည်း ထိန်းညှိပေးမည့် Layout Header

#### [NEW] [`components/ui/stats-card.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/stats-card.tsx)
* KPI / Metrics Summary Card (Icon container, Label, Value, Currency/Units)

#### [NEW] [`components/ui/table.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/table.tsx)
* Standard Data Table primitives: `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`, `TableEmpty`

#### [NEW] [`components/ui/modal.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/modal.tsx)
* Standard Dialog / Modal Shell with smooth backdrop blur, sticky header and footer

---

### အဆင့် ၂: စာမျက်နှာများအား Design System ဖြင့် အဆင့်ဆင့် ပြောင်းလဲခြင်း (Page Migration)

* **Phase 2.1 (Finance & Projects):**
  * `pages/Expenses.tsx`
  * `pages/ClientProjects.tsx`
  * `pages/ProjectDetailAnalytics.tsx`
  * `pages/ProjectAttendance.tsx`
* **Phase 2.2 (Sales & Operations):**
  * `pages/POS.tsx`
  * `pages/Orders.tsx`
  * `pages/CreditOrders.tsx`
  * `pages/Credits.tsx` & `pages/CreditDetail.tsx`
* **Phase 2.3 (Logistics & Inventory):**
  * `pages/Inventory.tsx`
  * `pages/Warehouse.tsx` & `pages/WarehouseDetail.tsx`
  * `pages/Storefront.tsx` & `pages/StorefrontDetail.tsx`
  * `pages/Suppliers.tsx` & `pages/SupplierDetail.tsx`
  * `pages/Purchasing.tsx`
* **Phase 2.4 (Reports, Settings & Programs):**
  * `pages/DailyReports.tsx`
  * `pages/Reports.tsx`
  * `pages/AccountManagement.tsx`
  * `pages/WorkerManagement.tsx`
  * `pages/LuckyDraw.tsx`
  * `pages/DeliveryManagement.tsx`
  * `pages/Tickets.tsx` & `pages/TicketDetail.tsx`
  * `pages/Settings.tsx`

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Component Test & Build Verification:**
   * `npm run build` ဖြင့် TypeScript compile နှင့် bundling အမှားအယွင်း ကင်းစင်အောင် စစ်ဆေးခြင်း။
2. **Visual Consistency Review:**
   * Button styling (Border radius, hover colors, active states) များ စာမျက်နှာတိုင်းတွင် တူညီမှု ရှိ/မရှိ စစ်ဆေးခြင်း။
   * Page Header (Title, Subtitle, Action Buttons) အကွာအဝေးနှင့် Alignment များ တူညီမှု ရှိ/မရှိ စစ်ဆေးခြင်း။
   * Table နှင့် Card Shadow/Border များ သန့်ရှင်းညီညာမှု ရှိ/မရှိ စစ်ဆေးခြင်း။
3. **Responsive & Mobile View Check:**
   * 375px (Mobile), 768px (Tablet), 1024px+ (Desktop) များတွင် Horizontal overflow မရှိဘဲ Touch target 44px+ ပြည့်မီမှု စစ်ဆေးခြင်း။
4. **Multi-language Check:**
   * English နှင့် မြန်မာ နှစ်မျိုးလုံးတွင် Font clipping မဖြစ်ဘဲ သပ်ရပ်စွာ ပေါ်လွင်ခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
