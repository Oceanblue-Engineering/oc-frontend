import React, { useRef, useState } from "react";
import {
  Download,
  Image as ImageIcon,
  Printer,
  X,
  FileText,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { toast } from "sonner";
import { InvoiceDocument, InvoiceData } from "./InvoiceDocument";
import { ReceiptDocument } from "./ReceiptDocument";
import {
  downloadInvoiceAsPdf,
  downloadInvoiceAsPng,
  printInvoice,
} from "../../utils/invoiceExporter";
import { Button } from "../ui/button";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoiceData & {
    paymentReceivedDate?: string;
    paymentMethod?: string;
  };
  initialDocumentType?: "invoice" | "receipt";
  title?: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceData,
  initialDocumentType = "invoice",
  title = "Official Document Preview",
}) => {
  const documentRef = useRef<HTMLDivElement>(null);
  const [documentType, setDocumentType] = useState<"invoice" | "receipt">(
    initialDocumentType
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  if (!isOpen) return null;

  const docPrefix = documentType === "receipt" ? "Receipt" : "Invoice";

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsExportingPdf(true);
    try {
      const filename = `${docPrefix}_${invoiceData.invoiceNo || "OceanBlue"}`;
      await downloadInvoiceAsPdf(documentRef.current, { filename });
      toast.success(`${docPrefix} PDF downloaded successfully!`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to generate ${docPrefix} PDF`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!documentRef.current) return;
    setIsExportingPng(true);
    try {
      const filename = `${docPrefix}_${invoiceData.invoiceNo || "OceanBlue"}.png`;
      await downloadInvoiceAsPng(documentRef.current, {
        filename,
        scale: 2.5,
      });
      toast.success(`${docPrefix} Image (PNG) downloaded successfully!`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to generate ${docPrefix} Image`);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handlePrint = () => {
    if (!documentRef.current) return;
    printInvoice(documentRef.current);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {/* Document Switcher Toggle */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80">
              <button
                onClick={() => setDocumentType("invoice")}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  documentType === "invoice"
                    ? "bg-white text-ocean-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                Invoice
              </button>
              <button
                onClick={() => setDocumentType("receipt")}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  documentType === "receipt"
                    ? "bg-white text-ocean-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <ReceiptIcon className="w-4 h-4" />
                Receipt
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium hidden md:inline">
              No: {invoiceData.invoiceNo} • {invoiceData.billTo.name || "Customer"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print
            </Button>

            <Button
              variant="subtle"
              size="sm"
              onClick={handleDownloadPng}
              isLoading={isExportingPng}
              leftIcon={<ImageIcon className="w-3.5 h-3.5" />}
            >
              Download PNG
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadPdf}
              isLoading={isExportingPdf}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download PDF
            </Button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-100">
          <div className="w-full max-w-[820px] transition-all flex justify-center">
            {documentType === "invoice" ? (
              <InvoiceDocument ref={documentRef} data={invoiceData} />
            ) : (
              <ReceiptDocument ref={documentRef} data={invoiceData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
