import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, TrendingUp, DollarSign, Users, Calendar, PieChart, BarChart, Plus } from "lucide-react";
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

const ProjectDetailAnalytics: React.FC = () => {
  const { projectId: id } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [financialSummary, setFinancialSummary] = useState<ProjectFinancialSummary | null>(null);
  const [expensesData, setExpensesData] = useState<any>(null);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "payroll" | "timeline">("overview");

  const loadData = async (showFullPageLoader = false) => {
    if (!id) return;
    if (showFullPageLoader) setLoading(true);

    try {
      // Fetch all data in parallel
      const [financialRes, expensesRes, payrollRes] = await Promise.all([
        fetchProjectFinancialSummary(id),
        fetchProjectExpenses(id),
        fetchProjectPayrollSummary(id),
      ]);

      if (financialRes.success && financialRes.data) {
        setFinancialSummary(financialRes.data);
      } else {
        toast.error(financialRes.message || t("projects.financialLoadFailed"));
      }

      if (expensesRes.success && expensesRes.data) {
        setExpensesData(expensesRes.data);
      } else {
        toast.error(expensesRes.message || t("projects.expensesLoadFailed"));
      }

      if (payrollRes.success && payrollRes.data) {
        setPayrollData(payrollRes.data);
      } else {
        toast.error(payrollRes.message || t("projects.payrollLoadFailed"));
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
      <div className="min-h-screen flex items-center justify-center bg-ocean-50/30">
        <Loader2 className="w-8 h-8 animate-spin text-ocean-600" />
      </div>
    );
  }

  if (!financialSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-50/30">
        <p className="text-slate-500">{t("projects.notFound")}</p>
      </div>
    );
  }

  const { project, financials, timeline } = financialSummary;

  const statusColor: Record<string, string> = {
    Signed: "bg-amber-50 text-amber-700 border border-amber-100",
    "In-Development": "bg-blue-50 text-blue-700 border border-blue-100",
    Delivered: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    Completed: "bg-purple-50 text-purple-700 border border-purple-100",
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
      id: "timeline",
      label: t("projects.tabTimeline") || "Timeline & Details",
      icon: Calendar,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-ocean-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/client-projects")}
          className="flex items-center gap-1.5 text-sm font-semibold text-ocean-600 hover:text-ocean-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> {t("projects.backToList")}
        </button>

        {/* Project header card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-ocean-800">{project.siteName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[project.status]}`}>
                  {project.status}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                  {project.customer}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-ocean-50 text-ocean-600">
                  {project.workers?.length || 0} {t("projects.unitWorkers")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => setExpenseModalOpen(true)}
                className="py-2 px-3.5 bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-sm shadow-ocean-600/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("projects.addExpense")}</span>
              </button>
              <button
                onClick={handleEditClick}
                className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-100 cursor-pointer transition-all"
              >
                {t("projects.editDetails")}
              </button>
              <button
                onClick={() => navigate(`/projects/${id}/attendance`)}
                className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-100 cursor-pointer transition-all"
              >
                {t("projects.viewAttendance")}
              </button>
            </div>
          </div>
          <p className="text-slate-600 mt-3 text-sm">{project.description}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200/80 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-ocean-600 text-white shadow-md shadow-ocean-600/20"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-ocean-600"}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? "bg-white/20 text-white" : "bg-ocean-50 text-ocean-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Financial summary cards */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h2 className="font-semibold text-ocean-800 text-sm mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-ocean-600" /> {t("projects.financialSummary")}
                </h2>
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
                    totalHoursWorked: payrollData?.summary?.totalHoursWorked || 0,
                    attendanceRecordCount: payrollData?.summary?.attendanceRecordCount || 0,
                    avgDailyRate: payrollData?.summary?.avgDailyRate || 0,
                  }}
                  formatCurrency={(n) => formatCurrency(n, language)}
                  formatPercentage={formatPercentage}
                />
              </div>

              {/* Quick expense breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-ocean-800 text-sm flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-ocean-600" /> {t("projects.expenseBreakdown")}
                  </h2>
                  <button
                    onClick={() => setActiveTab("expenses")}
                    className="text-xs font-semibold text-ocean-600 hover:text-ocean-700 cursor-pointer"
                  >
                    {t("projects.tabExpenses")} →
                  </button>
                </div>
                <ExpenseBreakdownChart
                  data={expensesData?.summary?.byCategory
                    ? Object.entries(expensesData.summary.byCategory).map(([name, value], index) => ({
                        name,
                        value: value as number,
                        color: [
                          "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8",
                          "#82CA9D", "#FF6B6B", "#6C5CE7", "#00B894", "#FDCB6E"
                        ][index % 10]
                      }))
                    : []}
                  isLoading={loading}
                  height={260}
                />
              </div>
            </div>

            {/* Right 1/3: Sidebar */}
            <div className="space-y-6">
              {/* Timeline summary */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-semibold text-ocean-800 text-sm mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-ocean-600" /> {t("projects.timeline")}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t("projects.daysElapsed")}</span>
                    <span className="text-sm font-bold text-ocean-700">{timeline.daysElapsed} {t("projects.unitDays")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t("projects.daysRemaining")}</span>
                    <span className="text-sm font-bold text-emerald-700">{timeline.daysRemaining} {t("projects.unitDays")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t("projects.percentComplete")}</span>
                    <span className="text-sm font-bold text-purple-700">{timeline.percentComplete}%</span>
                  </div>
                </div>
                <div className="mt-4 bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-ocean-600 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${Math.min(100, timeline.percentComplete)}%` }}
                  />
                </div>
              </div>

              {/* Worker summary */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-semibold text-ocean-800 text-sm mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-ocean-600" /> {t("projects.workerSummary")}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t("projects.totalWorkers")}</span>
                    <span className="text-sm font-bold text-ocean-700">{payrollData?.summary?.totalWorkers || 0} {t("projects.unitWorkers")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t("projects.totalHoursWorked")}</span>
                    <span className="text-sm font-bold text-emerald-700">{payrollData?.summary?.totalHoursWorked || 0} {t("projects.unitHours")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t("projects.attendanceRecords")}</span>
                    <span className="text-sm font-bold text-purple-700">{payrollData?.summary?.attendanceRecordCount || 0} {t("projects.unitRecords")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t("projects.avgDailyRate")}</span>
                    <span className="text-sm font-bold text-amber-700">{formatCurrency(payrollData?.summary?.avgDailyRate || 0, language)}</span>
                  </div>
                </div>
              </div>

              {/* Expense summary */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-semibold text-ocean-800 text-sm mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-ocean-600" /> {t("projects.expenseSummary")}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t("projects.expenseCount")}</span>
                    <span className="text-sm font-bold text-ocean-700">{expensesData?.summary?.expenseCount || 0} {t("projects.unitRecords")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t("projects.categories")}</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {expensesData?.summary?.byCategory ? Object.keys(expensesData.summary.byCategory).length : 0} {t("projects.unitCategories")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t("projects.monthsTracked")}</span>
                    <span className="text-sm font-bold text-purple-700">
                      {expensesData?.summary?.monthlyTotals?.length || 0} {t("projects.unitMonths")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-semibold text-ocean-800 text-sm mb-3">{t("projects.quickActions")}</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setExpenseModalOpen(true)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-ocean-200 bg-ocean-50/50 hover:bg-ocean-50 text-ocean-700 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t("projects.addExpense")}</span>
                  </button>
                  <button
                    onClick={() => navigate(`/projects/${id}/attendance`)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:border-ocean-300 hover:bg-ocean-50 text-slate-700 transition-all cursor-pointer"
                  >
                    {t("projects.viewAttendance")}
                  </button>
                  <button
                    onClick={() => navigate("/client-projects")}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:border-ocean-300 hover:bg-ocean-50 text-slate-700 transition-all cursor-pointer"
                  >
                    {t("projects.backToList")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSES */}
        {activeTab === "expenses" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expense breakdown chart */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h2 className="font-semibold text-ocean-800 text-sm mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-ocean-600" /> {t("projects.expenseBreakdown")}
                </h2>
                <ExpenseBreakdownChart
                  data={expensesData?.summary?.byCategory
                    ? Object.entries(expensesData.summary.byCategory).map(([name, value], index) => ({
                        name,
                        value: value as number,
                        color: [
                          "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8",
                          "#82CA9D", "#FF6B6B", "#6C5CE7", "#00B894", "#FDCB6E"
                        ][index % 10]
                      }))
                    : []}
                  isLoading={loading}
                  height={300}
                />
              </div>

              {/* Monthly trends chart */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h2 className="font-semibold text-ocean-800 text-sm mb-4 flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-ocean-600" /> {t("projects.monthlyTrends")}
                </h2>
                <MonthlyTrendsChart
                  data={expensesData?.summary?.monthlyTotals
                    ? expensesData.summary.monthlyTotals.map((item: any) => {
                        const monthExpenses = expensesData?.expenses?.filter((exp: any) => {
                          const dateVal = exp.date || exp.expenseDate;
                          if (!dateVal) return false;
                          const expMonth = typeof dateVal === "string" ? dateVal.substring(0, 7) : "";
                          return expMonth === item.month;
                        }) || [];

                        const totalExpensesForMonth = monthExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

                        return {
                          month: item.month,
                          expenses: totalExpensesForMonth,
                          payroll: 0,
                          total: item.total
                        };
                      })
                    : []}
                  isLoading={loading}
                  height={300}
                  chartType="bar"
                  showExpenses={true}
                  showPayroll={false}
                  showTotal={true}
                />
              </div>
            </div>

            {/* Project Expenses Table */}
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
            {/* Quick stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{t("projects.totalWorkers")}</p>
                <p className="text-xl font-bold text-ocean-700 mt-1">
                  {payrollData?.summary?.totalWorkers || 0} <span className="text-xs text-slate-400">{t("projects.unitWorkers")}</span>
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{t("projects.totalHoursWorked")}</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">
                  {payrollData?.summary?.totalHoursWorked || 0} <span className="text-xs text-slate-400">{t("projects.unitHours")}</span>
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{t("projects.totalPayroll")}</p>
                <p className="text-xl font-bold text-purple-700 mt-1">
                  {formatCurrency(payrollData?.summary?.totalPayroll || 0, language)}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{t("projects.avgDailyRate")}</p>
                <p className="text-xl font-bold text-amber-700 mt-1">
                  {formatCurrency(payrollData?.summary?.avgDailyRate || 0, language)}
                </p>
              </div>
            </div>

            {/* Payroll summary table */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-ocean-800 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-ocean-600" /> {t("projects.payrollSummary")}
                </h2>
                <button
                  onClick={() => navigate(`/projects/${id}/attendance`)}
                  className="py-1.5 px-3 bg-ocean-50 hover:bg-ocean-100 text-ocean-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  {t("projects.viewAttendance")} →
                </button>
              </div>
              <PayrollSummaryTable
                workers={payrollData?.workers || []}
                isLoading={loading}
                formatCurrency={(n) => formatCurrency(n, language)}
                onWorkerClick={() => {
                  navigate(`/projects/${id}/attendance`);
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 4: TIMELINE & DETAILS */}
        {activeTab === "timeline" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
              <h2 className="font-semibold text-ocean-800 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-ocean-600" /> {t("projects.timeline")} & {t("clientLogs.details") || "Details"}
              </h2>

              {/* Progress */}
              <div className="p-5 bg-ocean-50/40 rounded-2xl border border-ocean-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-ocean-800">{t("projects.progress")}</span>
                  <span className="text-sm font-bold text-ocean-700">{timeline.percentComplete}% {t("projects.complete")}</span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-ocean-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, timeline.percentComplete)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
                  <span>{timeline.daysElapsed} {t("projects.unitDays")} {t("projects.daysElapsed").toLowerCase()}</span>
                  <span>{timeline.daysRemaining} {t("projects.unitDays")} {t("projects.daysRemaining").toLowerCase()}</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-medium uppercase">{t("clients.name") || "Site Name"}</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{project.siteName}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-medium uppercase">{t("clients.company") || "Customer"}</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{project.customer}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-medium uppercase">{t("projects.startDate")}</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString(language === "en" ? "en-US" : "my-MM") : "N/A"}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-medium uppercase">{t("projects.endDate")}</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString(language === "en" ? "en-US" : "my-MM") : "N/A"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-2">{t("common.description") || "Description"}</p>
                <p className="text-sm text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                  {project.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Sidebar for Timeline */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-semibold text-ocean-800 text-sm mb-3">{t("projects.quickActions")}</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleEditClick}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:border-ocean-300 hover:bg-ocean-50 text-slate-700 transition-all cursor-pointer"
                  >
                    {t("projects.editDetails")}
                  </button>
                  <button
                    onClick={() => navigate(`/projects/${id}/attendance`)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:border-ocean-300 hover:bg-ocean-50 text-slate-700 transition-all cursor-pointer"
                  >
                    {t("projects.viewAttendance")}
                  </button>
                  <button
                    onClick={() => navigate("/client-projects")}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:border-ocean-300 hover:bg-ocean-50 text-slate-700 transition-all cursor-pointer"
                  >
                    {t("projects.backToList")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        project={editProject}
        onSaved={() => loadData(true)}
        onDeleted={() => navigate("/client-projects")}
      />

      <ProjectExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        projectId={id || ""}
        projectName={project.siteName}
        onExpenseCreated={() => loadData(false)}
      />
    </div>
  );
};

export default ProjectDetailAnalytics;