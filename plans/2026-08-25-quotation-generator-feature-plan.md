# Plan: Ocean Blue Official QUOTATION (စျေးနှုန်းကမ်းလှမ်းလွှာ) Generator စနစ် တည်ဆောက်ခြင်း

**Date:** 2026-08-25
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**Apps:** `OB-frontend` & `OB-backend`

---

## 1. Objective (ရည်ရွယ်ချက်)

ပေးပို့ထားသော **Ocean Blue Official Template** ဒီဇိုင်းပုံစံအတိုင်း Layout နှင့် စာရင်းဇယားများ တိကျစွာ ကိုက်ညီသော **QUOTATION (တရားဝင် စျေးနှုန်းကမ်းလှမ်းလွှာ)** ထုတ်ယူနိုင်သည့် စနစ်အား တည်ဆောက်ရန်။
* Customer အချက်အလက်များ၊ Line Items များနှင့် လုပ်ငန်းဆိုင်ရာ ကုန်ကျစရိတ်များကို အလွယ်တကူ ထည့်သွင်းပြီး တရားဝင် **QUOTATION** အဖြစ် ချက်ချင်း ဖန်တီးနိုင်စေခြင်း။
* **Document Switcher** တွင် **"📄 Invoice"**, **"🧾 Receipt"**, **"📋 Quotation"** တို့ကို **1-Click** ဖြင့် အပြန်အလှန် Auto-Fill ပြုလုပ်၍ ပြောင်းလဲထုတ်ယူနိုင်စေခြင်း။
* Quotation အား **Download PDF**, **Download PNG (Image)**, **Print (A4)** ပြုလုပ်နိုင်ခြင်း။

---

## 2. Visual Layout & Detail Specifications for QUOTATION ([Reference Template](file:///C:/Users/PC/.gemini/antigravity/brain/f337c8ca-a0cb-4554-a40d-642c4520a570/.user_uploaded/media_1787642198148.png))

1. **Header (ထိပ်စီးပိုင်း):**
   * **Left:** Ocean Blue Logo + "OCEAN BLUE" + "SWIMMING POOL SPECIALIZED CO.LTD"
   * **Right:** **"QUOTATION"** Title in bold Navy Blue (`#1c3d73`)
   * **Divider:** Dark Teal Accent Divider Line
2. **Quotation To & Meta Details (အချက်အလက်ပိုင်း):**
   * **Left (Quotation To):**
     * `Name      :` [Customer Name]
     * `Company   :` [Company Name]
     * `Address   :` [Site / Customer Address]
     * `Email     :` [Customer Email]
     * `Phone     :` [Customer Phone]
   * **Right (Quotation Meta with Icons):**
     * 📑 `Quotation No   :` [e.g. `OB-Q-20260825-4913`]
     * 📅 `Quotation Date :` [e.g. `2026-08-25`]
     * ⏳ `Validity Terms :` [e.g. `Valid for 14 Days` / `50% Advance, 50% on Completion`]
3. **Table with Central Watermark (ကုန်ကျစရိတ် ဇယားကွက်):**
   * Soft Opacity Ocean Blue Watermark Logo in center
   * Deep Navy Header (`No:`, `Description:`, `Qty:`, `Unit Price:`, `Amount:`)
   * Items Rows (`01`, `02`, `03`, `04`...)
4. **Summary, Remarks & Appreciation (အာမခံချက်နှင့် စာရင်းချုပ်):**
   * **Left Side:**
     * **Remarks:** (Cyan text `#00b4d8`)
       * `* 50 Years warranty for swimming pool structure.`
       * `* 5 Years warranty for water proofing services.`
       * `* 3 Years warranty for M&E accessories.`
       * `* One-time treatment and on-site Training also included.`
       * `* Prices can change according to time.`
       * `* This quotation only available within 2 weeks.`
     * **Appreciation Note:**
       * *Thank you very much.*
       * *We look forward to working with you.* (in `#0077b6`)
   * **Right Side (Attached Summary Grid):**
     * **`Sub-Total`** | **`[Amount] MMK`**
     * **`Discount / Tax (%)`** | **`[Amount / -]`**
     * **`Total Amount:`** | **`[Amount] MMK`**
5. **Signatures & Credentials (လက်မှတ်နှင့် တာဝန်ခံပုဂ္ဂိုလ် အချက်အလက်):**
   * **Prepared By:**
     * **U Pyae Phyo Maung B.E (MC)**
     * *Certified in Environmental Science*
     * *Maintenance and Chemical Handling*
     * *Certified in SCI Engineering*
     * *Founder at Ocean Blue*
   * **Client Signature:** (လက်မှတ်ထိုးရန် နေရာ)
6. **Bottom Blue Contact Banner (အောက်ခြေ ဆက်သွယ်ရန် လိပ်စာ):**
   * Deep Navy Bar with White Text:
     * 📞 `+959420190123` | ✉️ `info@oceanblue.com.mm` | 📍 `10(A), Aung Mingala Street, Mingaladon, Yangon`

---

## 3. Proposed Changes (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### အဆင့် ၁: Frontend Quotation Document Component (`OB-frontend`)
* **[NEW] [`components/Invoice/QuotationDocument.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/Invoice/QuotationDocument.tsx):**
  * ပေးပို့ထားသော Reference Template အတိုင်း Pixel-perfect Single A4 Page အဖြစ် တည်ဆောက်ထားသော Quotation Component။
* **[MODIFY] [`components/Invoice/InvoiceModal.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/Invoice/InvoiceModal.tsx):**
  * Document Switcher တွင် **"📄 Invoice"**, **"🧾 Receipt"**, **"📋 Quotation"** ၃ မျိုးလုံးကို 1-Click ဖြင့် အလွယ်တကူ ရွေးချယ်နိုင်အောင် ထည့်သွင်းခြင်း။
  * Quotation ရွေးချယ်ထားချိန်တွင် Export File အမည်အား `Quotation_OB-...` ဖြင့် ဒေါင်းလုဒ်ဆွဲပေးခြင်း။

### အဆင့် ၂: Editor & Document Management Page (`OB-frontend`)
* **[MODIFY] [`pages/InvoiceGenerator.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/InvoiceGenerator.tsx):**
  * Live Preview Switcher တွင် **Quotation Preview** ကို ထည့်သွင်းပေးခြင်း။
  * Quotation No (e.g. `OB-Q-...`) နှင့် Validity Terms (အာမခံသက်တမ်း) ထည့်သွင်းနိုင်သော Field များ ဖြည့်စွက်ခြင်း။
  * Invoices & Documents List ဇယားတွင် Quotation ကို ချက်ချင်း ကြည့်ရှု/ထုတ်ယူနိုင်သည့် **"Quotation"** Action Shortcut Button ထည့်သွင်းခြင်း။

### အဆင့် ၃: Backend Model & API ပံ့ပိုးမှု (`OB-backend`)
* **[MODIFY] [`models/invoice.model.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/models/invoice.model.js):**
  * `quotationNo` (String) နှင့် `validityDays` (Number, default: 14) field များ ထည့်သွင်းခြင်း။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Quotation Design Verification:**
   * Quotation Preview တွင် Header (QUOTATION), "Quotation To", "Quotation No", Remarks, Thank you note, Founder credentials နှင့် Bottom Contact Bar များ Reference Design အတိုင်း တိကျစွာ ပေါ်ပေါက်မှု စစ်ဆေးခြင်း။
2. **Auto-Fill & Document Switching Test:**
   * Form တွင် Data ဖြည့်ထားစဉ်ဖြစ်စေ၊ စာရင်းထဲမှ ဖြစ်စေ Invoice, Receipt, Quotation သို့ ကူးပြောင်းရာတွင် Customer Name, Line Items, Amounts များ အလိုအလျောက် တိကျစွာ ပါဝင်မှု စစ်ဆေးခြင်း။
3. **Export Check:**
   * Quotation အား **"Download PDF"**, **"Download PNG"**, **"Print"** ဖြင့် ထုတ်ယူရာတွင် A4 Single Page တွင် လှပသပ်ရပ်စွာ ထွက်ရှိမှု စစ်ဆေးခြင်း။
4. **Build Verification:**
   * `npm run build` ဖြင့် compile error မရှိကြောင်း စစ်ဆေးအတည်ပြုခြင်း။
