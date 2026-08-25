import React from "react";
import { cn } from "./cn";

export type StatsCardVariant =
  | "ocean"
  | "navy"
  | "emerald"
  | "amber"
  | "rose"
  | "purple"
  | "neutral";

export interface StatsCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  icon: React.ReactNode;
  variant?: StatsCardVariant;
  className?: string;
  onClick?: () => void;
}

export function StatsCard({
  label,
  value,
  subValue,
  icon,
  variant = "ocean",
  className,
  onClick,
}: StatsCardProps) {
  const iconVariants: Record<StatsCardVariant, string> = {
    ocean: "bg-ocean-50 text-ocean-600 border-ocean-200/60",
    navy: "bg-slate-100 text-slate-800 border-slate-200/80",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    amber: "bg-amber-50 text-amber-600 border-amber-200/60",
    rose: "bg-rose-50 text-rose-600 border-rose-200/60",
    purple: "bg-slate-100 text-slate-700 border-slate-200/70",
    neutral: "bg-slate-50 text-slate-600 border-slate-200/60",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl p-5 border border-zinc-200/70 shadow-xs flex items-center justify-between gap-4 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-zinc-300/80 active:scale-[0.99]",
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {value}
        </div>
        {subValue && (
          <p className="text-xs font-medium text-slate-400">{subValue}</p>
        )}
      </div>

      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
          iconVariants[variant]
        )}
      >
        {icon}
      </div>
    </div>
  );
}
