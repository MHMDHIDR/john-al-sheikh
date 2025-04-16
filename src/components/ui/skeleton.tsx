import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md animate-pulse bg-neutral-100 dark:bg-neutral-800", className)}
      {...props}
    />
  );
}
