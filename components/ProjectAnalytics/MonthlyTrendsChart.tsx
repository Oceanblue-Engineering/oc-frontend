import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useLanguage } from "../../context/LanguageContext";

export interface MonthlyTrend {
  month: string;
  expenses: number;
  payroll: number;
  total: number;
}

interface MonthlyTrendsChartProps {
  data: MonthlyTrend[];
  isLoading?: boolean;
  height?: number;
  chartType?: "line" | "bar" | "area";
  showExpenses?: boolean;
  showPayroll?: boolean;
  showTotal?: boolean;
}

const MonthlyTrendsChart: React.FC<MonthlyTrendsChartProps> = ({
  data,
  isLoading = false,
  height = 300,
  chartType = "line",
  showExpenses = true,
  showPayroll = true,
  showTotal = true,
}) => {
  const { t, language } = useLanguage();

  const formatMonth = (monthStr: string) => {
    if (!monthStr || monthStr.length !== 7) return monthStr;

    const [year, month] = monthStr.split("-");
    const monthNames =
      language === "en"
        ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        : ["ဇန်နဝါရီ", "ဖေဖော်ဝါရီ", "မတ်", "ဧပြီ", "မေ", "ဇွန်", "ဇူလိုင်", "သြဂုတ်", "စက်တင်ဘာ", "အောက်တိုဘာ", "နိုဝင်ဘာ", "ဒီဇင်ဘာ"];

    const monthName = monthNames[parseInt(month) - 1] || month;
    return `${monthName} ${year}`;
  };

  const formatCurrency = (value: number) => {
    if (language === "en") {
      return `${Math.floor(value).toLocaleString("en-US")} Ks`;
    }
    if (value >= 1000000) {
      return `သန်း ${Math.floor(value / 1000000)}`;
    }
    if (value >= 100000) {
      return `သိန်း ${Math.floor(value / 100000)}`;
    }
    if (value >= 1000) {
      return `ထောင် ${Math.floor(value / 1000)}`;
    }
    return `${value.toLocaleString()} ကျပ်`;
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const month = formatMonth(label);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 min-w-[180px]">
          <p className="font-semibold text-slate-800 mb-2">{month}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-slate-600">{entry.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50/50 border border-slate-100 rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-ocean-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-400">{t("projects.loadingData")}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50/50 border border-slate-100 rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-400">{t("projects.noMonthlyData")}</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const totalPayroll = data.reduce((sum, item) => sum + item.payroll, 0);
  const totalOverall = data.reduce((sum, item) => sum + item.total, 0);
  const avgPerMonth = data.length > 0 ? totalOverall / data.length : 0;

  const getChartComponent = () => {
    switch (chartType) {
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              fontSize={10}
              tick={{ fill: '#64748b' }}
            />
            <YAxis
              tickFormatter={formatShortCurrency}
              fontSize={10}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {showExpenses && (
              <Bar
                dataKey="expenses"
                name={t("projects.expenses")}
                fill="#0088FE"
                radius={[2, 2, 0, 0]}
              />
            )}
            {showPayroll && (
              <Bar
                dataKey="payroll"
                name={t("projects.payroll")}
                fill="#00C49F"
                radius={[2, 2, 0, 0]}
              />
            )}
            {showTotal && (
              <Bar
                dataKey="total"
                name={t("projects.total")}
                fill="#FFBB28"
                radius={[2, 2, 0, 0]}
              />
            )}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              fontSize={10}
              tick={{ fill: '#64748b' }}
            />
            <YAxis
              tickFormatter={formatShortCurrency}
              fontSize={10}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {showExpenses && (
              <Area
                type="monotone"
                dataKey="expenses"
                name={t("projects.expenses")}
                fill="#0088FE"
                fillOpacity={0.3}
                stroke="#0088FE"
                strokeWidth={2}
              />
            )}
            {showPayroll && (
              <Area
                type="monotone"
                dataKey="payroll"
                name={t("projects.payroll")}
                fill="#00C49F"
                fillOpacity={0.3}
                stroke="#00C49F"
                strokeWidth={2}
              />
            )}
            {showTotal && (
              <Area
                type="monotone"
                dataKey="total"
                name={t("projects.total")}
                fill="#FFBB28"
                fillOpacity={0.3}
                stroke="#FFBB28"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        );

      default: // line chart
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              fontSize={10}
              tick={{ fill: '#64748b' }}
            />
            <YAxis
              tickFormatter={formatShortCurrency}
              fontSize={10}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {showExpenses && (
              <Line
                type="monotone"
                dataKey="expenses"
                name={t("projects.expenses")}
                stroke="#0088FE"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            )}
            {showPayroll && (
              <Line
                type="monotone"
                dataKey="payroll"
                name={t("projects.payroll")}
                stroke="#00C49F"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            )}
            {showTotal && (
              <Line
                type="monotone"
                dataKey="total"
                name={t("projects.total")}
                stroke="#FFBB28"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-semibold text-slate-800 text-sm">{t("projects.monthlyExpenseTrends")}</h3>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-2">
          <div className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
            {t("projects.expenses")}: {formatCurrency(totalExpenses)}
          </div>
          <div className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg">
            {t("projects.payroll")}: {formatCurrency(totalPayroll)}
          </div>
          <div className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg">
            {t("projects.total")}: {formatCurrency(totalOverall)}
          </div>
        </div>
      </div>

      {/* Chart type selector */}
      <div className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {/* TODO: Add chart type change handler */}}
            className={`px-3 py-1 text-xs rounded-md ${chartType === 'line' ? 'bg-white text-ocean-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {t("projects.lineChart")}
          </button>
          <button
            onClick={() => {/* TODO: Add chart type change handler */}}
            className={`px-3 py-1 text-xs rounded-md ${chartType === 'bar' ? 'bg-white text-ocean-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {t("projects.barChart")}
          </button>
          <button
            onClick={() => {/* TODO: Add chart type change handler */}}
            className={`px-3 py-1 text-xs rounded-md ${chartType === 'area' ? 'bg-white text-ocean-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {t("projects.areaChart")}
          </button>
        </div>

        {/* Series toggle */}
        <div className="ml-auto flex items-center gap-2">
          {showExpenses && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-slate-600">{t("projects.expenses")}</span>
            </div>
          )}
          {showPayroll && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-slate-600">{t("projects.payroll")}</span>
            </div>
          )}
          {showTotal && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-slate-600">{t("projects.total")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          {getChartComponent()}
        </ResponsiveContainer>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50/50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">{t("projects.highestMonth")}</p>
          <p className="text-sm font-bold text-slate-800">
            {data.length > 0 ? formatMonth(data.reduce((max, item) => item.total > max.total ? item : max).month) : "N/A"}
          </p>
          <p className="text-xs text-slate-400">
            {data.length > 0 ? formatCurrency(data.reduce((max, item) => item.total > max.total ? item : max).total) : formatCurrency(0)}
          </p>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">{t("projects.lowestMonth")}</p>
          <p className="text-sm font-bold text-slate-800">
            {data.length > 0 ? formatMonth(data.reduce((min, item) => item.total < min.total ? item : min).month) : "N/A"}
          </p>
          <p className="text-xs text-slate-400">
            {data.length > 0 ? formatCurrency(data.reduce((min, item) => item.total < min.total ? item : min).total) : formatCurrency(0)}
          </p>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">{t("projects.avgMonthly")}</p>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(avgPerMonth)}</p>
          <p className="text-xs text-slate-400">{t("projects.perMonth")}</p>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">{t("projects.period")}</p>
          <p className="text-sm font-bold text-slate-800">{data.length} {t("projects.unitMonths")}</p>
          <p className="text-xs text-slate-400">{t("projects.totalTime")}</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTrendsChart;
