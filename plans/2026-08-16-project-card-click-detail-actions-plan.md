# Plan: Project Card နှိပ်ရင် Analytics Detail သို့ သွားစေရန် + Detail Page တွင် Edit/Attendance Button ထည့်ရန်

**Date:** 2026-08-16
**Status:** Draft (approval စောင့်ဆိုင်းဆဲ)
**App:** Dashboard (`OB-frontend`)

---

## 1. Objective (ရည်ရွယ်ချက်)

Client Projects စာမျက်နှာရှိ project card တစ်ခုစီတွင် ရှိသော **Edit Details / Attendance / Analytics** button ၃ ခုကို ဖယ်ရှားပြီး —

1. **Card တစ်ခုလုံးကို နှိပ်လျှင်** ၎င်း project ၏ **Analytics detail page** (`/projects/:projectId/analytics`) သို့ တိုက်ရိုက် သွားစေရန်။
2. **Edit** နှင့် **Attendance** functionality နှစ်ခုကို **Analytics detail page ထဲသို့** ရွှေ့ထည့်ရန် (header အပိုင်းတွင် button အဖြစ်)။

---

## 2. Files to Modify (ပြင်ဆင်မည့် ဖိုင်များ)

| # | File | ပြင်ဆင်ချက် |
|---|------|-----------|
| 1 | `pages/ClientProjects.tsx` | button ၃ ခု + button row ကို ဖယ်၊ card ကို clickable (navigate → analytics) ပြုလုပ်၊ မလိုတော့သော `handleEdit`/`selected` ကို ရှင်းလင်း |
| 2 | `pages/ProjectDetailAnalytics.tsx` | header တွင် **Edit Details** + **Attendance** button ထည့်၊ `ProjectModal` ချိတ်ဆက်၊ Quick Actions ရှိ ထပ်နေသော "View Attendance" ကို ဖယ် |
| 3 | `translations/en.ts` + `translations/my.ts` | `editDetails` key အသစ် ထည့် (Attendance အတွက် ရှိပြီးသား `viewAttendance` key ကို ပြန်သုံး) |

> Backend / API ပြောင်းလဲမှု **မလို**။ Route များ (`App.tsx`) ရှိပြီးသား ဖြစ်၍ မထိပါ။

---

## 3. Implementation Steps (အသေးစိတ်)

### 3.1 `pages/ClientProjects.tsx`

- **Card container div (line ~74)** တွင် `onClick={() => navigate(\`/projects/${p._id}/analytics\`)}` ထည့်၊ `cursor-pointer` class ထည့်၊ a11y အတွက် `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space) ထည့်။
- **Button row (lines 115–134) တစ်ခုလုံး ဖယ်ရှား** (Edit Details / Attendance / Analytics button ၃ ခုလုံး + ၎င်းတို့ကို ဝိုင်းထားသော `<div className="mt-5 pt-4 border-t ...">`)။
- **Dead code ရှင်းလင်း:**
  - `handleEdit` function (lines 39–42) ဖယ်။
  - `selected` / `setSelected` state ဖယ်။
  - `handleNew` ကို `setModalOpen(true)` သာ ကျန်အောင် ရိုးရှင်းစေ။
  - `ProjectModal` ကို `project={null}` (create mode သာ) ဖြင့် ဆက်သုံး → **New Project** flow အတည်။
- **`navigate` ရှိပြီးသား** (`useNavigate`) ဖြစ်၍ import အသစ် မလို။

### 3.2 `pages/ProjectDetailAnalytics.tsx`

- **Import အသစ်:**
  ```ts
  import { ProjectModal } from "../components/Project/ProjectModal";
  import { fetchProjectById, Project } from "../services/Project/project.service";
  ```
- **State အသစ်:**
  ```ts
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  ```
- **Edit handler** (fresh + canonical `Project` object ရယူရန်၊ `financialSummary.project` ၏ subset shape အစား):
  ```ts
  const handleEditClick = async () => {
    if (!id) return;
    try {
      const res = await fetchProjectById(id);
      setEditProject(res.data.client);
      setEditModalOpen(true);
    } catch (error: any) {
      toast.error(error.message || t("projects.loadFailed"));
    }
  };
  ```
- **Header ရှိ action buttons** — project header card (line ~112 `flex items-start justify-between`) ၏ ညာဘက် (ယခု empty ဖြစ်နေသည့်နေရာ) တွင် ထည့်:
  ```tsx
  <div className="flex items-center gap-2 shrink-0">
    <button onClick={handleEditClick}
      className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-100 cursor-pointer">
      {t("projects.editDetails")}
    </button>
    <button onClick={() => navigate(`/projects/${id}/attendance`)}
      className="py-2 px-3 bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-semibold rounded-xl cursor-pointer">
      {t("projects.viewAttendance")}
    </button>
  </div>
  ```
- **ProjectModal render** (component return ၏ အဆုံး၊ root `<div>` အတွင်း):
  ```tsx
  <ProjectModal
    isOpen={editModalOpen}
    onClose={() => setEditModalOpen(false)}
    project={editProject}
    onSaved={() => loadData(true)}
  />
  ```
- **Quick Actions ရှင်းလင်း (lines ~342–359):** header သို့ Attendance ရွှေ့ပြီးဖြစ်၍ ထပ်နေသော **"View Attendance" button ကို ဖယ်**၊ "Back to List" button ကိုသာ ကျန်စေ (ထပ်ခါထပ်ခါ မဖြစ်စေရန်)။

### 3.3 `translations/en.ts` + `my.ts`

`projects:` namespace ထဲ key အသစ် တစ်ခု ထည့် (နှစ်ဖိုင်လုံး):

| key | en.ts | my.ts |
|-----|-------|-------|
| `editDetails` | `"Edit Details"` | `"အသေးစိတ် ပြင်ဆင်ရန်"` |

> Attendance button label အတွက် ရှိပြီးသား `viewAttendance` (`"View Attendance"` / `"တက်ရောက်မှု ကြည့်ရန်"`) ကို ပြန်သုံးမည် → key အသစ် မလို။

---

## 4. Edge Cases (အထူးအခြေအနေများ)

1. **Card click vs nested elements** — button များ ဖယ်ပြီးနောက် card တွင် interactive child မကျန်တော့၍ card-level `onClick` သန့်ရှင်း။
2. **Edit fetch failure** — `fetchProjectById` error → `toast.error` ဖြင့် ပြ (modal မဖွင့်)။
3. **Detail page မှ Delete** — `ProjectModal` ၏ delete flow (`handleConfirmDelete`) သည် delete ပြီးနောက် `onSaved()` ကိုပဲ ခေါ်၍ save/delete ကို ခွဲခြားစရာ signal မရှိ။ Detail page တွင် `onSaved → loadData(true)` က ဖျက်ပြီးသား project ကို ပြန်ခေါ်မိ၍ error toast ပေါ်နိုင်။
   - **✅ Approved handling (2026-08-16):** `ProjectModal` တွင် **optional `onDeleted?: () => void` prop** ထည့်။ `handleConfirmDelete` က delete အောင်မြင်ပါက `(onDeleted || onSaved)()` ကို ခေါ် (backward-compatible — ClientProjects က `onDeleted` မပို့သဖြင့် ယခင်အတိုင်း `onSaved`=`load` ပဲ ခေါ်)။ Detail page က `onDeleted={() => navigate("/client-projects")}` ပို့၍ delete ပြီးလျှင် list သို့ ပြန် navigate (deleted project ကို re-fetch မဖြစ်စေရ)။
4. **`New Project` flow** — ClientProjects တွင် `ProjectModal` ကို create mode (`project={null}`) ဖြင့် ဆက်ထား၍ မပျက်စီးစေရ။
5. **i18n** — button label အားလုံး `t()` သုံး၍ en/my နှစ်ဘာသာလုံး မှန်ကန်။

---

## 5. Test Approach (စမ်းသပ်နည်း)

1. **Build:** `npm run build` — compile error မရှိကြောင်း စစ်။
2. **Manual:**
   - Client Projects card **တစ်ခုလုံး နှိပ် → Analytics detail** သို့ ရောက်ကြောင်း။
   - Detail page **Edit Details** နှိပ် → modal ဖွင့် → save → page data refresh ဖြစ်ကြောင်း။
   - Detail page **Attendance** နှိပ် → `/projects/:id/attendance` သို့ ရောက်ကြောင်း။
   - **New Project** button ယခင်အတိုင်း အလုပ်လုပ်ကြောင်း။
3. **i18n:** language `en` → English label; `my` → Myanmar label။

---

## 6. Summary

- **Removed:** ClientProjects card ၏ button ၃ ခု (Edit/Attendance/Analytics)။
- **Added:** card click → analytics navigation; detail page header တွင် Edit + Attendance button။
- **Net UX:** project တစ်ခုကို ဖွင့်ရ ပိုလွယ် (card တစ်ချက်နှိပ်)၊ action များကို detail page တွင် စုစည်း။
