import Image from "next/image";
import { cn } from "@/lib/utils";

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
        `flex flex-col items-center justify-center ${isSmall ? "gap-y-4 py-4" : "gap-y-10 py-10"}`,
        className,
      )}
    >
      <Image
        alt="Empty State"
        height={isSmall ? 100 : 300}
        src="/empty-state.svg"
        width={isSmall ? 100 : 300}
      />

      {children ?? <h3 className="text-lg font-semibold">No data available</h3>}
    </div>
  );
}
