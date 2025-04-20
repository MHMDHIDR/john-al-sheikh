"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AudioControls } from "@/components/custom/audio-controls";
import { ChatMessage } from "@/components/custom/chat-message";
import { Timer } from "@/components/custom/timer";
import { AuroraText } from "@/components/magicui/aurora-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

type Message = {
  role: "examiner" | "user";
  content: string;
  timestamp: string;
};

type SpeechChatProps = {
  userId: string;
};

export function SpeechChat({ userId }: SpeechChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [testId, setTestId] = useState<string>();
  const [shouldAutoStart, setShouldAutoStart] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const audioChunks = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const router = useRouter();
  const { success, error: errorToast, warning } = useToast();

  const startTestMutation = api.openai.startSpeakingTest.useMutation();
  const continueTestMutation = api.openai.continueSpeakingTest.useMutation();
  const finalizeTestMutation = api.openai.finalizeSpeakingTest.useMutation();

  // Convert audio blob to mp3
  const convertToMp3 = async (audioBlob: Blob): Promise<string> => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const audioData = await audioContext.decodeAudioData(arrayBuffer);

      if (!audioData || !(audioData instanceof AudioBuffer)) {
        throw new Error("Failed to decode audio data");
      }

      // Now TypeScript knows audioData is definitely an AudioBuffer
      const offlineContext = new OfflineAudioContext(
        audioData.numberOfChannels,
        audioData.length,
        audioData.sampleRate,
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioData;
      source.connect(offlineContext.destination);
      source.start();

      // Render audio
      const renderedBuffer = await offlineContext.startRendering();

      // Convert to WAV format
      const wavBlob = await new Promise<Blob>(resolve => {
        const length = renderedBuffer.length;
        const wav = new Float32Array(length);
        renderedBuffer.copyFromChannel(wav, 0);

        const wavBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(wavBuffer);

        // Write WAV header
        const writeString = (view: DataView, offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        };

        writeString(view, 0, "RIFF");
        view.setUint32(4, 36 + length * 2, true);
        writeString(view, 8, "WAVE");
        writeString(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, renderedBuffer.sampleRate, true);
        view.setUint32(28, renderedBuffer.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, "data");
        view.setUint32(40, length * 2, true);

        // Write audio data
        const samples = new Int16Array(wavBuffer, 44, length);
        for (let i = 0; i < length; i++) {
          const sample = Math.max(-1, Math.min(1, wav[i]));
          samples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }

        resolve(new Blob([wavBuffer], { type: "audio/wav" }));
      });

      // Convert to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(wavBlob);
      });

      return base64Audio.split(",")[1] ?? "";
    } catch (error) {
      console.error("Audio conversion error:", error);
      throw error;
    }
  };

  // Clear resources
  const clearResources = () => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioChunks.current = [];
  };

  // Play audio response
  const playAudioResponse = async (base64Audio: string) => {
    if (audioRef.current) {
      audioRef.current.src = `data:audio/mp3;base64,${base64Audio}`;
      try {
        await audioRef.current.play();
        // Auto-start recording after examiner finishes speaking
        if (shouldAutoStart) {
          setShouldAutoStart(false);
          const playEndTimeout = setTimeout(() => {
            void handleToggleRecording();
          }, 1000);
          timeoutsRef.current.push(playEndTimeout);
        }
      } catch (error) {
        console.error("Audio playback error:", error);
        errorToast("Failed to play audio. Please click the Start Recording button when ready.");
      }
    }
  };

  // Handle recording toggle
  const handleToggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      clearResources();
      setIsRecording(false);
    } else {
      try {
        audioChunks.current = [];
        setIsRecording(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        streamRef.current = stream;
        const recorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
          audioBitsPerSecond: 128000,
        });

        mediaRecorderRef.current = recorder;

        // Handle audio data
        recorder.addEventListener("dataavailable", event => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        });

        // Handle recording stop
        recorder.addEventListener("stop", () => {
          void (async () => {
            const finalAudioChunks = [...audioChunks.current];
            clearResources();
            setIsRecording(false);

            if (finalAudioChunks.length === 0) {
              errorToast("No audio recorded");
              return;
            }

            try {
              setIsProcessing(true);

              // Create blob and convert to WAV
              const audioBlob = new Blob(finalAudioChunks, { type: "audio/webm" });
              const base64Audio = await convertToMp3(audioBlob);

              if (!base64Audio) {
                errorToast("Failed to process audio");
                setIsProcessing(false);
                return;
              }

              // Continue the test with user's response
              const response = await continueTestMutation.mutateAsync({
                testId: testId!,
                audioBase64: base64Audio,
                section: currentSection,
              });

              if (!response.success) {
                errorToast("Failed to process response");
                setIsProcessing(false);
                return;
              }

              // Store messages in session storage
              const newMessages = [
                ...messages,
                {
                  role: "user" as const,
                  content: response.transcription,
                  timestamp: new Date().toISOString(),
                },
                {
                  role: "examiner" as const,
                  content: response.examinerResponse,
                  timestamp: new Date().toISOString(),
                },
              ];
              setMessages(newMessages);
              sessionStorage.setItem("testMessages", JSON.stringify(newMessages));

              // Play examiner's audio response and prepare for next section
              await playAudioResponse(response.audioBase64);

              // Move to next section if needed
              if (currentSection === 3) {
                // Finalize test and save to database
                const results = await finalizeTestMutation.mutateAsync({
                  testId: testId!,
                  messages: newMessages,
                });

                if (results.success) {
                  // Store results for results page
                  sessionStorage.setItem("ieltsResult", JSON.stringify(results.feedback));
                  router.push("/speaking-test-results");
                }
              } else {
                setCurrentSection(prev => prev + 1);
                setShouldAutoStart(true);
              }

              setIsProcessing(false);
            } catch (err) {
              console.error(err);
              errorToast("Error processing response");
              setIsProcessing(false);
            }
          })();
        });

        // Auto-stop based on section
        const maxTime = currentSection === 2 ? 120 : 60; // 2 minutes for section 2, 1 minute for others
        const maxTimeTimeout = setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
            success("Recording finished");
          }
        }, maxTime * 1000);
        timeoutsRef.current.push(maxTimeTimeout);

        // Warning 10 seconds before end
        const warningTimeout = setTimeout(
          () => {
            if (recorder.state === "recording") {
              warning("Please wrap up your response");
            }
          },
          (maxTime - 10) * 1000,
        );
        timeoutsRef.current.push(warningTimeout);

        recorder.start(500);
      } catch (err) {
        errorToast("Could not access microphone");
        clearResources();
        setIsRecording(false);
        console.error(err);
      }
    }
  };

  // Start test handler
  const handleStartTest = async () => {
    try {
      setIsProcessing(true);
      const response = await startTestMutation.mutateAsync({
        userId,
        type: "MOCK",
      });

      if (response.success) {
        setTestId(response.testId);
        const initialMessages = [
          {
            role: "examiner" as const,
            content: response.examinerResponse,
            timestamp: new Date().toISOString(),
          },
        ];
        setMessages(initialMessages);
        sessionStorage.setItem("testMessages", JSON.stringify(initialMessages));
        setShouldAutoStart(true);
        setHasStarted(true);
        await playAudioResponse(response.audioBase64);
      }
    } catch (error) {
      console.error(error);
      errorToast("Failed to start test");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg h-[600px] flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b">
          <h1 className="text-center text-2xl font-black">
            <AuroraText>اختبار المحادثة التجريبي</AuroraText>
          </h1>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Section {currentSection} of 3
          </p>
        </div>

        {/* Chat messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {!hasStarted && !isProcessing && (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <p className="text-center text-lg text-gray-600">
                  Welcome to the IELTS Speaking Test. Click the button below to start.
                </p>
                <Button
                  size="lg"
                  onClick={handleStartTest}
                  disabled={isProcessing}
                  className="w-48"
                >
                  Start Test
                </Button>
              </div>
            )}
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                message={msg.content}
                timestamp={msg.timestamp}
                isReply={msg.role === "user"}
              />
            ))}
            {isProcessing && (
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-400 border-t-primary"></div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Timer and Audio controls */}
        <div className="border-t p-4">
          {isRecording && (
            <div className="mb-4 flex justify-center">
              <Timer
                isRunning={isRecording}
                onTimeUp={() => {
                  if (mediaRecorderRef.current?.state === "recording") {
                    mediaRecorderRef.current.stop();
                  }
                }}
                totalSeconds={currentSection === 2 ? 120 : 60}
              />
            </div>
          )}
          {hasStarted && (
            <AudioControls
              isRecording={isRecording}
              onToggleRecording={handleToggleRecording}
              disabled={isProcessing || !testId}
            />
          )}
        </div>
      </Card>

      <audio
        ref={audioRef}
        className="hidden"
        onEnded={() => {
          if (shouldAutoStart) {
            void handleToggleRecording();
          }
        }}
      />
    </div>
  );
}
