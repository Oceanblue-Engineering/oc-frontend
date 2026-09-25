import React from "react";
import { Printer } from "lucide-react";
import {
  PRINT_PAPER_OPTIONS,
  PrintPaperSize,
} from "../../utils/printPaperSize";

import { useLanguage } from "../../context/LanguageContext";

interface PrintPaperSizeSelectorProps {
  value: PrintPaperSize;
  onChange: (size: PrintPaperSize) => void;
  disabled?: boolean;
  hideA4A5?: boolean;
  hideThermal?: boolean;
  allowedSizes?: PrintPaperSize[];
}

export const PrintPaperSizeSelector: React.FC<PrintPaperSizeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  hideA4A5 = false,
  hideThermal = false,
  allowedSizes,
}) => {
  const { t } = useLanguage();
  let options = PRINT_PAPER_OPTIONS;
  if (allowedSizes && allowedSizes.length > 0) {
    options = options.filter((option) => allowedSizes.includes(option.id));
  } else {
    if (hideA4A5) {
      options = options.filter((option) => option.id !== "A4" && option.id !== "A5");
    }
    if (hideThermal) {
      options = options.filter(
        (option) =>
          option.id !== "thermal-72mm" && option.id !== "thermal-58mm"
      );
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 whitespace-nowrap">
        <Printer className="w-4 h-4" />
        {t("settings.paperSizeLabel")}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.id)}
            title={option.description}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
              value === option.id
                ? "bg-[#27272a] text-white border-[#27272a] shadow-md shadow-ocean-600/10"
                : "bg-white text-[#27272a] border-ocean-200 hover:bg-ocean-50/50"
            } disabled:opacity-50`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
