# Plan: Delivery Management Page + Township CRUD UI + Home Menu

**Date:** 2026-08-07
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

Delivery Management page အသစ် ပြုလုပ်ပြီး၊ ယခင်က backend တွင် ရှိသော Township CRUD (`/townships`) အတွက် **Admin UI** ထည့်ပေးမည်။ ထို့နောက် ဤ page ကို **Home Screen Menu Hub** တွင် entry ထည့်မည်။

> Backend `township.controller.js`/`township.route.js` + frontend `services/Township/*` ရှိပြီးဖြစ်သည်။ ဤ plan သည် frontend page + menu wiring သာဖြစ်သည်။

## Files to Create / Modify

### Create
- `pages/DeliveryManagement.tsx` — Township CRUD page:
  - Township: စာရင်း (name, deliveryFee, isActive, actions)
  - "Add Township" modal (name + deliveryFee + active toggle)
  - Edit (inline/modal), delete (soft → confirm), active toggle
  - Uses `fetchTownships`, `createTownship`, `updateTownship`, `deleteTownship`

### Modify
- `App.tsx` — route `/delivery-management` → `<ProtectedRoute><DeliveryManagement /></ProtectedRoute>`
- `config/navigation.ts` — menu item `{ id: "delivery", titleKey, descKey, icon: Truck, path: "/delivery", color }`
- `translations/en.ts` + `my.ts` — `sidebar.delivery`, `home.desc.delivery`, `delivery.*` keys

## Implementation Steps

1. **Create `pages/DeliveryManagement.tsx`**:
   - `useState` ဖြင့် townships list, loading, modal (add/edit), form fields (name, deliveryFee, isActive) ။
   - Load: `fetchTownships()` (active + inactive) ။
   - Add: `createTownship({ name, deliveryFee })` → toast + reload ။
   - Edit: `updateTownship(id, { name, deliveryFee, isActive })` ။
   - Delete/Disable: `updateTownship(id, { isActive: false })` or `deleteTownship` → confirm modal ။
   - Ocean-blue theme table/cards (per design-system). Empty state, loading spinner ။
2. **Wiring menu** — navigation.ts item (icon `Truck`, `color: "bg-ocean-50 text-ocean-600"`), path `/delivery` ။
3. **Route** — App.tsx အား route ထည်ရ် ။
4. **i18n** — English + Myanmar strings ။

## Data / API Changes

- မရှိပါ။ Backend CRUD ရှိပြီးသားဖြစ်သည်။ Frontend page သာ အသစ်ဖသည်။

## Edge Cases & Considerations

- Deleting township — soft tripdis on backend (`isActive=false`, `isDeleted=true`) — confirm dialog ။
- Name duplication — backend `unique` — error toast ပြခမည် ။
- deliveryFee min 0 validation ။
- Home menu legacy: `hasPermission` — Delivery page owner/admin only (not related to auth logic; default visible) ။

## Test Plan

- `npm run build` ။
- Manual: `/delivery` မှ township add/edit/delete အလုပ်လုပ် ၊ POS township dropdown တွင် ပြင်ထားသော fee ပေါ် ၊ Home menu တွင် Delivery card ပေါ်သည် ။