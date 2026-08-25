import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useLanguage } from "../../context/LanguageContext";

export interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

interface ExpenseBreakdownChartProps {
  data: ExpenseCategory[];
  isLoading?: boolean;
  height?: number;
}

const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({
  data,
  isLoading = false,
  height = 300,
}) => {
  const { t, language } = useLanguage();
  const totalExpenses = data.reduce((sum, item) => sum + item.value, 0);

  // Monochrome zinc ramp — wide-contrast shades for distinguishable pie slices.
  const COLORS = [
    "#18181b", // zinc-900
    "#3f3f46", // zinc-700
    "#52525b", // zinc-600
    "#71717a", // zinc-500
    "#a1a1aa", // zinc-400
    "#d4d4d8", // zinc-300
    "#e4e4e7", // zinc-200
    "#27272a", // zinc-800
    "#09090b", // zinc-950
    "#f4f4f5", // zinc-100
  ];

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
          <p className="text-sm text-slate-400">{t("projects.noExpenseData")}</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      const percentage = totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : "0";

      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{name}</p>
          <div className="mt-1">
            <p className="text-sm text-slate-600">{formatCurrency(value)}</p>
            <p className="text-xs text-slate-400">{percentage}% {t("projects.ofTotal")}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-600 truncate">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 text-sm">{t("projects.expenseBreakdown")}</h3>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-ocean-50 text-ocean-700 text-xs font-semibold rounded-lg">
            {t("projects.total")}: {formatCurrency(totalExpenses)}
          </div>
          <div className="px-2 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg">
            {data.length} {t("projects.unitCategories")}
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      <div style={{ height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="80%"
              innerRadius="40%"
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {totalExpenses > 0 ? `${Math.round((data[0]?.value / totalExpenses) * 100)}%` : "0%"}
            </div>
            <div className="text-xs text-slate-500">
              {data[0]?.name || t("projects.mainCategory")}
            </div>
          </div>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="bg-slate-50/50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">{t("projects.highestExpense")}</p>
          <p className="text-sm font-bold text-slate-800">
            {data.length > 0 ? data[0].name : "N/A"}
          </p>
          <p className="text-xs text-slate-400">
            {data.length > 0 ? formatCurrency(data[0].value) : formatCurrency(0)}
          </p>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">{t("projects.lowestExpense")}</p>
          <p className="text-sm font-bold text-slate-800">
            {data.length > 1 ? data[data.length - 1].name : "N/A"}
          </p>
          <p className="text-xs text-slate-400">
            {data.length > 1 ? formatCurrency(data[data.length - 1].value) : formatCurrency(0)}
          </p>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">{t("projects.avgExpense")}</p>
          <p className="text-sm font-bold text-slate-800">
            {data.length > 0 ? formatCurrency(totalExpenses / data.length) : formatCurrency(0)}
          </p>
          <p className="text-xs text-slate-400">{t("projects.perItem")}</p>
        </div>

        <div className="bg-slate-50/50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">{t("projects.categories")}</p>
          <p className="text-sm font-bold text-slate-800">{data.length} {t("projects.unitItems")}</p>
          <p className="text-xs text-slate-400">{t("projects.total")}</p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseBreakdownChart;
