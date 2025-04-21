import { useEffect, useState } from "react";

interface TimerProps {
  isRunning: boolean;
  onTimeUp: () => void;
  totalSeconds: number;
  mode: "preparation" | "recording";
}

export function Timer({ isRunning, onTimeUp, totalSeconds, mode }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        // Only call onTimeUp and clear interval when we actually hit zero
        if (prev <= 0) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount or when isRunning changes
    return () => clearInterval(timer);
  }, [isRunning, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

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
