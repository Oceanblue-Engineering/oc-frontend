# Plan: Project Analytics စာမျက်နှာအား Tab များဖြင့် သီးခြားစီ ခွဲခြားပြသခြင်း (Separate Tabs for Sections)

**Date:** 2026-08-18
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**App:** `OB-frontend`

---

## 1. Objective (ရည်ရွယ်ချက်)

Project Detail Analytics စာမျက်နှာ (`/projects/:projectId/analytics`) တွင် တစ်မျက်နှာတည်း၌ အချက်အလက်များ ရှည်လျားစွာ စုပြုံနေခြင်းကို ရှင်းလင်းလွယ်ကူစေရန်အတွက် အဓိက အပိုင်းများအလိုက် **Tab များ (Overview, Expenses, Payroll & Workers, Timeline)** ဖြင့် စနစ်တကျ သီးခြားစီ ခွဲခြားပြသနိုင်ရန်။

---

## 2. Proposed Tab Structure (သတ်မှတ်မည့် Tab များ)

1. **📊 Overview (အနှစ်ချုပ်):**
   * Financial Summary Cards (`FinancialStatsCards`)
   * Project Progress & Key Highlights
   * Timeline Summary & Worker Stats အကျဉ်းချုပ်
2. **💰 Expenses (ကုန်ကျစရိတ်များ):**
   * Expense Summary Cards & `+ Add Expense` Button
   * Expense Breakdown Pie Chart (`ExpenseBreakdownChart`)
   * Monthly Expense Trends (`MonthlyTrendsChart`)
   * Project Expenses Table (`ProjectExpensesTable`)
3. **👥 Payroll & Workers (လုပ်ခနှင့် အလုပ်သမားများ):**
   * Worker Summary stats (Total Workers, Hours, Attendance, Avg Rate)
   * Payroll Summary Table (`PayrollSummaryTable`)
   * View Attendance စာမျက်နှာသို့ သွားရောက်နိုင်သည့် Quick Link
4. **📅 Timeline & Milestones (အချိန်ဇယား):**
   * Days Elapsed, Days Remaining, Progress Bar
   * Start Date, End Date, Customer & Project Notes

---

## 3. Proposed Changes (ပြင်ဆင်မည့် အစိတ်အပိုင်းများ)

### 3.1 [`OB-frontend/pages/ProjectDetailAnalytics.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/ProjectDetailAnalytics.tsx)
* **Tab State:** `activeTab` state ထည့်သွင်းခြင်း (`"overview"` | `"expenses"` | `"payroll"` | `"timeline"`)
* **Tab Navigation Bar:** Project Header ၏ အောက်တွင် လှပသေသပ်သော Tab Bar ထည့်သွင်းခြင်း (Icons, Badges, Active styling)
* **Conditional Content Rendering:** ရွေးချယ်ထားသော Tab အလိုက် သက်ဆိုင်ရာ Components များကို သီးခြားစီ Render လုပ်ခြင်း
* Responsive Layout: Mobile နှင့် Desktop အဆင်ပြေစေရန် Horizontal Scrollable Tab Bar ပြုလုပ်ခြင်း

### 3.2 [`OB-frontend/translations/en.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/translations/en.ts) & [`OB-frontend/translations/my.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/translations/my.ts)
* Tab Header များအတွက် Translation keys များ စစ်ဆေး/ဖြည့်စွက်ခြင်း (`tabOverview`, `tabExpenses`, `tabPayroll`, `tabTimeline`)

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

### 4.1 Manual Verification
1. Project Detail Analytics page သို့ ဝင်ရောက်ပြီး Tab Bar ပေါ်လာခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
2. Tab တစ်ခုချင်းစီ (Overview, Expenses, Payroll, Timeline) ကို နှိပ်ပြီး သက်ဆိုင်ရာ အပိုင်းများ သီးသန့် ကောင်းမွန်စွာ ပြသမှု ရှိ/မရှိ စစ်ဆေးခြင်း။
3. Expenses Tab ထဲတွင် `+ Add Expense` ခလုတ်နှိပ်၍ အသုံးစရိတ် ထည့်သွင်းခြင်း၊ Table နှင့် Charts များ အလုပ်လုပ်ခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
4. Payroll Tab တွင် အလုပ်သမား လုပ်ခဇယား သီးသန့် ပေါ်/မပေါ် စစ်ဆေးခြင်း။
5. Language toggle (English ⇄ မြန်မာ) တွင် Tab အမည်များ မှန်ကန်စွာ ပြောင်းလဲခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
6. `npm run build` ဖြင့် TypeScript build စစ်ဆေးခြင်း။
