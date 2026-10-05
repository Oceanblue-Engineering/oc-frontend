# Personal Expenses စာမျက်နှာရှိ Stats Cards များတွင် Labels (ခေါင်းစဉ်များ) ထည့်သွင်းပြသခြင်း အစီအစဉ် (Implementation Plan)

## ၁။ ပြဿနာ တွေ့ရှိချက် (Root Cause Analysis)

အသုံးပြုသူ ပေးပို့ထားသော ပုံတွင် `Personal Expenses` (ကိုယ်ပိုင်အသုံးစရိတ်များ) စာမျက်နှာ၏ ထိပ်ပိုင်းရှိ Stats Cards (၄) ခုတွင် ငွေပမာဏ (`865,500 MMK`, `1,019,500 MMK`, `154,000 MMK`, `1,019,500 MMK`) များနှင့် Icons များသာ ပေါ်နေပြီး၊ အဆိုပါ ငွေပမာဏများသည် မည်သည့် အသုံးစရိတ်ကို ကိုယ်စားပြုသည်ကို ဖော်ပြသည့် **Labels / Titles (ခေါင်းစဉ်စာသားများ)** ပေါ်မလာဘဲ ကွက်လပ်ဖြစ်နေပါသည်။

**အဓိက အကြောင်းရင်း:**
- [stats-card.tsx](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/stats-card.tsx) တွင် prop အမည်များကို `label` နှင့် `subValue` ဟု သတ်မှတ်ထားသော်လည်း အချို့နေရာများတွင် `title` နှင့် `description` ဟု ပေးပို့ခေါ်ဆိုခဲ့ခြင်းကြောင့် prop mismatch ဖြစ်ကာ စာသားများ မပေါ်ဘဲ ဖြစ်ခဲ့ရခြင်း ဖြစ်ပါသည်။

---

## ၂။ ဖြေရှင်းမည့် ရည်မှန်းချက် (Objective)

1. [stats-card.tsx](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/stats-card.tsx) component တွင် `label` (သို့) `title`၊ `subValue` (သို့) `description` မည်သည့် prop ဖြင့် ပေးပို့သည်ဖြစ်စေ အလိုအလျောက် fallback ဖတ်ရှုနိုင်ရန် robust ပြုလုပ်မည်။
2. [PersonalExpenses.tsx](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/PersonalExpenses.tsx) တွင် Stats Cards (၄) ခုအတွက် ရှင်းလင်းတိကျသော ခေါင်းစဉ် (Labels) နှင့် အရေအတွက် (Sub-values) များကို မြန်မာ/အင်္ဂလိပ် ၂ ဘာသာဖြင့် သေသပ်စွာ ထည့်သွင်းပြသပေးမည်:
   - **Card 1 (Wallet Icon - Emerald):**
     - Label: `"ရွေးချယ်ထားသော ကာလ စုစုပေါင်း"` / `"Selected Period Total"`
     - SubValue: `"{N} ကြိမ် အသုံးပြုထားသည်"` / `"{N} transactions"`
   - **Card 2 (Calendar Icon - Blue):**
     - Label: `"ယခုလ အသုံးစရိတ်"` / `"This Month"`
     - SubValue: `"{N} ကြိမ်"` / `"{N} transactions"`
   - **Card 3 (Trending Icon - Amber):**
     - Label: `"ယခုအပတ် အသုံးစရိတ်"` / `"This Week"`
     - SubValue: `"{N} ကြိမ်"` / `"{N} transactions"`
   - **Card 4 (CreditCard Icon - Purple):**
     - Label: `"စုစုပေါင်း အသုံးစရိတ်"` / `"All-Time Total"`
     - SubValue: `"စုစုပေါင်း {N} ခု"` / `"Total {N} records"`
3. ကတ်တစ်ခုချင်းစီ၏ Icon Background အရောင်များ (`variant="emerald"`, `"ocean"`, `"amber"`, `"purple"`) ကိုပါ လှပညီညွတ်စွာ တွဲဖက်သတ်မှတ်ပေးမည်။

---

## ၃။ ပြင်ဆင်မည့် ဖိုင်များ (Files to Modify)

1. **`OB-frontend/components/ui/stats-card.tsx`**:
   - `StatsCardProps` တွင် `title?: React.ReactNode` နှင့် `description?: React.ReactNode` ကို optional အဖြစ် ထည့်သွင်းခြင်း။
   - Component rendering တွင် `const displayLabel = label ?? title;` နှင့် `const displaySubValue = subValue ?? description;` ဖြင့် prop mismatch ပြဿနာကို အပြီးတိုင် ကာကွယ်ခြင်း။
2. **`OB-frontend/pages/PersonalExpenses.tsx`**:
   - Stats Cards (၄) ခု၏ props များအား `label`, `title`, `subValue`, `description`, `variant` စသည်တို့ကို ပြည့်စုံသေချာစွာ ဖြည့်သွင်းခြင်း။

---

## ၄။ စမ်းသပ်စစ်ဆေးမည့် နည်းလမ်း (Verification & Testing)

1. **TypeScript Build Check**:
   - `npm run build` ဖြင့် error ကင်းရှင်းစွာ bundle ထွက်ရှိခြင်း ရှိမရှိ စစ်ဆေးမည်။
2. **Visual UI Check**:
   - Personal Expenses စာမျက်နှာတွင် ကတ် (၄) ခုစလုံး၏ ထိပ်ပိုင်းတွင် Label ခေါင်းစဉ်များနှင့် အောက်ခြေတွင် sub-value အရေအတွက်များ ရှင်းလင်းသပ်ရပ်စွာ ပေါ်လာခြင်း ရှိမရှိ စစ်ဆေးမည်။
