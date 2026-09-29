# Implementation Plan: Stage Column Detail Page for Pre-Sale Pipeline

**နေ့စွဲ:** 2026-09-29  
**App:** `OB-frontend`  
**ဖန်တီး/ပြင်ဆင်မည့် ဖိုင်များ:**
- `OB-frontend/pages/StageDetail.tsx` (ဖိုင်အသစ်)
- `OB-frontend/pages/ClientLeads.tsx` (ပြင်ဆင်မည် — stage header တွင် detail page သို့သွားနိုင်သည့် link/icon ထည့်သွင်းခြင်း)
- `OB-frontend/App.tsx` (ပြင်ဆင်မည် — `/clients/stage/:stageName` route ထည့်သွင်းခြင်း)

---

## ၁။ ရည်ရွယ်ချက် (Objective)
Pre-sale Pipeline (`/clients`) ပေါ်ရှိ Stage Column တစ်ခုချင်းစီ (ဥပမာ- `Sale Inquiry`, `Sent Quotation`, etc.) အတွက် သီးသန့် Detail Page တစ်ခု ဖန်တီးပေးရန် ဖြစ်ပါသည်။ ထို Detail Page တွင် အဆိုပါ Stage အတွင်းရှိ Leads အားလုံးကို ၃ ကတ် ကန့်သတ်ချက်မရှိဘဲ ပြည့်စုံသော Table/List view ဖြင့် ရှာဖွေခြင်း၊ စစ်ထုတ်ခြင်း၊ Pagination ဖြင့် ကြည့်ရှုခြင်းနှင့် အချက်အလက်များကို ပြင်ဆင်နိုင်မည် ဖြစ်ပါသည်။

---

## ၂။ အသုံးပြုသူ အတွေ့အကြုံနှင့် လုပ်ဆောင်ချက်များ (Features & UX)

1. **Column မှ Detail Page သို့ သွားရောက်ခြင်း (Navigation):**
   - Stage Column တစ်ခုချင်းစီ၏ Header တွင် Stage Title ကို နှိပ်၍သော်လည်းကောင်း၊ ဘေးရှိ External Link icon (သို့မဟုတ် "View All" button) ကို နှိပ်၍သော်လည်းကောင်း သက်ဆိုင်ရာ Stage Detail Page သို့ ချက်ချင်း ကူးပြောင်းနိုင်ခြင်း (`/clients/stage/:stageName?type=sales` သို့မဟုတ် `service`)။
2. **Stage Detail Page ၏ ဖွဲ့စည်းပုံ:**
   - **Back Button & Breadcrumb:** Pre-sale Pipeline ပင်မစာမျက်နှာ (`/clients`) သို့ ပြန်သွားနိုင်သည့် ခလုတ်။
   - **Header & Metrics:** Stage အမည်၊ Pipeline အမျိုးအစား (Sales / Service)၊ စုစုပေါင်း Lead အရေအတွက် badge။
   - **Filter & Search Bar:** ဝယ်ယူသူအမည်၊ ကုမ္ပဏီ၊ ဖုန်း၊ အီးမေးလ်တို့ဖြင့် ရှာဖွေနိုင်ခြင်း။
   - **+ New Lead in this Stage:** အဆိုပါ Stage ဖြင့် တိုက်ရိုက် Lead အသစ်ထည့်သွင်းနိုင်သည့် ခလုတ်။
   - **Detailed Table View:**
     - Client Name & Contact Info (Phone / Email)
     - Company / Business Name & Industry
     - Current Problems & Desired Outcome
     - Status Changer (Stage ပြောင်းလဲနိုင်သည့် Quick dropdown)
     - Actions: Edit Lead (LeadModal ဖွင့်ခြင်း), View Logs
   - **Pagination:** Server-side pagination (Next, Previous, Page count) ပါဝင်ခြင်း။

---

## ၃။ ပြင်ဆင်/ဖန်တီးမည့် ဖိုင်များ (Files to Create / Modify)

| ဖိုင်လမ်းကြောင်း | လုပ်ဆောင်ချက် | အသေးစိတ် |
|---|---|---|
| `OB-frontend/pages/StageDetail.tsx` | Create (အသစ်ဖန်တီး) | Stage Detail Page ပင်မ Component |
| `OB-frontend/App.tsx` | Modify (ပြင်ဆင်) | `/clients/stage/:stageName` route အသစ်ထည့်သွင်းခြင်း |
| `OB-frontend/pages/ClientLeads.tsx` | Modify (ပြင်ဆင်) | Stage header တွင် detail page သို့ navigate လုပ်နိုင်သည့် ခလုတ်ထည့်သွင်းခြင်း |

---

## ၄။ Data & API ပံ့ပိုးမှု (Data & API Integration)
- Backend တွင် `GET /leads?status=...&leadType=...&search=...&page=...&limit=...` endpoint ရှိပြီးသားဖြစ်သဖြင့် backend code ပြင်ဆင်ရန် မလိုပါ။
- Frontend ရှိ `fetchLeads({ status, leadType, search, page, limit })` service ကို တိုက်ရိုက်ခေါ်ယူ အသုံးပြုမည် ဖြစ်ပါသည်။

---

## ၅။ ဖြစ်နိုင်ချေရှိသော အခြေအနေများနှင့် ဖြေရှင်းချက် (Edge Cases)
- **Stage Name တွင် Space ပါဝင်ခြင်း:** URL encode / decode (`encodeURIComponent(stage)`) ပြုလုပ်၍ Route Parameter ကို ကိုင်တွယ်မည်။
- **Leads မရှိသော Stage ဖြစ်နေခြင်း:** Empty state သန့်ရှင်းလှပစွာ ပြသမည် ("No leads found in this stage" နှင့် "+ Create First Lead" button)။
- **Status အပြောင်းအလဲ ချက်ချင်း update ဖြစ်ခြင်း:** Table ပေါ်မှ status ပြောင်းလိုက်ပါက ချက်ချင်း re-fetch ပြုလုပ်ပေးမည်။

---

## ၆။ စမ်းသပ်စစ်ဆေးမည့် နည်းလမ်း (Testing Approach)
1. `/clients` စာမျက်နှာတွင် Stage header တစ်ခု (ဥပမာ- `Sale Inquiry`) ကို နှိပ်ပြီး Detail Page သို့ ရောက်ရှိခြင်း ရှိမရှိ စစ်ဆေးခြင်း။
2. Detail Page တွင် Lead စာရင်းများ ပြည့်စုံစွာ ပေါ်မပေါ် စစ်ဆေးခြင်း။
3. Search box တွင် ရိုက်ထည့်၍ ရှာဖွေမှု အလုပ်လုပ်ခြင်း ရှိမရှိ စစ်ဆေးခြင်း။
4. `+ New Inquiry` ခလုတ်နှိပ်ပါက အဆိုပါ stage default အဖြစ် ပါဝင်သော LeadModal ပွင့်မပွင့် စစ်ဆေးခြင်း။
5. Back button နှိပ်ပါက `/clients` သို့ ပြန်လည်ရောက်ရှိခြင်း ရှိမရှိ စစ်ဆေးခြင်း။
6. `npm run build` ပြုလုပ်၍ build error မရှိကြောင်း အတည်ပြုခြင်း။
