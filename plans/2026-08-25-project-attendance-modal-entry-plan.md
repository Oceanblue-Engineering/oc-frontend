# Plan: Project Attendance အား Modal ဖြင့် Worker နှင့် Date ရွေးချယ်ထည့်သွင်းသည့် စနစ်သို့ ပြောင်းလဲခြင်း

**Date:** 2026-08-25
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**Apps:** `OB-frontend` & `OB-backend`

---

## 1. Objective (ရည်ရွယ်ချက်)

လက်ရှိ Attendance စာမျက်နှာတွင် Worker အားလုံးကို Default အနေဖြင့် တန်းမပြတော့ဘဲ **"+ Add Worker Attendance" (သို့မဟုတ် Add Entry)** ခလုတ်နှိပ်ပါက ပေါ်လာမည့် **Modal (Popup)** တွင် **Date** နှင့် **Worker** အား စိတ်ကြိုက် ရွေးချယ်ဖြည့်စွက်ပြီးမှ သက်ဆိုင်ရာ စာရင်းဇယားတွင် ပေါ်ပေါက်လာစေမည့် စနစ်သို့ ပြောင်းလဲတည်ဆောက်ရန်။

---

## 2. User Experience & Workflow (လုပ်ဆောင်ချက် အဆင့်ဆင့်)

1. **Daily Attendance Entry Tab (ဇယားကွက်):**
   * ရွေးချယ်ထားသော နေ့စွဲ (Date) အတွက် **အမှန်တကယ် ထည့်သွင်းထားသော ဝန်ထမ်းများ၏ စာရင်းကိုသာ** ဇယားတွင် ပြသပေးမည် (ယခင်ကဲ့သို့ ဝန်ထမ်းအားလုံး အလိုအလျောက် Absent ဖြင့် တန်းမပေါ်တော့ပါ)။
   * စာရင်း မရှိသေးပါက သပ်ရပ်သော **Empty State** နှင့်အတူ **"+ Add Worker Attendance"** ခလုတ် ပြသပေးမည်။
   * အတန်းတစ်ခုချင်းစီတွင် ✏️ **Edit** (Modal ပြန်ဖွင့်၍ ပြင်ဆင်ခြင်း) နှင့် 🗑️ **Delete** (စာရင်းမှ ဖယ်ရှားခြင်း) ခလုတ်များ ပါဝင်မည်။

2. **Add / Edit Attendance Modal (ထည့်သွင်း/ပြင်ဆင်မည့် Modal):**
   * **Date Picker:** ရက်စွဲ ရွေးချယ်ခြင်း (Default: လက်ရှိ ရွေးထားသော နေ့စွဲ)
   * **Worker Selector:** ဝန်ထမ်းများထဲမှ တစ်ဦးကို Dropdown ဖြင့် ရွေးချယ်ခြင်း (Daily Rate အလိုအလျောက် ပေါ်လာမည်)
   * **Status:** `Present` (100%), `Half Day` (50%), `OT Only`, `Absent`
   * **Shift:** `Day Shift`, `Night Shift`, `Full Day`
   * **OT Amount (Ks):** အချိန်ပို လုပ်အားခ ရိုက်ထည့်ခြင်း
   * **Calculated Wage Earned:** ရရှိမည့် လုပ်အားခကို အလိုအလျောက် တွက်ချက်ပြသခြင်း
   * **Notes:** မှတ်ချက် ရေးသွင်းခြင်း
   * **Buttons:** `Save Attendance`, `Cancel`

3. **Payroll & Summary Report Tab:**
   * ဤ Tab တွင် ထည့်သွင်းထားသမျှ Attendance မှတ်တမ်းများအပေါ် အခြေခံ၍ ဝန်ထမ်းတစ်ဦးချင်းစီ၏ စုစုပေါင်း အလုပ်ဆင်းရက်၊ OT စုစုပေါင်းနှင့် ပေးချေရမည့် လုပ်အားခ စာရင်းချုပ်ကို ဆက်လက် တွက်ချက်ပြသပေးမည်။

---

## 3. Proposed Changes (အကောင်အထည်ဖော်မည့် အဆင့်များ)

### အဆင့် ၁: Backend API ပံ့ပိုးမှု (`OB-backend`)
* **[MODIFY] [`controllers/attendance.controller.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/controllers/attendance.controller.js):**
  * `deleteAttendanceRecord`: သီးခြား Attendance Record တစ်ခုအား ဖျက်သိမ်းနိုင်သော API Controller ထည့်သွင်းခြင်း။
* **[MODIFY] [`routes/attendance.route.js`](file:///c:/Users/PC/Desktop/OceanBlue/OB-backend/src/routes/attendance.route.js):**
  * `DELETE /projects/:projectId/attendance/:attendanceId` endpoint ထည့်သွင်းခြင်း။

### အဆင့် ၂: Frontend Service & Modal Component (`OB-frontend`)
* **[MODIFY] [`services/Attendance/attendance.service.ts`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/services/Attendance/attendance.service.ts):**
  * `deleteAttendance(projectId, attendanceId)` function ထည့်သွင်းခြင်း။
* **[MODIFY] [`pages/ProjectAttendance.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/pages/ProjectAttendance.tsx):**
  * Date နှင့် Worker ရွေးချယ်နိုင်သော **AddAttendanceModal** တည်ဆောက်ခြင်း။
  * ဇယားတွင် ထည့်သွင်းထားသော စာရင်းများကိုသာ စစ်ထုတ်ပြသခြင်း။
  * Edit နှင့် Delete လုပ်ဆောင်ချက်များ ထည့်သွင်းခြင်း။

---

## 4. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Modal Entry Test:**
   * "+ Add Worker Attendance" ခလုတ်နှိပ်၍ Modal ပွင့်လာခြင်း၊ Date နှင့် Worker ရွေးချယ်ပြီး Save လုပ်ပါက ဇယားထဲတွင် ချက်ချင်း စာရင်းဝင်လာမှု စစ်ဆေးခြင်း။
2. **Edit & Delete Test:**
   * ထည့်ပြီးသား Worker အား Edit နှိပ်၍ Status / OT ပြင်ဆင်နိုင်ခြင်းနှင့် Delete နှိပ်ပါက စာရင်းမှ ဖယ်ရှားနိုင်ခြင်း စစ်ဆေးခြင်း။
3. **Date Filter Check:**
   * နေ့စွဲ ပြောင်းလဲသည့်အခါ အဆိုပါနေ့အတွက် ထည့်သွင်းထားသော စာရင်းများသာ သီးသန့် ပေါ်လာမှု စစ်ဆေးခြင်း။
4. **Summary & Payroll Check:**
   * Summary Tab တွင် စုစုပေါင်း လုပ်အားခများ တိကျစွာ တွက်ချက်မှု ရှိ/မရှိ စစ်ဆေးခြင်း။
5. **Build Test:**
   * `npm run build` ဖြင့် compile error မရှိကြောင်း စစ်ဆေးခြင်း။
