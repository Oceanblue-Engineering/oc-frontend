import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./cn";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  leftIcon?: React.ReactNode;
  error?: string | boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, leftIcon, error, disabled, children, ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <select
          disabled={disabled}
          ref={ref}
          className={cn(
            "w-full h-10 pl-3.5 pr-10 text-sm bg-white border rounded-xl appearance-none transition-all duration-150 outline-none cursor-pointer",
            "text-slate-800",
            "border-slate-200 hover:border-slate-300",
            "focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/10",
            "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
            leftIcon && "pl-10",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
