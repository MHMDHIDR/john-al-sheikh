import { useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";

interface AudioProgressControlProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  showLabel?: boolean;
  className?: string;
}

export function AudioProgressControl({
  value,
  max,
  onChange,
  showLabel = false,
  className = "",
}: AudioProgressControlProps) {
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

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex items-center gap-x-2.5 ${className}`}>
      <Slider
        value={[value]}
        onValueChange={handleValueChange}
        min={0}
        max={max}
        step={0.1}
        aria-label="Audio progress control"
        className="w-full cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onFocus={handlePointerDown}
        onBlur={handleBlur}
        showTooltip={true}
        tooltipContent={value => formatTime(value)}
      />
      {showLabel && (
        <output
          className={`text-sm font-medium text-muted-foreground tabular-nums transition-opacity duration-300 ${
            isChanging ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {formatTime(value)} / {formatTime(max)}
        </output>
      )}
    </div>
  );
}
