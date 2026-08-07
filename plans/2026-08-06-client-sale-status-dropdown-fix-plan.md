# Plan: Client Status Dropdown — Sale Close (Signed) ထည့်သွင်းခြင်း Fix

**Date:** 2026-08-06
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

Client (Lead) modal ၏ status dropdown တွင် **`Signed` (Sale Close)** option မပါသော bug ကို ပြုပြင်ရန်။ Lead ကို pre-sale အဆင့်မှာ "Signed" ဟု သတ်မှတ်လိုက်လျှင် backend က POS Credit Person auto-create လုပ်ပြီး Post-Sale သို့ ပြောင်းပေးသည် — ထို့ကြောင့် ဤ option သည် pre-sale dropdown တွင် ရှိရမည်။

## Root Cause

`ClientModal.tsx` ၏ `PRE_SALE_STATUSES` array တွင် `Signed` မထည့်ခဲ့ပါ။ `POST_SALE_STATUSES` ထဲမှာသာ ပါ၍ `isPostSale` ဖြစ်ပြီးမှသာ ပြသည် — lead ကို Signed မသတ်မှတ်နိုင်သည့် chicken-and-egg ပြဿနာ။

## Files to Modify

- `OB-frontend/components/Client/ClientModal.tsx`

## Implementation Steps

1. `PRE_SALE_STATUSES` array အကုန် (သို့မဟုတ် အလယ်တွင်) **`"Signed"`** ထည့်ရန်။
   - Order: `... , "Sent Contract", "Signed", "Follow-up needed", "Ghosted"`
   - သို့မဟုတ် sale-close အဆင့်ကို pipeline ၏ အဆုံးသို့ ရှင်းရှင်းထား — `"Ghosted"` ပြီးနောက်။
2. (ထည့်သွင်းရန်) `POST_SALE_STATUSES` မှ `Signed` ကို ဖယ်ထား၍ `PRE_SALE_STATUSES` တွင်သာ ထားရန် — `Signed` သည် transition status ဖြစ်သောကြောင့် pre-sale dropdown မှ ရွေးပြီး trigger လုပ်ရမည်။
   - သို့သော် post-sale view တွင် client သည် `Signed` သို့မဟုတ် `In-Development`/`Delivered` ဖြစ်နိုင်သောကြောင့် `POST_SALE_STATUSES` တွင် `Signed` ကို ဆက်ထားလိုကောင်းလိုသည်။ **ဆုံးဖြတ်ချက်:** `Signed` ကို `PRE_SALE_STATUSES` သို့ ထည့်၍ `POST_SALE_STATUSES` တွင်လည်း ဆက်ထားမည် (view နှစ်ခုလုံးတွင် အလုပ်လုပ်ရန်)။

## Data / API Changes

- မရှိပါ။ Frontend UI dropdown fix သာ။ (Backend enum တွင် `Signed` ရှိနှင့်ပြီးဖြစ်သည်။)

## Edge Cases

- Lead ကို `Signed` ရွေးသိမ်းလျှင် backend service က `isPostSale=true` + POS Credit Person auto-create လုပ်မည် — dropdown မှ ရွေးနိုင်ခြင်းကသာ လိုသည်။
- `Signed` client ကို post-sale view တွင် `In-Development`/`Delivered` သို့ ဆက်ပြောင်းနိုင်သည်။

## Test Plan

- `npm run build` အောင်မြင်သည်။
- Manual: Lead modal တွင် status dropdown ၌ **Signed** option ပေါ်သည်။ Signed ရွေးသိမ်းလျှင် client က Post-Sale view သို့ ပြောင်းရွှေ့ပြီး POS credit person တွင် ပေါ်သည်။