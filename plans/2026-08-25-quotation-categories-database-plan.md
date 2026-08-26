# Plan: Quotation Categories (ကဏ္ဍများ) အား Database တွင် သိမ်းဆည်းခြင်း၊ ရှိပြီးသား ရွေးချယ်ခြင်းနှင့် အသစ်ထည့်သွင်းနိုင်သည့် စနစ် တည်ဆောက်ခြင်း

**Date:** 2026-08-25
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**Apps:** `OB-backend` & `OB-frontend`

---

## 1. Objective (ရည်ရွယ်ချက်)

Quotation တွင် အသုံးပြုသော **Category (ကဏ္ဍခွဲများ - ဥပမာ Swimming Pool Shell, Tiling and Water Proofing, M & E စသည်)** ကို Database တွင် သိမ်းဆည်းထားပြီး:
* User အနေဖြင့် **ရှိပြီးသား Category များအား Dropdown / Search ဖြင့် အလွယ်တကူ ပြန်လည်ရွေးချယ်နိုင်စေရန်**။
* မရှိသေးသော Category အသစ်များ (ဥပမာ `Filtration & Pump System`, `Decking & Landscaping`) ကိုလည်း **တိုက်ရိုက် စာရိုက်ထည့်သွင်းပြီး Database သို့ အလိုအလျောက် သိမ်းဆည်းပေးနိုင်စေရန်**။

---

## 2. Key Architecture & Features (စနစ်ဖွဲ့စည်းပုံနှင့် လုပ်ဆောင်ချက်များ)

### ၁။ Backend Database & API (`OB-backend`):
1. **Model ([`models/quotationCategory.model.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/models/quotationCategory.model.js)):**
   * `name` (String, required, unique, trim)
   * `description` (String)
   * `displayOrder` (Number)
   * `isDefault` (Boolean)
2. **Pre-seeded Default Categories:**
   * `Swimming Pool Shell`
   * `Tiling and Water Proofing`
   * `M & E`
   * `Filtration & Pump System`
   * `Decking & Landscaping`
   * `Chemicals & Water Treatment`
3. **API Endpoints ([`routes/quotationCategory.route.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/routes/quotationCategory.route.js)):**
   * `GET /api/v1/quotation-categories` (Category စာရင်းအားလုံး ရယူခြင်း)
   * `POST /api/v1/quotation-categories` (Category အသစ် သိမ်းဆည်းခြင်း)
   * `DELETE /api/v1/quotation-categories/:id` (Category ဖျက်ခြင်း)

### ၂။ Frontend Dynamic Category Management (`OB-frontend`):
1. **Category Service ([`services/Invoice/quotationCategory.service.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/services/Invoice/quotationCategory.service.ts)):**
   * `fetchQuotationCategories()` နှင့် `createQuotationCategory(name)` စနစ် ချိတ်ဆက်ခြင်း။
2. **Category Selector / Combobox UI ([`pages/InvoiceGenerator.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/InvoiceGenerator.tsx)):**
   * Section တစ်ခုချင်းစီ၏ Header တွင်:
     * **Searchable Dropdown (ရှိပြီးသား ကဏ္ဍများ ရွေးချယ်ခြင်း)**: Database ရှိ Category စာရင်းကို Dropdown ဖြင့် ချက်ချင်း ရွေးချယ်နိုင်ခြင်း။
     * **"+ New Category" / Inline Type (အသစ်ထည့်သွင်းခြင်း)**: စာရင်းထဲတွင် မရှိသေးသော အမည်အသစ်ကို စာရိုက်ထည့်လိုက်ပါက Database သို့ အလိုအလျောက် သိမ်းဆည်းပေးပြီး နောင်တွင် ပြန်လည်အသုံးပြုနိုင်ခြင်း။
3. **Items per Category & Live Synchronization:**
   * Category တစ်ခုချင်းစီအောက်တွင် Custom Item ထည့်သွင်းခြင်း (သို့မဟုတ်) Inventory မှ ပစ္စည်းရွေးချယ်ခြင်း။
   * ညာဘက် **Quotation Preview** တွင် ရွေးချယ်ထားသော Category Title များဖြင့် ဇယားများ Sub-Total နှင့်တကွ အလိုအလျောက် ပေါ်ပေါက်စေခြင်း။

---

## 3. Proposed Changes (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### အဆင့် ၁: Backend Model, Controller & Route (`OB-backend`)
* **[NEW] `src/models/quotationCategory.model.js`:** Quotation Category Schema
* **[NEW] `src/controllers/quotationCategory.controller.js`:** Fetch, Create, Delete APIs
* **[NEW] `src/routes/quotationCategory.route.js`:** Router definition
* **[MODIFY] `src/app.js`:** Register `app.use("/api/v1", quotationCategoryRouter)`

### အဆင့် ၂: Frontend Service & Editor Integration (`OB-frontend`)
* **[NEW] `services/Invoice/quotationCategory.service.ts`:** API client functions
* **[MODIFY] `pages/InvoiceGenerator.tsx`:** Categorized Section Cards with Dynamic Category Dropdown + New Category creation, Items per category, and Live sync
* **[MODIFY] `components/Invoice/QuotationDocument.tsx`:** Render dynamic category titles and sub-totals

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Category Fetch & Seed Check:**
   * Backend မှ Default Categories များ (`Swimming Pool Shell`, `Tiling and Water Proofing`, `M & E` စသည်) တိကျစွာ ရောက်ရှိလာမှု စစ်ဆေးခြင်း။
2. **New Category Creation Test:**
   * Category အသစ် စာရိုက်ထည့်ပါက Database သို့ အောင်မြင်စွာ သိမ်းဆည်းနိုင်ပြီး စာရင်းထဲတွင် ချက်ချင်း ပေါ်လာမှု စစ်ဆေးခြင်း။
3. **Quotation Render Test:**
   * ရွေးချယ်ထားသော Category များနှင့် သက်ဆိုင်ရာ ပစ္စည်းများ Quotation Preview တွင် Sub-Total နှင့်တကွ တိကျစွာ ပေါ်ပေါက်မှု စစ်ဆေးခြင်း။
4. **Build Check:**
   * Backend Syntax Check (`node --check`) နှင့် Frontend Build (`npm run build`) အောင်မြင်မှု စစ်ဆေးခြင်း။
