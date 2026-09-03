# Plan: Invoice, Quotation & Receipt တွင် Customer/Project အား ရှိပြီးသား Project များနှင့် ချိတ်ဆက်ခြင်း သို့မဟုတ် Manual ထည့်သွင်းနိုင်သည့် စနစ်

**Date:** 2026-09-02  
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)  
**Apps:** `OB-frontend` & `OB-backend`

---

## 1. Objective (ရည်ရွယ်ချက်)

Quotation, Invoice နှင့် Receipt ထုတ်ယူသည့် စာမျက်နှာ ([`InvoiceGenerator.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/InvoiceGenerator.tsx)) တွင် Customer / Client Name နှင့် Project Information အား:
1. **လက်ရှိ တည်ရှိပြီးသား Project များနှင့် ချိတ်ဆက် ရွေးချယ်နိုင်ခြင်း (Link to Existing Project):**
   * Database ရှိ Client Projects စာရင်းမှ ပရောဂျက်တစ်ခုကို ရွေးလိုက်သည်နှင့် Client Name, Project / Site Name, Location, Phone စသည်တို့အား **အလိုအလျောက် Auto-Fill ဖြည့်သွင်းပေးခြင်း**။
2. **စိတ်ကြိုက် Manual စာရိုက်ထည့်နိုင်ခြင်း (Manual Custom Entry):**
   * Project အသစ်ဖြစ်စေ၊ ပရောဂျက်နှင့် မချိတ်ဆက်လိုသည့် ပြင်ပ Customer များအတွက်ဖြစ်စေ Input အကွက်များတွင် စိတ်ကြိုက် စာရိုက်ထည့်သွင်းနိုင်ခြင်း။
3. **Hybrid Flexibility:**
   * ရှိပြီးသား Project ကို ရွေးပြီးနောက် အချက်အလက်များကို လိုအပ်သလို ထပ်မံပြင်ဆင်စာရိုက်နိုင်ခြင်း (သို့မဟုတ် "Unlink" လုပ်၍ သီးသန့်ထားနိုင်ခြင်း)။

---

## 2. User Workflow & UI Design (အသုံးပြုသူ အင်တာဖေ့စ် ဒီဇိုင်း)

1. **"Project & Customer Info" Card တွင် Quick Project Selector ထည့်သွင်းခြင်း:**
   * Customer အချက်အလက် ဖြည့်သွင်းသည့် Card ထိပ်တွင်:
     * **"📁 Link from Existing Project" (Dropdown Selector):**
       * Database ထဲရှိ Active Projects စာရင်း (ဥပမာ- `Novotal Grand Villa Pool — ဦးလှမောင်`) အား Dropdown ဖြင့် ဖော်ပြပေးခြင်း။
       * ပရောဂျက်တစ်ခု ရွေးချယ်လိုက်ပါက:
         * Customer Name ➔ ပရောဂျက်၏ Client Name ဖြင့် Auto-fill
         * Project / Company Name ➔ ပရောဂျက်၏ Site Name ဖြင့် Auto-fill
         * Location / Site Address ➔ ပရောဂျက်၏ Location ဖြင့် Auto-fill
         * `projectId` ➔ Backend နှင့်ပါ တိုက်ရိုက် ချိတ်ဆက်သိမ်းဆည်းပေးခြင်း။
     * **"✏️ Manual / Custom Entry" Toggle / Clear Button:**
       * မည်သည့် Project နှင့်မျှ မချိတ်ဘဲ စိတ်ကြိုက် ရိုက်ထည့်လိုပါက "Custom Entry" အနေဖြင့် လွတ်လပ်စွာ စာရိုက်ထည့်နိုင်ခြင်း။
2. **Quotation / Invoice / Receipt Live Preview Sync:**
   * ရွေးချယ်လိုက်သော Customer နှင့် Project အချက်အလက်များသည် ညာဘက်ရှိ Quotation Preview (Quotation for project name, Location, Date) နှင့် Invoice/Receipt (Bill To) တွင် ချက်ချင်း Real-time ချိတ်ဆက်ပြသပေးခြင်း။
3. **Backend Analytics Linkage (`OB-backend`):**
   * `Invoice` Model တွင် `projectId` (Optional ObjectId reference) ထည့်သွင်းပေးခြင်းဖြင့် နောင်တွင် Project Detail Analytics စာမျက်နှာမှ ၎င်းပရောဂျက်အတွက် ထုတ်ထားသော Quotation / Invoices များကိုပါ ပြန်လည်ကြည့်ရှုနိုင်စေခြင်း။

---

## 3. Proposed Changes (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### အဆင့် ၁: Frontend UI & Service Integration (`OB-frontend`)
* **[MODIFY] [`pages/InvoiceGenerator.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/InvoiceGenerator.tsx):**
  * `fetchProjects` service (`services/Project/project.service.ts`) အား ချိတ်ဆက်၍ Projects စာရင်း ရယူခြင်း။
  * Customer & Project Info Card တွင် "Link to Existing Project" Dropdown Selector နှင့် Auto-Fill Handler ထည့်သွင်းခြင်း။
  * Manual စာရိုက်ထည့်လိုပါက အချိန်မရွေး လွတ်လပ်စွာ ရိုက်နိုင်စေရန် Input များကို ဆက်လက်ဖွင့်ထားပေးခြင်း။

### အဆင့် ၂: Backend Model Support (`OB-backend`)
* **[MODIFY] [`src/models/invoice.model.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/models/invoice.model.js):**
  * `projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null }` ထည့်သွင်းခြင်း။
* **[MODIFY] [`src/controllers/invoice.controller.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/controllers/invoice.controller.js):**
  * Invoice သိမ်းဆည်းရာတွင် `projectId` ပါဝင်ပါက လက်ခံသိမ်းဆည်းပေးခြင်း။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Existing Project Selection Test:**
   * Dropdown မှ Project တစ်ခုအား ရွေးချယ်ကြည့်ပြီး Customer Name, Site Name, Address များ တိကျစွာ Auto-Fill ဖြစ်/မဖြစ် စစ်ဆေးခြင်း။
2. **Manual Entry Test:**
   * မည်သည့် Project ကိုမျှ မရွေးဘဲ Customer အမည်အသစ်နှင့် Project အမည်အသစ်ကို လက်ဖြင့် စာရိုက်ထည့်သွင်းမှု ပုံမှန် အလုပ်လုပ်/မလုပ် စစ်ဆေးခြင်း။
3. **Quotation & Invoice Document Rendering Test:**
   * ချိတ်ဆက်ထားသော Project Name နှင့် Client အချက်အလက်များ Quotation (Project Name & Location) နှင့် Invoice/Receipt (Bill To) တွင် တိကျစွာ ပေါ်ပေါက်မှု စစ်ဆေးခြင်း။
4. **Build Check:**
   * `npm run build` ဖြင့် compile error မရှိကြောင်း စစ်ဆေးအတည်ပြုခြင်း။
