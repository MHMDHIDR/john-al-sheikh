import { Mic, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

type RecordButtonProps = {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function ButtonRecord({ isRecording, onClick, disabled = false }: RecordButtonProps) {
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
      const totalBars = 40; // More bars for radio wave style
      const container = waveContainerRef.current;

      for (let i = 0; i < totalBars; i++) {
        const bar = document.createElement("div");
        const colorIndex = i % colors.length;

        bar.style.width = "3px";
        bar.style.backgroundColor = colors[colorIndex] ?? "#4285F4";
        bar.style.margin = "0 2px";
        bar.style.height = "5px"; // Start with minimal height
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

  useEffect(() => {
    // Setup audio analyzer when recording starts
    if (isRecording) {
      void setupAudioAnalyzer();
    } else {
      // Clean up when recording stops
      cleanupAudioAnalyzer();
    }

    return () => {
      cleanupAudioAnalyzer();
    };
  }, [isRecording, setupAudioAnalyzer, cleanupAudioAnalyzer]);

  return (
    <div className="flex relative flex-col items-center">
      <button
        id="recording-button"
        className={`relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full transition-all ${
          isRecording ? "bg-white shadow-lg" : "bg-blue-500 hover:bg-blue-600"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        onClick={onClick}
        disabled={disabled}
      >
        {isRecording ? (
          <div className="relative">
            <Square className="size-5 text-red-600" />
            <div className="absolute top-0 left-0 size-4 animate-ping rounded-full bg-red-600"></div>
          </div>
        ) : (
          <Mic className="size-5 text-white" />
        )}
      </button>

      {isRecording && (
        <div
          className="-mt-8 flex h-32 w-80 items-center justify-center absolute -z-10"
          ref={waveContainerRef}
        />
      )}
    </div>
  );
}
