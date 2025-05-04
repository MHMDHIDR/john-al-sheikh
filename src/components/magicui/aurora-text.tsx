"use client";

import { useTheme } from "next-themes";
import { memo, useLayoutEffect, useState } from "react";

type AuroraTextProps = {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
  darkColors?: string[];
};

export const AuroraText = memo(
  ({
    children,
    className = "",
    colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
    darkColors = ["#FF66A1", "#A46DDF", "#339CFF", "#72d8fc"],
    speed = 1,
  }: AuroraTextProps) => {
    const { theme: currentTheme } = useTheme();
    const [theme, setTheme] = useState<string | undefined>(undefined);

    useLayoutEffect(() => {
      setTheme(currentTheme);

      return () => setTheme(undefined);
    }, [currentTheme]);

    const lightGradient = `linear-gradient(135deg, ${colors.join(", ")}, ${colors[0]})`;
    const darkGradient = `linear-gradient(135deg, ${darkColors.join(", ")}, ${darkColors[0]})`;

    const gradientStyle = {
      backgroundImage: theme === "dark" ? darkGradient : lightGradient,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animationDuration: `${10 / speed}s`,
    };

    return (
      <span className={`relative inline-block ${className}`}>
        <span className="sr-only">{children}</span>
        <span
          className="relative animate-aurora bg-[length:200%_auto] bg-clip-text text-transparent"
          style={gradientStyle}
          aria-hidden="true"
        >
          {children}
        </span>
      </span>
    );
  },
);

AuroraText.displayName = "AuroraText";
