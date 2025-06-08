import { memo, useEffect, useRef, useState } from "react";

type TimerProps = {
  isRunning: boolean;
  onTimeUp: () => void;
  startTime: number; // timestamp in ms
  duration: number; // duration in ms
  mode: "preparation" | "recording" | "general-english";
};

// Using memo to prevent unnecessary rerenders
export const Timer = memo(function Timer({
  isRunning,
  onTimeUp,
  startTime,
  duration,
  mode,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.ceil((startTime + duration - Date.now()) / 1000)),
  );
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    // Update immediately in case of re-mount or prop change
    setTimeLeft(Math.max(0, Math.ceil((startTime + duration - Date.now()) / 1000)));

    intervalIdRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((startTime + duration - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        setTimeout(onTimeUp, 0);
      }
    }, 1000);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isRunning, startTime, duration, onTimeUp]);

  // Format time
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Get color based on time left
  const getTimerColor = () => {
    if (mode === "preparation") return "text-blue-600";
    if (timeLeft <= 10) return "text-red-600";
    return "text-green-600";
  };

  return (
    <div className="flex items-center select-none justify-center md:gap-1.5 gap-1.5">
      <div className={`text-xl font-bold ${getTimerColor()}`}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      <div className="text-xs font-bold text-muted-foreground">
        {mode === "preparation" ? (
          "وقت التحضير"
        ) : mode === "general-english" ? (
          "الوقت"
        ) : (
          <span className="hidden md:inline-flex">الوقت المتبقي من نهاية الاختبار</span>
        )}
      </div>
    </div>
  );
});
