import { useEffect, useState } from "react";

type TimerProps = {
  isRunning: boolean;
  onTimeUp: () => void;
  totalSeconds: number;
};

export function TimerQuickSpeakingTest({ isRunning, onTimeUp, totalSeconds }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(totalSeconds);
      return;
    }

    if (timeLeft === 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onTimeUp, totalSeconds]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(1, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="text-3xl font-medium tracking-tight text-gray-900">{formatTime(timeLeft)}</div>
  );
}
