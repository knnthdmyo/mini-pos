interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-brand-surface/60 text-brand-muted backdrop-blur-sm border border-brand-border/40",
  success: "bg-green-500/10 text-green-600 backdrop-blur-sm border border-green-500/20",
  warning: "bg-amber-500/10 text-amber-600 backdrop-blur-sm border border-amber-500/20",
  danger:  "bg-red-500/10 text-red-600 backdrop-blur-sm border border-red-500/20",
  info:    "bg-brand-primary/10 text-brand-primary backdrop-blur-sm border border-brand-primary/20",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
