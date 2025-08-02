import { useEffect, useState } from "react";

export const useCountUp = (end: number, duration = 2000) => {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;

    const step = (timestamp: number) => {
      startTimestamp ??= timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      setCount(Math.floor(startValue + (end - startValue) * easeOutQuad));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
};
