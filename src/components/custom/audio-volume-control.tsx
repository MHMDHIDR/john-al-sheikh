import { useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";

interface AudioVolumeControlProps {
  value: number;
  onChange: (value: number) => void;
  showLabel?: boolean;
  className?: string;
}

export function AudioVolumeControl({
  value,
  onChange,
  showLabel = false,
  className = "",
}: AudioVolumeControlProps) {
  const [isChanging, setIsChanging] = useState(false);
  const fadeTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleValueChange = (newValue: number[]) => {
    onChange(newValue[0] ?? 0);
  };

  const handlePointerDown = () => {
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    setIsChanging(true);
  };
  const handlePointerUp = () => {
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    fadeTimeout.current = setTimeout(() => setIsChanging(false), 800);
  };
  const handleBlur = () => {
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    fadeTimeout.current = setTimeout(() => setIsChanging(false), 800);
  };

  return (
    <div className={`flex items-center gap-x-2.5 ${className}`}>
      <Slider
        value={[value]}
        onValueChange={handleValueChange}
        min={0}
        max={1}
        step={0.01}
        aria-label="Volume control"
        className="w-full cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onFocus={handlePointerDown}
        onBlur={handleBlur}
      />
      {showLabel && (
        <output
          className={`text-sm font-medium text-muted-foreground tabular-nums transition-opacity duration-300 ${
            isChanging ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {Math.round(value * 100)}%
        </output>
      )}
    </div>
  );
}
