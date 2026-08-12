# Plan: Tickets Table — "Detail" Button ထည့်သွင်းခြင်း

**Date:** 2026-08-07
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

Tickets List table တွင် row/ticket တစ်ခုစီအတွက် **"Detail"** button ထည့်ပေးရန် — click လုပ်လျှင် `/tickets/:id` (Ticket Detail page) သို့ သွားမည်။ (ယခု title double-click သာသုံးနိုင်သည် — button ဖြင့် ရှင်းလင်းစေမည်။)

## Files to Modify

- `OB-frontend/pages/Tickets.tsx`

## Implementation Steps

1. **React Router import** — `useNavigate` (သို့ `Link`) ထည့်။
2. **Actions column** (table) — "Actions" header + cell ထည့်:
   - "Detail" button (ocean-blue pill) → `navigate(\`/tickets/${tk._id}\`)`
3. (Optional) Title double-click navigation ကို ထားရှိ / ဖယ် — button ရှိသောကြောင့် title click ကို navigate အောင် ပြောင်းနိုင်သည် (clearer UX)။
   - **ဆုံးဖြတ်ချက်:** title click တစ်ချက်နှိပ်လျှင် detail သွားအောင် ပြောင်းမည် (double-click ဖယ်)။

## Data / API Changes

- မရှိပါ။ Frontend UI addition သာ။

## Edge Cases

- `useNavigate` import — React Router v7 (`react-router-dom`)။
- Actions column responsive (mobile တွင်လည်း မြင်ရမည် — `hidden` မထား)။

## Test Plan

- `npm run build`။
- Manual: Tickets list row တွင် "Detail" button ပေါ်ပြီး click လျှင် detail page သို့ သွားသည်။