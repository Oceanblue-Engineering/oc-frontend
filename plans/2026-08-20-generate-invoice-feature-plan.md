# Plan: OceanBlue Invoice Generator (PDF & Image Export) Feature ထည့်သွင်းတည်ဆောက်ခြင်း

**Date:** 2026-08-20
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**App:** `OB-frontend`

---

## 1. Objective (ရည်ရွယ်ချက်)

ပေးပို့ထားသော **Ocean Blue Swimming Pool Specialized Co.Ltd** တရားဝင် Invoice Design ပုံစံအတိုင်း Layout နှင့် အသေးစိတ် အချက်အလက်များ တိကျစွာ ကိုက်ညီသော **Invoice Template & Generator** ကို တည်ဆောက်ရန်။ 
Invoice ဖန်တီးပြီးပါက:
1. **Download PDF** (A4 အရည်အသွေးမြင့် PDF ဖိုင်)
2. **Download Image (PNG)** (Viber/Telegram/Messenger တို့တွင် ပေးပို့ရန် High-resolution Image)
3. **Print (A4 Direct Print)** (စက်ဖြင့် တိုက်ရိုက် Print ထုတ်ခြင်း)
4. **Orders / POS / Projects** မှ Data များကို 1-Click ဖြင့် အလိုအလျောက် Invoice ထုတ်ယူနိုင်ခြင်းအပြင် **Custom Line Items** များ စိတ်ကြိုက်ထည့်သွင်းဖန်တီးနိုင်ခြင်း။

---

## 2. Visual Layout & Structure (ဒီဇိုင်းနှင့် ဖွဲ့စည်းပုံ)

1. **Header:**
   * ဘယ်ဘက်: Ocean Blue Logo Icon + "OCEAN BLUE" (Bold Navy/Cyan) + "SWIMMING POOL SPECIALIZED CO.LTD"
   * ညာဘက်: "INVOICE" (Large Bold Navy Title)
   * Divider Line: Teal/Cyan Accent Line
2. **Bill To & Invoice Meta:**
   * **Bill To:** Name, Company, Address, Email, Phone
   * **Invoice Details (With Icons):**
     * 📑 `Invoice No :`
     * 📅 `Invoice Date :`
     * 💳 `Payment Terms :` (e.g. 50% Advance, 50% Completion / Cash / Net 30)
3. **Items Table & Watermark:**
   * နောက်ခံအလယ်တွင် Ocean Blue Watermark Logo (Soft Opacity)
   * Table Header: Deep Navy Blue (`#1e3a8a` / `#0f2a4a`) with white bold text
   * Headers: `No:` | `Description:` | `Qty:` | `Unit Price:` | `Amount:`
   * အတန်းများ (01, 02, 03...): သပ်ရပ်သော Border grid များ
4. **Remarks & Totals Section:**
   * **Remarks (Cyan / Blue):**
     * `* 50 Years warranty for swimming pool structure.`
     * `* 5 Years warranty for water proofing services.`
     * `* 3 Years warranty for M&E accessories.`
     * `* One-time treatment and on-site Training also included.`
     * `* Prices can change according to time.`
     * `* This quotation only available within 2 weeks.`
     *(စိတ်ကြိုက် ပြင်ဆင်/ထည့်သွင်းနိုင်ခြင်း)*
   * **Totals (ညာဘက်ဇယား):**
     * `Sub-Total`
     * `Discount / Tax (%)`
     * `Total Amount:` (Bold)
5. **Footer:**
   * **PAYMENT METHOD:**
     * KBZ Pay: `09448799120 | Phyo Maung`
     * KBZ Pay (Special/Personal): `09448799120 | Phyo Maung`
     * AYA Pay: `09448799120 | Phyo Maung`
   * **Signatures:**
     * `Prepared By:` ____________________
     * `Client Signature:` ____________________

---

## 3. Proposed Changes (ဖန်တီးပြင်ဆင်မည့် ဖိုင်များ)

### အဆင့် ၁: Invoice Template & Export Components (`components/Invoice/`)
* **[NEW] [`components/Invoice/InvoiceDocument.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/Invoice/InvoiceDocument.tsx):**
  * ပေးပို့ထားသော ဒီဇိုင်းအတိုင်း A4 Pixel-perfect Standard ဖြင့် ရေးဆွဲထားသော Invoice View Document (Printable & Canvas-capturable)။
* **[NEW] [`components/Invoice/InvoiceModal.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/Invoice/InvoiceModal.tsx):**
  * Invoice Preview ကြည့်ရှုနိုင်ပြီး **"Download PDF"**, **"Download Image (PNG)"**, **"Print"** ခလုတ်များပါဝင်သော Interactive Modal။
* **[NEW] [`utils/invoiceExporter.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/utils/invoiceExporter.ts):**
  * `html2canvas` + `jspdf` ကို အသုံးပြု၍ 2x Resolution ဖြင့် PNG Image Download လုပ်ခြင်းနှင့် A4 PDF Export လုပ်ပေးမည့် Utility Functions။

### အဆင့် ၂: Standalone Invoice Generator စာမျက်နှာ (`pages/InvoiceGenerator.tsx`)
* **[NEW] [`pages/InvoiceGenerator.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/InvoiceGenerator.tsx):**
  * Custom Items များ (Add Row / Delete Row / Description / Qty / Unit Price)၊ Customer Name, Address, Phone, Payment Terms, Remarks များကို စိတ်ကြိုက် ရိုက်ထည့်ပြီး ချက်ချင်း Live Preview ကြည့်ကာ PDF/Image ထုတ်ယူနိုင်သည့် Dedicated Page။
* **[MODIFY] [`App.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/App.tsx):** `/invoice-generator` Route အသစ် ထည့်သွင်းပေးခြင်း။
* **[MODIFY] [`components/TopBar.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/TopBar.tsx):** Quick Invoice Link / Button ထည့်သွင်းခြင်း။

### အဆင့် ၃: Orders & POS များနှင့် ချိတ်ဆက်ခြင်း
* **[MODIFY] [`components/Orders/OrdersTable.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/Orders/OrdersTable.tsx) & [`components/Orders/OrderDetailModal.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/Orders/OrderDetailModal.tsx):**
  * Order တစ်ခုချင်းစီတွင် **"Generate Invoice"** Button ထည့်သွင်းပြီး ချက်ချင်း Official A4 Invoice Preview/Export ပြုလုပ်နိုင်စေခြင်း။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Visual Accuracy Check:**
   * ပေးပို့ထားသော Image နှင့် Header, Watermark, Table, Remarks, Payment Method, Signature Layout များ တိကျစွာ ကိုက်ညီမှု ရှိ/မရှိ စစ်ဆေးခြင်း။
2. **Download PDF & Image Verification:**
   * "Download PDF" နှိပ်ပါက A4 format ဖြင့် စာလုံးမဝါးဘဲ ရှင်းလင်းစွာ ထွက်ရှိမှု စစ်ဆေးခြင်း။
   * "Download Image (PNG)" နှိပ်ပါက High-resolution PNG ပုံအဖြစ် download ဖြစ်မှု စစ်ဆေးခြင်း။
3. **Responsive & Print Check:**
   * Browser Print Preview (`Ctrl + P`) တွင် Header, Table, Footer များ စာမျက်နှာ အံဝင်ခွင်ကျ ထွက်ရှိမှု စစ်ဆေးခြင်း။
4. **Production Build:**
   * `npm run build` ဖြင့် TypeScript compile နှင့် error ကင်းစင်မှု စစ်ဆေးခြင်း။
