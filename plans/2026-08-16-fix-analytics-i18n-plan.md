# Plan: Fix Project Analytics i18n (Hardcoded Myanmar Strings)

**Date:** 2026-08-16
**Status:** Draft
**App:** Dashboard (`OB-frontend`)

---

## Objective

Analytics စာမျက်နှာတွင် **English ရွေးထားသော်လည်း Myanmar စာသားများ ပေါ်နေခြင်း** ကို ဖြေရှင်းရန်။ user-facing string အားလုံးကို `t()` (translation) မှတစ်ဆင့် language-aware ဖြစ်အောင် ပြောင်းမည်။

## Root Cause

Component များတွင် string များကို `t()` မသုံးဘဲ **hardcode** လုပ်ထားသည်။ အချို့က Myanmar (ဥပမာ `စုစုပေါင်းကုန်ကျစရိတ်`, `ဦး`, `ရက်`, `ကျပ်`)၊ အချို့က English (ဥပမာ `Total Expenses`, `Days Elapsed`)။ ဒါကြောင့် language ပြောင်းလည်း စာသားမပြောင်းပါ။

## Files to Modify (၇ ဖိုင်)

1. **`translations/en.ts`** — `projects` namespace တွင် key အသစ်များ ထည့်ရန် (English တန်ဖိုးများ)
2. **`translations/my.ts`** — `projects` namespace တွင် key အသစ်များ ထည့်ရန် (Myanmar တန်ဖိုးများ)
3. **`services/ProjectAnalytics/projectAnalytics.service.ts`** — `formatCurrency` ကို language-aware ဖြစ်အောင် ပြင်ရန်
4. **`pages/ProjectDetailAnalytics.tsx`** — inline unit suffix များ (`ဦး`,`ရက်`,`နာရီ`,`မှတ်တမ်း`,`အမျိုးအစား`,`လ`,`ပြီးပြီ`) ကို `t()` ဖြင့် အစားထိုးရန်
5. **`components/ProjectAnalytics/FinancialStatsCards.tsx`** — label/subtitle အားလုံး `t()` သို့ ပြောင်းရန်
6. **`components/ProjectAnalytics/PayrollSummaryTable.tsx`** — table header, footer, pagination, empty-state စာသားများ `t()` သို့
7. **`components/ProjectAnalytics/MonthlyTrendsChart.tsx`** + **`ExpenseBreakdownChart.tsx`** — chart label, legend, tooltip, month name, currency unit များ language-aware ဖြစ်အောင်

## Implementation Approach

### 1. Translation keys တိုးချဲ့ခြင်း
`projects` namespace ထဲ key အုပ်စုအသစ်များ ထည့်မည် (en.ts + my.ts နှစ်ခုစလုံး)—

- **Unit suffixes:** `unitWorkers`(ဦး), `unitDays`(ရက်), `unitHours`(နာရီ), `unitRecords`(မှတ်တမ်း), `unitCategories`(အမျိုးအစား), `unitMonths`(လ), `unitItems`(ခု), `complete`(ပြီးပြီ), `currencyKyat`(ကျပ်)
- **FinancialStatsCards:** `financialOverview`, `totalExpenses`, `totalPayroll`, `totalCost`, `estimatedRevenue`, `estimatedProfit`, `profitMargin`, `projectTimeline`, `projectPerformance`, `workers`, `hoursWorked`, `attendance`, `start`, `end`, `financialHealth`, `roiRatio`, `timelineHealth`, `ahead`, `onTrack`, `marginExcellent`/`marginGood`/`marginWarning`, `roiHigh`/`roiGood`/`roiLow`, `aheadDesc`/`onTrackDesc`
- **PayrollSummaryTable:** `workerPayrollList`, `noWorkerData`, `count`, `total`, `colName`, `colPosition`, `colDailyRate`, `colHours`, `colAttendance`, `average`, `page`, `prev`, `next`
- **Charts:** `loadingData`, `noMonthlyData`, `noExpenseData`, `expenses`, `payroll`, `monthlyExpenseTrends`, `lineChart`/`barChart`/`areaChart`, `highestMonth`/`lowestMonth`/`avgMonthly`/`period`, `perMonth`/`totalTime`, `ofTotal`, `mainCategory`, `highestExpense`/`lowestExpense`/`avgExpense`, `perItem`

> ရှိပြီးသား key များ (`expenseBreakdown`, `categories`, `totalWorkers` စသည်) ကို ပြန်သုံးမည် — ထပ်မထည့်ပါ။

### 2. Component များတွင် `useLanguage()` ခေါ်ခြင်း
Component လေးခုစလုံးတွင် `const { t, language } = useLanguage();` ထည့်၍ hardcode string များကို `t("projects.xxx")` ဖြင့် အစားထိုးမည်။

### 3. Currency language-aware
`formatCurrency(amount, language)` အဖြစ် ပြင်မည်—
- **my:** ယခုအတိုင်း (`သိန်း`/`သန်း`/`ထောင်`/`ကျပ်`)
- **en:** `Math.floor(amount).toLocaleString("en-US") + " Ks"` (ဥပမာ `0 Ks`, `45,000,000 Ks`)

Page က `useLanguage()` မှ `language` ရယူ၍ component များသို့ `(n) => formatCurrency(n, language)` အဖြစ် ပေးပို့မည် (component props signature မပြောင်း)။ Chart နှစ်ခု၏ local formatter များကိုလည်း `language` branch ထည့်မည်။

### 4. Month names language-aware (MonthlyTrendsChart)
`language === "en"` ဆိုလျှင် English လအမည် (`Jan`,`Feb`,...)၊ မဟုတ်လျှင် Myanmar (`ဇန်နဝါရီ`,...) ပြမည်။

### 5. FinancialStatsCards subtitle ကိစ္စ
Card တစ်ခုစီတွင် English title + Myanmar subtitle (အဓိပ္ပာယ်တူ) နှစ်ကြောင်း ရှိနေသည်။ i18n မှန်ကန်စေရန် **title တစ်ကြောင်းတည်း** localized ဖြစ်အောင်ထား၍ ထပ်နေသော Myanmar subtitle `<p>` များကို ဖယ်မည်။ (Myanmar mode တွင် title က Myanmar ပြမည်၊ English mode တွင် English ပြမည်။)

## Edge Cases

- `t()` သည် key မတွေ့လျှင် English fallback၊ ထို့နောက် key string ကိုယ်တိုင် ပြန်ပေးသည် — crash မဖြစ်ပါ။
- Interpolation (ဥပမာ pagination "Page 1 / 3") ကို `` `${t("projects.page")} ${currentPage} / ${totalPages}` `` ဖြင့် ရေးမည် (t() က param မထောက်ပံ့သဖြင့်)။
- Backend data (status `In-Development`, customer name, project name, description) များကို ဘာသာမပြန် — data အတိုင်းထားမည်။
- Chart Y-axis short format (`K`/`M`) သည် language-neutral ဖြစ်ပြီးသား — မပြင်ပါ။

## Test Plan

1. `npm run build` — compile အောင်မြင်ကြောင်း စစ်ရန်။
2. Browser တွင် language = **English** ရွေး၍ analytics page ဝင်ကာ Myanmar စာသား လုံးဝ မကျန်ကြောင်း စစ်ရန် (labels, units, currency `Ks`, chart legend, table)။
3. language = **Myanmar** ပြန်ရွေး၍ အားလုံး Myanmar ပြန်ပြောင်းကြောင်း စစ်ရန်။
