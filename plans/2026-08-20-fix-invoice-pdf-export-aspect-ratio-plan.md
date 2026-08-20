# Plan: Invoice Export (PDF/PNG) တွင် အောက်ခြေ Cut-off ဖြစ်နေမှုအား ပြင်ဆင်ခြင်း

**Date:** 2026-08-20
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**App:** `OB-frontend`

---

## 1. Issue Analysis (ပြဿနာ ဖြစ်ပွားရသည့် အကြောင်းရင်း)

ပေးပို့ထားသော Export PDF ပုံကို စစ်ဆေးရာတွင်:
1. **Footer ပျောက်ဆုံးနေခြင်း:** Invoice အောက်ခြေရှိ **"PAYMENT METHOD"** (KBZ Pay / AYA Pay badges) နှင့် **"Prepared By / Client Signature"** အပိုင်းများ A4 စာမျက်နှာ အပြင်ဘက်သို့ ရောက်သွားပြီး ဖြတ်တောက် (Cut-off) ခံရခြင်း။
2. **Ratio မညီမျှခြင်း:** 
   * `InvoiceDocument` ၏ အမြင့် (Height) နှင့် Padding များသည် Standard A4 Aspect Ratio (`794px x 1123px` / `210mm x 297mm`) ထက် ပိုရှည်နေခြင်း။
   * Preview Screen ရှိ Parent Container တွင် `scale-[0.82]` transform သုံးထားသဖြင့် `html2canvas` မှ capture လုပ်ချိန်တွင် exact unscaled dimensions မရရှိဘဲ အောက်ခြေ clipping ဖြစ်သွားခြင်း။

---

## 2. Proposed Solutions (ပြုပြင်မည့် အချက်များ)

### အဆင့် ၁: Exact Single Page A4 Standard (`components/Invoice/InvoiceDocument.tsx`)
* Invoice Document ၏ အရွယ်အစားကို Standard A4 Dimensions (`794px x 1123px` / Ratio `1 : 1.4142`) အဖြစ် တိကျစွာ သတ်မှတ်ခြင်း။
* Layout အား `flex flex-col justify-between` ဖြင့် ဖွဲ့စည်းပြီး:
  * **Top:** Header & Bill To / Invoice Meta
  * **Middle:** Items Table, Remarks & Totals
  * **Bottom:** Payment Method & Signatures (စာမျက်နှာ အောက်ဆုံးတွင် အမြဲ အံဝင်ခွင်ကျ ရှိစေရန် Anchor လုပ်ခြင်း)
* Padding များနှင့် Spacing များကို A4 Single Page ထဲတွင် လုံလောက်စွာ ဆံ့စေရန် ချိန်ညှိခြင်း။

### အဆင့် ၂: Pixel-perfect PDF & Image Exporter (`utils/invoiceExporter.ts`)
* `html2canvas` ၏ `onclone` callback တွင် Cloned DOM ၏ transform အား ဖယ်ရှားပြီး exact `794px x 1123px` ဖြင့် capture ပြုလုပ်ခြင်း။
* `jsPDF` တွင် A4 Page (`210mm x 297mm`) အတိုင်း 0 Margin ဖြင့် 100% အပြည့် အံဝင်ခွင်ကျ ထည့်သွင်းခြင်း။

---

## 3. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **PDF Export Verification:**
   * Invoice အသစ်ကို "Download PDF" နှိပ်ပြီး ဖွင့်ကြည့်ပါက Header, Table, Remarks, Payment Method နှင့် Signature ၂ ခုလုံး အောက်ခြေအထိ ရှင်းလင်းစွာ တစ်မျက်နှာတည်း ပါဝင်မှု ရှိ/မရှိ စစ်ဆေးခြင်း။
2. **Image (PNG) Export Verification:**
   * "Download PNG" နှိပ်ပါကလည်း အောက်ခြေ Footer မပြတ်ဘဲ ပြီးပြည့်စုံသော ပုံရရှိမှု စစ်ဆေးခြင်း။
3. **Build Check:**
   * `npm run build` ဖြင့် compile error မရှိကြောင်း စစ်ဆေးခြင်း။
