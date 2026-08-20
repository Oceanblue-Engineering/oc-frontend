import React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "./cn";

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  backAction?: {
    label?: string;
    onClick: () => void;
  };
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  backAction,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6",
        className
      )}
    >
      <div className="flex flex-col space-y-1">
        {backAction && (
          <button
            onClick={backAction.onClick}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ocean-600 transition-colors mb-1.5 w-fit cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backAction.label || "Back"}</span>
          </button>
        )}
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-ocean-50 text-ocean-600 border border-ocean-200/60 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {actions && (
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
