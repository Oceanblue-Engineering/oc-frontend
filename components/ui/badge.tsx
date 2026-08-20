import React from "react";
import { cn } from "./cn";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "purple"
  | "outline"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-ocean-50 text-ocean-700 border-ocean-200/70",
    secondary: "bg-slate-800 text-white border-transparent",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    warning: "bg-amber-50 text-amber-700 border-amber-200/70",
    destructive: "bg-red-50 text-red-700 border-red-200/70",
    purple: "bg-purple-50 text-purple-700 border-purple-200/70",
    outline: "bg-white text-slate-700 border-slate-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200/50",
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: "bg-ocean-500",
    secondary: "bg-slate-300",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    destructive: "bg-red-500",
    purple: "bg-purple-500",
    outline: "bg-slate-400",
    neutral: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
