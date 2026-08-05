# Plan: Login ပြီးနောက် Home Page သို့ Redirect

**Date:** 2026-08-05
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

Login အောင်မြင်ပြီးနောက် `/pos` အစား **Home (`/`)** သို့ redirect ပြုလုပ်ရန်။ Hub-and-Spoke layout အသစ်အရ login ပြီးလျှင် Menu Hub (Home) ကို ဦးစွာမြင်ရမည်ဖြစ်သည်။

## Files to Modify

- `OB-frontend/pages/Login.tsx`

## Implementation Steps

1. Line 17 (already-logged-in redirect): `navigate("/pos", { replace: true })` → `navigate("/", { replace: true })`.
2. Line 55 (successful login redirect): `navigate("/pos")` → `navigate("/")`.

## Data / API Changes

- မရှိပါ။ Frontend redirect path တစ်ခုတည်း ပြောင်းလဲခြင်းသာ။

## Edge Cases

- `/` သည် `ProtectedRoute` ဖြင့်ကာကွယ်ထားပြီး `Home` menu hub ကို render လုပ်သည် — token ရှိလျှင် ကောင်းစွာအလုပ်လုပ်သည်။
- Print routes / အခြားနေရာများကို မထိခိုက်ပါ။

## Test Plan

- `npm run build` အောင်မြင်ရန်။
- Manual: login ပြီးနောက် `/` (Menu Hub) သို့ ရောက်သည်။