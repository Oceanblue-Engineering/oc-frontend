# Plan: Invoice သိမ်းဆည်းခြင်း (Save Invoice) နှင့် Invoice List ဇယား စနစ် ထည့်သွင်းတည်ဆောက်ခြင်း

**Date:** 2026-08-20
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**Apps:** `OB-backend` & `OB-frontend`

---

## 1. Objective (ရည်ရွယ်ချက်)

ဖန်တီးထားသော Invoice များကို Download ပြုလုပ်ရုံသာမက **Database (MongoDB) နှင့် စနစ်ထဲတွင် သိမ်းဆည်းထားနိုင်ရန် (Save Invoice)** နှင့် ယခင် ထုတ်ထားသော Invoice အားလုံးကို **Invoice List ဇယား (Table)** ဖြင့် အသေးစိတ် ရှာဖွေကြည့်ရှုခြင်း၊ Filter ပြုလုပ်ခြင်း၊ ပြန်လည် Print/Download ပြုလုပ်ခြင်း၊ Edit/Delete ပြုလုပ်ခြင်းတို့ ဆောင်ရွက်နိုင်ရန်။

---

## 2. Proposed Changes (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### အဆင့် ၁: Backend API & Model တည်ဆောက်ခြင်း (`OB-backend`)

#### [NEW] [`OB-backend/src/models/invoice.model.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/models/invoice.model.js)
* **Schema Fields:**
  * `invoiceNo` (String, unique, required)
  * `invoiceDate` (Date, required)
  * `paymentTerms` (String)
  * `billTo` (`name`, `company`, `address`, `email`, `phone`)
  * `items` (`no`, `description`, `qty`, `unitPrice`, `amount`)
  * `subTotal` (Number), `discountOrTaxLabel` (String), `discountOrTaxAmount` (Number), `totalAmount` (Number, required)
  * `remarks` ([String])
  * `status` (Enum: `"draft"`, `"issued"`, `"paid"`, `"cancelled"`, default: `"issued"`)
  * `orderId` (Ref Order, optional), `projectId` (Ref Project, optional), `adminId` (Ref Admin, optional)
  * `softDeleted` (Boolean, default: false)

#### [NEW] [`OB-backend/src/controllers/invoice.controller.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/controllers/invoice.controller.js)
* `createInvoice`: Invoice အသစ် Database တွင် သိမ်းဆည်းခြင်း
* `getInvoices`: Search, Date Range, Status filter ဖြင့် Invoice စာရင်းများ ဆွဲထုတ်ခြင်း
* `getInvoiceById`: သက်ဆိုင်ရာ Invoice အသေးစိတ် ရယူခြင်း
* `updateInvoice`: Invoice ပြင်ဆင်ခြင်း
* `deleteInvoice`: Invoice ဖျက်သိမ်းခြင်း (Soft delete)
* `updateInvoiceStatus`: Status ပြောင်းလဲခြင်း (`paid`, `cancelled`, etc.)

#### [NEW] [`OB-backend/src/routes/invoice.route.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/routes/invoice.route.js) & [MODIFY] [`OB-backend/src/app.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/app.js)
* `/api/v1/invoices` endpoints များ ချိတ်ဆက်တပ်ဆင်ခြင်း။

---

### အဆင့် ၂: Frontend Service & Invoice List Management (`OB-frontend`)

#### [NEW] [`OB-frontend/services/Invoice/invoice.service.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/services/Invoice/invoice.service.ts)
* Backend API နှင့် ချိတ်ဆက်ပြီး `createInvoice`, `fetchInvoices`, `fetchInvoiceById`, `updateInvoice`, `deleteInvoice`, `updateInvoiceStatus` functions များ ရေးသားခြင်း (Offline LocalStorage fallback ပါဝင်)။

#### [MODIFY] [`OB-frontend/pages/InvoiceGenerator.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/InvoiceGenerator.tsx)
* **Tab 1: 📋 Invoice List (အင်ဗွိုက်စ် စာရင်း ဇယား):**
  * KPI Stats Cards: Total Invoices, Total Invoiced Amount (MMK), Paid Invoices, Pending
  * Search & Filter: Search by Invoice No, Customer Name, Phone, Status Filter, Date Range Picker
  * Data Table:
    * `No`, `Invoice No`, `Date`, `Customer / Company`, `Items Count`, `Total Amount (MMK)`, `Payment Terms`, `Status Badge`, `Actions`
    * Row Actions: 👁️ View/Modal Preview, 📄 PDF Download, 🖼️ PNG Download, 🖨️ Print, ✏️ Edit, 🗑️ Delete (with ConfirmModal)
* **Tab 2: ➕ Create New Invoice (အင်ဗွိုက်စ် အသစ် ဖန်တီးရန်):**
  * Form + Live A4 Preview
  * **"💾 Save Invoice"** Button (Database တွင် သိမ်းဆည်းပြီး Invoice List ထဲသို့ အလိုအလျောက် ရောက်ရှိခြင်းနှင့် Modal Preview ဖွင့်ပေးခြင်း)

---

## 3. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Save Functionality Test:**
   * Invoice အသစ်တစ်ခု ဖန်တီး၍ "Save Invoice" နှိပ်ပါက Database တွင် သိမ်းဆည်းပြီး Toast notification ပေါ်လာမှု စစ်ဆေးခြင်း။
2. **Invoice List & Filtering Test:**
   * သိမ်းဆည်းထားသော Invoice များအားလုံး List ဇယားတွင် နေ့စွဲအလိုက် စနစ်တကျ ပေါ်လာခြင်း၊ Search နှင့် Status filter များ အလုပ်လုပ်ခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
3. **Actions & Export Test:**
   * List ဇယားမှတစ်ဆင့် View (Modal Preview), Download PDF, Download PNG, Print, Delete လုပ်ဆောင်ချက်များ အဆင်ပြေစွာ အလုပ်လုပ်ခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
4. **Production Build:**
   * `npm run build` ဖြင့် Frontend compile error ကင်းစင်မှု စစ်ဆေးခြင်း။
