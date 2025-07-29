import { Mic, MicOff } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type TimerProps = {
  isRunning: boolean;
  onTimeUp: () => void;
  startTime: number | null; // timestamp in ms
  duration: number; // duration in ms
  mode: "preparation" | "recording" | "general-english" | "mock-test";
  isMuted: boolean;
  onToggleMute?: () => void;
  isConnected: boolean;
  // Add this prop to prevent timer reset during preparation
  isPreparationMode?: boolean;
  windDownTriggered?: boolean;
  // Add new prop for starting conversation
  onStartConversation?: () => void;
};

// Using memo to prevent unnecessary rerenders
export const Timer = memo(function Timer({
  isRunning,
  onTimeUp,
  startTime,
  duration,
  mode,
  isMuted,
  onToggleMute,
  isConnected,
  isPreparationMode = false,
  onStartConversation,
  windDownTriggered,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpCalledRef = useRef(false); // Prevent multiple calls to onTimeUp

  // Wave visualization refs
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const barsRef = useRef<HTMLDivElement[]>([]);
  const visualizeRef = useRef<(() => void) | undefined>(undefined);

  // Google-inspired colors - memoized to prevent dependency changes on re-renders
  const colors = useMemo(
    () => [
      "#4285F4", // Google blue
      "#EA4335", // Google red
      "#FBBC05", // Google yellow
      "#34A853", // Google green
    ],
    [],
  );

  // Timer logic - Fixed to not reset during preparation
  useEffect(() => {
    // For preparation mode, use a completely isolated timer that never resets
    if (isPreparationMode && mode === "preparation" && startTime) {
      // Only start the timer once when preparation begins
      if (!intervalIdRef.current) {
        timeUpCalledRef.current = false;

        // Set initial values
        const initialRemaining = Math.ceil(duration / 1000);
        setTimeLeft(initialRemaining);
        setProgress(0);

        // Use a stable interval that doesn't depend on external state changes
        intervalIdRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
          const progressPercent = Math.max(0, Math.min(100, (elapsed / duration) * 100));

          setTimeLeft(remaining);
          setProgress(progressPercent);

          if (remaining <= 0 && !timeUpCalledRef.current) {
            timeUpCalledRef.current = true;
            if (intervalIdRef.current) {
              clearInterval(intervalIdRef.current);
              intervalIdRef.current = null;
            }
            setTimeout(onTimeUp, 0);
          }
        }, 1000);
      }

      // Don't return cleanup for preparation mode - let it run until completion
      return;
    }

    // For non-preparation modes, use the original logic
    if (!isRunning || !startTime) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      setTimeLeft(0);
      setProgress(0);
      timeUpCalledRef.current = false;
      return;
    }

    // Original timer logic for non-preparation modes
    const updateTime = () => {
      const elapsed = Date.now() - startTime;

      if (mode === "mock-test") {
        // For mock-test mode, show elapsed time instead of countdown
        const elapsedSeconds = Math.floor(elapsed / 1000);
        setTimeLeft(elapsedSeconds);
        setProgress(0); // No progress circle for mock-test
      } else {
        // For other modes, show countdown
        const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
        const progressPercent = Math.max(0, Math.min(100, (elapsed / duration) * 100));

        setTimeLeft(remaining);
        setProgress(progressPercent);

        if (remaining <= 0 && !timeUpCalledRef.current) {
          timeUpCalledRef.current = true;
          if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
          }
          setTimeout(onTimeUp, 0);
        }
      }
    };

    updateTime();
    intervalIdRef.current = setInterval(updateTime, 1000);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isRunning, startTime, duration, onTimeUp, mode, isPreparationMode]);

  // Cleanup preparation timer when preparation mode ends
  useEffect(() => {
    if (!isPreparationMode && intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
      timeUpCalledRef.current = false;
    }
  }, [isPreparationMode]);

  // Wave visualization logic
  const visualize = useCallback(() => {
    if (!analyserRef.current || !barsRef.current.length) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateWaveform = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate visualizer bars
      const bars = barsRef.current;
      const barCount = bars.length;

      // Map frequency data to bar heights with smooth radio wave pattern
      for (let i = 0; i < barCount; i++) {
        // Create symmetric pattern (radio wave style)
        const index = Math.floor((i * bufferLength) / barCount);
        const value = dataArray[index] ?? 0;

        // Apply curve for radio wave appearance
        const position = i / barCount;
        const symmetricPosition = Math.abs(position - 0.5) * 2; // 0 at center, 1 at edges
        const multiplier = 1 - symmetricPosition * 0.7; // Taller in middle

        // Apply curve for natural wave appearance
        const height = Math.max(4, value * multiplier * 0.5);

        const bar = bars[i];
        if (bar) {
          bar.style.height = `${height}px`;
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  // Store the visualize function in a ref to avoid circular dependencies
  useEffect(() => {
    visualizeRef.current = visualize;
  }, [visualize]);

  const setupAudioAnalyzer = useCallback(async () => {
    try {
      if (!waveContainerRef.current) return;

      // Clear previous waves
      while (waveContainerRef.current.firstChild) {
        waveContainerRef.current.removeChild(waveContainerRef.current.firstChild);
      }

      barsRef.current = [];

      // Create visualization bars
      const totalBars = 45; // More bars for radio wave style
      const container = waveContainerRef.current;

      for (let i = 0; i < totalBars; i++) {
        const bar = document.createElement("div");
        const colorIndex = i % colors.length;

        bar.style.width = "3px";
        bar.style.backgroundColor = colors[colorIndex] ?? "#4285F4";
        bar.style.margin = "0 2px";
        bar.style.height = "40px"; // Start with minimal height
        bar.style.borderRadius = "1px";
        bar.style.transition = "height 0.05s ease"; // Smooth transitions
        bar.style.transformOrigin = "bottom";

        container.appendChild(bar);
        barsRef.current.push(bar);
      }

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create audio context and analyzer
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;

      analyser.fftSize = 128; // Power of 2, lower for better performance

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start visualization using the ref to avoid circular dependencies
      if (visualizeRef.current) {
        visualizeRef.current();
      }
    } catch (err) {
      console.error("Error setting up audio analyzer:", err);
    }
  }, [colors]);

  const cleanupAudioAnalyzer = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear analyzer reference
    analyserRef.current = null;
  }, []);

  // Setup audio analyzer when connected and not muted (but not during preparation)
  useEffect(() => {
    if (isConnected && !isMuted && !isPreparationMode) {
      void setupAudioAnalyzer();
    } else {
      cleanupAudioAnalyzer();
    }

    return () => {
      cleanupAudioAnalyzer();
    };
  }, [isConnected, isMuted, isPreparationMode, setupAudioAnalyzer, cleanupAudioAnalyzer]);

  // Format time
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Default time display when not running
  const defaultMinutes = Math.floor(duration / 1000 / 60);
  const defaultSeconds = Math.floor((duration / 1000) % 60);

  // Get color based on time left
  const getTimerColor = () => {
    if (mode === "preparation") return "stroke-blue-600";
    if (mode === "mock-test") return "stroke-green-600";
    if (timeLeft <= 10) return "stroke-red-600";
    if (timeLeft <= 60) return "stroke-orange-500";
    return "stroke-blue-600";
  };

  // Get background color based on time left
  const getBackgroundColor = () => {
    if (mode === "preparation") return "bg-blue-50 dark:bg-blue-950/20";
    if (mode === "mock-test") return "bg-green-50 dark:bg-green-950/20";
    if (timeLeft <= 10) return "bg-red-50 dark:bg-red-950/20";
    if (timeLeft <= 60) return "bg-orange-50 dark:bg-orange-950/20";
    return "bg-blue-50 dark:bg-blue-950/20";
  };

  // Calculate stroke dasharray for progress
  const radius = 45; // SVG circle radius
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    mode === "mock-test" ? circumference : circumference - (progress / 100) * circumference;

  const handleClick = () => {
    if (isConnected && !isPreparationMode) {
      onToggleMute?.();
    } else if (!isConnected && onStartConversation) {
      onStartConversation();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/*  Timer Circle */}
      <div className="relative">
        <svg className="size-32 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={cn("transition-all duration-300 ease-in-out", getTimerColor())}
          />
        </svg>

        {/* Center content with waves */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Wave visualization container - hidden during preparation */}
          {isConnected && !isMuted && !isPreparationMode && (
            <div
              className="mt-0 flex h-72 w-88 items-center justify-center absolute -z-10"
              ref={waveContainerRef}
            />
          )}

          {/* Microphone button */}
          {isConnected ? (
            <button
              onClick={handleClick}
              disabled={isPreparationMode || windDownTriggered}
              className={cn(
                "flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all duration-200 relative z-10",
                getBackgroundColor(),
                isPreparationMode || windDownTriggered
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              )}
            >
              {isMuted || isPreparationMode ? (
                <MicOff className="size-6 text-red-600" />
              ) : (
                <Mic className="size-6 text-green-600" />
              )}
            </button>
          ) : (
            <button
              onClick={handleClick}
              className="flex flex-col items-center justify-center size-20 rounded-full bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 relative z-10 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <Mic className="size-6 text-blue-600" />
            </button>
          )}
        </div>
      </div>

      {/* Time display */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isRunning && startTime
            ? `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
            : `${String(defaultMinutes).padStart(2, "0")}:${String(defaultSeconds).padStart(2, "0")}`}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {mode === "mock-test" ? "الوقت المنقضي" : isRunning ? "الوقت المتبقي" : "زمن المحادثة"}
        </div>
      </div>

      {/* Mic status */}
      {isConnected && (
        <div className="text-center">
          <div
            className={cn(
              "text-sm font-medium px-3 py-1 rounded-full",
              isMuted || isPreparationMode
                ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
            )}
          >
            {isPreparationMode ? "وقت التحضير" : isMuted ? "صامت" : "يستمع"}
          </div>
        </div>
      )}
    </div>
  );
});
