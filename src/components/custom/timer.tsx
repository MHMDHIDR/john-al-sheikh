import { useEffect, useState } from "react";

type TimerProps = {
  isRunning: boolean;
  onTimeUp: () => void;
  totalSeconds: number;
  mode: "preparation" | "recording" | "general-english";
};

export function Timer({ isRunning, onTimeUp, totalSeconds, mode }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  // Simple direct implementation - reset on any property change
  useEffect(() => {
    // Reset time when total seconds changes or when running starts
    if (isRunning) {
      setTimeLeft(totalSeconds);
    }

    // Don't set up interval if not running
    if (!isRunning) return;

    // Use a simple interval to count down
    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        // Log every tick for debugging
        const newVal = prev - 1;

        // Handle reaching zero
        if (prev <= 1) {
          clearInterval(intervalId);
          setTimeout(onTimeUp, 0); // Use setTimeout to avoid state update issues
          return 0;
        }
        return newVal;
      });
    }, 1000);

    // Clean up on unmount or when dependencies change
    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning, totalSeconds, onTimeUp]);

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
    <div className="flex items-center select-none justify-center md:space-y-1.5 space-x-1.5 md:space-x-0">
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
}
