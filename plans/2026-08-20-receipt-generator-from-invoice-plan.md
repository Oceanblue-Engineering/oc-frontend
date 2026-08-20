# Plan: Invoice မှတစ်ဆင့် Receipt (တရားဝင် ငွေရပြေစာ) ထုတ်ယူခြင်းနှင့် Payment Received Date စနစ် ထည့်သွင်းတည်ဆောက်ခြင်း

**Date:** 2026-08-20
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**Apps:** `OB-backend` & `OB-frontend`

---

## 1. Objective (ရည်ရွယ်ချက်)

ပေးပို့ထားသော **Ocean Blue Official RECEIPT (ငွေရပြေစာ)** ဒီဇိုင်းပုံစံအတိုင်း Layout နှင့် အချက်အလက်များ တိကျစွာ ကိုက်ညီသော **Receipt Generator** အား တည်ဆောက်ရန်။
* Invoice တွင် **`paymentReceivedDate`** (ငွေလက်ခံရရှိသည့်နေ့) နှင့် **`paymentMethod`** (ငွေပေးချေသည့်နည်းလမ်း) တို့ကို ထည့်သွင်းခြင်း။
* Invoice Status ကို **"Paid"** သို့ ပြောင်းလိုက်ချိန်တွင် (သို့မဟုတ် "Generate Receipt" ခလုတ်နှိပ်ချိန်တွင်) Invoice မှ Data များကို **Auto-Fill** ပြုလုပ်၍ တရားဝင် **RECEIPT** အဖြစ် ချက်ချင်း ပြောင်းလဲထုတ်ယူနိုင်စေခြင်း။
* Receipt အား **Download PDF**, **Download PNG (Image)**, **Print (A4)** ပြုလုပ်နိုင်ခြင်း။

---

## 2. Visual Layout Details for RECEIPT ([Reference Design](file:///C:/Users/PC/.gemini/antigravity/brain/f337c8ca-a0cb-4554-a40d-642c4520a570/.user_uploaded/media_1787223790967.png))

1. **Header:**
   * Ocean Blue Logo + "OCEAN BLUE SWIMMING POOL SPECIALIZED CO.LTD" (Left)
   * **"RECEIPT"** Title in bold Navy Blue (`#1c3d73`) (Right) + Dark Teal Divider Line
2. **Received From & Payment Meta:**
   * **Received From:** Name, Company, Address, Email, Phone
   * **Receipt Meta (With Icons):**
     * 📑 `Invoice No :` [Invoice No]
     * 📅 `Invoice Date :` [Payment Received Date / Invoice Date]
     * 💳 `Payment Method :` [KBZ Pay / AYA Pay / Cash / Bank Transfer]
3. **Items Table & Watermark:**
   * အလယ်တွင် Ocean Blue Soft Watermark Logo
   * Navy Header (`No:`, `Description:`, `Qty:`, `Unit Price:`, `Amount:`)
   * Items Rows (01, 02, 03, 04...)
4. **Summary & Appreciation:**
   * **Left Side:**
     * **Remarks:** Bulleted Warranty Points
     * **Thank you note:**
       * *Thank you very much.*
       * *We look forward to working with you again.* (in `#0077b6`)
   * **Right Side:**
     * **`Total Amount:`** | **`[Amount MMK]`** (Attached to Unit Price & Amount columns)
5. **Signatures & Credentials:**
   * **Prepared By:**
     * **U Pyae Phyo Maung B.E (MC)**
     * *Certified in Environmental Science*
     * *Maintenance and Chemical Handling*
     * *Certified in SCI Engineering*
     * *Founder at Ocean Blue*
6. **Bottom Blue Contact Bar (Footer):**
   * Deep Navy Bar with White Text:
     * 📞 `+959420190123` | ✉️ `info@oceanblue.com.mm` | 📍 `10(A), Aung Mingala Street, Mingaladon, Yangon`

---

## 3. Proposed Changes (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### အဆင့် ၁: Backend Schema Update (`OB-backend`)
* **[MODIFY] [`models/invoice.model.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/models/invoice.model.js):**
  * `paymentReceivedDate` (Date, default: null)
  * `paymentMethod` (String, default: "KBZ Pay")
* **[MODIFY] [`controllers/invoice.controller.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/controllers/invoice.controller.js):**
  * Status ကို "paid" ဟု ပြောင်းချိန်တွင် `paymentReceivedDate` မပါရှိပါက လက်ရှိအချိန် (Current Date) ကို အလိုအလျောက် သတ်မှတ်ပေးခြင်း။

### အဆင့် ၂: Frontend Receipt Document & Switcher (`OB-frontend`)
* **[NEW] [`components/Invoice/ReceiptDocument.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/Invoice/ReceiptDocument.tsx):**
  * ပေးပို့ထားသော Receipt Template အတိုင်း Pixel-perfect ရေးဆွဲထားသော A4 Receipt Component။
* **[MODIFY] [`components/Invoice/InvoiceModal.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/Invoice/InvoiceModal.tsx):**
  * Modal Header တွင် **"📄 Invoice"** နှင့် **"🧾 Receipt"** အကြား 1-Click ဖြင့် အလွယ်တကူ ကူးပြောင်းကြည့်ရှုနိုင်သည့် Document Type Toggle ထည့်သွင်းခြင်း။
* **[MODIFY] [`pages/InvoiceGenerator.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/InvoiceGenerator.tsx):**
  * Invoice Form တွင် `paymentReceivedDate` နှင့် `paymentMethod` ထည့်သွင်းရန် Field များ ထည့်ပေးခြင်း။
  * Invoices List ဇယားတွင် Status ကို "Paid" သို့ ပြောင်းပါက Receipt ကို ချက်ချင်း ထုတ်ယူနိုင်သည့် **"Receipt"** Shortcut Action Button ထည့်သွင်းခြင်း။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Receipt Design Verification:**
   * "Receipt" ကြည့်ရှုချိန်တွင် Header (RECEIPT), "Received From", "Payment Method", "Thank you note", "U Pyae Phyo Maung" credentials နှင့် အောက်ခြေ Blue Contact Bar များ တိကျစွာ ပေါ်ပေါက်မှု စစ်ဆေးခြင်း။
2. **Auto-Fill Check:**
   * Invoice တစ်ခုမှ Receipt သို့ ပြောင်းရာတွင် Customer Name, Items, Total Amount, Dates များ အလိုအလျောက် ပြည့်စုံစွာ ပါဝင်မှု စစ်ဆေးခြင်း။
3. **Export Check:**
   * Receipt အား "Download PDF" နှင့် "Download PNG" ဖြင့် ထုတ်ယူရာတွင် A4 Single Page တွင် သပ်ရပ်စွာ ထွက်ရှိမှု စစ်ဆေးခြင်း။
4. **Build Check:**
   * `npm run build` ဖြင့် compile error မရှိကြောင်း စစ်ဆေးခြင်း။
