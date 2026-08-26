# Plan: Quotation Categories (ကဏ္ဍခွဲများ) စီမံခန့်ခွဲသည့် Input Form တည်ဆောက်ခြင်း

**Date:** 2026-08-25
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**Apps:** `OB-frontend`

---

## 1. Objective (ရည်ရွယ်ချက်)

Quotation တွင် ပါဝင်သော **Category Sections (ဥပမာ- Swimming Pool Shell, Tiling and Water Proofing, M & E)** ဇယားများအတွက် ခေါင်းစဉ် (Category Title) များကို စိတ်ကြိုက် ပြင်ဆင်နိုင်စေရန်နှင့် ကုန်ပစ္စည်း/ဝန်ဆောင်မှုများကို သက်ဆိုင်ရာ Category အောက်သို့ တိုက်ရိုက် ရွေးချယ်ထည့်သွင်းနိုင်သည့် **Categorized Line Items Editor UI** အား တည်ဆောက်ရန်။

---

## 2. UI & Workflow Design (အသုံးပြုသူ အင်တာဖေ့စ် ဒီဇိုင်း)

1. **Category Sections အလိုက် သီးခြား Card များဖြင့် ပြသခြင်း:**
   * Line Items နေရာတွင် Category ၃ ခု (သို့မဟုတ် လိုသလို ထပ်တိုးနိုင်သော Sections) ကို ကတ်တစ်ခုချင်းစီအဖြစ် ပြသပေးမည်။
   * **Category Title Input:** ဥပမာ - `Swimming Pool Shell`, `Tiling and Water Proofing`, `M & E` အမည်များကို စိတ်ကြိုက် ပြင်ဆင်နိုင်ခြင်း။
2. **Category တစ်ခုချင်းစီအလိုက် ပစ္စည်းထည့်သွင်းခြင်း:**
   * Category ကတ်တစ်ခုချင်းစီတွင် သီးသန့် Actions များ ပါဝင်မည်:
     * **`+ Custom Item`:** အဆိုပါ Category အောက်သို့ စိတ်ကြိုက် Item ရိုက်ထည့်ရန် Row အသစ် တိုးပေးခြင်း။
     * **`📦 Pick Inventory`:** Inventory Modal ဖွင့်ပြီး ရွေးလိုက်သော ပစ္စည်းအား အဆိုပါ Category အောက်သို့ တိုက်ရိုက် ထည့်သွင်းပေးခြင်း။
   * **Category Sub-Total:** အဆိုပါ Category ၏ စုစုပေါင်း ကုန်ကျစရိတ်ကို Real-time ပြသပေးခြင်း။
3. **"+ Add New Category Section" ခလုတ်:**
   * လိုအပ်ပါက Section အသစ် (ဥပမာ- Decking & Landscaping) ကို ထပ်တိုးနိုင်ခြင်း သို့မဟုတ် မလိုသော Section ကို ဖျက်နိုင်ခြင်း။
4. **Live Document Synchronization:**
   * Category တစ်ခုချင်းစီတွင် ပြင်ဆင်/ထည့်သွင်းလိုက်သော အချက်အလက်များသည် ညာဘက်ရှိ **Quotation Preview (Pool Shell, Tiling & Water Proofing, M&E ဇယားများ)** တွင် Sub-Total နှင့်တကွ ချက်ချင်း တိုက်ရိုက် Auto-Sync ဖြစ်စေခြင်း။

---

## 3. Proposed Changes (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### Frontend Implementation (`OB-frontend`)
* **[MODIFY] [`pages/InvoiceGenerator.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/InvoiceGenerator.tsx):**
  * Line Items Editor ကို `categorySections` ဖွဲ့စည်းပုံဖြင့် ပြောင်းလဲ၍ Category Title Input၊ Category အလိုက် `+ Custom Item` နှင့် `📦 Pick Inventory` ခလုတ်များ ထည့်သွင်းခြင်း။
  * Inventory Picker ဖွင့်ချိန်တွင် မည်သည့် Category Section ထဲသို့ ထည့်ရမည်ကို `targetSectionIndex` ဖြင့် ချိတ်ဆက်ပေးခြင်း။
* **[MODIFY] [`components/Invoice/QuotationDocument.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/Invoice/QuotationDocument.tsx):**
  * `categorySections` ၏ ခေါင်းစဉ်နှင့် Items များကို အခြေခံ၍ Quotation Document တွင် ဇယားများ တိကျစွာ ရေးဆွဲပြသခြင်း။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Category Title Editing Test:**
   * Category Title များ (Swimming Pool Shell, etc.) အား စာရိုက်ပြောင်းလဲပါက Quotation Preview ရှိ Table ခေါင်းစဉ်များ ချက်ချင်း ပြောင်းလဲမှု စစ်ဆေးခြင်း။
2. **Category Item Adding Test:**
   * သက်ဆိုင်ရာ Category အောက်တွင် Custom Item ရိုက်ထည့်ခြင်း သို့မဟုတ် Inventory မှ ပစ္စည်းရွေးထည့်ပါက အဆိုပါ Category ဇယားထဲသို့သာ တိကျစွာ ရောက်ရှိမှုနှင့် Sub-Total တွက်ချက်မှု စစ်ဆေးခြင်း။
3. **Build Check:**
   * `npm run build` ဖြင့် compile error မရှိကြောင်း စစ်ဆေးအတည်ပြုခြင်း။
