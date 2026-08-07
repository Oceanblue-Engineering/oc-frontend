# Plan: Order Detail Modal — Markup Display ဖယ်ရှားခြင်း

**Date:** 2026-08-07
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

Order Detail Modal ၏ **Payment Summary** တွင် ပြသထားသော **Markup** block ကို ဖယ်ရှားရန်။ Delivery fee ပြသခြင်းနှင့် ကိုက်ညီစေရန်၊ markup display မလိုအပ်တော့ပါ။

## Root Cause / Location

`components/Orders/OrderDetailModal.tsx` ၏ Payment Summary အတွင်း:
```jsx
{order.discount === 0 &&
  order.finalAmount > order.subTotal && (
    <div className="flex justify-between text-green-600">
      <span>Markup</span>
      <span>{...toLocaleString()} MMK</span>
    </div>
  )}
```
ဤ block သည် discount မရှိဘဲ finalAmount > subTotal ဖြစ်သည့်အခါ "Markup" ကို ပြသည်။ ဖယ်ရှားပါမည်။

## Files to Modify

- `OB-frontend/components/Orders/OrderDetailModal.tsx`

## Implementation Steps

1. Payment Summary တွင် Markup block (lines ~332–343) ကို **ဖယ်ရှား**ရန်။

## Data / API Changes

- မရှိပါ။ Display removal သာဖြစ်သည်။

## Edge Cases

- မရှိပါ — markup display ကို ပြရန်မလိုတော့ပါ။ Final Amount သည် မှန်ကန်စွာ ဆက်ပြပါမည်။

## Test Plan

- `npm run build`။
- Manual: discount 0 + finalAmount > subTotal ရှိသော order ၏ detail modal တွင် "Markup" line မပေါ်တော့ပါ။