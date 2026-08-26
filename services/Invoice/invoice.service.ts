import axios from "axios";
import { InvoiceData } from "../../components/Invoice/InvoiceDocument";

export interface InvoiceRecord extends InvoiceData {
  _id?: string;
  quotationNo?: string;
  validityTerms?: string;
  status?: "draft" | "issued" | "paid" | "cancelled";
  paymentMethod?: string;
  paymentReceivedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  orderId?: string | null;
  projectId?: string | null;
}

export interface GetInvoicesParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface InvoicesResponse {
  success: boolean;
  data: InvoiceRecord[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  stats?: {
    totalInvoicedAmount: number;
    paidAmount: number;
    totalCount: number;
    paidCount: number;
    issuedCount: number;
  };
}

const LOCAL_STORAGE_KEY = "ocean_blue_invoices_cache";

const getLocalInvoices = (): InvoiceRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read local invoices:", err);
    return [];
  }
};

const saveLocalInvoices = (invoices: InvoiceRecord[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.error("Failed to save local invoices:", err);
  }
};

/**
 * Creates and saves an invoice (Backend with LocalStorage backup)
 */
export async function createInvoice(
  invoiceData: InvoiceData & { status?: string }
): Promise<{ success: boolean; data: InvoiceRecord; message?: string }> {
  try {
    const res = await axios.post<{
      success: boolean;
      data: InvoiceRecord;
      message?: string;
    }>("/api/v1/invoices", invoiceData);

    if (res.data && res.data.success) {
      // Sync local cache
      const local = getLocalInvoices();
      saveLocalInvoices([res.data.data, ...local.filter(i => i.invoiceNo !== res.data.data.invoiceNo)]);
      return res.data;
    }
  } catch (err: any) {
    console.warn("Backend save failed, saving to local cache:", err);
  }

  // Fallback to local storage
  const localRecord: InvoiceRecord = {
    ...invoiceData,
    _id: `local_${Date.now()}`,
    status: (invoiceData as any).status || "issued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const local = getLocalInvoices();
  saveLocalInvoices([localRecord, ...local.filter(i => i.invoiceNo !== localRecord.invoiceNo)]);

  return {
    success: true,
    data: localRecord,
    message: "Invoice saved locally",
  };
}

/**
 * Fetches invoices with filtering
 */
export async function fetchInvoices(
  params: GetInvoicesParams = {}
): Promise<InvoicesResponse> {
  try {
    const res = await axios.get<InvoicesResponse>("/api/v1/invoices", {
      params,
    });
    if (res.data && res.data.success) {
      // Sync local cache
      if (res.data.data && res.data.data.length > 0) {
        saveLocalInvoices(res.data.data);
      }
      return res.data;
    }
  } catch (err) {
    console.warn("Backend fetch failed, falling back to local cache:", err);
  }

  // Local fallback
  let list = getLocalInvoices();

  if (params.status && params.status !== "all") {
    list = list.filter((i) => (i.status || "issued") === params.status);
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (i) =>
        i.invoiceNo.toLowerCase().includes(q) ||
        (i.billTo?.name || "").toLowerCase().includes(q) ||
        (i.billTo?.phone || "").toLowerCase().includes(q) ||
        (i.billTo?.company || "").toLowerCase().includes(q)
    );
  }

  const total = list.length;
  const totalInvoicedAmount = list.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const paidInvoices = list.filter((i) => i.status === "paid");
  const paidAmount = paidInvoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

  return {
    success: true,
    data: list,
    pagination: {
      total,
      page: params.page || 1,
      limit: params.limit || 50,
      pages: Math.ceil(total / (params.limit || 50)),
    },
    stats: {
      totalInvoicedAmount,
      paidAmount,
      totalCount: total,
      paidCount: paidInvoices.length,
      issuedCount: list.filter((i) => (i.status || "issued") === "issued").length,
    },
  };
}

/**
 * Updates an invoice
 */
export async function updateInvoice(
  id: string,
  data: Partial<InvoiceRecord>
): Promise<{ success: boolean; data?: InvoiceRecord; message?: string }> {
  try {
    if (!id.startsWith("local_")) {
      const res = await axios.put(`/api/v1/invoices/${id}`, data);
      if (res.data.success) {
        return res.data;
      }
    }
  } catch (err) {
    console.warn("Backend update failed:", err);
  }

  const local = getLocalInvoices();
  const index = local.findIndex((i) => i._id === id || i.invoiceNo === data.invoiceNo);
  if (index !== -1) {
    local[index] = { ...local[index], ...data, updatedAt: new Date().toISOString() };
    saveLocalInvoices(local);
    return { success: true, data: local[index], message: "Updated locally" };
  }

  return { success: false, message: "Invoice not found" };
}

/**
 * Deletes an invoice
 */
export async function deleteInvoice(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!id.startsWith("local_")) {
      await axios.delete(`/api/v1/invoices/${id}`);
    }
  } catch (err) {
    console.warn("Backend delete failed:", err);
  }

  const local = getLocalInvoices().filter((i) => i._id !== id);
  saveLocalInvoices(local);

  return { success: true, message: "Invoice deleted successfully" };
}

/**
 * Updates status of an invoice
 */
export async function updateInvoiceStatus(
  id: string,
  status: "draft" | "issued" | "paid" | "cancelled",
  extraData: { paymentReceivedDate?: string; paymentMethod?: string } = {}
): Promise<{ success: boolean; data?: InvoiceRecord; message?: string }> {
  try {
    if (!id.startsWith("local_")) {
      const res = await axios.patch(`/api/v1/invoices/${id}/status`, {
        status,
        ...extraData,
      });
      if (res.data.success) return res.data;
    }
  } catch (err) {
    console.warn("Backend status update failed:", err);
  }

  const local = getLocalInvoices();
  const item = local.find((i) => i._id === id);
  if (item) {
    item.status = status;
    if (extraData.paymentReceivedDate) {
      item.paymentReceivedDate = extraData.paymentReceivedDate;
    }
    if (extraData.paymentMethod) {
      item.paymentMethod = extraData.paymentMethod;
    }
    item.updatedAt = new Date().toISOString();
    saveLocalInvoices(local);
    return { success: true, data: item, message: `Status updated to ${status}` };
  }

  return { success: false, message: "Invoice not found" };
}
