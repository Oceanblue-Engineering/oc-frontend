# Plan: Tickets List Page — Assign Selector ထည့်သွင်းခြင်း

**Date:** 2026-08-07
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

Tickets List page (grid/table) တွင် **Assign** selector (dropdown) ထည့်ပေးရန် — row/ticket တစ်ခုစီတွင် assigned to admin ကို ချက်ချင်း ရွေးပြောင်းနိုင်ရန်။ (Detail page တွင်သာမက List မှာလည်း assign ရလိုသည့် user request။)

## Files to Modify

- `OB-frontend/pages/Tickets.tsx`

## Implementation Steps

1. **Imports** — `assignTicket` (services/Ticket/assignTicket), `fetchAdminAccounts` (services/Admin/fetchAdminAccounts) ထည့်။
2. **Admin state + load** — `admins` state + admin accounts fetch (role-gated `admin`/`owner` အတိုင်း load — detail page နှင့် consistent)။
3. **Assign column** (table) — "Assign" column ကို table header + row cell တွင် dropdown ထည့်:
   - Dropdown value = `assigned_to` id (or "")
   - Options = admin accounts (name)
   - onChange → `assignTicket(ticketId, value)` → toast + refresh list
4. **Role gate** — admin/owner သာ assign selector မြင်ရင် (detail page pattern အတိုင်း); cashier ဆိုလျှင် assignee name ပြရုံ။
5. **(Optional)** Assignee display — dropdown ထဲတွင်မဟုတ်ဘဲ၊ assignee မရှိလျှင် "Unassigned" ပြရန်။

## Data / API Changes

- မရှိပါ။ Frontend UI addition သာ (backend `assignTicket` route ရှိပြီးသား)။

## Edge Cases

- `fetchAdminAccounts` response shape: `data.accounts` (array)။
- Assignee string vs object — `assigned_to` populate object ဖြစ်နိုင် — `.value` အတွက် id extract။
- Assign API fail → toast error (list မထိခိုက်)။
- Loading state — admins load မပြီးမချင်း dropdown disable/empty။

## Test Plan

- `npm run build`။
- Manual (admin/owner): Tickets list row တွင် Assign dropdown ပေါ်ပြီး ရွေးလျှင် assignee ပြောင်းသည် + toast; list refresh။
- Manual (cashier): Assign dropdown မပါ, assignee name ပြရုံ။