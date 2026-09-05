import React, { useRef, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
  ClipboardList,
  Package,
  Boxes,
  PlusCircle,
  X,
  Layers,
  FolderPlus,
  ChevronDown,
  Briefcase,
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
import {
  QuotationDocument,
  QuotationCategorySection,
  DEFAULT_QUOTATION_SECTIONS,
} from "../components/Invoice/QuotationDocument";
import { InvoiceModal, DocumentType } from "../components/Invoice/InvoiceModal";
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
import { fetchProducts } from "../services/Inventory/fetchProducts";
import {
  fetchQuotationCategories,
  createQuotationCategory,
  QuotationCategoryItem,
} from "../services/Invoice/quotationCategory.service";
import { fetchProjects, Project } from "../services/Project/project.service";
import { Product } from "../types";
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
  const [previewDocType, setPreviewDocType] =
    useState<DocumentType>("quotation");

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
  const [modalInitialType, setModalInitialType] =
    useState<DocumentType>("quotation");
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceRecord | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Form & Export state
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  // Inventory Line Item Picker state
  const [isInventoryPickerOpen, setIsInventoryPickerOpen] = useState(false);
  const [inventoryProducts, setInventoryProducts] = useState<Product[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("all");
  const [targetSectionIndex, setTargetSectionIndex] = useState<number>(0);
  const [targetRowIndex, setTargetRowIndex] = useState<number | null>(null);

  // Database Quotation Categories state
  const [dbCategories, setDbCategories] = useState<QuotationCategoryItem[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Projects Linker state
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const getInitialInvoiceData = (): InvoiceData & {
    quotationNo?: string;
    validityTerms?: string;
    paymentMethod?: string;
    paymentReceivedDate?: string;
    status?: "draft" | "issued" | "paid" | "cancelled";
    categorySections: QuotationCategorySection[];
  } => {
    const today = new Date().toISOString().split("T")[0];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = `OB-${today.replace(/-/g, "")}-${randomSuffix}`;
    const quotationNo = `OB-Q-${today.replace(/-/g, "")}-${randomSuffix}`;

    const defaultSections = JSON.parse(
      JSON.stringify(DEFAULT_QUOTATION_SECTIONS)
    );

    // Flatten all items for invoice
    const allItems: InvoiceItem[] = [];
    defaultSections.forEach((sec: QuotationCategorySection) => {
      sec.items.forEach((it) => {
        allItems.push({ ...it, no: allItems.length + 1 });
      });
    });

    const subTotal = allItems.reduce((s, it) => s + (it.amount || 0), 0);

    return {
      invoiceNo,
      quotationNo,
      invoiceDate: today,
      paymentTerms: "50% Advance, 50% on Completion",
      validityTerms: "Valid for 14 Days",
      paymentMethod: "KBZ Pay",
      paymentReceivedDate: "",
      status: "issued",
      projectId: null,
      billTo: {
        name: "",
        company: "",
        address: "",
        email: "",
        phone: "",
      },
      categorySections: defaultSections,
      items: allItems,
      subTotal,
      discountOrTaxLabel: "Discount / Tax (%)",
      discountOrTaxAmount: 0,
      totalAmount: subTotal,
      remarks: [...DEFAULT_REMARKS],
      paymentAccounts: [...DEFAULT_PAYMENT_ACCOUNTS],
      preparedBy: "Prepared By: Ocean Blue",
      currency: "MMK",
    };
  };

  const [invoiceData, setInvoiceData] = useState(getInitialInvoiceData());

  // Load Invoices & DB Categories on mount
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

  const loadCategories = async () => {
    try {
      const res = await fetchQuotationCategories();
      if (res && res.success && res.data) {
        setDbCategories(res.data);
      }
    } catch (err) {
      console.error("Error loading quotation categories:", err);
    }
  };

  // Load Projects for Project Linker
  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetchProjects();
      if (res && res.success && res.data) {
        setAvailableProjects(res.data.clients || []);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleSelectProject = (projId: string) => {
    if (!projId) {
      handleUnlinkProject();
      return;
    }
    const selectedProj = availableProjects.find((p) => p._id === projId);
    if (selectedProj) {
      setInvoiceData((prev) => ({
        ...prev,
        projectId: selectedProj._id,
        billTo: {
          ...prev.billTo,
          name: selectedProj.customer || prev.billTo.name,
          company: selectedProj.siteName || prev.billTo.company,
          address: selectedProj.description || prev.billTo.address,
        },
      }));
      toast.success(`Linked to Project: "${selectedProj.siteName}"`);
    }
  };

  const handleUnlinkProject = () => {
    setInvoiceData((prev) => ({
      ...prev,
      projectId: null,
    }));
    toast.info("Unlinked from project. Manual custom editing enabled.");
  };

  useEffect(() => {
    loadInvoices();
    loadCategories();
    loadProjects();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadInvoices();
  };

  // Load Inventory Products
  const loadInventory = async () => {
    setIsLoadingInventory(true);
    try {
      const res = await fetchProducts({ limit: 150 });
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.products || [];
      setInventoryProducts(list);
    } catch (err) {
      console.error("Error loading inventory products:", err);
      toast.error("Failed to load inventory products");
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const handleOpenInventoryPicker = (
    sectionIdx: number,
    rowIndex: number | null = null
  ) => {
    setTargetSectionIndex(sectionIdx);
    setTargetRowIndex(rowIndex);
    setIsInventoryPickerOpen(true);
    if (inventoryProducts.length === 0) {
      loadInventory();
    }
  };

  // Filtered products list for inventory modal
  const filteredProducts = useMemo(() => {
    return inventoryProducts.filter((p) => {
      const name = (p.name || (p as any).productName || "").toLowerCase();
      const code = (p.productCode || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const query = inventorySearch.toLowerCase().trim();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        code.includes(query) ||
        category.includes(query);

      const matchesCategory =
        inventoryCategoryFilter === "all" ||
        p.category === inventoryCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [inventoryProducts, inventorySearch, inventoryCategoryFilter]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    inventoryProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [inventoryProducts]);

  // Recalculate totals across all category sections
  const syncSectionsAndTotals = (
    sections: QuotationCategorySection[],
    discountOrTaxAmount: number = invoiceData.discountOrTaxAmount || 0
  ) => {
    const allItems: InvoiceItem[] = [];
    let grandSum = 0;

    sections.forEach((sec) => {
      sec.items.forEach((it) => {
        allItems.push({ ...it, no: allItems.length + 1 });
        grandSum += Number(it.amount) || 0;
      });
    });

    const subTotal = grandSum;
    const totalAmount = Math.max(0, subTotal - (Number(discountOrTaxAmount) || 0));

    return { allItems, subTotal, totalAmount };
  };

  // Section & Item Change Handlers
  const handleSectionTitleChange = (sectionIdx: number, newTitle: string) => {
    const updatedSections = [...invoiceData.categorySections];
    updatedSections[sectionIdx] = {
      ...updatedSections[sectionIdx],
      title: newTitle,
    };
    setInvoiceData({
      ...invoiceData,
      categorySections: updatedSections,
    });
  };

  const handleCreateNewDbCategory = async (sectionIdx: number) => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await createQuotationCategory(newCategoryName.trim());
      if (res && res.success) {
        toast.success(`Category "${res.data.name}" added to Database!`);
        await loadCategories();
        handleSectionTitleChange(sectionIdx, res.data.name);
        setNewCategoryName("");
        setIsCreatingCategory(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    }
  };

  const handleAddCategorySection = () => {
    const newSection: QuotationCategorySection = {
      title: "New Category Section",
      items: [
        {
          no: 1,
          description: "",
          qty: 1,
          unitPrice: 0,
          amount: 0,
        },
      ],
    };
    const updatedSections = [...invoiceData.categorySections, newSection];
    const { allItems, subTotal, totalAmount } = syncSectionsAndTotals(
      updatedSections,
      invoiceData.discountOrTaxAmount
    );

    setInvoiceData({
      ...invoiceData,
      categorySections: updatedSections,
      items: allItems,
      subTotal,
      totalAmount,
    });
    toast.success("Added new Category Section");
  };

  const handleRemoveCategorySection = (sectionIdx: number) => {
    if (invoiceData.categorySections.length <= 1) {
      toast.error("Quotation must have at least 1 section");
      return;
    }
    const updatedSections = invoiceData.categorySections.filter(
      (_, i) => i !== sectionIdx
    );
    const { allItems, subTotal, totalAmount } = syncSectionsAndTotals(
      updatedSections,
      invoiceData.discountOrTaxAmount
    );

    setInvoiceData({
      ...invoiceData,
      categorySections: updatedSections,
      items: allItems,
      subTotal,
      totalAmount,
    });
  };

  const handleItemFieldChange = (
    sectionIdx: number,
    itemIdx: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    const updatedSections = [...invoiceData.categorySections];
    const section = { ...updatedSections[sectionIdx] };
    const items = [...section.items];
    const currentItem = { ...items[itemIdx], [field]: value };

    if (field === "qty" || field === "unitPrice") {
      const qty = field === "qty" ? Number(value) : currentItem.qty;
      const unitPrice =
        field === "unitPrice" ? Number(value) : currentItem.unitPrice;
      currentItem.amount = (qty || 0) * (unitPrice || 0);
    }

    items[itemIdx] = currentItem;
    section.items = items;
    updatedSections[sectionIdx] = section;

    const { allItems, subTotal, totalAmount } = syncSectionsAndTotals(
      updatedSections,
      invoiceData.discountOrTaxAmount
    );

    setInvoiceData({
      ...invoiceData,
      categorySections: updatedSections,
      items: allItems,
      subTotal,
      totalAmount,
    });
  };

  const handleAddCustomItemToSection = (sectionIdx: number) => {
    const updatedSections = [...invoiceData.categorySections];
    const section = { ...updatedSections[sectionIdx] };
    const newItem: InvoiceItem = {
      no: section.items.length + 1,
      description: "",
      qty: 1,
      unitPrice: 0,
      amount: 0,
    };
    section.items = [...section.items, newItem];
    updatedSections[sectionIdx] = section;

    const { allItems, subTotal, totalAmount } = syncSectionsAndTotals(
      updatedSections,
      invoiceData.discountOrTaxAmount
    );

    setInvoiceData({
      ...invoiceData,
      categorySections: updatedSections,
      items: allItems,
      subTotal,
      totalAmount,
    });
  };

  const handleRemoveItemFromSection = (
    sectionIdx: number,
    itemIdx: number
  ) => {
    const updatedSections = [...invoiceData.categorySections];
    const section = { ...updatedSections[sectionIdx] };
    if (section.items.length <= 1) {
      toast.error("Section must have at least 1 item");
      return;
    }
    section.items = section.items.filter((_, i) => i !== itemIdx);
    updatedSections[sectionIdx] = section;

    const { allItems, subTotal, totalAmount } = syncSectionsAndTotals(
      updatedSections,
      invoiceData.discountOrTaxAmount
    );

    setInvoiceData({
      ...invoiceData,
      categorySections: updatedSections,
      items: allItems,
      subTotal,
      totalAmount,
    });
  };

  // Select Product from Inventory Modal into Section
  const handleSelectInventoryProduct = (
    product: Product,
    selectedQty: number = 1
  ) => {
    const productName =
      product.name || (product as any).productName || "Product";
    const unitPrice =
      Number(product.sellingPrice) || Number(product.costPrice) || 0;
    const qty = selectedQty > 0 ? selectedQty : 1;
    const amount = qty * unitPrice;

    const updatedSections = [...invoiceData.categorySections];
    const section = { ...updatedSections[targetSectionIndex] };
    const items = [...section.items];

    if (targetRowIndex !== null && items[targetRowIndex]) {
      // Replace existing row in section
      items[targetRowIndex] = {
        ...items[targetRowIndex],
        description: productName,
        unitPrice,
        qty,
        amount,
      };
      toast.success(
        `Updated item in "${section.title}" with "${productName}"`
      );
    } else {
      // Append new row to section
      items.push({
        no: items.length + 1,
        description: productName,
        qty,
        unitPrice,
        amount,
      });
      toast.success(`Added "${productName}" to "${section.title}"`);
    }

    section.items = items;
    updatedSections[targetSectionIndex] = section;

    const { allItems, subTotal, totalAmount } = syncSectionsAndTotals(
      updatedSections,
      invoiceData.discountOrTaxAmount
    );

    setInvoiceData({
      ...invoiceData,
      categorySections: updatedSections,
      items: allItems,
      subTotal,
      totalAmount,
    });

    setIsInventoryPickerOpen(false);
    setTargetRowIndex(null);
  };

  const handleDiscountChange = (val: number) => {
    const { allItems, subTotal, totalAmount } = syncSectionsAndTotals(
      invoiceData.categorySections,
      val
    );
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

  // Save Document
  const handleSaveInvoice = async () => {
    if (!invoiceData.billTo.name.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    setIsSaving(true);
    try {
      const res = await createInvoice(invoiceData);
      if (res && res.success) {
        toast.success("Document saved successfully!");
        loadInvoices();
        setSelectedInvoice(res.data);
        setModalInitialType(previewDocType);
        setIsPreviewOpen(true);
      } else {
        toast.error(res.message || "Failed to save document");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error saving document");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Document
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete?._id) return;
    setIsDeleting(true);
    try {
      const res = await deleteInvoice(invoiceToDelete._id);
      if (res.success) {
        toast.success("Document deleted successfully");
        setInvoiceToDelete(null);
        loadInvoices();
      } else {
        toast.error(res.message || "Failed to delete document");
      }
    } catch (err) {
      toast.error("Error deleting document");
    } finally {
      setIsDeleting(false);
    }
  };

  // Change Status
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
          toast.info(
            "Invoice marked as Paid! You can now download the Receipt.",
            {
              action: {
                label: "View Receipt",
                onClick: () => {
                  setSelectedInvoice({
                    ...invoice,
                    status: "paid",
                    paymentReceivedDate,
                  });
                  setModalInitialType("receipt");
                  setIsPreviewOpen(true);
                },
              },
            }
          );
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
      quotationNo:
        inv.quotationNo || inv.invoiceNo.replace(/^OB-/, "OB-Q-"),
      invoiceDate: inv.invoiceDate
        ? new Date(inv.invoiceDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      paymentTerms: inv.paymentTerms || "50% Advance, 50% on Completion",
      validityTerms: inv.validityTerms || "Valid for 14 Days",
      paymentMethod: inv.paymentMethod || "KBZ Pay",
      paymentReceivedDate: inv.paymentReceivedDate
        ? new Date(inv.paymentReceivedDate).toISOString().split("T")[0]
        : "",
      status: inv.status || "issued",
      billTo: { ...inv.billTo },
      categorySections: DEFAULT_QUOTATION_SECTIONS,
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
    toast.info(`Loaded document ${inv.invoiceNo} into editor`);
  };

  // Export handlers
  const getDocPrefix = () => {
    switch (previewDocType) {
      case "receipt":
        return "Receipt";
      case "quotation":
        return "Quotation";
      default:
        return "Invoice";
    }
  };

  const docPrefix = getDocPrefix();
  const documentNumber =
    previewDocType === "quotation"
      ? invoiceData.quotationNo ||
        invoiceData.invoiceNo.replace(/^OB-/, "OB-Q-")
      : invoiceData.invoiceNo || "OceanBlue";

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsExportingPdf(true);
    try {
      const filename = `${docPrefix}_${documentNumber}`;
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
      const filename = `${docPrefix}_${documentNumber}.png`;
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
        title="Official Quotations, Invoices & Receipts"
        subtitle="Manage, create, auto-fill, and export official Ocean Blue A4 Quotations, Invoices, and Receipts"
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
                Document List ({invoices.length})
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
                Create New Document
              </button>
            </div>
          </div>
        }
      />

      {/* TAB 1: DOCUMENT LIST & TABLE */}
      {activeTab === "list" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Total Documents"
              value={stats.totalCount || invoices.length}
              icon={<Receipt className="w-5 h-5" />}
              variant="ocean"
              subValue="Generated invoices count"
            />
            <StatsCard
              label="Total Invoiced"
              value={`${(stats.totalInvoicedAmount || 0).toLocaleString()} MMK`}
              icon={<DollarSign className="w-5 h-5" />}
              variant="navy"
              subValue="Gross billing amount"
            />
            <StatsCard
              label="Paid / Receipts"
              value={`${(stats.paidAmount || 0).toLocaleString()} MMK`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="emerald"
              subValue={`${stats.paidCount || 0} receipts ready`}
            />
            <StatsCard
              label="Issued / Pending"
              value={stats.issuedCount || 0}
              icon={<Clock className="w-5 h-5" />}
              variant="amber"
              subValue="Awaiting payment"
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
                      placeholder="Search by Invoice No, Quotation No, Customer, Phone..."
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
                    New Document
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
                  <TableHead>Quotation / Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer (Bill To)</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Payment Method / Terms</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-52">
                    Quick Exports & Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingList ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-ocean-600 mx-auto mb-2" />
                      <span className="text-slate-500 font-semibold text-xs">
                        Loading Documents...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableEmpty
                    colSpan={9}
                    icon={<FileText className="w-6 h-6 text-slate-300" />}
                    title="No documents found"
                    description="Create a new document to get started"
                    actionLabel="Create Document"
                    onAction={() => setActiveTab("create")}
                  />
                ) : (
                  invoices.map((inv, idx) => (
                    <TableRow key={inv._id || idx}>
                      <TableCell className="text-center font-bold text-slate-500">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-ocean-800 block">
                          {inv.quotationNo ||
                            inv.invoiceNo.replace(/^OB-/, "OB-Q-")}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold block">
                          {inv.invoiceNo}
                        </span>
                        {inv.paymentReceivedDate && (
                          <span className="block text-[10px] text-emerald-600 font-semibold">
                            Paid:{" "}
                            {new Date(
                              inv.paymentReceivedDate
                            ).toLocaleDateString()}
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
                          {/* Quotation View (1st) */}
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setModalInitialType("quotation");
                              setIsPreviewOpen(true);
                            }}
                            title="View & Download Quotation"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                          </Button>

                          {/* Invoice View (2nd) */}
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

                          {/* Receipt View (3rd) */}
                          <Button
                            variant={
                              inv.status === "paid" ? "default" : "outline"
                            }
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
                            title="Edit Document"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => setInvoiceToDelete(inv)}
                            title="Delete Document"
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

      {/* TAB 2: CREATE DOCUMENT FORM & LIVE PREVIEW */}
      {activeTab === "create" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">
                Document:
              </span>
              <Badge variant="secondary">
                {previewDocType === "quotation"
                  ? invoiceData.quotationNo
                  : invoiceData.invoiceNo}
              </Badge>
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
                Save Document
              </Button>
            </div>
          </div>

          {/* Form & Live Preview Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Left Form (5 cols) */}
            <div className="xl:col-span-5 space-y-6">
              {/* Customer & Project Info */}
              <Card>
                <CardHeader className="border-b border-slate-100 pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ocean-600" /> Quotation /
                    Project & Customer Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {/* Project Linker Dropdown */}
                  <div className="p-3 bg-ocean-50/70 rounded-2xl border border-ocean-100/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ocean-900 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-ocean-600" />
                        Link to Client Project (Optional)
                      </label>
                      {invoiceData.projectId && (
                        <button
                          type="button"
                          onClick={handleUnlinkProject}
                          className="text-[11px] font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Unlink project and edit manually"
                        >
                          <X className="w-3 h-3" /> Unlink
                        </button>
                      )}
                    </div>
                    <Select
                      value={invoiceData.projectId || ""}
                      onChange={(e) => handleSelectProject(e.target.value)}
                      className="bg-white text-xs sm:text-sm h-9"
                    >
                      <option value="">✨ Manual / Custom Entry (No Project Linked)</option>
                      {availableProjects.map((proj) => (
                        <option key={proj._id} value={proj._id}>
                          📁 {proj.siteName} — {proj.customer} ({proj.status})
                        </option>
                      ))}
                    </Select>
                    {invoiceData.projectId && (
                      <div className="flex items-center gap-1.5 text-[11px] text-ocean-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Auto-filled from Project. You can still modify any fields below freely.</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Customer / Client Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. U Kyaw Min"
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
                        Project / Company Name
                      </label>
                      <Input
                        placeholder="e.g. Novotal Villa Swimming Pool"
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
                        Location / Site Address
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

              {/* Document & Validity Settings */}
              <Card>
                <CardHeader className="border-b border-slate-100 pb-3">
                  <CardTitle className="text-sm">
                    Document & Validity Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Quotation No
                      </label>
                      <Input
                        value={
                          invoiceData.quotationNo ||
                          invoiceData.invoiceNo.replace(/^OB-/, "OB-Q-")
                        }
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            quotationNo: e.target.value,
                          })
                        }
                      />
                    </div>
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Document Date
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
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Validity Terms
                      </label>
                      <Input
                        value={invoiceData.validityTerms || "Valid for 14 Days"}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            validityTerms: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Status & Payment Method */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Document Status
                      </label>
                      <Select
                        value={invoiceData.status || "issued"}
                        onChange={(e) => {
                          const status = e.target.value as any;
                          const paymentReceivedDate =
                            status === "paid" &&
                            !invoiceData.paymentReceivedDate
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
                        <option value="CB Pay / WavePay">
                          CB Pay / WavePay
                        </option>
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

              {/* DYNAMIC CATEGORY SECTIONS LINE ITEMS EDITOR */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-ocean-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      Quotation Category Sections
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCategorySection}
                    leftIcon={<FolderPlus className="w-3.5 h-3.5 text-ocean-600" />}
                    className="text-ocean-700 border-ocean-200 bg-ocean-50/50 hover:bg-ocean-100"
                  >
                    + Add Category Section
                  </Button>
                </div>

                {invoiceData.categorySections.map((section, secIdx) => {
                  const sectionSubTotal = section.items.reduce(
                    (s, it) => s + (Number(it.amount) || 0),
                    0
                  );

                  return (
                    <Card
                      key={secIdx}
                      className="border-slate-200/90 shadow-sm overflow-hidden"
                    >
                      {/* Section Header: Category Selector & Title Input */}
                      <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-6 h-6 rounded-xl bg-ocean-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {secIdx + 1}
                            </span>

                            {/* Category Title Input & Selector */}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={section.title}
                                  onChange={(e) =>
                                    handleSectionTitleChange(
                                      secIdx,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Category Title (e.g. Swimming Pool Shell, M & E...)"
                                  className="font-bold text-xs sm:text-sm bg-white h-9"
                                />

                                {/* DB Category Quick Select Dropdown */}
                                {dbCategories.length > 0 && (
                                  <Select
                                    value={
                                      dbCategories.some(
                                        (c) => c.name === section.title
                                      )
                                        ? section.title
                                        : ""
                                    }
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleSectionTitleChange(
                                          secIdx,
                                          e.target.value
                                        );
                                      }
                                    }}
                                    className="h-9 text-xs w-44 bg-white"
                                  >
                                    <option value="" disabled>
                                      Saved Categories...
                                    </option>
                                    {dbCategories.map((c) => (
                                      <option
                                        key={c._id || c.name}
                                        value={c.name}
                                      >
                                        {c.name}
                                      </option>
                                    ))}
                                  </Select>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delete Section button */}
                          {invoiceData.categorySections.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveCategorySection(secIdx)
                              }
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                              title="Delete this category section"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Inline New Category Creation to DB */}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-500 font-medium">
                            Sub-Total:{" "}
                            <span className="font-bold text-ocean-700">
                              {sectionSubTotal.toLocaleString()} MMK
                            </span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isCreatingCategory ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  size="sm"
                                  placeholder="New category name..."
                                  value={newCategoryName}
                                  onChange={(e) =>
                                    setNewCategoryName(e.target.value)
                                  }
                                  className="h-7 text-xs w-36 bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCreateNewDbCategory(secIdx)
                                  }
                                  className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsCreatingCategory(false)}
                                  className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-[10px]"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsCreatingCategory(true)}
                                className="text-ocean-600 hover:text-ocean-800 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3 h-3" /> Save as DB Category
                              </button>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      {/* Items in this Category */}
                      <CardContent className="p-4 space-y-3">
                        {section.items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">
                                  {itemIdx + 1}
                                </span>
                                Item #{itemIdx + 1}
                              </span>

                              <div className="flex items-center gap-2">
                                {/* Pick inventory for this specific row */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenInventoryPicker(
                                      secIdx,
                                      itemIdx
                                    )
                                  }
                                  className="text-[11px] font-bold text-ocean-600 hover:text-ocean-800 bg-ocean-50 hover:bg-ocean-100 px-2 py-0.5 rounded-lg border border-ocean-200 flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Replace with product from inventory"
                                >
                                  <Package className="w-3 h-3" />
                                  Inventory
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveItemFromSection(
                                      secIdx,
                                      itemIdx
                                    )
                                  }
                                  className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                              </div>
                            </div>

                            {/* Description Input */}
                            <Input
                              placeholder="Description (e.g. Pool Pump, Tiles, Soil Works...)"
                              value={item.description}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  secIdx,
                                  itemIdx,
                                  "description",
                                  e.target.value
                                )
                              }
                              className="font-medium text-xs sm:text-sm bg-white"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  Qty
                                </label>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Qty"
                                  value={item.qty || ""}
                                  onChange={(e) =>
                                    handleItemFieldChange(
                                      secIdx,
                                      itemIdx,
                                      "qty",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">
                                  Unit Price (Ks)
                                </label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="Unit Price"
                                  value={item.unitPrice || ""}
                                  onChange={(e) =>
                                    handleItemFieldChange(
                                      secIdx,
                                      itemIdx,
                                      "unitPrice",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="bg-white"
                                />
                              </div>
                            </div>

                            <div className="text-right text-xs font-bold text-slate-800 pt-1 flex items-center justify-between border-t border-slate-200/60 mt-1">
                              <span className="text-[11px] text-slate-400 font-normal">
                                Amount
                              </span>
                              <span>
                                {(item.amount || 0).toLocaleString()}{" "}
                                {invoiceData.currency}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Section Actions: Add Custom Item or Pick from Inventory */}
                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleOpenInventoryPicker(secIdx, null)
                            }
                            leftIcon={
                              <Package className="w-3.5 h-3.5 text-ocean-600" />
                            }
                            className="text-ocean-700 border-ocean-200 bg-ocean-50/40 hover:bg-ocean-100"
                          >
                            Pick from Inventory
                          </Button>
                          <Button
                            type="button"
                            variant="subtle"
                            size="sm"
                            onClick={() =>
                              handleAddCustomItemToSection(secIdx)
                            }
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                          >
                            + Custom Item
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

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
                        className="text-xs bg-white"
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
                {/* 3-Way Switcher Toggle in Live Preview: Quotation -> Invoice -> Receipt */}
                <div className="bg-slate-200 p-1 rounded-2xl flex items-center gap-1 border border-slate-300/80">
                  <button
                    onClick={() => setPreviewDocType("quotation")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      previewDocType === "quotation"
                        ? "bg-white text-ocean-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Quotation Preview
                  </button>
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
                  {previewDocType === "quotation" && (
                    <QuotationDocument ref={documentRef} data={invoiceData} />
                  )}
                  {previewDocType === "invoice" && (
                    <InvoiceDocument ref={documentRef} data={invoiceData} />
                  )}
                  {previewDocType === "receipt" && (
                    <ReceiptDocument ref={documentRef} data={invoiceData} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice / Receipt / Quotation Modal Preview */}
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

      {/* INVENTORY PRODUCT PICKER MODAL */}
      {isInventoryPickerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center border border-ocean-100 shrink-0">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      Select Product from Inventory
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Adding to Section:{" "}
                      <span className="font-bold text-ocean-700">
                        {invoiceData.categorySections[targetSectionIndex]
                          ?.title || "Current Section"}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInventoryPickerOpen(false)}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-2.5 shrink-0">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search inventory by product name or code..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                    className="h-10 text-xs sm:text-sm bg-slate-50/60"
                  />
                  {inventorySearch && (
                    <button
                      type="button"
                      onClick={() => setInventorySearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {uniqueCategories.length > 0 && (
                  <Select
                    value={inventoryCategoryFilter}
                    onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                    className="h-10 text-xs w-full sm:w-44 bg-slate-50/60"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {/* Products List */}
              <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-slate-50/40">
                {isLoadingInventory ? (
                  <div className="py-12 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-ocean-600 mx-auto mb-2" />
                    <span className="text-xs text-slate-500 font-semibold">
                      Loading inventory items...
                    </span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Package className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">
                      No inventory products found
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Try searching with another keyword or add items manually
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const name =
                      product.name || (product as any).productName || "Product";
                    const price =
                      Number(product.sellingPrice) ||
                      Number(product.costPrice) ||
                      0;
                    const stock =
                      (product.stockWarehouse || 0) + (product.stockShop || 0);

                    return (
                      <div
                        key={product._id || product.id}
                        className="p-3.5 bg-white border border-slate-200/80 hover:border-ocean-300 hover:shadow-xs rounded-2xl transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-ocean-50 text-ocean-600 font-bold text-xs flex items-center justify-center shrink-0 border border-ocean-100 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              {product.productCode && (
                                <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[10px] text-slate-600">
                                  {product.productCode}
                                </span>
                              )}
                              {product.category && (
                                <span className="truncate">{product.category}</span>
                              )}
                              <span>•</span>
                              <span
                                className={
                                  stock > 0
                                    ? "text-emerald-600 font-semibold"
                                    : "text-amber-600 font-semibold"
                                }
                              >
                                Stock: {stock}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Add Button */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">
                              Selling Price
                            </span>
                            <span className="font-black text-slate-900 text-xs sm:text-sm">
                              {price.toLocaleString()} MMK
                            </span>
                          </div>

                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              handleSelectInventoryProduct(product, 1)
                            }
                            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                          >
                            Add to Section
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {filteredProducts.length} of {inventoryProducts.length}{" "}
                  products
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInventoryPickerOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={handleDeleteInvoice}
        title="Delete Document"
        message={`Are you sure you want to delete "${invoiceToDelete?.invoiceNo}" for ${invoiceToDelete?.billTo?.name}?`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default InvoiceGenerator;
