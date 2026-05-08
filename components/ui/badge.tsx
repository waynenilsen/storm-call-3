import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 [a]:hover:bg-primary/15 dark:bg-primary/15 dark:ring-primary/25",
        solid:
          "bg-gradient-to-b from-brand-from to-brand-to text-primary-foreground shadow-xs [a]:hover:brightness-110",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/70",
        destructive:
          "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:ring-destructive/30 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/15",
        success:
          "bg-success/10 text-success ring-1 ring-inset ring-success/20 dark:bg-success/15 dark:ring-success/30",
        warning:
          "bg-warning/15 text-warning-foreground ring-1 ring-inset ring-warning/30 dark:bg-warning/20 dark:text-warning",
        accent:
          "bg-accent/15 text-accent-foreground ring-1 ring-inset ring-accent/30 dark:bg-accent/20 dark:text-accent",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
