import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "group/btn relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-semibold outline-offset-2 transition-[background-color,color,border-color,transform,opacity] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand text-brand-fg hover:bg-brand-hover active:bg-brand-press",
        dark: "bg-ink text-sand hover:bg-brand hover:text-brand-fg dark:bg-sand dark:text-ink dark:hover:bg-brand dark:hover:text-brand-fg",
        secondary: "border border-fg/70 bg-transparent text-fg hover:bg-fg hover:text-canvas",
        subtle: "bg-surface-3 text-fg hover:bg-line",
        ghost: "text-fg-2 hover:bg-surface-3 hover:text-fg",
        outline: "border border-line-strong bg-surface text-fg hover:border-fg/60 hover:bg-surface-2",
        danger: "bg-danger-soft text-danger hover:bg-danger hover:text-canvas",
        link: "h-auto p-0 text-brand-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-[0.8rem]",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-sm",
        xl: "h-14 px-8 text-sm",
        icon: "size-9",
        "icon-sm": "size-8",
      },
      shape: {
        app: "rounded-md",
        editorial: "rounded-[2px] text-[0.74rem] uppercase tracking-[0.16em]",
        pill: "rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md", shape: "app" },
  },
);

export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({ className, variant, size, shape, asChild, loading, disabled, children, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, shape }), className);
  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
