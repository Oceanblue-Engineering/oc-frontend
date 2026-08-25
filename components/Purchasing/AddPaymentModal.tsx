import React, { useState, useEffect } from "react";
import { X, DollarSign, CreditCard, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createPurchasePayment } from "../../services/Purchase/createPurchasePayment";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string;
  poNumber?: string;
  totalAmount: number;
  remainingBalance: number;
  onPaymentSuccess: () => Promise<void> | void;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash (လက်ငင်းငွေသား)" },
  { value: "kpay", label: "KBZ Pay (KPay)" },
  { value: "wavepay", label: "Wave Pay" },
  { value: "ayapay", label: "AYA Pay" },
  { value: "uabpay", label: "UAB Pay" },
  { value: "bank_transfer", label: "Bank Transfer (ဘဏ်လွှဲ)" },
];

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  purchaseId,
  poNumber,
  totalAmount,
  remainingBalance,
  onPaymentSuccess,
}) => {
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setPaidAmount("");
      setPaymentMethod("cash");
      setNotes("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setPaidAmount("");
      setError("");
      return;
    }

    const num = Number(value);
    setPaidAmount(num);

    if (num <= 0) {
      setError("Paid amount must be greater than 0");
    } else if (num > remainingBalance) {
      setError(
        `Paid amount cannot exceed remaining balance of ${remainingBalance.toLocaleString()} MMK`
      );
    } else {
      setError("");
    }
  };

  const handleFillMaxAmount = () => {
    setPaidAmount(remainingBalance);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = Number(paidAmount);
    if (!paidAmount || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    if (numAmount > remainingBalance) {
      setError(
        `Paid amount cannot exceed remaining balance (${remainingBalance.toLocaleString()} MMK)`
      );
      toast.error(
        `Paid amount cannot exceed remaining balance (${remainingBalance.toLocaleString()} MMK)`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPurchasePayment(purchaseId, {
        paidAmount: numAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message || "Payment added successfully!");
        await onPaymentSuccess();
        onClose();
      } else {
        toast.error(res.message || "Failed to add payment");
        setError(res.message || "Failed to add payment");
      }
    } catch (err: any) {
      console.error("Failed to add payment", err);
      const errMsg = err?.message || "An error occurred while adding payment";
      toast.error(errMsg);
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-zinc-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Add Payment
              </h2>
              <p className="text-xs text-slate-500">ဆပ်ငွေထည့်သွင်းရန်</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PO Info Card */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Purchase Order:</span>
              <span className="font-mono font-bold text-slate-800">
                {poNumber || purchaseId.substring(0, 12)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Total Amount:</span>
              <span className="font-semibold text-slate-700">
                {totalAmount.toLocaleString()} MMK
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">
                Remaining Balance (ကျန်ငွေ):
              </span>
              <span className="text-sm font-extrabold text-rose-600">
                {remainingBalance.toLocaleString()} MMK
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Paid Amount (ပေးချေငွေ) <span className="text-red-500">*</span>
                </label>
                {remainingBalance > 0 && (
                  <button
                    type="button"
                    onClick={handleFillMaxAmount}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                  >
                    Pay Full Remaining
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={remainingBalance}
                  step="any"
                  required
                  placeholder="0"
                  value={paidAmount}
                  onChange={handleAmountChange}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl outline-none transition-all pr-14 ${
                    error
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                  MMK
                </span>
              </div>
              {error && (
                <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Method (ပေးချေမှုပုံစံ){" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-medium text-slate-800"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Notes (မှတ်ချက်) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Add payment notes, transaction ID, or bank reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-slate-800 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !paidAmount ||
                  Number(paidAmount) <= 0 ||
                  Number(paidAmount) > remainingBalance ||
                  !!error
                }
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
