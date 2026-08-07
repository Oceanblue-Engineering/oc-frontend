# Plan: Order Detail Modal — Delivery Details & Fee Display

**Date:** 2026-08-07
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

Order တစ်ခုကို delivery fee နှင့် ဖန်တီးပြီးနောက် **Order Detail Modal** တွင် delivery details နှင့် fee ကို မပြသနေသော issue ကို ပြုပြင်ရန်။ Backend က delivery fee ကို order document ၏ `deliveryDetails.deliveryFee` ထဲတွင် သိမ်းပြီးဖြစ်သော်လည်း detail view တွင် မပြပါ။

## Root Cause

`components/Orders/OrderDetailModal.tsx` ၏ **Payment Summary** section (lines 309–384) တွင် delivery details ကို လုံးဝမပြပါ။ `order.deliveryDetails` / `order.deliveryStatus` ကို render မလုပ်ပါ။

## Files to Modify

- `OB-frontend/components/Orders/OrderDetailModal.tsx`

## Implementation Steps

1. **Delivery Details block ထည့်ရန်** (Payment Summary အထက်တွင်):
   - `order.deliveryStatus` badge (Pending/Processing/Out/Delivered/Cancelled — OrdersTable ၏ color logic အတိုင်း)
   - `order.deliveryDetails` ရှိလျှင်: townshipName, recipientName, recipientPhone, deliveryAddress
2. **Payment Summary တွင် Delivery Fee line ထည့်ရန်**:
   - `order.deliveryDetails?.deliveryFee > 0` လျှင် Subtotal နောက်တွင် "Delivery Fee" + fee ပြမည် (Final Amount မတိုင်မီ)။
3. Order interface (`fetchOrders.ts`) တွင် `deliveryStatus`/`deliveryDetails` ပြီးသားရှိသည် — ထည့်စရာမလို။

## Data / API Changes

- မရှိပါ။ Backend က deliveryDetails ကို return လုပ်ပြီးဖြစ်သည်။ Display သာ ထည့်မည်။

## Edge Cases

- Delivery မဟုတ်သော (Pickup) orders — `deliveryDetails` မရှိ → block မပြပါ။
- deliveryFee = 0 သို့မဟုတ် township မရွေးထားလျှင် — fee line မပြပါ။

## Test Plan

- `npm run build`။
- Manual: delivery order ၏ detail modal တွင် township, recipient, fee ပေါ်သည်; pickup order တွင် မပေါ်ပါ။