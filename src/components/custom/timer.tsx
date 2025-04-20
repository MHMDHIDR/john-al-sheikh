import { useEffect, useState } from "react";

type TimerProps = {
  isRunning: boolean;
  onTimeUp: () => void;
  totalSeconds: number;
};

export function Timer({ isRunning, onTimeUp, totalSeconds }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="text-center">
      <div className="text-4xl font-mono font-bold text-primary">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Time Remaining</p>
    </div>
  );
}
