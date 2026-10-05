# StatsCard Component တွင် icon is not defined ReferenceError အား ပြုပြင်ခြင်း အစီအစဉ် (Implementation Plan)

## ၁။ ပြဿနာ တွေ့ရှိချက် (Root Cause Analysis)

`Personal Expenses` (သို့မဟုတ် StatsCard အသုံးပြုထားသော မည်သည့်စာမျက်နှာမဆို) ဖွင့်လှစ်ချိန်တွင်:
```
Uncaught ReferenceError: icon is not defined
    at StatsCard (stats-card.tsx:77:10)
```
ဟူသော runtime error ဖြစ်ပေါ်ရခြင်း ဖြစ်ပါသည်။

**အကြောင်းရင်း:**
- [stats-card.tsx](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/stats-card.tsx) ၏ `StatsCardProps` interface တွင် `icon: React.ReactNode` ပါဝင်သော်လည်း၊ `StatsCard` function ၏ props destructuring parameter စာရင်းတွင် `icon` အား မတော်တဆ ချန်လှပ်မိခဲ့ပါသည်။
- သို့ဖြစ်ပါ၍ JSX အောက်ခြေ လိုင်း ၇၇ ရှိ `{icon}` ကို render လုပ်ရန် ကြိုးစားချိန်တွင် `icon is not defined` ReferenceError တက်ကာ စာမျက်နှာ crash ဖြစ်သွားရခြင်း ဖြစ်ပါသည်။

---

## ၂။ ဖြေရှင်းမည့် ရည်မှန်းချက် (Objective)

[stats-card.tsx](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ui/stats-card.tsx) ၏ `StatsCard` parameter list တွင် `icon` prop ကို ပြန်လည်ထည့်သွင်းပေးမည်။

```tsx
export function StatsCard({
  label,
  title,
  value,
  subValue,
  description,
  icon,
  variant = "ocean",
  className,
  onClick,
}: StatsCardProps) {
```

---

## ၃။ ပြင်ဆင်မည့် ဖိုင် (Files to Modify)

- **`OB-frontend/components/ui/stats-card.tsx`**:
  - လိုင်း ၂၅-၃၄ ရှိ destructuring argument တွင် `icon` ထည့်သွင်းခြင်း။

---

## ၄။ စမ်းသပ်စစ်ဆေးမည့် နည်းလမ်း (Verification & Testing)

1. `npm run build` ဖြင့် compile စစ်ဆေးခြင်း။
2. `Personal Expenses` စာမျက်နှာတွင် StatsCard များ error လုံးဝမတက်ဘဲ Icon များနှင့် Label များ မှန်ကန်စွာ ပေါ်လာခြင်း ရှိမရှိ စစ်ဆေးခြင်း။
