# Plan: Categorized Multi-Section QUOTATION (ကဏ္ဍခွဲများဖြင့် စျေးနှုန်းကမ်းလှမ်းလွှာ) ဒီဇိုင်းအသစ် တည်ဆောက်ခြင်း

**Date:** 2026-08-25
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**Apps:** `OB-frontend`

---

## 1. Objective (ရည်ရွယ်ချက်)

ပေးပို့ထားသော **Quotation Design အသစ် ([Reference Image](file:///C:/Users/PC/.gemini/antigravity/brain/f337c8ca-a0cb-4554-a40d-642c4520a570/.user_uploaded/media_1787643095585.png))** အတိုင်း Swimming Pool လုပ်ငန်းခွင်သုံး **ကဏ္ဍ ၃ ခု (Swimming Pool Shell, Tiling and Water Proofing, M & E)** ဖြင့် ဖွဲ့စည်းထားသော တရားဝင် **QUOTATION** ဒီဇိုင်းနှင့် Form အား တိကျစွာ ပြောင်းလဲတည်ဆောက်ရန်။

---

## 2. Visual Layout Specifications ([Reference Design](file:///C:/Users/PC/.gemini/antigravity/brain/f337c8ca-a0cb-4554-a40d-642c4520a570/.user_uploaded/media_1787643095585.png))

1. **Header (ထိပ်စီးပိုင်း):**
   * **Left:** Ocean Blue Logo + "OCEAN BLUE SWIMMING POOL SPECIALIZED CO.LTD"
   * **Right:** **"QUOTATION"** Title in bold Navy Blue (`#1c3d73`)
   * **Divider:** Dark Teal Accent Line
2. **Project & Location Meta (ပရောဂျက်နှင့် နေရာအချက်အလက်):**
   * `Quotation for project name: [Project Name]`
   * `Location: [Project Location / Address]`
   * `Date: [Date]` (ညာဘက် အစွန်)
3. **Category Section 1: Swimming Pool Shell**
   * ခေါင်းစဉ်: **`Swimming Pool Shell`** (Bold Navy Blue)
   * ဇယားကွက်: `No:` | `Description:` | `Qty:` | `Unit Price:` | `Amount:`
   * ညာဘက်အောက်ခြေတွင် တွဲလျက်ပါဝင်သော **`Sub-Total`** | **`[Amount] MMK`**
4. **Category Section 2: Tiling and Water Proofing**
   * ခေါင်းစဉ်: **`Tiling and Water Proofing`** (Bold Navy Blue)
   * ဇယားကွက်: `No:` | `Description:` | `Qty:` | `Unit Price:` | `Amount:`
   * ညာဘက်အောက်ခြေတွင် တွဲလျက်ပါဝင်သော **`Sub-Total`** | **`[Amount] MMK`**
5. **Category Section 3: M & E**
   * ခေါင်းစဉ်: **`M & E`** (Bold Navy Blue)
   * ဇယားကွက်: `No:` | `Description:` | `Qty:` | `Unit Price:` | `Amount:`
   * ညာဘက်အောက်ခြေတွင် တွဲလျက်ပါဝင်သော **`Sub-Total`** | **`[Amount] MMK`**
6. **Bottom Summary & Signatures (အောက်ခြေ စာရင်းချုပ်နှင့် လက်မှတ်):**
   * **Left Side:**
     * `Prepared By:`
     * **U Pyae Phyo Maung B.E (MC)**
     * *Certified in Environmental Science*
     * *Certified in SCI Engineering*
   * **Right Side:**
     * ညာဘက်တွင် **`Total Amount`** | **`[Total Amount] MMK`** Box (အထင်းသား စာလုံးမည်း)
     * အောက်တွင် **Thank you very much.** / **We look forward to working with you again.** (in `#0077b6`)
7. **Background Watermark:**
   * အလယ်ဗဟိုတွင် Soft Opacity Ocean Blue Watermark Logo။

---

## 3. Proposed Changes (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### အဆင့် ၁: Quotation Document Component အသစ် ပြင်ဆင်ခြင်း (`OB-frontend`)
* **[MODIFY] [`components/Invoice/QuotationDocument.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/Invoice/QuotationDocument.tsx):**
  * ကဏ္ဍ ၃ ခု (Pool Shell, Tiling & Water Proofing, M&E) ခွဲခြားထားသော ဇယား ၃ ခုနှင့် Sub-Total တစ်ခုချင်းစီ ပါဝင်သည့် Pixel-perfect Single A4 Page Layout အဖြစ် ပြန်လည်ရေးဆွဲခြင်း။
  * အောက်ခြေတွင် ဘယ်ဘက် `Prepared By` နှင့် ညာဘက် `Total Amount` / `Thank you note` အား နေရာချထားခြင်း။

### အဆင့် ၂: Editor Form တွင် Categories အလိုက် ထည့်သွင်းနိုင်စေခြင်း (`OB-frontend`)
* **[MODIFY] [`pages/InvoiceGenerator.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/InvoiceGenerator.tsx):**
  * Quotation ရွေးချယ်ထားချိန်တွင် Items များကို Category အလိုက် (Pool Shell / Tiling & Water Proofing / M&E) သီးခြားစီ ဖြည့်စွက်နိုင်စေခြင်း။
  * `Project Name` နှင့် `Location` input field များကို ထည့်သွင်းပေးခြင်း။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Design Matching Check:**
   * Quotation Preview သည် ပေးပို့ထားသော Reference Image (Pool Shell, Tiling & Water Proofing, M&E ဇယား ၃ ခု၊ Subtotals၊ Prepared By ဘယ်ဘက်နှင့် Total Amount ညာဘက်) အတိုင်း 100% တထေရာတည်း တူညီမှု ရှိ/မရှိ စစ်ဆေးခြင်း။
2. **Export Check:**
   * A4 Single Page တွင် လှပသပ်ရပ်စွာ PDF / PNG Export ထွက်ရှိမှု စစ်ဆေးခြင်း။
3. **Build Check:**
   * `npm run build` ဖြင့် compile error ကင်းစင်ကြောင်း စစ်ဆေးခြင်း။
