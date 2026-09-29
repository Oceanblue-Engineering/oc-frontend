# Implementation Plan: Fix Lead Card and Column Height in Pre-Sale Pipeline

**နေ့စွဲ:** 2026-09-29  
**App:** `OB-frontend`  
**ဖိုင်:** `OB-frontend/pages/ClientLeads.tsx`

---

## ၁။ ရည်ရွယ်ချက် (Objective)
Pre-sale Pipeline (Client Leads) စာမျက်နှာ (`/clients`) ပေါ်ရှိ Lead Card များ၏ height ကို တညီတညွတ်တည်း ပုံသေ (fixed / uniform height) ဖြစ်စေရန်နှင့် Stage Columns များ၏ အမြင့်ကို ညီညာပြေပြစ်အောင် ပြင်ဆင်ရန် ဖြစ်ပါသည်။

---

## ၂။ လက်ရှိ ပြဿနာ သုံးသပ်ချက် (Current Issues)
1. **Lead Cards မညီခြင်း:**
   - Lead တစ်ခုချင်းစီတွင် `companyName` ပါရှိပါက ၃ လိုင်း (Name + Company + Phone/Email) ဖြစ်ပြီး၊ `companyName` မပါရှိပါက ၂ လိုင်း (Name + Phone/Email) သာ ရှိသဖြင့် Card အမြင့်များ မညီမညာ (uneven height) ဖြစ်နေသည်။
2. **Stage Columns မညီခြင်း:**
   - Leads များသော Column (ဥပမာ- Sale Inquiry) သည် ရှည်လျားပြီး Leads မရှိသော Column (ဥပမာ- Follow-up, Ghost) များသည် တိုလွန်းနေကာ grid ပေါ်တွင် ကြည့်မကောင်းဖြစ်နေသည်။

---

## ၃။ ပြင်ဆင်မည့် ဖိုင်များ (Files to Modify)
- `OB-frontend/pages/ClientLeads.tsx`

---

## ၄။ အကောင်အထည်ဖော်မည့် အဆင့်များ (Implementation Steps)

### အဆင့် (၁): Individual Lead Cards အမြင့်ကို Fixed / Uniform ပြုလုပ်ခြင်း
- Lead Card `<button>` အတွင်း `h-24` (သို့မဟုတ် `min-h-[96px]`) နှင့် `flex flex-col justify-between` layout အသုံးပြုမည်။
- Company Name နေရာအတွက် `<p className="text-xs text-slate-500 truncate h-4 leading-4">` သတ်မှတ်ပြီး ကုမ္ပဏီအမည် မရှိပါက `—` သို့မဟုတ် နေရာလွတ် အချိုးညီထားရှိမည်။
- ဖုန်းနံပါတ်/အီးမေးလ် လိုင်းကို card ၏ အောက်ခြေတွင် တစ်ညီတည်း ပြသမည်။

```tsx
<button
  key={c._id}
  onClick={() => handleEdit(c)}
  className="w-full text-left bg-ocean-50/40 hover:bg-ocean-50 border border-ocean-100 rounded-xl p-3 transition-all hover:border-ocean-300 cursor-pointer h-24 flex flex-col justify-between"
>
  <div>
    <span className="font-semibold text-slate-800 text-sm truncate block">
      {c.name}
    </span>
    <p className="text-xs text-slate-500 truncate mt-0.5 h-4 leading-4">
      {c.companyName || "—"}
    </p>
  </div>
  <p className="text-xs text-slate-400 truncate">
    {c.phone || c.email || "—"}
  </p>
</button>
```

### အဆင့် (၂): Stage Column Box များ၏ အမြင့်ကို ညီညာစေခြင်း
- Stage Column container (`div`) တွင် `min-h-[460px] flex flex-col` သတ်မှတ်မည်။
- Leads များ ပြသသည့် အကန့်ကို `flex-1 space-y-2 overflow-y-auto max-h-[520px] pr-1` ထားရှိမည်။
- Leads မရှိသည့် stage များတွင်လည်း အမြင့်ညီညာစွာ ဖြစ်နေစေမည်။

---

## ၅။ Data & API ပြောင်းလဲမှု (Data / API Changes)
- မရှိပါ (UI/CSS ချိန်ညှိမှု သာဖြစ်ပါသည်)။

---

## ၆။ ဖြစ်နိုင်ချေရှိသော ပြဿနာများနှင့် ဖြေရှင်းချက် (Edge Cases)
- **နာမည်ရှည်လျားခြင်း / Text Overflow:** `truncate` class ကို အသုံးပြုထားပြီး ဖြစ်သဖြင့် card ပုံပျက်ခြင်း မဖြစ်စေပါ။
- **Leads အရေအတွက် များပြားလာခြင်း:** Column အမြင့်ကို ပုံသေထားပြီး အတွင်း၌ scroll (`overflow-y-auto`) ပြုလုပ်နိုင်သဖြင့် card များစွာရှိသော်လည်း column ပုံပျက်သွားမည် မဟုတ်ပါ။

---

## ၇။ စမ်းသပ်စစ်ဆေးမည့် နည်းလမ်း (Testing Approach)
1. Browser တွင် `/clients` စာမျက်နှာကို refresh လုပ်၍ card အားလုံး အမြင့် ညီမညီ စစ်ဆေးခြင်း။
2. `companyName` မပါသော lead (ဥပမာ- `Hnin`) နှင့် ပါသော lead (ဥပမာ- `WTDM`, `Aung Aung Oo`) တို့ အမြင့် တူညီမှု ရှိမရှိ စစ်ဆေးခြင်း။
3. Responsive အနေအထား (Mobile, Tablet, Desktop) တွင် စစ်ဆေးခြင်း။
