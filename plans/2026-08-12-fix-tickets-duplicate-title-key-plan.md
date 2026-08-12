# Plan: Tickets translations — Duplicate `title` Key ပြင်ဆင်ခြင်း

**Date:** 2026-08-12
**Status:** Implemented
**App(s):** dashboard (`OB-frontend`)

---

## Objective

`translations/en.ts` နှင့် `my.ts` ၏ `tickets` section ထဲတွင် `title` key **နှစ်ခါ** ရေးထားသဖြင့် (build warning: *Duplicate key "title" in object literal*) JS object မှာ နောက်ဆုံးတစ်ခုကသာ အနိုင်ရ၍ `t("tickets.title")` သည် အမြဲ **"Title" / "ခေါင်းစဉ်"** ကိုသာ ပြန်ပေးနေသည်။ ရလဒ်အနေဖြင့် Tickets page ၏ **page header** သည် "Tickets" အစား "ခေါင်းစဉ်" ဟု မှားပြနေသည်။

ဤ bug ကို ဖြေရှင်းရန် — page header အတွက် `title: "Tickets"` ကို ထိန်းထားပြီး၊ table column header + modal field label အတွက် သီးခြား key အသစ် (`titleLabel`) ထည့်ကာ Tickets.tsx ၏ သက်ဆိုင်ရာ ၂ နေရာကို လိုက်ပြောင်းမည်။

---

## Files to Modify

- `OB-frontend/translations/en.ts` — `tickets` section
- `OB-frontend/translations/my.ts` — `tickets` section
- `OB-frontend/pages/Tickets.tsx` — table column header + modal label

---

## လက်ရှိ `t("tickets.title")` သုံးထားသော နေရာများ (grep ရလဒ်)

| File / Line | ရည်ရွယ်ချက် | မှန်ကန်သော စာသား |
|-------------|-------------|------------------|
| `Tickets.tsx:161` | Page header (h1) | **"Tickets"** |
| `Tickets.tsx:207` | Table column header (th) | "Title" / "ခေါင်းစဉ်" |
| `Tickets.tsx:286` | New-Ticket modal — field label | "Title" / "ခေါင်းစဉ်" |

> `t("tickets.titleDescRequired")` (line 102) သည် သီးခြား key ဖြစ်၍ မထိပါ။

---

## Implementation Steps

1. **`en.ts` (`tickets` section):**
   - ဒုတိယ `title: "Title"` (line ~222) key ကို **ဖျက်**ပြီး `titleLabel: "Title"` အဖြစ် ထည့်။
   - ပထမ `title: "Tickets"` (line ~217) ကို ထားရှိ (page header အတွက်)။

2. **`my.ts` (`tickets` section):**
   - ဒုတိယ `title: "ခေါင်းစဉ်"` (line ~223) key ကို **ဖျက်**ပြီး `titleLabel: "ခေါင်းစဉ်"` အဖြစ် ထည့်။
   - ပထမ `title: "Tickets"` (line ~218) ကို ထားရှိ။

3. **`Tickets.tsx`:**
   - Line 207 (table column header) → `{t("tickets.titleLabel")}`
   - Line 286 (modal field label) → `{t("tickets.titleLabel")} *`
   - Line 161 (page header) → `{t("tickets.title")}` အတိုင်း မပြောင်း (ယခု "Tickets" ပြန်ရမည်)။

---

## Data / API Changes

- မရှိပါ။ Frontend i18n + UI label သာ ပြင်သည်။

## Edge Cases

- Key အသစ် `titleLabel` ကို en.ts + my.ts **နှစ်ခုစလုံး** တွင် ထည့်ရမည် (translation shape parity)။
- `tickets.title` ကို အခြား file (TicketDetail.tsx အပါအဝင်) တွင် မသုံးထားကြောင်း grep ဖြင့် အတည်ပြုပြီး — Tickets.tsx တစ်ခုတည်းသာ။
- Build warning (duplicate key) ပျောက်ရမည်။

## Test Plan

- `npm run build` — *Duplicate key "title"* warning **မပါတော့ဘဲ** အောင်မြင်ရမည်။
- Manual:
  - `/tickets` page header → **"Tickets"** ပြသည်။
  - Table column header → "Title" / "ခေါင်းစဉ်" ပြသည်။
  - New Ticket modal field label → "Title" / "ခေါင်းစဉ်" ပြသည်။
