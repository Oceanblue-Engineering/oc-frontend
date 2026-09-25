import React, { useState, useEffect } from "react";
import { Printer, Check } from "lucide-react";
import { toast } from "sonner";
import { PrintPaperSizeSelector } from "../Print/PrintPaperSizeSelector";
import {
  getSavedPrintPaperSize,
  savePrintPaperSize,
  PrintPaperSize,
  PRINT_PAPER_OPTIONS,
} from "../../utils/printPaperSize";
import { useLanguage } from "../../context/LanguageContext";

export const PrintPaperSizeSettingsCard: React.FC = () => {
  const { t } = useLanguage();
  const [paperSize, setPaperSize] = useState<PrintPaperSize>(() => {
    const saved = getSavedPrintPaperSize();
    return saved === "thermal-72mm" || saved === "thermal-58mm" ? "A4" : saved;
  });

  useEffect(() => {
    const saved = getSavedPrintPaperSize();
    if (saved === "thermal-72mm" || saved === "thermal-58mm") {
      setPaperSize("A4");
      savePrintPaperSize("A4");
    } else {
      setPaperSize(saved);
    }
  }, []);

  const handleChange = (size: PrintPaperSize) => {
    setPaperSize(size);
    savePrintPaperSize(size);
    const label =
      PRINT_PAPER_OPTIONS.find((o) => o.id === size)?.label ?? size;
    toast.success(`Default print size set to ${label}`);
  };

  const selectedOption = PRINT_PAPER_OPTIONS.find((o) => o.id === paperSize);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800 mb-1 flex items-center gap-2">
        <Printer className="w-5 h-5 text-[#27272a]" />
        {t("settings.voucherPrintSize")}
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        {t("settings.voucherPrintSizeDesc")}
      </p>

      <PrintPaperSizeSelector
        value={paperSize}
        onChange={handleChange}
        hideThermal={true}
      />

      {selectedOption && (
        <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-green-600" />
          {selectedOption.description}
        </p>
      )}
    </div>
  );
};
