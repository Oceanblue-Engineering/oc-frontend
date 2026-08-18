# Plan: Project Detail Page တွင် Project Expense ထည့်သွင်းနိုင်သည့် Feature ထည့်သွင်းခြင်း

**Date:** 2026-08-18
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**App:** `OB-frontend` & `OB-backend`

---

## 1. Objective (ရည်ရွယ်ချက်)

Project Detail Analytics စာမျက်နှာ (`/projects/:projectId/analytics`) ထဲမှနေ၍ သက်ဆိုင်ရာ Project အတွက် ကုန်ကျစရိတ် (Expense) များကို တိုက်ရိုက် စာရင်းသွင်းနိုင်ရန် (`+ Add Expense`) နှင့် အဆိုပါ Project ၏ အသုံးစရိတ်စာရင်းများကို ဇယား (Table) ဖြင့် အသေးစိတ် ကြည့်ရှု/စီမံနိုင်ရန်။

---

## 2. Problem & Root Cause Analysis (ပြဿနာနှင့် စိစစ်တွေ့ရှိချက်များ)

1. **Frontend:**
   * လက်ရှိ `ProjectDetailAnalytics.tsx` တွင် Financial Summary, Expense Chart, Monthly Trends များကိုသာ ပြသထားပြီး Project အသုံးစရိတ် အသစ် ထည့်သွင်းနိုင်သည့် ခလုတ် (Button) သို့မဟုတ် Modal မရှိပါ။
   * အသုံးစရိတ်စာရင်း အသေးစိတ်ကို ပြသပေးသည့် Table မပါဝင်သေးပါ။
2. **Backend (`projectAnalytics.controller.js`):**
   * `getProjectExpenses` controller တွင် Expense Model ၏ Field အမည်များ လွဲမှားနေပါသည် (`expenseType` အစား `category`၊ `expenseDate` အစား `date`၊ `isDeleted` အစား `softDeleted`)။ ထို့ကြောင့် Project Expenses API မှ ဒေတာ အမှန်မထွက်ဘဲ Analytics Chart များတွင် ဒေတာ မှားယွင်းနိုင်ပါသည်။

---

## 3. Proposed Changes (အကောင်အထည်ဖော်မည့် အပြောင်းအလဲများ)

### 3.1 Backend (`OB-backend`)

#### [MODIFY] [`OB-backend/src/controllers/projectAnalytics.controller.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/controllers/projectAnalytics.controller.js)
* `getProjectExpenses`:
  * `filter` တွင် `isDeleted: false` အစား `softDeleted: false` သို့ ပြင်ဆင်ခြင်း။
  * Date range filter တွင် `filter.expenseDate` အစား `filter.date` သို့ ပြင်ဆင်ခြင်း။
  * Sorting ကို `{ date: -1 }` ဖြင့် ပြင်ဆင်ခြင်း။
  * Category grouping တွင် `exp.expenseType` အစား `exp.category` သို့ ပြင်ဆင်ခြင်း။
  * Monthly grouping တွင် `exp.expenseDate` အစား `exp.date` သို့ ပြင်ဆင်ခြင်း။
  * Expense list ကို `adminId` (name, role) နှင့် `locationId` (locationName, locationCode) populate ပြုလုပ်ခြင်း။
* `getProjectFinancialSummary`:
  * `expenseFilter` တွင် `isDeleted: false` အစား `softDeleted: false` သာ ထားရှိခြင်း။

---

### 3.2 Frontend (`OB-frontend`)

#### [NEW] [`OB-frontend/components/ProjectAnalytics/ProjectExpenseModal.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ProjectAnalytics/ProjectExpenseModal.tsx)
* Project အတွက် Expense အသစ် ထည့်သွင်းနိုင်သည့် Modal Component:
  * Category Dropdown (`electricity`, `water`, `utilities`, `salary`, `maintenance`, `rent`, `materials`, `transportation`, `other`)
  * Amount (MMK) Input
  * Date Input (Default: ယနေ့ရက်စွဲ)
  * Location Profile Select (Cashier မဟုတ်ပါက ရွေးချယ်နိုင်ပြီး၊ Cashier ဖြစ်ပါက မိမိ Assigned Location အလိုအလျောက် သတ်မှတ်ခြင်း)
  * Notes Textarea (Optional)
  * `projectId` ကို လက်ရှိ Project ID အဖြစ် အလိုအလျောက် ချိတ်ဆက်ပေးပို့ခြင်း
  * `createExpense` API ဖြင့် ချိတ်ဆက်ခေါ်ယူခြင်း

#### [NEW] [`OB-frontend/components/ProjectAnalytics/ProjectExpensesTable.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/ProjectAnalytics/ProjectExpensesTable.tsx)
* Project နှင့် သက်ဆိုင်သော Expense များအား စာရင်းဇယားဖြင့် ပြသပေးမည့် Component:
  * စဉ်နံပါတ်၊ ရက်စွဲ၊ Category badge၊ Notes၊ စာရင်းသွင်းသူ (Recorded By)၊ Amount (MMK)
  * Delete action (Owner ခွင့်ပြုချက်ဖြင့် ဖျက်နိုင်ခြင်း)

#### [MODIFY] [`OB-frontend/pages/ProjectDetailAnalytics.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/ProjectDetailAnalytics.tsx)
* Header အပိုင်းတွင် **`+ Add Expense`** button ထည့်သွင်းခြင်း။
* Quick Actions တွင်လည်း **`+ Add Expense`** button ထည့်သွင်းခြင်း။
* `ProjectExpenseModal` ဖွင့်/ပိတ် state များ ထည့်သွင်းပြီး သိမ်းဆည်းပြီးပါက `loadData()` ဖြင့် Analytics, Charts, Financial Summary များကို အလိုအလျောက် Refresh လုပ်စေခြင်း။
* Expense Breakdown Chart အောက်တွင် `ProjectExpensesTable` ကို ထည့်သွင်းပြသခြင်း။

#### [MODIFY] [`OB-frontend/translations/en.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/translations/en.ts) & [`OB-frontend/translations/my.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/translations/my.ts)
* Project Expenses အတွက် လိုအပ်သော i18n Translation keys များ ထည့်သွင်းခြင်း (`addExpense`, `expenseList`, `noProjectExpenses`, etc.)။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

### 4.1 Manual Verification (လက်တွေ့စမ်းသပ်ခြင်း)
1. Project Detail Analytics page (`/projects/:projectId/analytics`) သို့ ဝင်ရောက်ခြင်း။
2. Header ရှိ **`+ Add Expense`** ခလုတ်ကို နှိပ်ပြီး Modal ပေါ်လာခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
3. Category, Amount, Date, Notes များ ဖြည့်သွင်းပြီး Save ပြုလုပ်ခြင်း။
4. အသုံးစရိတ်အသစ်သည်:
   * Financial Summary (Total Expenses, Total Cost, Profit Margin) တွင် တိုးလာခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
   * Expense Breakdown Pie Chart တွင် ချက်ချင်း အချိုးအစား ပြောင်းလဲပေါ်လာခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
   * Monthly Trends Chart တွင် ထည့်သွင်းတွက်ချက်ပြသခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
   * Project Expenses Table တွင် စာရင်းအသစ်အဖြစ် တန်းပေါ်လာခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း။
5. Language toggle (EN ⇄ မြန်မာ) ပြုလုပ်ပြီး ဘာသာစကား အားလုံး မှန်ကန်စွာ ပေါ်မပေါ် စစ်ဆေးခြင်း။
