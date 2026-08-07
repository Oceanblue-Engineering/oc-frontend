# Plan: DeliveryAnalytics — `t` Shadow Bug Fix

**Date:** 2026-08-07
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

Delivery Management page ဝင်စဉ် runtime error `Uncaught TypeError: t is not a function` ကို ပြုပြင်ရန်။

## Root Cause

`pages/DeliveryManagement.tsx` line 226 — township breakdown render အတွက် `.map((t) => ...)` ထောတွင် parameter `t` သည် `useLanguage()` မှ translation function `t` ကို **shadow** ပြုလုပ်သည်။ ထို့နောက် line 230 တွင် `t("delivery.analytics.orders")` ကို ခေါ်သောအခါ `t` သည် township object ဖြစ်နေ၍ "t2 is not a function" error ဖြစ်သည်။

## Files to Modify

- `OB-frontend/pages/DeliveryManagement.tsx`

## Implementation Steps

1. Line 226: `.map((t) =>` → `.map((tw) =>`
2. Line 227: `key={t.townshipName}` → `key={tw.townshipName}`; `{t.townshipName}` → `{tw.townshipName}`
3. Line 230: `{t.orders}` → `{tw.orders}`; `{t.revenue.toLocaleString()}` → `{tw.revenue.toLocaleString()}`

## Data / API Changes

- မရှိပါ။ Variable rename သာ။

## Edge Cases

- `t` name ကို translation function ဥပမဲ shadow မလုပ်တော့သည်။

## Test Plan

- `npm run build`။
- Manual: /delivery page ကိုဖွင့်ပြီး township breakdown ပေါ်ပြီး no error။