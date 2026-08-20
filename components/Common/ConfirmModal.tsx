import React from "react";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { Button } from "../ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: "red" | "blue" | "green" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  confirmButtonColor = "red",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const getButtonVariant = () => {
    switch (confirmButtonColor) {
      case "red":
        return "destructive";
      case "blue":
        return "default";
      case "green":
        return "success";
      case "primary":
        return "default";
      default:
        return "destructive";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0 border border-red-200/60">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText || t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant={getButtonVariant() as any}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText || t("common.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
};
