import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-br from-muted to-muted/60 ring-1 ring-inset ring-border/50",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
