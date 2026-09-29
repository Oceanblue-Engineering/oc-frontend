# Implementation Plan: Stage Columns Scrolling with Max 3 Visible Cards

**နေ့စွဲ:** 2026-09-29  
**App:** `OB-frontend`  
**ဖိုင်:** `OB-frontend/pages/ClientLeads.tsx`

---

## ၁။ ရည်ရွယ်ချက် (Objective)
Pre-sale Pipeline ရှိ Stage Columns များတွင် Card အများဆုံး ၃ ကတ် (Max 3 cards) သာ မျက်နှာပြင်ပေါ်တွင် ညီညာစွာ ပြသစေပြီး၊ ၃ ကတ်ထက် ကျော်လွန်သော Leads များရှိပါက Column အတွင်း၌ Scroll (`overflow-y-auto`) ပြုလုပ်၍ ကြည့်ရှုနိုင်ရန် ပြင်ဆင်ရန် ဖြစ်ပါသည်။

---

## ၂။ လက်ရှိ ပြဿနာ သုံးသပ်ချက် (Current Issues)
- `Sale Inquiry` ကဲ့သို့ Leads များပြားသော Stage တွင် ၅ ကတ် (သို့မဟုတ် ထို့ထက်ပို၍) ဆက်တိုက်ထွက်လာသဖြင့် Column သည် အောက်ဘက်သို့ အလွန်အမင်း ရှည်လျားသွားသည်။
- ဘေးရှိ အခြား Columns များ (ဥပမာ- Product Explain, Sent Quotation) နှင့် အမြင့်မညီမညာ ဖြစ်ပေါ်စေသည်။

---

## ၃။ အမြင့် တွက်ချက်မှု (Height Calculation for 3 Cards)
- Card တစ်ခုချင်းစီ၏ အမြင့် = `h-24` (96px)
- Cards များကြား အကွာအဝေး (`space-y-2`) = 8px
- Card ၃ ခုအတွက် စုစုပေါင်း အမြင့် = (96px × 3) + (8px × 2) = **304px**
- ထို့ကြောင့် Cards list container ၏ `max-h` ကို `308px` (သို့မဟုတ် `h-[308px]`) သတ်မှတ်ပေးပြီး `overflow-y-auto` ထည့်သွင်းခြင်းဖြင့် ကတ် ၃ ခု အတိအကျသာ ပေါ်နေမည်ဖြစ်ပြီး၊ ၄ ခုမြောက်ကတ်မှစ၍ scroll ပြုလုပ်ရမည် ဖြစ်ပါသည်။

---

## ၄။ ပြင်ဆင်မည့် ဖိုင် (Files to Modify)
- `OB-frontend/pages/ClientLeads.tsx`

---

## ၅။ အကောင်အထည်ဖော်မည့် အသေးစိတ် (Implementation Details)

### အဆင့် (၁): Stage Column Box အမြင့် ချိန်ညှိခြင်း
Stage Column ၏ အမြင့်ကို fixed/compact ပုံစံ ဖြစ်စေရန်:
- Container ၏ အမြင့်ကို header (36px) + cards container (308px) + padding (32px) = အကြမ်းဖျင်း `h-[390px]` (သို့မဟုတ် တညီတညွတ်တည်း အချိုးကျ) သတ်မှတ်မည်။

### အဆင့် (၂): Cards Container တွင် Max 3 Cards Scroll သတ်မှတ်ခြင်း
```tsx
<div className="space-y-2 h-[308px] overflow-y-auto pr-1 custom-scrollbar">
  {stageClients.length === 0 && (
    <div className="h-full flex items-center justify-center">
      <p className="text-xs text-slate-400 text-center">
        {t("clients.noLeads")}
      </p>
    </div>
  )}
  {stageClients.map((c) => (
    <button
      key={c._id}
      onClick={() => handleEdit(c)}
      className="w-full text-left bg-ocean-50/40 hover:bg-ocean-50 border border-ocean-100 rounded-xl p-3 transition-all hover:border-ocean-300 cursor-pointer h-24 flex flex-col justify-between shrink-0"
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
  ))}
</div>
```

---

## ၆။ Data & API ပြောင်းလဲမှု (Data / API Changes)
- မရှိပါ (UI/CSS ချိန်ညှိမှု သာဖြစ်ပါသည်)။

---

## ၇။ စမ်းသပ်စစ်ဆေးမည့် နည်းလမ်း (Testing Approach)
1. Browser တွင် `/clients` စာမျက်နှာကို refresh ပြုလုပ်ခြင်း။
2. `Sale Inquiry` stage တွင် ကတ် ၃ ခုသာ မြင်တွေ့ရပြီး အောက်ဘက်သို့ ချောမွေ့စွာ scroll ဆွဲ၍ ကျန်ရှိသော ကတ်များကို ကြည့်ရှုနိုင်ခြင်း ရှိမရှိ စစ်ဆေးခြင်း။
3. Columns အားလုံး (Leads မရှိသော stage များအပါအဝင်) အမြင့် ညီညီညာညာ တစ်ပြေးညီ ဖြစ်မဖြစ် စစ်ဆေးခြင်း။
4. `npm run build` ပြုလုပ်၍ syntax/type error မရှိကြောင်း စစ်ဆေးခြင်း။
