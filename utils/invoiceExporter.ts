import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface InvoiceExportOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

/**
 * Downloads a DOM element as a high-resolution PNG image
 */
export async function downloadInvoiceAsPng(
  element: HTMLElement,
  options: InvoiceExportOptions = {}
): Promise<boolean> {
  try {
    const { filename = "OceanBlue-Invoice.png", scale = 2.5 } = options;

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (_, clonedElement) => {
        clonedElement.style.transform = "none";
        clonedElement.style.margin = "0";
      },
    });

    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error("Error exporting invoice as PNG:", error);
    throw error;
  }
}

/**
 * Downloads a DOM element as a high-resolution A4 PDF
 */
export async function downloadInvoiceAsPdf(
  element: HTMLElement,
  options: InvoiceExportOptions = {}
): Promise<boolean> {
  try {
    const { filename = "OceanBlue-Invoice.pdf", scale = 2.5 } = options;

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (_, clonedElement) => {
        clonedElement.style.transform = "none";
        clonedElement.style.margin = "0";
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    // Standard A4 dimensions (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Fit cleanly on A4
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, imgHeight, undefined, "FAST");
    } else {
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error("Error exporting invoice as PDF:", error);
    throw error;
  }
}

/**
 * Prints the invoice directly
 */
export function printInvoice(element: HTMLElement) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Invoice - Ocean Blue</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        <div style="width: 210mm; min-height: 297mm; margin: 0 auto;">
          ${element.outerHTML}
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 400);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
