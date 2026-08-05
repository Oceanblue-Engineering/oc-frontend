# Plan: Hub-and-Spoke (App Launcher) Navigation Layout Refactor

**Date:** 2026-08-05
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

လက်ရှိ persistent Sidebar navigation ကို ဖယ်ရှားပြီး **Hub-and-Spoke (App Launcher / Dashboard Menu Grid)** ပုံစံသို့ ပြောင်းလဲသည်။ Home Screen (`/`) သည် ဗဟို Menu Hub ဖြစ်လာပြီး application ၏ feature pages အားလုံးကို interactive Icon Cards/Grid အဖြစ် ပြသမည်။ Menu card တစ်ခုခုကို နှိပ်ပါက သက်ဆိုင်ရာ feature page သို့ သွားမည်။ Sub-feature page များတွင် Header/Top-Bar ၌ "Home / Back to Menu" ခလုတ် ပါရှိမည်။

---

## Actual Repo Mapping (လက်ရှိ structure နှင့် ကိုက်ညီစေရန်)

> သင်ဖော်ပြသော `src/config/`, `src/pages/`, `src/layouts/` များသည် ဤ repo တွင် **မရှိပါ**။ `OB-frontend` သည် flat structure ဖြစ်သည်။ ထို့ကြောင့် အောက်ပါအတိုင်း လိုက်လျောညီထွေ ပြုလုပ်မည် (repo convention: pages = `PascalCase.tsx`, config/util = `camelCase.ts`):

| Logical goal | Actual file in repo |
|--------------|---------------------|
| Menu config data | `OB-frontend/config/navigation.ts` (အသစ်) |
| Home menu hub page | `OB-frontend/pages/Home.tsx` (အသစ်) |
| Layout refactor (remove sidebar) | `OB-frontend/App.tsx` ရှိ `AppLayout` (modify) |
| Top bar / header | `OB-frontend/components/TopBar.tsx` (အသစ်) |
| Translations | `OB-frontend/translations/en.ts` + `my.ts` (modify) |

---

## Files to Create / Modify

### Create
- `config/navigation.ts` — centralized menu config array (id, title/description keys, icon, path, color/badge).
- `pages/Home.tsx` — responsive Tailwind grid menu hub.
- `components/TopBar.tsx` — minimal top bar (branding, user, logout, "Home" control).

### Modify
- `App.tsx` — refactor `AppLayout`: remove `Sidebar` render + side margins; render `TopBar`; add `/` → `<Home />` route.
- `translations/en.ts` + `translations/my.ts` — add `home` section (descriptions + "Back to Menu" strings).

### Unused / kept
- `components/Sidebar.tsx` — **ဆက်ထားသော်လည်း AppLayout မှာ render မလုပ်တော့ပါ** (နောက်ပြန်ပြောင်းရလွယ်ရန် ဖျက်မထား)။

---

## Implementation Steps

1. **Create `config/navigation.ts`**:
   - Export `NavigationItem[]` — array with `{ id, titleKey, descKey, icon, path, color }`.
   - Icons: Lucide React (ShoppingCart, Package, Store, Receipt, CreditCard, Users, Truck, PieChart, LayoutDashboard, Shield, Bell, Gift, Bot, Settings…).
   - Include **all visible sidebar items + Settings**: pos, inventory, storefront, orders, credit-orders, credits, suppliers, expenses, reports, accounts, daily-reports, purchasing, lucky-draw, ai-chat, settings.
   - `warehouse` ကို sidebar တွင် ယခင်က comment လုပ်ထားသောကြောင့် မထည့်ပါ (intent ကို ထိန်းသိမ်းရန်)။
   - Export `hasPermission(path, role)` helper (Sidebar မှ ယူ၍ centralize လုပ်မည်)။
   - Export `menuGroups` (optional) — sidebar ၏ group labels (salesGroup, creditsGroup, inventoryGroup, financeGroup, systemGroup) ကို သုံးနိုင်ရန်။

2. **Create `pages/Home.tsx`**:
   - `ProtectedRoute` ထဲတွင်ရှိမည် (App.tsx မှ route ပေး)။
   - `useLanguage()` + `useApp()` (role for permission filter) + `useNavigate()`/`Link`။
   - `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6` layout။
   - Menu item card: icon (Lucide), title, short description; Tailwind hover (scale, shadow, border highlight); `<Link to={path}>`။
   - Role-based filtering: `hasPermission(path, role)`။
   - App branding header on the hub.

3. **Create `components/TopBar.tsx`**:
   - Props: optional `showHome` (sub-page များတွင် true)။
   - Left: App branding/logo။
   - Right: user name/avatar, logout button, settings, "Home/Back to Menu" (`useNavigate("/")`) — sub-pages များတွင် သာ show။
   - Mobile hamburger မလိုတော့ပါ (sidebar မရှိတော့သောကြောင့်)။

4. **Modify `App.tsx` `AppLayout`**:
   - Remove `<Sidebar …/>` + backdrop + hamburger button + `isOpen`/`isCollapsed` state + `lg:pl-[…]` margin logic။
   - Render `<TopBar />` at top; main content full width (`w-full` / `max-w` center)။
   - Add route: `/` element → `<ProtectedRoute><Home /></ProtectedRoute>` (အသစ်; ယခင်က `/` → `/pos` redirect ဖြစ်သည်)။
   - `protected` sub-pages များ အားလုံး `<TopBar showHome />` အောက်တွင် render ဖြစ်မည်။
   - `/mobile-print/:orderId` နှင့် `/print-receipt/:orderId` ကို **TopBar မလို**သော standalone print views အနေဖြင့် ထားရှိမည် (ပုံနှိပ်စဉ် header မပါအောင်)။

5. **Translations**:
   - `en.ts`/`my.ts`: `home` section — `title` ("Menu"), per-item `desc.*` strings, `backToMenu` ("Home" / "ပင်မမီနူး")။
   - ရှိနှင့်ပြီး `sidebar.*` labels များကို hub card title အဖြစ် ပြန်သုံးပါမည် (duplicate မဖြစ်ရန်)။

---

## Data / API Changes

- မရှိပါ။ Frontend UI/layout refactor သာဖြစ်ပြီး backend API/data မပြောင်းပါ။

---

## Edge Cases & Considerations

- **Permissions:** `/accounts` → owner သာ; `/purchasing`, `/inventory`, `/warehouse`, `/suppliers` → admin/owner သာ။ Home hub တွင် role မတူသော items များကို filter လုပ်မည် (Sidebar နှင့် အတူတူ)။
- **Dark Mode:** သင်ဖော်ပြသော "Dark Mode Toggle" သည် လက်ရှိ app တွင် **မရှိပါ**။ App တွင် dark mode မရှိသောကြောင့် ၎င်းကို မထည့်ပါ (လိုအပ်လျှင် သီးခြား plan ဖြင့် ပြုလုပ်နိုင်သည်)။
- **Print pages:** `/mobile-print`, `/print-receipt` ကို hub grid တွင် မထည့်ပါ — ၎င်းတို့သည် utility/print routes ဖြစ်သည်။
- **Settings access:** ယခင်က Sidebar profile card မှသာ ရနိုင်သည်။ အခု hub grid တွင် Settings card ထည့်မည်။
- **Mobile:** Mobile တွင် hamburger→sidebar အစား TopBar မှ Home ခလုတ် သုံးမည်။ Grid သည် responsive (2→3→4 cols) ဖြစ်သည်။
- **Back navigation:** Browser back + TopBar "Home" နှစ်မျိုးလုံး အလုပ်လုပ်မည် (React Router)။
- **Unused code:** `Sidebar.tsx` ကို render မလုပ်တော့သော်လည်း file ကျန်ရစ်မည်။ ဖျက်ချင်ပါက နောက် task ဖြင့် သီးခြားပြုလုပ်နိုင်သည်။

---

## Test Plan

- `npm run build` — TypeScript + Vite build အောင်မြင်ကြောင်း။
- Manual:
  - `/` ဖွင့် → menu hub grid ပေါ်သည်။
  - Menu card တစ်ခုစီ click → သင့်ရဲ့ page သို့ navigate ဖြစ်သည်။
  - Sub-page တွင် TopBar "Home" ခလုတ် → `/` သို့ ပြန်သွားသည်။
  - Role (owner/admin/cashier) အလိုက် hub items များ filter ဖြစ်သည်။
  - Mobile viewport တွင် grid + TopBar ကောင်းစွာ ပြသည်။
  - Print receipt page များတွင် TopBar မပေါ်ပါ။

---

## Notes / Deviations from Request

- Request တွင် `src/…` လမ်းကြောင်းများ ဖော်ပြသော်လည်း repo ၏ flat structure ကြောင့် `config/`, `pages/`, `components/` အောက်တွင် နေရာချပါသည်။
- "Dark Mode Toggle" မပါပါ (app တွင် dark mode မရှိ)။
- Warehouse card မပါပါ (sidebar တွင် ယခင်ကပင် hidden/comment ထားသည်)။
