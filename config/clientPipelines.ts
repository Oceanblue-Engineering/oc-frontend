/**
 * Client pipeline stage metadata for the tabbed Sales / Service leads view.
 * Stages are grouped by leadType so the grid renders only the active tab's columns.
 */
export type LeadType = "sales" | "service";

export const PIPELINES: Record<LeadType, string[]> = {
  sales: [
    "Sale Inquiry",
    "Product Explain",
    "Sent Quotation",
    "Purchased",
    "Follow-up",
    "Ghost",
  ],
  service: [
    "Service Inquiry",
    "Service Explain",
    "Meeting Made",
    "Sent Quotation",
    "Sent Contract",
    "Follow-up",
    "Ghost",
  ],
};

export const TABS: { id: LeadType; labelKey: string }[] = [
  { id: "sales", labelKey: "clients.tabSales" },
  { id: "service", labelKey: "clients.tabService" },
];

/** Default starting stage for a given lead type. */
export const initialStageFor = (type: LeadType): string =>
  type === "service" ? "Service Inquiry" : "Sale Inquiry";
