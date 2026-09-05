import React from "react";
import { cn } from "./cn";

export function TableContainer({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn("w-full text-left text-sm text-slate-700", className)}
    {...props}
  />
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-slate-50/80 border-b border-slate-100 text-xs uppercase font-bold text-slate-500 tracking-wider select-none",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-slate-100/90", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "hover:bg-slate-50/70 transition-colors duration-150 group",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn("px-4 py-3.5 font-bold text-slate-600 align-middle", className)}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 py-3.5 align-middle text-slate-700 font-medium", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export interface TableEmptyProps {
  colSpan: number;
  message?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function TableEmpty({
  colSpan,
  message = "No records found",
  title,
  description,
  icon,
  action,
  actionLabel,
  onAction,
}: TableEmptyProps) {
  const content = (title || description) ? (
    <div className="space-y-1">
      {title && <p className="text-sm font-bold text-slate-700">{title}</p>}
      {description && <p className="text-xs font-normal text-slate-500 max-w-sm">{description}</p>}
    </div>
  ) : (
    <p className="text-sm font-semibold text-slate-500 max-w-sm">
      {message}
    </p>
  );

  const actionNode = action || (actionLabel && onAction ? (
    <button
      type="button"
      onClick={onAction}
      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
    >
      {actionLabel}
    </button>
  ) : null);

  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-12 px-4">
        <div className="flex flex-col items-center justify-center space-y-3">
          {icon && (
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
              {icon}
            </div>
          )}
          {content}
          {actionNode && <div className="pt-2">{actionNode}</div>}
        </div>
      </td>
    </tr>
  );
}

