import { useEffect, useState } from "react";

interface TimerProps {
  isRunning: boolean;
  onTimeUp: () => void;
  totalSeconds: number;
  mode: "preparation" | "recording";
}

export function Timer({ isRunning, onTimeUp, totalSeconds, mode }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  // Simple direct implementation - reset on any property change
  useEffect(() => {
    // Reset time when total seconds changes or when running starts
    if (isRunning) {
      console.log(`Timer reset to ${totalSeconds} and started`);
      setTimeLeft(totalSeconds);
    }

    // Don't set up interval if not running
    if (!isRunning) return;

    // Use a simple interval to count down
    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        // Log every tick for debugging
        const newVal = prev - 1;
        console.log(`Timer tick: ${prev} -> ${newVal}`);

        // Handle reaching zero
        if (prev <= 1) {
          clearInterval(intervalId);
          console.log("Timer reached zero, calling onTimeUp");
          setTimeout(onTimeUp, 0); // Use setTimeout to avoid state update issues
          return 0;
        }
        return newVal;
      });
    }, 1000);

    // Clean up on unmount or when dependencies change
    return () => {
      console.log("Clearing timer interval");
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
    <div className="flex flex-col items-center select-none justify-center space-y-1">
      <div className={`text-xl font-bold ${getTimerColor()}`}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      <div className="text-xs font-bold text-muted-foreground">
        {mode === "preparation" ? "وقت التحضير" : "وقت التسجيل"}
      </div>
    </div>
  );
}
