# Plan: POS Checkout — Markup Feature ဖယ်ရှားခြင်း

**Date:** 2026-08-07
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

`OB-frontend/pages/POS.tsx` checkout modal တွင် **Markup** (fixed-amount price markup) feature ကို လုံးဝဖယ်ရှားရန်။ Discount ကိုသာ ဆက်ထားမည်။ Delivery fee တွက်ချက်မှုနှင့် ကိုက်ညီစေရန် total calculation ကို discount-only ဖြစ်အောင် ရိုးရှင်းစေမည်။

## Markup Code Locations (POS.tsx)

| # | Location | What |
|---|----------|------|
| 1 | line ~100–101 | State: `markup`, `markupAmount` |
| 2 | line ~105 | State: `useMarkup` (toggle) |
| 3 | line ~118 | State: `showMarkupCalculator` |
| 4 | line ~460 | `totalAfterMarkup = subtotal + markupAmount` |
| 5 | line ~463–465 | `total = (useMarkup ? totalAfterMarkup : totalAfterDiscount) + deliveryFee` |
| 6 | line ~466–468 | `combinedDiscountAmount = useMarkup ? 0 : ...` |
| 7 | line ~518–520 | `discountAmount = useMarkup ? 0 : ...` |
| 8 | line ~623–624 | reset: `setMarkup(0)`, `setMarkupAmount(0)` |
| 9 | line ~1569–1596 | "Discount/Markup Toggle" radio group |
| 10 | line ~1622–1636 | "Markup Amount (MMK)" input (conditional `useMarkup`) |
| 11 | line ~1701–1706 | Order Summary "Markup Amount" line |
| 12 | line ~1759–1856 | "Markup Calculator Modal" (entire) |

## Files to Modify

- `OB-frontend/pages/POS.tsx`

## Implementation Steps

1. **Remove markup states** (#1, #2, #3): `markup`, `markupAmount`, `useMarkup`, `showMarkupCalculator` declarations ဖယ်။
2. **Simplify total calc** (#4–#6): 
   - Remove `totalAfterMarkup`.
   - `total = totalAfterDiscount + deliveryFee`.
   - `combinedDiscountAmount = Math.round(subtotal - totalAfterDiscount)` (no ternary).
3. **Remove markup from payload** (#7): `discountAmount = Math.round(subtotal - totalAfterDiscount)`.
4. **Remove reset refs** (#8): `setMarkup(0)`, `setMarkupAmount(0)` ဖယ်။
5. **Remove Toggle UI** (#9): "Pricing Option" radio group (Discount/Markup) ကို ဖယ် — Discount input ကို unconditional ပြမည်။
6. **Remove Markup input** (#10): conditional `useMarkup &&` block ဖယ်။
7. **Remove Summary Markup line** (#11): `{useMarkup && markupAmount > 0 && ...}` ဖယ်။
8. **Remove Markup Calculator Modal** (#12): entire block (line ~1759–1856) ဖယ်။
9. **Unconditional Discount display**: `{!useMarkup && discount > 0 && ...}` → `{discount > 0 && ...}` ။

## Data / API Changes

- မရှိပါ။ Frontend UI/cals feature removal သာ။ `finalAmount` သည် discount + delivery fee ဖြင့်သာ တွက်မည်။

## Edge Cases

- Discount သာကျန်မည် — checkout modal တွင် "Discount (%)" input သာ ပေါ်မည်။
- Delivery fee ကို discount ပြီးနောက် ပေါင်းမည် (ပုံမှန်)။
- Markup မှဖန်တီးထားသော legacy orders များသည် DB တွင်ရှိနေဆဲ — display only၊ ထိခိုက်မည်မဟုတ်ပါ။

## Test Plan

- `npm run build`။
- Manual: checkout modal တွင် Markup option/input/calculator မပေါ်တော့ပါ; Discount ကောင်းစွာ အလုပ်လုပ်သည်; delivery fee + discount + total မှန်ကန်သည်။