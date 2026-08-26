# Plan: Inventory မှ ပစ္စည်းများ ရွေးချယ်၍ Quotation / Invoice Line Items ထည့်သွင်းနိုင်သည့် စနစ် တည်ဆောက်ခြင်း

**Date:** 2026-08-25
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**Apps:** `OB-frontend`

---

## 1. Objective (ရည်ရွယ်ချက်)

Quotation (စျေးနှုန်းကမ်းလှမ်းလွှာ) သို့မဟုတ် Invoice ဖန်တီးရာတွင် Line Items စာရင်းများအား လက်ဖြင့် စာရိုက်ထည့်ရုံသာမက **စနစ်အတွင်းရှိ Inventory (ကုန်ပစ္စည်းစာရင်း)** ထဲမှ ပစ္စည်းများကို Search ပြုလုပ်ပြီး **1-Click ဖြင့် အလွယ်တကူ ရွေးချယ်ထည့်သွင်းနိုင်စေရန်**။

---

## 2. Key Features & Workflow (လုပ်ဆောင်ချက်များ)

1. **"📦 Select from Inventory" Quick Selector Modal ([`InvoiceGenerator.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/InvoiceGenerator.tsx)):**
   * Line Items Card ပေါ်တွင် **"📦 Select from Inventory"** ခလုတ် ထည့်သွင်းပေးခြင်း။
   * နှိပ်လိုက်ပါက Inventory Modal ပွင့်လာပြီး:
     * **Instant Search Bar:** ပစ္စည်းအမည် (Name)၊ Product Code၊ Category ဖြင့် ချက်ချင်း ရှာဖွေနိုင်ခြင်း။
     * **Product Card / List:** ပစ္စည်းအမည်၊ Category၊ လက်ကျန် Stock အရေအတွက်၊ ရောင်းစျေး (Selling Price) တို့ကို ရှင်းလင်းစွာ ပြသပေးခြင်း။
     * **Qty & Add Action:** လိုအပ်သော အရေအတွက် (Qty) ရွေးချယ်ပြီး "Add to Items" နှိပ်လိုက်သည်နှင့် Line Item အဖြစ် အလိုအလျောက် ပေါင်းထည့်ပေးခြင်း။
2. **Individual Line Item Quick Picker (တန်းစီဇယားအတွင်း ပစ္စည်းရွေးချယ်ခြင်း):**
   * Line Item တစ်ခုချင်းစီတွင်လည်း Description အကွက်ဘေး၌ "📦 Pick from Inventory" ခလုတ်ငယ် ထည့်ပေးထားမည်ဖြစ်ပြီး သက်ဆိုင်ရာ Row ထဲသို့ ပစ္စည်းအမည်နှင့် Selling Price တိုက်ရိုက် Auto-Fill ဖြစ်စေခြင်း။
3. **Live Auto-Calculation:**
   * Inventory မှ ပစ္စည်းထည့်လိုက်သည်နှင့် Qty × Unit Price = Amount တွက်ချက်ကာ Quotation နှင့် Invoice ၏ Sub-Total / Total Amount တို့ကို Real-time ပြောင်းလဲပေးခြင်း။

---

## 3. Proposed Changes (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### Frontend Implementation (`OB-frontend`)
* **[MODIFY] [`pages/InvoiceGenerator.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/InvoiceGenerator.tsx):**
  * `fetchProducts` service (`services/Inventory/fetchProducts.ts`) အား ချိတ်ဆက်၍ Inventory ပစ္စည်းများ ဖတ်ယူခြင်း။
  * **Inventory Picker Modal** တည်ဆောက်ခြင်း (Search bar, Category filter, Product items list, Qty input, Add button)။
  * ရွေးချယ်လိုက်သော ပစ္စည်းများကို Line Items စာရင်းထဲသို့ ထည့်သွင်းပေးပြီး စျေးနှုန်းနှင့် Total များကို အလိုအလျောက် တွက်ချက်စေခြင်း။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Inventory Loading & Search Test:**
   * Inventory Picker Modal ဖွင့်ချိန်တွင် ပစ္စည်းများ အမှန်တကယ် ပေါ်ပေါက်မှုနှင့် Name/Code ဖြင့် ရှာဖွေမှု အဆင်ပြေ/မပြေ စစ်ဆေးခြင်း။
2. **Line Item Auto-Fill Test:**
   * ပစ္စည်းတစ်ခုကို ရွေးပြီး Add လုပ်ပါက Description, Qty, Unit Price, Amount များ Line Items စာရင်းထဲသို့ တိကျစွာ ရောက်ရှိသွားပြီး Quotation Preview တွင် ချက်ချင်း ပေါ်လာမှု စစ်ဆေးခြင်း။
3. **Build Check:**
   * `npm run build` ဖြင့် compile error ကင်းစင်ကြောင်း စစ်ဆေးအတည်ပြုခြင်း။
