# Plan: Delivery Management — Analytics Panel

**Date:** 2026-08-07
**Status:** Implemented
**App(s):** Cross-app — backend (`OB-backend`) + dashboard (`OB-frontend`)

---

## Objective

Delivery Management page တွင် **Analytics** panel ထည့်ပေးရန်။ Township များနှင့် delivery orders များ၏ ကိန်းဂဏန်းအချက်အလက်များကို ပြသမည် (summary cards + township breakdown + delivery status breakdown)။

## Data Source

Backend `Order` model တွင် ရှိနှင့်ပြီး:
- `deliveryDetails.deliveryFee` — delivery order များ၏ fee
- `deliveryDetails.townshipName` — township အလိုက် grouping
- `deliveryStatus` — status breakdown (`pending`/`processing`/`out_for_delivery`/`delivered`/`cancelled`)

## Backend (`OB-backend/`)

### New Service — `src/services/deliveryAnalytics.service.js`
`Order.aggregate()` ဖြင့် delivery orders ကို aggregate လုပ်မည်:
- **Total delivery orders**: `{ "deliveryDetails.township": { $exists: true, $ne: null }, isDeleted: false }` count
- **Total delivery revenue**: `$sum: "$deliveryDetails.deliveryFee"`
- **By township** (`$group: "_id": "$deliveryDetails.townshipName"`):
  - `orders` (count), `revenue` (`$sum` fee)
- **By delivery status** (`$group: "_id": "$deliveryStatus"`): count

### New Controller — `src/controllers/deliveryAnalytics.controller.js`
`asyncErrorHandler` ဖြင့် response envelope:
```js
{ success, message, data: { totals, byTownship, byStatus } }
```

### New Route — `src/routes/deliveryAnalytics.route.js` + mount
- `GET /api/v1/delivery-analytics` — `protect` + `permissionGranted("owner", "admin")`
- `app.js` တွင် mount

## Frontend (`OB-frontend/`)

### New Service — `services/Delivery/fetchDeliveryAnalytics.ts`
- `GET /delivery-analytics` → `{ totals, byTownship, byStatus }`

### Modify — `pages/DeliveryManagement.tsx`
Delivery Management page အထက်တွင် **Analytics section** ထည့်မည်:
1. **Summary Cards** (grid, ocean theme):
   - Total Townships (existing list count)
   - Active Townships
   - Total Delivery Orders
   - Total Delivery Revenue (MMK)
2. **Township Breakdown** (table/cards): township name → orders count + revenue
3. **Delivery Status Breakdown** (badge + count): Pending / Processing / Out / Delivered / Cancelled
- Load `fetchDeliveryAnalytics()` on mount + after CRUD changes.

### Translations — `en.ts` + `my.ts`
`delivery.analytics.*` keys: totalOrders, totalRevenue, orders, revenue, statusBreakdown, townshipBreakdown, activeTownships, etc.

---

## Data / API Changes

| Change | Detail |
|--------|--------|
| New API | `GET /api/v1/delivery-analytics` |
| New service | `deliveryAnalytics.service.js` (aggregate) |
| New controller/route | `deliveryAnalytics.controller.js` + `deliveryAnalytics.route.js` |
| Frontend | service + page analytics section |

## Edge Cases & Considerations

- Delivery order မရှိသေး → totals = 0, empty breakdown — empty state ပြမည်။
- `deliveryFee` missing/0 → revenue 0။
- Township မရွေးထားသော (null) orders → breakdown တွင် မပါဝင် (delivery order မဟုတ်)။
- Aggregate pipeline — `isDeleted: false` filter ထည့်မည်။
- Dates optional: date-range filter ထည့်လိုပါက `startDate`/`endDate` query — လိုအပ်လျှင်။

## Test Plan

- Backend `node --check` + (လိုလျှင်) endpoint manual test။
- Frontend `npm run build`။
- Manual: Delivery Management page တွင် summary cards + township breakdown + status breakdown ပေါ်ပြီး township add/edit/delete ပြီးနောက် analytics update ဖြစ်သည်။