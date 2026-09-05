import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  PieChart,
  BarChart,
  Plus,
  Edit,
  Activity,
  Briefcase,
  FileText,
  Receipt,
  Eye,
  CheckCircle2,
  Printer,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchProjectExpenses,
  fetchProjectPayrollSummary,
  fetchProjectFinancialSummary,
  formatCurrency,
  formatPercentage,
  ProjectFinancialSummary,
} from "../services/ProjectAnalytics/projectAnalytics.service";
import FinancialStatsCards from "../components/ProjectAnalytics/FinancialStatsCards";
import ExpenseBreakdownChart from "../components/ProjectAnalytics/ExpenseBreakdownChart";
import MonthlyTrendsChart from "../components/ProjectAnalytics/MonthlyTrendsChart";
import PayrollSummaryTable from "../components/ProjectAnalytics/PayrollSummaryTable";
import { ProjectExpensesTable } from "../components/ProjectAnalytics/ProjectExpensesTable";
import { ProjectExpenseModal } from "../components/ProjectAnalytics/ProjectExpenseModal";
import { ProjectModal } from "../components/Project/ProjectModal";
import { fetchProjectById, Project } from "../services/Project/project.service";
import { fetchInvoices, InvoiceRecord } from "../services/Invoice/invoice.service";
import { InvoiceModal, DocumentType } from "../components/Invoice/InvoiceModal";
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatsCard,
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
} from "../components/ui";

const ProjectDetailAnalytics: React.FC = () => {
  const { projectId: id } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [financialSummary, setFinancialSummary] =
    useState<ProjectFinancialSummary | null>(null);
  const [expensesData, setExpensesData] = useState<any>(null);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [projectInvoices, setProjectInvoices] = useState<InvoiceRecord[]>([]);
  const [invoiceStats, setInvoiceStats] = useState<any>(null);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] =
    useState<InvoiceRecord | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [modalDocumentType, setModalDocumentType] =
    useState<DocumentType>("quotation");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "expenses" | "payroll" | "invoices" | "timeline"
  >("overview");

  const loadData = async (showFullPageLoader = false) => {
    if (!id) return;
    if (showFullPageLoader) setLoading(true);

    try {
      const [financialRes, expensesRes, payrollRes, invoicesRes] = await Promise.all([
        fetchProjectFinancialSummary(id),
        fetchProjectExpenses(id),
        fetchProjectPayrollSummary(id),
        fetchInvoices({ projectId: id }),
      ]);

      if (financialRes.success && financialRes.data) {
        setFinancialSummary(financialRes.data);
      } else {
        toast.error(
          financialRes.message || t("projects.financialLoadFailed")
        );
      }

      if (expensesRes.success && expensesRes.data) {
        setExpensesData(expensesRes.data);
      } else {
        toast.error(
          expensesRes.message || t("projects.expensesLoadFailed")
        );
      }

      if (payrollRes.success && payrollRes.data) {
        setPayrollData(payrollRes.data);
      } else {
        toast.error(
          payrollRes.message || t("projects.payrollLoadFailed")
        );
      }

      if (invoicesRes && invoicesRes.success) {
        setProjectInvoices(invoicesRes.data || []);
        setInvoiceStats(invoicesRes.stats || null);
      }
    } catch (error: any) {
      console.error("Error loading project analytics:", error);
      toast.error(error.message || t("projects.loadFailed"));
    } finally {
      if (showFullPageLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEditClick = async () => {
    if (!id) return;
    try {
      const res = await fetchProjectById(id);
      setEditProject(res.data.client);
      setEditModalOpen(true);
    } catch (error: any) {
      toast.error(error.message || t("projects.loadFailed"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
        <div className="w-10 h-10 border-4 border-ocean-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-500">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  if (!financialSummary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
        <p className="text-slate-500 font-semibold mb-3">
          {t("projects.notFound")}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/client-projects")}
        >
          {t("projects.backToList")}
        </Button>
      </div>
    );
  }

  const { project, financials, timeline } = financialSummary;

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "signed" || s === "in-development" || s === "active") {
      return <Badge variant="default">{status}</Badge>;
    }
    if (s === "delivered" || s === "completed") {
      return <Badge variant="success">{status}</Badge>;
    }
    return <Badge variant="warning">{status}</Badge>;
  };

  const TABS = [
    {
      id: "overview",
      label: t("projects.tabOverview") || "Overview",
      icon: BarChart,
    },
    {
      id: "expenses",
      label: t("projects.tabExpenses") || "Expenses",
      icon: DollarSign,
      badge: expensesData?.summary?.expenseCount || 0,
    },
    {
      id: "payroll",
      label: t("projects.tabPayroll") || "Payroll & Workers",
      icon: Users,
      badge: payrollData?.summary?.totalWorkers || 0,
    },
    {
      id: "invoices",
      label: "Quotations & Invoices",
      icon: FileText,
      badge: projectInvoices.length,
    },
    {
      id: "timeline",
      label: t("projects.tabTimeline") || "Timeline & Details",
      icon: Calendar,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        backAction={{
          label: t("projects.backToList"),
          onClick: () => navigate("/client-projects"),
        }}
        title={project.siteName}
        subtitle={
          <span className="flex items-center gap-2 mt-1">
            {getStatusBadge(project.status)}
            <Badge variant="neutral">{project.customer}</Badge>
            <Badge variant="outline">
              {project.workers?.length || 0} {t("projects.unitWorkers")}
            </Badge>
          </span>
        }
        icon={<Briefcase className="w-5 h-5" />}
        actions={
          <>
            <Button
              variant="default"
              size="default"
              onClick={() => setExpenseModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t("projects.addExpense")}
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleEditClick}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              {t("projects.editDetails")}
            </Button>
            <Button
              variant="subtle"
              size="default"
              onClick={() => navigate(`/projects/${id}/attendance`)}
              leftIcon={<Users className="w-4 h-4" />}
            >
              {t("projects.viewAttendance")}
            </Button>
          </>
        }
      />

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "outline"}
              size="default"
              onClick={() => setActiveTab(tab.id as any)}
              leftIcon={<Icon className="w-4 h-4" />}
              rightIcon={
                tab.badge !== undefined && tab.badge > 0 ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-ocean-50 text-ocean-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                ) : undefined
              }
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-ocean-600" />{" "}
                  {t("projects.financialSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <FinancialStatsCards
                  financials={{
                    totalExpenses: financials.totalExpenses,
                    totalPayroll: financials.totalPayroll,
                    totalCost: financials.totalCost,
                    estimatedRevenue: financials.estimatedRevenue,
                    estimatedProfit: financials.estimatedProfit,
                    profitMargin: financials.profitMargin,
                  }}
                  timeline={{
                    daysElapsed: timeline.daysElapsed,
                    daysRemaining: timeline.daysRemaining,
                    percentComplete: timeline.percentComplete,
                  }}
                  projectStats={{
                    totalWorkers: payrollData?.summary?.totalWorkers || 0,
                    totalHoursWorked:
                      payrollData?.summary?.totalHoursWorked || 0,
                    attendanceRecordCount:
                      payrollData?.summary?.attendanceRecordCount || 0,
                    avgDailyRate: payrollData?.summary?.avgDailyRate || 0,
                  }}
                  formatCurrency={(n) => formatCurrency(n, language)}
                  formatPercentage={formatPercentage}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <PieChart className="w-4 h-4 text-ocean-600" />{" "}
                  {t("projects.expenseBreakdown")}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("expenses")}
                >
                  {t("projects.tabExpenses")} →
                </Button>
              </CardHeader>
              <CardContent className="pt-5">
                <ExpenseBreakdownChart
                  data={
                    expensesData?.summary?.byCategory
                      ? Object.entries(expensesData.summary.byCategory).map(
                          ([name, value], index) => ({
                            name,
                            value: value as number,
                            color: [
                              "#18181b",
                              "#3f3f46",
                              "#52525b",
                              "#71717a",
                              "#a1a1aa",
                              "#d4d4d8",
                              "#e4e4e7",
                              "#27272a",
                              "#09090b",
                              "#f4f4f5",
                            ][index % 10],
                          })
                        )
                      : []
                  }
                  isLoading={loading}
                  height={260}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right 1/3: Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-ocean-600" />{" "}
                  {t("projects.timeline")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">
                    {t("projects.daysElapsed")}
                  </span>
                  <span className="font-bold text-slate-800">
                    {timeline.daysElapsed} {t("projects.unitDays")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">
                    {t("projects.daysRemaining")}
                  </span>
                  <span className="font-bold text-slate-800">
                    {timeline.daysRemaining} {t("projects.unitDays")}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">
                      {t("projects.progress")}
                    </span>
                    <span className="text-ocean-600">
                      {formatPercentage(timeline.percentComplete)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-ocean-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(timeline.percentComplete, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-ocean-600" />{" "}
                  {t("projects.tabPayroll")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">
                    {t("projects.totalWorkers")}
                  </span>
                  <span className="font-bold text-slate-800">
                    {payrollData?.summary?.totalWorkers || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">
                    {t("projects.totalHours")}
                  </span>
                  <span className="font-bold text-slate-800">
                    {payrollData?.summary?.totalHoursWorked || 0} hrs
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">
                    {t("projects.totalPayroll")}
                  </span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(
                      payrollData?.summary?.totalPayrollCost || 0,
                      language
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <PieChart className="w-4 h-4 text-ocean-600" />{" "}
                  {t("projects.expenseBreakdown")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <ExpenseBreakdownChart
                  data={
                    expensesData?.summary?.byCategory
                      ? Object.entries(expensesData.summary.byCategory).map(
                          ([name, value], index) => ({
                            name,
                            value: value as number,
                            color: [
                              "#18181b",
                              "#3f3f46",
                              "#52525b",
                              "#71717a",
                              "#a1a1aa",
                              "#d4d4d8",
                              "#e4e4e7",
                              "#27272a",
                              "#09090b",
                              "#f4f4f5",
                            ][index % 10],
                          })
                        )
                      : []
                  }
                  isLoading={loading}
                  height={280}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart className="w-4 h-4 text-ocean-600" />{" "}
                  {t("projects.monthlyTrends")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <MonthlyTrendsChart
                  data={expensesData?.summary?.monthlyTrends || []}
                  isLoading={loading}
                  formatCurrency={(n) => formatCurrency(n, language)}
                  height={280}
                />
              </CardContent>
            </Card>
          </div>

          <ProjectExpensesTable
            expenses={expensesData?.expenses || []}
            isLoading={loading}
            onExpenseDeleted={() => loadData(false)}
            onAddExpenseClick={() => setExpenseModalOpen(true)}
            formatCurrency={(n) => formatCurrency(n, language)}
          />
        </div>
      )}

      {/* TAB 3: PAYROLL & WORKERS */}
      {activeTab === "payroll" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("projects.totalWorkers")}
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {payrollData?.summary?.totalWorkers || 0}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("projects.totalHours")}
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {payrollData?.summary?.totalHoursWorked || 0}{" "}
                <span className="text-xs font-normal text-slate-400">hrs</span>
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("projects.totalPayroll")}
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(
                  payrollData?.summary?.totalPayrollCost || 0,
                  language
                )}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("projects.avgDailyRate")}
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {formatCurrency(
                  payrollData?.summary?.avgDailyRate || 0,
                  language
                )}
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-ocean-600" />{" "}
                {t("projects.payrollBreakdown")}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/projects/${id}/attendance`)}
                leftIcon={<Users className="w-3.5 h-3.5" />}
              >
                {t("projects.viewAttendance")}
              </Button>
            </CardHeader>
            <CardContent className="pt-5">
              <PayrollSummaryTable
                workers={payrollData?.workers || []}
                summary={payrollData?.summary}
                isLoading={loading}
                formatCurrency={(n) => formatCurrency(n, language)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: QUOTATIONS, INVOICES & RECEIPTS */}
      {activeTab === "invoices" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Total Invoiced Amount"
              value={formatCurrency(
                invoiceStats?.totalInvoicedAmount ??
                  projectInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0),
                language
              )}
              icon={<FileText className="w-5 h-5" />}
              variant="ocean"
              subValue="Total billing value for this project"
            />
            <StatsCard
              label="Paid / Received Amount"
              value={formatCurrency(
                invoiceStats?.paidAmount ??
                  projectInvoices
                    .filter((i) => i.status === "paid")
                    .reduce((s, i) => s + (i.totalAmount || 0), 0),
                language
              )}
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="emerald"
              subValue="Confirmed customer payments"
            />
            <StatsCard
              label="Outstanding Balance"
              value={formatCurrency(
                Math.max(
                  0,
                  (invoiceStats?.totalInvoicedAmount ??
                    projectInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0)) -
                    (invoiceStats?.paidAmount ??
                      projectInvoices
                        .filter((i) => i.status === "paid")
                        .reduce((s, i) => s + (i.totalAmount || 0), 0))
                ),
                language
              )}
              icon={<DollarSign className="w-5 h-5" />}
              variant="amber"
              subValue="Pending payments due"
            />
            <StatsCard
              label="Total Documents"
              value={projectInvoices.length}
              icon={<Receipt className="w-5 h-5" />}
              variant="purple"
              subValue="Quotations, Invoices & Receipts"
            />
          </div>

          {/* Table Container */}
          <Card>
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between gap-4 py-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-ocean-600" />
                  Project Quotations, Invoices & Receipts
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official financial documents linked directly to this project
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/invoice-generator")}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Document
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Document No</TableHead>
                      <TableHead>Quotation No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer / Client</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectInvoices.length === 0 ? (
                      <TableEmpty
                        colSpan={9}
                        icon={<FileText className="w-8 h-8 text-slate-300" />}
                        title="No Documents Issued for This Project Yet"
                        description="You can generate official Quotations, Invoices and Receipts linked to this project."
                        action={
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate("/invoice-generator")}
                            leftIcon={<Plus className="w-4 h-4" />}
                          >
                            Create First Document
                          </Button>
                        }
                      />
                    ) : (
                      projectInvoices.map((inv, idx) => (
                        <TableRow key={inv._id || idx} hoverable>
                          <TableCell className="text-center font-semibold text-slate-500 text-xs">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-bold text-slate-900 text-xs sm:text-sm">
                            {inv.invoiceNo}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 font-mono">
                            {inv.quotationNo || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                            {inv.invoiceDate
                              ? new Date(inv.invoiceDate).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-800">
                            {inv.billTo?.name || "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900 text-xs sm:text-sm">
                            {formatCurrency(inv.totalAmount, language)}
                          </TableCell>
                          <TableCell className="text-center">
                            {inv.status === "paid" ? (
                              <Badge variant="success">Paid</Badge>
                            ) : inv.status === "cancelled" ? (
                              <Badge variant="destructive">Cancelled</Badge>
                            ) : (
                              <Badge variant="default">Issued</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {inv.paymentMethod || "KBZ Pay"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="subtle"
                                size="xs"
                                onClick={() => {
                                  setSelectedInvoiceForModal(inv);
                                  setModalDocumentType("quotation");
                                  setIsInvoiceModalOpen(true);
                                }}
                                title="View Quotation"
                              >
                                Quotation
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => {
                                  setSelectedInvoiceForModal(inv);
                                  setModalDocumentType("invoice");
                                  setIsInvoiceModalOpen(true);
                                }}
                                title="View Invoice"
                              >
                                Invoice
                              </Button>
                              {inv.status === "paid" && (
                                <Button
                                  variant="subtle"
                                  size="xs"
                                  onClick={() => {
                                    setSelectedInvoiceForModal(inv);
                                    setModalDocumentType("receipt");
                                    setIsInvoiceModalOpen(true);
                                  }}
                                  title="View Receipt"
                                  className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                >
                                  Receipt
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: TIMELINE & DETAILS */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-ocean-600" />{" "}
                {t("projects.timeline")} & Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold">
                    {t("projects.daysElapsed")}
                  </p>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {timeline.daysElapsed} {t("projects.unitDays")}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold">
                    {t("projects.daysRemaining")}
                  </p>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {timeline.daysRemaining} {t("projects.unitDays")}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold">
                    {t("projects.progress")}
                  </p>
                  <p className="text-xl font-bold text-ocean-600 mt-1">
                    {formatPercentage(timeline.percentComplete)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-600">Overall Completion</span>
                  <span className="text-ocean-600">
                    {formatPercentage(timeline.percentComplete)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-ocean-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(timeline.percentComplete, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Project Modal */}
      {editModalOpen && editProject && (
        <ProjectModal
          isOpen={editModalOpen}
          project={editProject}
          onClose={() => {
            setEditModalOpen(false);
            setEditProject(null);
          }}
          onSuccess={() => {
            setEditModalOpen(false);
            setEditProject(null);
            loadData(false);
          }}
        />
      )}

      {/* Add Expense Modal */}
      {expenseModalOpen && id && (
        <ProjectExpenseModal
          isOpen={expenseModalOpen}
          projectId={id}
          projectName={project.siteName}
          onClose={() => setExpenseModalOpen(false)}
          onExpenseCreated={() => loadData(false)}
        />
      )}

      {/* Official Invoice / Quotation / Receipt Modal */}
      {isInvoiceModalOpen && selectedInvoiceForModal && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedInvoiceForModal(null);
          }}
          invoiceData={selectedInvoiceForModal}
          initialDocumentType={modalDocumentType}
          title={`Document Preview — ${selectedInvoiceForModal.invoiceNo}`}
        />
      )}
    </div>
  );
};

export default ProjectDetailAnalytics;