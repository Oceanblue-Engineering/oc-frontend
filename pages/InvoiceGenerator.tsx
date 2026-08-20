import React, { useRef, useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Image as ImageIcon,
  Printer,
  RotateCcw,
  Sparkles,
  Save,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  DollarSign,
  Receipt,
  List,
  Edit,
  SlidersHorizontal,
  Calendar,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import {
  InvoiceDocument,
  InvoiceData,
  InvoiceItem,
  DEFAULT_REMARKS,
  DEFAULT_PAYMENT_ACCOUNTS,
} from "../components/Invoice/InvoiceDocument";
import { ReceiptDocument } from "../components/Invoice/ReceiptDocument";
import { InvoiceModal } from "../components/Invoice/InvoiceModal";
import {
  downloadInvoiceAsPdf,
  downloadInvoiceAsPng,
  printInvoice,
} from "../utils/invoiceExporter";
import {
  createInvoice,
  fetchInvoices,
  deleteInvoice,
  updateInvoiceStatus,
  InvoiceRecord,
} from "../services/Invoice/invoice.service";
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
  StatsCard,
} from "../components/ui";
import { ConfirmModal } from "../components/Common/ConfirmModal";

export const InvoiceGenerator: React.FC = () => {
  const documentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [previewDocType, setPreviewDocType] = useState<"invoice" | "receipt">(
    "invoice"
  );

  // Invoices list state
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    totalInvoicedAmount: 0,
    paidAmount: 0,
    totalCount: 0,
    paidCount: 0,
    issuedCount: 0,
  });

  // Modal & Actions state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(
    null
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<"invoice" | "receipt">(
    "invoice"
  );
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceRecord | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Form & Export state
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  const getInitialInvoiceData = (): InvoiceData & {
    paymentMethod?: string;
    paymentReceivedDate?: string;
    status?: "draft" | "issued" | "paid" | "cancelled";
  } => {
    const today = new Date().toISOString().split("T")[0];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = `OB-${today.replace(/-/g, "")}-${randomSuffix}`;

    return {
      invoiceNo,
      invoiceDate: today,
      paymentTerms: "50% Advance, 50% on Completion",
      paymentMethod: "KBZ Pay",
      paymentReceivedDate: "",
      status: "issued",
      billTo: {
        name: "",
        company: "",
        address: "",
        email: "",
        phone: "",
      },
      items: [
        {
          no: 1,
          description: "Swimming Pool Construction & Civil Works",
          qty: 1,
          unitPrice: 15000000,
          amount: 15000000,
        },
        {
          no: 2,
          description: "Water Proofing System & Chemical Treatment",
          qty: 1,
          unitPrice: 3500000,
          amount: 3500000,
        },
        {
          no: 3,
          description: "M&E Pool Pump & Filtration Equipment",
          qty: 1,
          unitPrice: 4500000,
          amount: 4500000,
        },
      ],
      subTotal: 23000000,
      discountOrTaxLabel: "Discount / Tax (%)",
      discountOrTaxAmount: 0,
      totalAmount: 23000000,
      remarks: [...DEFAULT_REMARKS],
      paymentAccounts: [...DEFAULT_PAYMENT_ACCOUNTS],
      preparedBy: "Prepared By: Ocean Blue",
      currency: "MMK",
    };
  };

  const [invoiceData, setInvoiceData] = useState(getInitialInvoiceData());

  // Load Invoices
  const loadInvoices = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetchInvoices({
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      if (res && res.success) {
        setInvoices(res.data || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadInvoices();
  };

  // Recalculate totals
  const recalculate = (
    items: InvoiceItem[],
    discountOrTaxAmount: number = invoiceData.discountOrTaxAmount || 0
  ) => {
    const subTotal = items.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const totalAmount = Math.max(0, subTotal - (Number(discountOrTaxAmount) || 0));
    return { subTotal, totalAmount };
  };

  // Form Handlers
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    const updated = [...invoiceData.items];
    const current = { ...updated[index], [field]: value };

    if (field === "qty" || field === "unitPrice") {
      const qty = field === "qty" ? Number(value) : current.qty;
      const unitPrice =
        field === "unitPrice" ? Number(value) : current.unitPrice;
      current.amount = (qty || 0) * (unitPrice || 0);
    }

    updated[index] = current;
    const { subTotal, totalAmount } = recalculate(
      updated,
      invoiceData.discountOrTaxAmount
    );

    setInvoiceData({
      ...invoiceData,
      items: updated,
      subTotal,
      totalAmount,
    });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      no: invoiceData.items.length + 1,
      description: "",
      qty: 1,
      unitPrice: 0,
      amount: 0,
    };
    const updated = [...invoiceData.items, newItem];
    const { subTotal, totalAmount } = recalculate(
      updated,
      invoiceData.discountOrTaxAmount
    );

    setInvoiceData({
      ...invoiceData,
      items: updated,
      subTotal,
      totalAmount,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceData.items.length <= 1) {
      toast.error("Invoice must have at least 1 item");
      return;
    }
    const updated = invoiceData.items.filter((_, i) => i !== index);
    const { subTotal, totalAmount } = recalculate(
      updated,
      invoiceData.discountOrTaxAmount
    );

    setInvoiceData({
      ...invoiceData,
      items: updated,
      subTotal,
      totalAmount,
    });
  };

  const handleDiscountChange = (val: number) => {
    const { subTotal, totalAmount } = recalculate(invoiceData.items, val);
    setInvoiceData({
      ...invoiceData,
      discountOrTaxAmount: val,
      subTotal,
      totalAmount,
    });
  };

  const handleRemarkChange = (index: number, value: string) => {
    const remarks = [...(invoiceData.remarks || [])];
    remarks[index] = value;
    setInvoiceData({ ...invoiceData, remarks });
  };

  const handleAddRemark = () => {
    const remarks = [...(invoiceData.remarks || []), "New warranty / note"];
    setInvoiceData({ ...invoiceData, remarks });
  };

  const handleRemoveRemark = (index: number) => {
    const remarks = (invoiceData.remarks || []).filter((_, i) => i !== index);
    setInvoiceData({ ...invoiceData, remarks });
  };

  // Save Invoice Handler
  const handleSaveInvoice = async () => {
    if (!invoiceData.billTo.name.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    setIsSaving(true);
    try {
      const res = await createInvoice(invoiceData);
      if (res && res.success) {
        toast.success("Invoice saved successfully!");
        loadInvoices();
        setSelectedInvoice(res.data);
        setModalInitialType(invoiceData.status === "paid" ? "receipt" : "invoice");
        setIsPreviewOpen(true);
      } else {
        toast.error(res.message || "Failed to save invoice");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error saving invoice");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Invoice Handler
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete?._id) return;
    setIsDeleting(true);
    try {
      const res = await deleteInvoice(invoiceToDelete._id);
      if (res.success) {
        toast.success("Invoice deleted successfully");
        setInvoiceToDelete(null);
        loadInvoices();
      } else {
        toast.error(res.message || "Failed to delete invoice");
      }
    } catch (err) {
      toast.error("Error deleting invoice");
    } finally {
      setIsDeleting(false);
    }
  };

  // Change Status Handler
  const handleStatusChange = async (
    invoice: InvoiceRecord,
    newStatus: "draft" | "issued" | "paid" | "cancelled"
  ) => {
    if (!invoice._id) return;
    try {
      const paymentReceivedDate =
        newStatus === "paid" && !invoice.paymentReceivedDate
          ? new Date().toISOString().split("T")[0]
          : invoice.paymentReceivedDate;

      const res = await updateInvoiceStatus(invoice._id, newStatus, {
        paymentReceivedDate,
      });

      if (res.success) {
        toast.success(`Status updated to ${newStatus}`);
        loadInvoices();
        if (newStatus === "paid") {
          toast.info("Invoice marked as Paid! You can now download the Receipt.", {
            action: {
              label: "View Receipt",
              onClick: () => {
                setSelectedInvoice({ ...invoice, status: "paid", paymentReceivedDate });
                setModalInitialType("receipt");
                setIsPreviewOpen(true);
              },
            },
          });
        }
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Edit Invoice from List
  const handleEditInvoice = (inv: InvoiceRecord) => {
    setInvoiceData({
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.invoiceDate
        ? new Date(inv.invoiceDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      paymentTerms: inv.paymentTerms || "50% Advance, 50% on Completion",
      paymentMethod: inv.paymentMethod || "KBZ Pay",
      paymentReceivedDate: inv.paymentReceivedDate
        ? new Date(inv.paymentReceivedDate).toISOString().split("T")[0]
        : "",
      status: inv.status || "issued",
      billTo: { ...inv.billTo },
      items: (inv.items || []).map((it, idx) => ({ ...it, no: idx + 1 })),
      subTotal: inv.subTotal || inv.totalAmount,
      discountOrTaxLabel: inv.discountOrTaxLabel || "Discount / Tax (%)",
      discountOrTaxAmount: inv.discountOrTaxAmount || 0,
      totalAmount: inv.totalAmount,
      remarks:
        inv.remarks && inv.remarks.length > 0
          ? [...inv.remarks]
          : [...DEFAULT_REMARKS],
      paymentAccounts: [...DEFAULT_PAYMENT_ACCOUNTS],
      preparedBy: inv.preparedBy || "Prepared By: Ocean Blue",
      currency: inv.currency || "MMK",
    });
    setActiveTab("create");
    toast.info(`Loaded invoice ${inv.invoiceNo} into editor`);
  };

  // Export handlers
  const docPrefix = previewDocType === "receipt" ? "Receipt" : "Invoice";

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsExportingPdf(true);
    try {
      const filename = `${docPrefix}_${invoiceData.invoiceNo || "OceanBlue"}`;
      await downloadInvoiceAsPdf(documentRef.current, { filename });
      toast.success(`${docPrefix} PDF generated and downloaded!`);
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

  const handleReset = () => {
    setInvoiceData(getInitialInvoiceData());
    toast.info("Invoice form reset to default template");
  };

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Official Invoices & Receipts"
        subtitle="Manage, create, auto-fill receipts, and export official Ocean Blue A4 Invoices and Receipts"
        icon={<FileText className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1">
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "list"
                    ? "bg-white text-ocean-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Invoice List ({invoices.length})
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "create"
                    ? "bg-white text-ocean-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Create Invoice
              </button>
            </div>
          </div>
        }
      />

      {/* TAB 1: INVOICE LIST & TABLE */}
      {activeTab === "list" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Invoices"
              value={stats.totalCount || invoices.length}
              icon={<Receipt className="w-5 h-5" />}
              variant="default"
              description="Generated invoices count"
            />
            <StatsCard
              title="Total Invoiced"
              value={`${(stats.totalInvoicedAmount || 0).toLocaleString()} MMK`}
              icon={<DollarSign className="w-5 h-5" />}
              variant="secondary"
              description="Gross billing amount"
            />
            <StatsCard
              title="Paid / Receipts"
              value={`${(stats.paidAmount || 0).toLocaleString()} MMK`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="success"
              description={`${stats.paidCount || 0} receipts generated`}
            />
            <StatsCard
              title="Issued / Pending"
              value={stats.issuedCount || 0}
              icon={<Clock className="w-5 h-5" />}
              variant="warning"
              description="Awaiting payment"
            />
          </div>

          {/* Search & Filter Bar */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row items-center justify-between gap-3"
              >
                <div className="flex-1 w-full flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Search by Invoice No, Customer, Phone, Company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    size="default"
                    leftIcon={<Search className="w-3.5 h-3.5" />}
                  >
                    Search
                  </Button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-36"
                  >
                    <option value="all">All Status</option>
                    <option value="issued">Issued</option>
                    <option value="paid">Paid</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={loadInvoices}
                    isLoading={isLoadingList}
                    title="Refresh List"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="default"
                    size="default"
                    onClick={() => setActiveTab("create")}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    New Invoice
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Invoices Data Table */}
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Bill To (Customer)</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Payment Method / Terms</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingList ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-ocean-600 mx-auto mb-2" />
                      <span className="text-slate-500 font-semibold text-xs">
                        Loading Invoices...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableEmpty
                    colSpan={9}
                    title="No invoices found"
                    description="Create a new invoice to get started"
                    actionLabel="Create Invoice"
                    onAction={() => setActiveTab("create")}
                  />
                ) : (
                  invoices.map((inv, idx) => (
                    <TableRow key={inv._id || idx}>
                      <TableCell className="text-center font-bold text-slate-500">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-ocean-800">
                          {inv.invoiceNo}
                        </span>
                        {inv.paymentReceivedDate && (
                          <span className="block text-[10px] text-emerald-600 font-semibold">
                            Paid: {new Date(inv.paymentReceivedDate).toLocaleDateString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        {inv.invoiceDate
                          ? new Date(inv.invoiceDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-900 block">
                          {inv.billTo?.name || "Customer"}
                        </span>
                        {(inv.billTo?.company || inv.billTo?.phone) && (
                          <span className="text-[11px] text-slate-500 block">
                            {inv.billTo.company
                              ? `${inv.billTo.company} • `
                              : ""}
                            {inv.billTo.phone || ""}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700">
                        {inv.items?.length || 0}
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-900 text-sm">
                        {(inv.totalAmount || 0).toLocaleString()}{" "}
                        {inv.currency || "MMK"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-[150px] truncate">
                        {inv.paymentMethod || inv.paymentTerms || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <select
                          value={inv.status || "issued"}
                          onChange={(e) =>
                            handleStatusChange(inv, e.target.value as any)
                          }
                          className={`text-[11px] font-bold border rounded-full px-2.5 py-0.5 outline-none cursor-pointer ${
                            inv.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : inv.status === "issued"
                              ? "bg-ocean-50 text-ocean-700 border-ocean-300"
                              : "bg-slate-50 text-slate-700 border-slate-300"
                          }`}
                        >
                          <option value="issued">Issued</option>
                          <option value="paid">Paid</option>
                          <option value="draft">Draft</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Invoice View */}
                          <Button
                            variant="subtle"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setModalInitialType("invoice");
                              setIsPreviewOpen(true);
                            }}
                            title="View Invoice"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>

                          {/* Receipt View Shortcut */}
                          <Button
                            variant={inv.status === "paid" ? "default" : "outline"}
                            size="icon-sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setModalInitialType("receipt");
                              setIsPreviewOpen(true);
                            }}
                            title="View & Download Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handleEditInvoice(inv)}
                            title="Edit Invoice"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => setInvoiceToDelete(inv)}
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {/* TAB 2: CREATE INVOICE FORM & LIVE PREVIEW */}
      {activeTab === "create" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">
                Document:
              </span>
              <Badge variant="secondary">{invoiceData.invoiceNo}</Badge>
              {invoiceData.status === "paid" && (
                <Badge variant="success">Paid</Badge>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print {docPrefix}
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
                variant="subtle"
                size="sm"
                onClick={handleDownloadPdf}
                isLoading={isExportingPdf}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download PDF
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveInvoice}
                isLoading={isSaving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Invoice
              </Button>
            </div>
          </div>

          {/* Form & Live Preview Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Left Form (5 cols) */}
            <div className="xl:col-span-5 space-y-6">
              {/* Customer Details */}
              <Card>
                <CardHeader className="border-b border-slate-100 pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ocean-600" /> Bill To / Received From
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. U Kyaw Thu"
                      value={invoiceData.billTo.name}
                      onChange={(e) =>
                        setInvoiceData({
                          ...invoiceData,
                          billTo: {
                            ...invoiceData.billTo,
                            name: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Company
                      </label>
                      <Input
                        placeholder="e.g. Golden Land Villa"
                        value={invoiceData.billTo.company || ""}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            billTo: {
                              ...invoiceData.billTo,
                              company: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Phone
                      </label>
                      <Input
                        placeholder="09..."
                        value={invoiceData.billTo.phone || ""}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            billTo: {
                              ...invoiceData.billTo,
                              phone: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Email
                      </label>
                      <Input
                        placeholder="client@example.com"
                        value={invoiceData.billTo.email || ""}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            billTo: {
                              ...invoiceData.billTo,
                              email: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Address
                      </label>
                      <Input
                        placeholder="No.12, Pyay Road, Yangon"
                        value={invoiceData.billTo.address || ""}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            billTo: {
                              ...invoiceData.billTo,
                              address: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice & Payment Settings */}
              <Card>
                <CardHeader className="border-b border-slate-100 pb-3">
                  <CardTitle className="text-sm">Invoice & Payment Settings</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Invoice No
                      </label>
                      <Input
                        value={invoiceData.invoiceNo}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            invoiceNo: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Invoice Date
                      </label>
                      <Input
                        type="date"
                        value={invoiceData.invoiceDate}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            invoiceDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Status & Payment Method */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Invoice Status
                      </label>
                      <Select
                        value={invoiceData.status || "issued"}
                        onChange={(e) => {
                          const status = e.target.value as any;
                          const paymentReceivedDate =
                            status === "paid" && !invoiceData.paymentReceivedDate
                              ? new Date().toISOString().split("T")[0]
                              : invoiceData.paymentReceivedDate;
                          setInvoiceData({
                            ...invoiceData,
                            status,
                            paymentReceivedDate,
                          });
                          if (status === "paid") {
                            setPreviewDocType("receipt");
                          }
                        }}
                      >
                        <option value="issued">Issued (Unpaid)</option>
                        <option value="paid">Paid (Receipt Ready)</option>
                        <option value="draft">Draft</option>
                        <option value="cancelled">Cancelled</option>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Payment Method
                      </label>
                      <Select
                        value={invoiceData.paymentMethod || "KBZ Pay"}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            paymentMethod: e.target.value,
                          })
                        }
                      >
                        <option value="KBZ Pay">KBZ Pay</option>
                        <option value="AYA Pay">AYA Pay</option>
                        <option value="CB Pay / WavePay">CB Pay / WavePay</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </Select>
                    </div>
                  </div>

                  {/* Payment Received Date (Visible if Paid) */}
                  {invoiceData.status === "paid" && (
                    <div className="space-y-1 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                      <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        Payment Received Date
                      </label>
                      <Input
                        type="date"
                        value={invoiceData.paymentReceivedDate || ""}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            paymentReceivedDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Payment Terms
                    </label>
                    <Input
                      value={invoiceData.paymentTerms}
                      placeholder="e.g. 50% Advance, 50% on Completion"
                      onChange={(e) =>
                        setInvoiceData({
                          ...invoiceData,
                          paymentTerms: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Discount / Tax (MMK)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={invoiceData.discountOrTaxAmount || ""}
                      placeholder="0"
                      onChange={(e) =>
                        handleDiscountChange(Number(e.target.value))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Line Items Editor */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
                  <CardTitle className="text-sm">Invoice Line Items</CardTitle>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={handleAddItem}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {invoiceData.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">
                          Item #{index + 1}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>

                      <Input
                        placeholder="Description (e.g. Pool Pump, Tiles...)"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.qty || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "qty",
                              Number(e.target.value)
                            )
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Unit Price"
                          value={item.unitPrice || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unitPrice",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="text-right text-xs font-bold text-slate-700 pt-1">
                        Amount: {(item.amount || 0).toLocaleString()}{" "}
                        {invoiceData.currency}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Remarks Editor */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
                  <CardTitle className="text-sm">Warranty & Remarks</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRemark}
                    leftIcon={<Plus className="w-3 h-3" />}
                  >
                    Add Note
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {(invoiceData.remarks || []).map((remark, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={remark}
                        onChange={(e) =>
                          handleRemarkChange(idx, e.target.value)
                        }
                        className="text-xs"
                      />
                      <button
                        onClick={() => handleRemoveRemark(idx)}
                        className="p-2 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Live Document Preview (7 cols) */}
            <div className="xl:col-span-7 sticky top-4 space-y-3">
              <div className="flex items-center justify-between px-2">
                {/* Switcher Toggle in Live Preview */}
                <div className="bg-slate-200 p-1 rounded-2xl flex items-center gap-1 border border-slate-300/80">
                  <button
                    onClick={() => setPreviewDocType("invoice")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      previewDocType === "invoice"
                        ? "bg-white text-ocean-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Invoice Preview
                  </button>
                  <button
                    onClick={() => setPreviewDocType("receipt")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      previewDocType === "receipt"
                        ? "bg-white text-ocean-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Receipt Preview
                  </button>
                </div>

                <span className="text-xs font-medium text-slate-400">
                  Pixel-perfect Single A4 Page
                </span>
              </div>

              <div className="bg-slate-200/80 p-4 sm:p-6 rounded-3xl overflow-x-auto shadow-inner border border-slate-300 flex justify-center">
                <div className="scale-[0.82] sm:scale-100 origin-top">
                  {previewDocType === "invoice" ? (
                    <InvoiceDocument ref={documentRef} data={invoiceData} />
                  ) : (
                    <ReceiptDocument ref={documentRef} data={invoiceData} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice / Receipt Modal Preview (from Table or after Save) */}
      {selectedInvoice && (
        <InvoiceModal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedInvoice(null);
          }}
          invoiceData={selectedInvoice}
          initialDocumentType={modalInitialType}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${invoiceToDelete?.invoiceNo}" for ${invoiceToDelete?.billTo?.name}?`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default InvoiceGenerator;
