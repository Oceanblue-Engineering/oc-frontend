# Plan: Mobile မှာ Menu Grid 1 Column ဖြစ်စေခြင်း

**Date:** 2026-08-05
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

Mobile viewport တွင် Home Menu Hub ၏ grid ကို လက်ရှိ `grid-cols-2` မှ **`grid-cols-1`** သို့ ပြောင်းလဲရန်။ ဖုန်းစခရင်တွင် menu card များ တစ်ခုစီ ကျယ်ပြန့်စွာ ပေါ်စေမည်။ Desktop/tablet ပုံစံ (md:3-cols, lg:4-cols) ကို မပြောင်းပါ။

## Files to Modify

- `OB-frontend/pages/Home.tsx`

## Implementation Steps

1. Grid container class ပြောင်းလဲခြင်း:
   - `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6`
   - → `grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6`

## Data / API Changes

- မရှိပါ။ Tailwind responsive class တစ်ခုတည်း ပြောင်းလဲခြင်းသာ။

## Edge Cases

- Mobile တွင် card တစ်ခုလုံး အကျယ်ကြီးဖြစ်၍ တို့ရလွယ်မည်။
- Tablet (md) မှ စ၍ 3-column ပြန်ဖြစ်မည် — မထိခိုက်ပါ။

## Test Plan

- `npm run build` အောင်မြင်ရန်။
- Mobile viewport တွင် menu card များ 1 column အတိုင်း ပေါ်သည်။