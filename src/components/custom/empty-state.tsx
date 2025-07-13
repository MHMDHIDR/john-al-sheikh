import Image from "next/image";
import { cn } from "@/lib/utils";
import { EmptyStateIcon } from "./icons";

export default function EmptyState({
  children,
  isSmall,
  className,
}: {
  isSmall?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        `flex flex-col items-center justify-center ${isSmall ? "gap-y-2 py-2" : "gap-y-4 py-4"}`,
        className,
      )}
    >
      <EmptyStateIcon className={cn(isSmall ? "size-24" : "size-56")} />

      {children ?? <h3 className="text-lg font-semibold">No data available</h3>}
    </div>
  );
}
