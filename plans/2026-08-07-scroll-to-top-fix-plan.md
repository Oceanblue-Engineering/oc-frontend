# Plan: Route အသစ်ဝင်တိုင်း Scroll-to-Top Fix

**Date:** 2026-08-07
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

Page (route) တစ်ခုထဲဝင်လိုက်တိုင်း scroll က အောက်ဆုံးမှာ ရှိနေသော (ယခင် page ၏ scroll position ကို ဆက်ထိန်းထားသည့်) bug ကို ပြုပြင်ရန်။ Route ပြောင်းတိုင်း scroll ကို **ထိပ်ဆုံး** သို့ အလိုအလျောက် reset ပြုလုပ်မည်။

## Root Cause

React Router (BrowserRouter) သည် route ပြောင်းလျ чеки positioned scroll ကို reset မလုပ်ပါ။ Browser က `window.scrollY` / scroll container position ကို ဆက်ထိန်းထား၍ page ထဲဝဲတိုင်း ယခင် scroll အနေအထားမှာ ပေါ်နေသည်။ "အောက်ဆုံးအထိဆွဲပြီးသား" ဟူသော လက္ခဏာဖြစ်သည်။

## Files to Create / Modify

- **Create:** `components/ScrollToTop.tsx` — route change တိုင်း `window.scrollTo(0,0)` ခေါ်သော component။
- **Modify:** `App.tsx` — `<ScrollToTop />` ကို `<BrowserRouter>` အတွင်း၊ `<Routes>` ရှေ့တွင် render လုပ်ရန်။

## Implementation Steps

1. **Create `components/ScrollToTop.tsx`**:
   ```jsx
   import { useEffect } from "react";
   import { useLocation } from "react-router-dom";
   export const ScrollToTop: React.FC = () => {
     const { pathname } = useLocation();
     useEffect(() => {
       window.scrollTo({ top: 0, left: 0, behavior: "instant" });
     }, [pathname]);
     return null;
   };
   ```
2. **App.tsx** — import + `<ScrollToTop />` ကို `<BrowserRouter>` အတွင်း, `<Routes>` (App-level) ရှေ့တွင် render (App functional အတွက် `App` component ၏ Routes ရှေ့)။

## Data / API Changes

- မရှိပါ။ Frontend scroll-behavior fix သာ။

## Edge Cases

- **Print pages** (`/mobile-print`, `/print-receipt`) — ပုံနှိပ်စဉ် scroll reset ၍ print အလုပ်မလုပ်နိုင် — ၎င်းတို့ကို မထိခိုစေရန် pathname filter optional (skip print routes) သို့မဟုတ် အမြဲ top reset လုပ်ခြင်း — print pages အားနည်းချက် မရှိသောကြောင့် ပုံမှန်ထား။
- Back/Forward navigation — scroll reset ပြုလုပ်မည် (standard). Optional: session history restore မလိုလျှင်။

## Test Plan

- `npm run build`။
- Manual: Page (Home → e.g. Inventory ကဲ့သား ရှည်သော page) သို့ သွားလိုက်တိုင်း scroll သည် ထိပ်မှ စသည်။ Long list page ကို အောက်ဆုံးဆွဲပြီး Home ပြန်လျှင် Home မှာ scroll top ဖြစ်သည်။