import { cn } from "@/lib/utils";
import type { JSX } from "react";

export default function Divider({
  children,
  className,
  textClassName,
}: {
  children?: string | JSX.Element;
  className?: string;
  textClassName?: string;
}) {
  return (
    <div
      className={cn(
        `relative m-4 flex w-full items-center justify-center before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:[background:linear-gradient(90deg,transparent,#777,transparent)] dark:before:[background:linear-gradient(90deg,transparent,#999,transparent)]`,
        className,
      )}
    >
      {children ? (
        <span
          className={cn(
            "z-10 px-2 select-none bg-background dark:bg-background text-primary/70 text-sm",
            textClassName,
          )}
        >
          {children}
        </span>
      ) : null}
    </div>
  );
}
