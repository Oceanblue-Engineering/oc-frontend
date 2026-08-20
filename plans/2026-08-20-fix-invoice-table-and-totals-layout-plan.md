# Plan: Invoice Table Layout (Remarks & Totals) အား Reference Design အတိုင်း တဆက်တည်း ဖြစ်အောင် ပြင်ဆင်ခြင်း

**Date:** 2026-08-20
**Status:** Draft (အသုံးပြုသူ၏ သဘောတူညီချက် စောင့်ဆိုင်းဆဲ)
**App:** `OB-frontend`

---

## 1. Issue Analysis (ပြဿနာ ဖြစ်ပွားရသည့် အကြောင်းရင်း)

ပေးပို့ထားသော Reference Design အမှန်တွင်:
* **Sub-Total, Discount / Tax (%), Total Amount** တို့သည် သီးခြား Box မဟုတ်ဘဲ **Table ၏ ညာဘက်ကော်လံ ၂ ခု (`Unit Price` နှင့် `Amount`) နှင့် အောက်ခြေတွင် တဆက်တည်း ဇယားကွက်အဖြစ် ချိတ်ဆက်နေခြင်း** ဖြစ်ပါသည်။
* ဘယ်ဘက်ခြမ်း ကော်လံ ၃ ခု (`No`, `Description`, `Qty`) ၏ အောက်ခြေနေရာလွတ်တွင် **"Remarks:"** အချက်အလက်များကို ဇယားထဲတွင် တပြိုင်နက်တည်း ထည့်သွင်းထားခြင်း ဖြစ်ပါသည်။

ယခင် ကုဒ်တွင် Table နှင့် Remarks/Totals တို့ကို သီးခြား `div` grid များ ခွဲထုတ်ထားသဖြင့် Export/Screen အရွယ်အစားပြောင်းလဲချိန်တွင် Subtotal box သည် Remarks ၏ အောက်သို့ အပြည့်ကျသွားပြီး Layout လွဲချော်ခဲ့ခြင်း ဖြစ်ပါသည်။

---

## 2. Proposed Solution (ပြုပြင်မည့် နည်းလမ်း)

### Single Unified Table Grid တည်ဆောက်ခြင်း ([`components/Invoice/InvoiceDocument.tsx`](file:///c:/Users/PC/Desktop/OceanBlue/OB-frontend/components/Invoice/InvoiceDocument.tsx))

Table ၏ `<tbody>` အောက်တွင် **တဆက်တည်းဖြစ်သော Summary Rows** များကို တိုက်ရိုက် ထည့်သွင်းမည်:

```tsx
<table className="w-full border-collapse border border-slate-300">
  {/* Thead */}
  <thead>
    <tr className="bg-[#1c3d73] text-white">
      <th className="w-14">No:</th>
      <th>Description:</th>
      <th className="w-16">Qty:</th>
      <th className="w-36">Unit Price:</th>
      <th className="w-40">Amount:</th>
    </tr>
  </thead>

  {/* Tbody */}
  <tbody>
    {/* Line Items (01, 02, 03, 04...) */}
    {displayItems.map(...)}

    {/* Row 1: Left Remarks (colSpan=3 rowSpan=3) + Right Sub-Total */}
    <tr className="border-t border-slate-300">
      <td colSpan={3} rowSpan={3} className="p-4 align-top border-r border-slate-300">
        <h3 className="font-black text-[#00b4d8] text-xs sm:text-sm mb-1.5">Remarks:</h3>
        <ul className="space-y-1 text-xs text-slate-800 font-semibold">
          {remarks.map((rem, i) => (
            <li key={i}>* {rem}</li>
          ))}
        </ul>
      </td>
      <td className="py-2.5 px-4 text-center font-bold text-slate-800 border-r border-b border-slate-300">
        Sub-Total
      </td>
      <td className="py-2.5 px-4 text-right font-bold text-slate-900 border-b border-slate-300">
        {formatMoney(subTotal)} {currency}
      </td>
    </tr>

    {/* Row 2: Right Discount / Tax */}
    <tr className="border-b border-slate-300">
      <td className="py-2.5 px-4 text-center font-bold text-slate-800 border-r border-slate-300">
        {discountOrTaxLabel}
      </td>
      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
        {discountOrTaxAmount ? `${formatMoney(discountOrTaxAmount)} ${currency}` : "-"}
      </td>
    </tr>

    {/* Row 3: Right Total Amount */}
    <tr>
      <td className="py-2.5 px-4 text-center font-black text-slate-900 border-r border-slate-300">
        Total Amount:
      </td>
      <td className="py-2.5 px-4 text-right font-black text-slate-900 text-sm sm:text-base">
        {formatMoney(totalAmount)} {currency}
      </td>
    </tr>
  </tbody>
</table>
```

---

## 3. Verification Plan (စစ်ဆေးအတည်ပြုမည့် အစီအစဉ်)

1. **Visual Accuracy Check:**
   * Preview Screen နှင့် Exported PDF/PNG နှစ်ခုလုံးတွင် Sub-Total, Discount, Total Amount တို့ Table ၏ ညာဘက်ကော်လံများနှင့် တဆက်တည်း ဖြစ်နေမှု စစ်ဆေးခြင်း။
2. **Export PDF Check:**
   * PDF အသစ် ဒေါင်းလုဒ်ဆွဲပြီး Reference ပုံနှင့် တထေရာတည်း တူညီမှု ရှိ/မရှိ စစ်ဆေးခြင်း။
3. **Build Check:**
   * `npm run build` ဖြင့် compile error မရှိကြောင်း စစ်ဆေးခြင်း။
