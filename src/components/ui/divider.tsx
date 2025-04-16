import { cn } from "@/lib/utils";

export function Divider({ children, className }: { children?: string; className?: string }) {
  return (
    <div
      className={cn(
        `relative m-4 flex w-full items-center justify-center before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:[background:linear-gradient(90deg,transparent,#777,transparent)] dark:before:[background:linear-gradient(90deg,transparent,#999,transparent)]`,
        className,
      )}
    >
      {children ? (
        <span className="z-10 px-2 select-none bg-background text-primary/80">{children}</span>
      ) : null}
    </div>
  );
}

export default Divider;
