import React from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  PieChart,
  BarChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export interface FinancialStats {
  totalExpenses: number;
  totalPayroll: number;
  totalCost: number;
  estimatedRevenue: number;
  estimatedProfit: number;
  profitMargin: number;
}

export interface TimelineStats {
  daysElapsed: number;
  daysRemaining: number;
  percentComplete: number;
}

export interface ProjectStats {
  totalWorkers: number;
  totalHoursWorked: number;
  attendanceRecordCount: number;
  avgDailyRate: number;
}

interface FinancialStatsCardsProps {
  financials: FinancialStats;
  timeline: TimelineStats;
  projectStats: ProjectStats;
  isLoading?: boolean;
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
}

const FinancialStatsCards: React.FC<FinancialStatsCardsProps> = ({
  financials,
  timeline,
  projectStats,
  isLoading = false,
  formatCurrency,
  formatPercentage,
}) => {
  const { t } = useLanguage();

  const getTrendIndicator = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;

    if (change > 5) {
      return (
        <div className="flex items-center gap-1 text-xs text-emerald-600">
          <ArrowUpRight className="w-3 h-3" />
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      );
    } else if (change < -5) {
      return (
        <div className="flex items-center gap-1 text-xs text-rose-600">
          <ArrowDownRight className="w-3 h-3" />
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-200" />
              <div className="h-4 w-24 bg-slate-200 rounded" />
            </div>
            <div className="h-6 w-32 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial cards */}
      <div>
        <h3 className="font-semibold text-ocean-800 text-sm mb-4">{t("projects.financialOverview")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500">{t("projects.totalExpenses")}</span>
              </div>
              {getTrendIndicator(financials.totalExpenses)}
            </div>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(financials.totalExpenses)}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500">{t("projects.totalPayroll")}</span>
              </div>
              {getTrendIndicator(financials.totalPayroll)}
            </div>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(financials.totalPayroll)}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500">{t("projects.totalCost")}</span>
              </div>
              {getTrendIndicator(financials.totalCost)}
            </div>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(financials.totalCost)}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500">{t("projects.estimatedRevenue")}</span>
              </div>
              {getTrendIndicator(financials.estimatedRevenue)}
            </div>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(financials.estimatedRevenue)}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500">{t("projects.estimatedProfit")}</span>
              </div>
              {getTrendIndicator(financials.estimatedProfit)}
            </div>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(financials.estimatedProfit)}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500">{t("projects.profitMargin")}</span>
              </div>
              {getTrendIndicator(financials.profitMargin)}
            </div>
            <p className="text-lg font-bold text-slate-800">{formatPercentage(financials.profitMargin)}</p>
          </div>
        </div>
      </div>

      {/* Project progress & stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-ocean-800 text-sm mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-ocean-600" /> {t("projects.projectTimeline")}
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
              <span className="text-xs text-slate-500">{t("projects.progress")}</span>
              <span className="text-sm font-bold text-purple-700">{timeline.percentComplete}%</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{t("projects.start")}</span>
                <span>{timeline.percentComplete}%</span>
                <span>{t("projects.end")}</span>
              </div>
              <div className="bg-slate-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-ocean-600 to-emerald-500 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${Math.min(100, timeline.percentComplete)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Worker & project stats */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-ocean-800 text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-ocean-600" /> {t("projects.projectPerformance")}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                  <Users className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-xs text-slate-500">{t("projects.workers")}</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{projectStats.totalWorkers}</p>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
                  <Calendar className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-xs text-slate-500">{t("projects.hoursWorked")}</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{projectStats.totalHoursWorked}</p>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
                  <BarChart className="w-3 h-3 text-purple-600" />
                </div>
                <span className="text-xs text-slate-500">{t("projects.attendance")}</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{projectStats.attendanceRecordCount}</p>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                  <DollarSign className="w-3 h-3 text-amber-600" />
                </div>
                <span className="text-xs text-slate-500">{t("projects.avgDailyRate")}</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(projectStats.avgDailyRate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial health indicators */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="font-semibold text-ocean-800 text-sm mb-4">{t("projects.financialHealth")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg border ${
            financials.profitMargin > 20
              ? 'bg-emerald-50 border-emerald-100'
              : financials.profitMargin > 10
                ? 'bg-amber-50 border-amber-100'
                : 'bg-rose-50 border-rose-100'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t("projects.profitMargin")}</span>
              <span className={`text-xs font-bold ${
                financials.profitMargin > 20
                  ? 'text-emerald-600'
                  : financials.profitMargin > 10
                    ? 'text-amber-600'
                    : 'text-rose-600'
              }`}>
                {formatPercentage(financials.profitMargin)}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {financials.profitMargin > 20
                ? t("projects.marginExcellent")
                : financials.profitMargin > 10
                  ? t("projects.marginGood")
                  : t("projects.marginWarning")}
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${
            financials.estimatedProfit > financials.totalCost * 0.15
              ? 'bg-emerald-50 border-emerald-100'
              : financials.estimatedProfit > financials.totalCost * 0.05
                ? 'bg-amber-50 border-amber-100'
                : 'bg-rose-50 border-rose-100'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t("projects.roiRatio")}</span>
              <span className={`text-xs font-bold ${
                financials.estimatedProfit > financials.totalCost * 0.15
                  ? 'text-emerald-600'
                  : financials.estimatedProfit > financials.totalCost * 0.05
                    ? 'text-amber-600'
                    : 'text-rose-600'
              }`}>
                {Math.round((financials.estimatedProfit / financials.totalCost) * 100) || 0}%
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {financials.estimatedProfit > financials.totalCost * 0.15
                ? t("projects.roiHigh")
                : financials.estimatedProfit > financials.totalCost * 0.05
                  ? t("projects.roiGood")
                  : t("projects.roiLow")}
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${
            timeline.percentComplete > 75 && timeline.daysRemaining < timeline.daysElapsed * 0.25
              ? 'bg-emerald-50 border-emerald-100'
              : timeline.percentComplete > 50 && timeline.daysRemaining < timeline.daysElapsed * 0.5
                ? 'bg-amber-50 border-amber-100'
                : 'bg-rose-50 border-rose-100'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t("projects.timelineHealth")}</span>
              <span className={`text-xs font-bold ${
                timeline.percentComplete > 75 && timeline.daysRemaining < timeline.daysElapsed * 0.25
                  ? 'text-emerald-600'
                  : timeline.percentComplete > 50 && timeline.daysRemaining < timeline.daysElapsed * 0.5
                    ? 'text-amber-600'
                    : 'text-rose-600'
              }`}>
                {timeline.percentComplete > timeline.daysElapsed / (timeline.daysElapsed + timeline.daysRemaining) * 100
                  ? t("projects.ahead")
                  : t("projects.onTrack")}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {timeline.percentComplete > timeline.daysElapsed / (timeline.daysElapsed + timeline.daysRemaining) * 100
                ? t("projects.aheadDesc")
                : t("projects.onTrackDesc")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialStatsCards;
