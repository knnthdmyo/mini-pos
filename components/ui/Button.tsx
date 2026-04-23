import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-brand-primary text-white hover:bg-brand-primary/90 active:bg-brand-primary/80 disabled:bg-brand-primary/40 shadow-sm shadow-brand-primary/25",
  secondary:
    "glass text-brand-text hover:bg-brand-surface/80 active:bg-brand-surface/90 disabled:opacity-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300",
  ghost:
    "bg-transparent text-brand-muted hover:bg-brand-surface/50 active:bg-brand-surface/70 disabled:opacity-50",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-[40px] px-3 py-1.5 text-sm",
  md: "min-h-[48px] px-5 py-2.5 text-base",
  lg: "min-h-[56px] px-7 py-3.5 text-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className = "", children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={[
          "inline-flex items-center justify-center rounded-xl font-semibold",
          "transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50",
          "disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
