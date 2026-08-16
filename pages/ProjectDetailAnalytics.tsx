import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, TrendingUp, DollarSign, Users, Calendar, PieChart, BarChart } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-ocean-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/client-projects")}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ocean-600 hover:text-ocean-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> {t("projects.backToList")}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
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
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleEditClick}
                    className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-100 cursor-pointer transition-all"
                  >
                    {t("projects.editDetails")}
                  </button>
                  <button
                    onClick={() => navigate(`/projects/${id}/attendance`)}
                    className="py-2 px-3 bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all"
                  >
                    {t("projects.viewAttendance")}
                  </button>
                </div>
              </div>
              <p className="text-slate-600 mt-4 text-sm">{project.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-ocean-50/30 p-4 rounded-xl border border-ocean-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-ocean-600" />
                    <span className="text-xs font-semibold text-ocean-700">{t("projects.startDate")}</span>
                  </div>
                  <p className="text-sm text-slate-700">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString(language === "en" ? "en-US" : "my-MM") : "N/A"}
                  </p>
                </div>

                <div className="bg-ocean-50/30 p-4 rounded-xl border border-ocean-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-ocean-600" />
                    <span className="text-xs font-semibold text-ocean-700">{t("projects.endDate")}</span>
                  </div>
                  <p className="text-sm text-slate-700">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString(language === "en" ? "en-US" : "my-MM") : "N/A"}
                  </p>
                </div>

                <div className="bg-ocean-50/30 p-4 rounded-xl border border-ocean-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-ocean-600" />
                    <span className="text-xs font-semibold text-ocean-700">{t("projects.progress")}</span>
                  </div>
                  <p className="text-sm text-slate-700">{timeline.percentComplete}% {t("projects.complete")}</p>
                </div>
              </div>
            </div>

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
                      // Convert month format and calculate expenses for each month
                      const monthExpenses = expensesData?.expenses?.filter((exp: any) => {
                        if (!exp.expenseDate) return false;
                        const expMonth = exp.expenseDate.substring(0, 7); // YYYY-MM format
                        return expMonth === item.month;
                      }) || [];

                      const totalExpensesForMonth = monthExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

                      return {
                        month: item.month,
                        expenses: totalExpensesForMonth,
                        payroll: 0, // We could add payroll data if available
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

            {/* Payroll summary table */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h2 className="font-semibold text-ocean-800 text-sm mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-ocean-600" /> {t("projects.payrollSummary")}
              </h2>
              <PayrollSummaryTable
                workers={payrollData?.workers || []}
                isLoading={loading}
                formatCurrency={(n) => formatCurrency(n, language)}
                onWorkerClick={(workerId) => {
                  // Navigate to worker details page
                  console.log("Worker clicked:", workerId);
                }}
              />
            </div>
          </div>

          {/* Sidebar (1/3 width) */}
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
                  onClick={() => navigate("/client-projects")}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:border-ocean-300 hover:bg-ocean-50 transition-all cursor-pointer"
                >
                  {t("projects.backToList")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        project={editProject}
        onSaved={() => loadData(true)}
        onDeleted={() => navigate("/client-projects")}
      />
    </div>
  );
};

export default ProjectDetailAnalytics;