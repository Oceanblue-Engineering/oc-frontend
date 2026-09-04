# Plan: Warehouse နှင့် Storefront စာမျက်နှာများတွင် Active / Inactive ခွဲခြားကြည့်ရှုနိုင်သော Tab စနစ် ထည့်သွင်းခြင်း

**Date:** 2026-09-04  
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)  
**Apps:** `OB-frontend`

---

## 1. Objective (ရည်ရွယ်ချက်)

* **Warehouse Management (`pages/Warehouse.tsx`)** နှင့် **Storefront Management (`pages/Storefront.tsx`)** စာမျက်နှာများရှိ Profiles စာရင်းတွင်:
  * လက်ရှိ အသုံးပြုနေသော **`Active` (လက်ရှိအသုံးပြုဆဲ)** ကုန်လှောင်ရုံ/ဆိုင်ခန်းများ၊
  * ပိတ်ထား/ရပ်နားထားသော **`Inactive` (ရပ်နားထားသော)** ကုန်လှောင်ရုံ/ဆိုင်ခန်းများ နှင့်
  * စုစုပေါင်း **`All` (အားလုံး)** အား
  သီးသန့် Segmented Tabs များဖြင့် လွယ်ကူရှင်းလင်းစွာ ခွဲခြား စစ်ထုတ်ကြည့်ရှုနိုင်စေရန် ပြုလုပ်ပေးမည် ဖြစ်ပါသည်။

---

## 2. Proposed UI Design & Architecture (ဒီဇိုင်းနှင့် ဖွဲ့စည်းပုံ)

### ၂.၁ Segmented Status Filter Tabs
Warehouse Profiles / Storefront Profiles ခေါင်းစဉ်ဘေး (သို့မဟုတ်) အပေါ်တွင် အောက်ပါ Filter Tabs များကို ထည့်သွင်းပေးမည်:
1. **`All` (အားလုံး):** စုစုပေါင်း အရေအတွက် Badge ဖြင့် ပြသမည် (ဥပမာ- `2`)
2. **`Active` (အသုံးပြုဆဲ):** အစိမ်းရောင် Badge & အရေအတွက် (ဥပမာ- `1`)
3. **`Inactive` (ရပ်နားထားသော):** အနီ/မီးခိုးရောင် Badge & အရေအတွက် (ဥပမာ- `1`)

### ၂.၂ Tab အလိုက် သီးသန့် Empty State
* အကယ်၍ သက်ဆိုင်ရာ Status တွင် ပရိုဖိုင်မရှိပါက:
  * Active Tab တွင် မရှိပါက: `"လက်ရှိ အသုံးပြုနေသော ကုန်လှောင်ရုံ / ဆိုင်ခန်း မရှိသေးပါ"`
  * Inactive Tab တွင် မရှိပါက: `"ရပ်နားထားသော ကုန်လှောင်ရုံ / ဆိုင်ခန်း မရှိပါ"`
  ဟု ရှင်းလင်းစွာ ပြသပေးမည်။

---

## 3. Step-by-Step Implementation Steps (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### အဆင့် ၁: `Warehouse.tsx` (`OB-frontend/pages/Warehouse.tsx`)
* `statusFilter` state (`"all" | "active" | "inactive"`) ထည့်သွင်းခြင်း (Default အား `"all"` သို့မဟုတ် `"active"` ထားရှိခြင်း)။
* `warehouseProfiles` အား ရွေးချယ်ထားသော `statusFilter` အလိုက် စစ်ထုတ်ပေးမည့် `filteredProfiles` logic ရေးသားခြင်း။
* Profiles ကတ်များ၏ အပေါ်တွင် Tab ခလုတ်များ ထည့်သွင်းပြီး အရေအတွက် Badge များ ပြသပေးခြင်း။

### အဆင့် ၂: `Storefront.tsx` (`OB-frontend/pages/Storefront.tsx`)
* `Warehouse.tsx` နည်းတူ `statusFilter` state နှင့် `filteredProfiles` logic ထည့်သွင်းခြင်း။
* Storefront Profiles ကတ်များ၏ အပေါ်တွင် Tab ခလုတ်များနှင့် အရေအတွက် Badge များ ထည့်သွင်းပေးခြင်း။

### အဆင့် ၃: ဘာသာစကား ဖော်ပြချက်များ စစ်ဆေးဖြည့်စွက်ခြင်း (`translations/my.ts` & `translations/en.ts`)
* `warehouse.all`, `warehouse.active`, `warehouse.inactive`
* `storefront.all`, `storefront.active`, `storefront.inactive`
စသည့် translation keys များ ပြည့်စုံစွာ ပါဝင်စေခြင်း။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Build Verification:**
   * `npm run build` ကို run ၍ TypeScript compilation error ကင်းရှင်းကြောင်း အတည်ပြုခြင်း။
2. **Real Chrome Browser (Playwright) E2E Test:**
   * Warehouse စာမျက်နှာတွင် `Active` Tab နှိပ်ပါက Active Profiles သာ ထွက်ပေါ်လာခြင်း စစ်ဆေးခြင်း။
   * `Inactive` Tab နှိပ်ပါက Inactive Profiles သာ သီးသန့် ထွက်ပေါ်လာခြင်း စစ်ဆေးခြင်း။
   * Storefront စာမျက်နှာတွင်လည်း တူညီစွာ စစ်ဆေးပြီး Screenshots များကို walkthrough တွင် မှတ်တမ်းတင်ခြင်း။
