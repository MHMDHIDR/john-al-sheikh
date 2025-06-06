import { memo, useEffect, useRef, useState } from "react";

type TimerProps = {
  isRunning: boolean;
  onTimeUp: () => void;
  totalSeconds: number;
  mode: "preparation" | "recording" | "general-english";
};

// Using memo to prevent unnecessary rerenders
export const Timer = memo(function Timer({ isRunning, onTimeUp, totalSeconds, mode }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const prevRunningRef = useRef(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // Only reset time when isRunning changes from false to true or on first initialization
  useEffect(() => {
    if (!initializedRef.current || (isRunning && !prevRunningRef.current)) {
      setTimeLeft(totalSeconds);
      initializedRef.current = true;
    }

    prevRunningRef.current = isRunning;
  }, [isRunning, totalSeconds]);

  // Use a separate effect for the countdown logic
  useEffect(() => {
    // Don't set up interval if not running
    if (!isRunning) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    // Use a simple interval to count down
    intervalIdRef.current = setInterval(() => {
      setTimeLeft(prev => {
        // Handle reaching zero
        if (prev <= 1) {
          if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
          }
          setTimeout(onTimeUp, 0); // Use setTimeout to avoid state update issues
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Clean up on unmount or when dependencies change
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isRunning, onTimeUp]);

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
