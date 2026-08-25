import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold transition-all duration-150 active:scale-[0.98] select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "bg-ocean-600 text-white hover:bg-ocean-700 shadow-sm shadow-ocean-600/15 border border-transparent",
        secondary:
          "bg-[#18181b] text-white hover:bg-[#09090b] shadow-sm border border-transparent",
        outline:
          "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/15 border border-transparent",
        subtle:
          "bg-ocean-50 text-ocean-700 hover:bg-ocean-100 border border-ocean-200/80",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/15 border border-transparent",
        link: "text-ocean-600 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2 text-xs sm:text-sm rounded-xl gap-2",
        sm: "h-8 px-3 py-1.5 text-xs rounded-xl gap-1.5",
        lg: "h-11 px-6 py-2.5 text-sm sm:text-base rounded-2xl gap-2.5 font-bold",
        icon: "h-9 w-9 p-0 rounded-xl justify-center shrink-0",
        "icon-sm": "h-7 w-7 p-0 rounded-lg justify-center shrink-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
