# Plan: Project Detail Page တွင် ပရောဂျက်အလိုက် ထုတ်ထားသော Invoice, Quotation, Receipt စာရင်းများနှင့် စုစုပေါင်းပမာဏ (Total Amount) ကို Tab အသစ် ထည့်သွင်းပြသခြင်း

**Date:** 2026-09-02  
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)  
**Apps:** `OB-frontend` & `OB-backend`

---

## 1. Objective (ရည်ရွယ်ချက်)

ပရောဂျက် အသေးစိတ်နှင့် ဘဏ္ဍာရေး စာမျက်နှာ ([`ProjectDetailAnalytics.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/ProjectDetailAnalytics.tsx)) တွင်:
* ယခု ပရောဂျက်အတွက် သီးသန့် ထုတ်ယူထားသော **Quotation, Invoice နှင့် Receipt စာရင်းများ** အားလုံးကို Tab သီးသန့်တစ်ခုအနေဖြင့် ကြည့်ရှုနိုင်စေခြင်း။
* ယင်းပရောဂျက်အတွက် **စုစုပေါင်း ဘေလ်ထုတ်ငွေ (Total Invoiced Amount)**၊ **ငွေလက်ခံရရှိပြီးငွေ (Paid Amount)**၊ **ကျန်ရှိငွေ (Outstanding Due)** နှင့် စာရွက်စာတမ်း အရေအတွက် အကျဉ်းချုပ် ကတ်များအား ရှင်းလင်းစွာ ဖော်ပြပေးခြင်း။
* စာရင်းထဲမှ စာရွက်စာတမ်း တစ်ခုချင်းစီကို ချက်ချင်း **Preview ကြည့်ရှုခြင်း (Quotation/Invoice/Receipt အားလုံးပြောင်းကြည့်နိုင်ခြင်း)**၊ Download ဆွဲခြင်း သို့မဟုတ် Print ထုတ်နိုင်စေခြင်း။

---

## 2. Proposed Architecture & UI Layout (စနစ်ဖွဲ့စည်းပုံနှင့် ဒီဇိုင်း)

### ၂.၁ Project Detail Analytics တွင် Tab အသစ် ထည့်သွင်းခြင်း
* **Tab စာရင်း:**
  1. `အနှစ်ချုပ်` (Overview)
  2. `ကုန်ကျစရိတ်များ` (Expenses)
  3. `လုပ်ခနှင့် အလုပ်သမားများ` (Payroll)
  4. **`ဘေလ်နှင့် စာရွက်စာတမ်းများ` (Quotations & Invoices)** ➔ **[NEW TAB]**
  5. `အချိန်ဇယားနှင့် အသေးစိတ်` (Timeline)

### ၂.၂ New Tab တွင် ပါဝင်မည့် အချက်များ (Tab Components)
1. **Financial KPI Cards (ဘဏ္ဍာရေး အကျဉ်းချုပ် ကတ်များ):**
   * **စုစုပေါင်း ထုတ်ယူငွေ (Total Invoiced):** ပရောဂျက်အတွက် ထုတ်ထားသော ဘေလ်အားလုံးပေါင်း ပမာဏ (MMK)
   * **လက်ခံရရှိပြီးငွေ (Received / Paid):** ဖောက်သည်ထံမှ လက်ခံရရှိပြီးသော ငွေပမာဏ
   * **ရရန်ကျန်ငွေ (Outstanding Balance):** မရရှိသေးသော လက်ကျန်ငွေပမာဏ
   * **စာရွက်စာတမ်း အရေအတွက် (Total Documents):** ထုတ်ထားသော စုစုပေါင်း အရေအတွက်
2. **Action Header:**
   * `+ Create New Document` ခလုတ် ➔ Invoice Generator စာမျက်နှာသို့ သွားရောက်ကာ ၎င်းပရောဂျက်အား Auto-select လုပ်ပေးမည်။
3. **Documents Table (စာရွက်စာတမ်း စာရင်းဇယား):**
   * ကော်လံများ:
     * **No:** အမှတ်စဉ်
     * **Doc Numbers:** Quotation No / Invoice No
     * **Date:** ထုတ်ယူသည့် ရက်စွဲ
     * **Customer / Client:** ဖောက်သည် အမည်
     * **Amount (MMK):** ဘေလ်တန်ဖိုး (ကျပ်)
     * **Status:** အခြေအနေ Badge (`Issued`, `Paid`, `Draft`, `Cancelled`)
     * **Payment Method:** ပေးချေမှု ပုံစံ
     * **Actions:** `Preview` (ဖွင့်ကြည့်ရန်), `Print`, `Download`

---

## 3. Step-by-Step Implementation Steps (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### အဆင့် ၁: Backend API Query Enhancement (`OB-backend`)
* **[MODIFY] [`src/controllers/invoice.controller.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/controllers/invoice.controller.js):**
  * `getInvoices` controller တွင် `projectId` query parameter စစ်ဆေးမှု ထည့်သွင်းခြင်း (`filter.projectId = projectId`)။
  * Stats Aggregation တွင် `projectId` ပါပါက ပရောဂျက်တစ်ခုချင်းစီအလိုက် Stats သီးသန့် တွက်ချက်ပေးရန် ပြင်ဆင်ခြင်း။

### အဆင့် ၂: Frontend Service Update (`OB-frontend`)
* **[MODIFY] [`services/Invoice/invoice.service.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/services/Invoice/invoice.service.ts):**
  * `GetInvoicesParams` တွင် `projectId?: string` ထည့်သွင်းပေးခြင်း။

### အဆင့် ၃: Project Detail UI Integration (`OB-frontend`)
* **[MODIFY] [`pages/ProjectDetailAnalytics.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/ProjectDetailAnalytics.tsx):**
  * `activeTab` အမျိုးအစားတွင် `"invoices"` ထည့်သွင်းခြင်း။
  * `invoicesData`, `invoicesStats`, `isLoadingInvoices` state များ ထည့်သွင်း၍ ပရောဂျက် ID ဖြင့် ဘေလ်စာရင်း ရယူခြင်း။
  * `"invoices"` Tab Content အား KPI Cards, Table, Action Buttons နှင့် Preview Modal ချိတ်ဆက် ထည့်သွင်းခြင်း။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Backend Filter Verification:**
   * `GET /api/v1/invoices?projectId=<ID>` ဖြင့် ခေါ်ယူကြည့်ရာ သက်ဆိုင်ရာ ပရောဂျက်တစ်ခုတည်း၏ ဘေလ်များနှင့် Stats များသာ တိကျစွာ ထွက်ရှိ/မထွက်ရှိ စစ်ဆေးခြင်း။
2. **Tab Switch & UI Display Test:**
   * Project Detail စာမျက်နှာတွင် Tab ၅ ခုလုံး ကောင်းမွန်စွာ အလုပ်လုပ်ပြီး `ဘေလ်နှင့် စာရွက်စာတမ်းများ` Tab သို့ ချောမွေ့စွာ ပြောင်းလဲနိုင်မှု စစ်ဆေးခြင်း။
3. **KPI & Total Amount Calculation Test:**
   * ပရောဂျက်အတွက် ထုတ်ထားသော Invoices များ၏ စုစုပေါင်းတန်ဖိုး (Total Invoiced Amount) နှင့် Paid/Due တွက်ချက်မှု တိကျမှန်ကန်မှု စစ်ဆေးခြင်း။
4. **Document Preview Modal Test:**
   * Table ထဲမှ နှိပ်လိုက်ပါက Quotation, Invoice, Receipt စာရွက်စာတမ်းအား Modal ဖြင့် ကြည့်ရှုနိုင်မှု စစ်ဆေးခြင်း။
5. **Real Chrome Browser (Playwright E2E) Verification:**
   * စစ်ဆေးပြီး Screenshot များဖြင့် Walkthrough အစီရင်ခံစာ ထုတ်ပေးခြင်း။
