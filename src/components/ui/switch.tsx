"use client";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  layout?: "dotted" | "grid" | "grid-small";
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, layout, ...props }, ref) => {
    const isThreeState = layout !== undefined;

    return (
      <SwitchPrimitives.Root
        type="button"
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          isThreeState
            ? cn(
                "w-16",
                layout === "dotted" && "bg-input",
                layout === "grid" && "bg-primary",
                layout === "grid-small" && "bg-secondary",
              )
            : cn(
                "transition-colors duration-300 ease-in-out",
                "data-[state=checked]:bg-primary",
                "data-[state=unchecked]:bg-input",
              ),
          className,
        )}
        {...props}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0",
            isThreeState
              ? cn(
                  layout === "dotted" && "translate-x-0",
                  layout === "grid" && "translate-x-5 rtl:-translate-x-5",
                  layout === "grid-small" && "translate-x-10 rtl:-translate-x-10",
                  "transition-transform duration-300 ease-in-out",
                )
              : cn(
                  "transition-transform duration-300 ease-in-out will-change-transform",
                  "data-[state=checked]:translate-x-5",
                  "data-[state=checked]:rtl:-translate-x-5",
                  "data-[state=unchecked]:translate-x-0",
                ),
          )}
          style={{
            transformOrigin: "center",
            backfaceVisibility: "hidden",
          }}
        />
      </SwitchPrimitives.Root>
    );
  },
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
