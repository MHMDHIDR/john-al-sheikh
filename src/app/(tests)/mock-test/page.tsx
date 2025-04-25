"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Timer } from "@/components/custom/timer";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { MAX_RECORDING_TIME } from "@/lib/constants";
import {
  clearAudioBuffer,
  closeOpenaiConnection,
  commitAudioBuffer,
  detectNonIELTSContent,
  getOpenaiWebrtcInstance,
  handleSectionTransition,
  OpenAIRealtimeEvent,
  sendSessionUpdate,
  sendTextMessage,
} from "@/lib/openai-realtime";
import { cn } from "@/lib/utils";

type SpeakingTestMessage = {
  role: "examiner" | "candidate";
  content: string;
  timestamp: string;
};

type SectionName = "الأولى" | "الثانية" | "الثالثة";

export default function MockTestPage() {
  const [sectionName, setSectionName] = useState<SectionName>("الأولى");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [messages, setMessages] = useState<SpeakingTestMessage[]>([]);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [currentSection, setCurrentSection] = useState<number>(1);
  const [isExaminerSpeaking, setIsExaminerSpeaking] = useState<boolean>(false);
  const [sectionTopic, setSectionTopic] = useState<string>("");
  const [preparationMode, setPreparationMode] = useState<boolean>(false);

  // Ref to store WebRTC connection
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const testTranscriptRef = useRef<string>("");

  // Initialize WebRTC connection to OpenAI
  const initializeWebRTC = useCallback(async () => {
    try {
      // Get audio element for AI speech playback
      const audioElement = document.querySelector("audio");
      if (!audioElement) {
        throw new Error("Audio element not found");
      }
      audioElementRef.current = audioElement;

      // Create WebRTC connection
      const { pc, dc } = await getOpenaiWebrtcInstance(audioElement);
      peerConnectionRef.current = pc;
      dataChannelRef.current = dc;

      console.log("WebRTC connection established");

      // Set up data channel event handlers
      dc.onmessage = event => {
        try {
          const message = JSON.parse(event.data) as OpenAIRealtimeEvent;

          // Handle different message types
          switch (message.type) {
            case "session.created":
              console.log("Session created:", message);
              // Start the test with section 1
              handleSectionTransition(dc, 1);
              break;

            case "response.text.partial":
            case "response.text.new":
              if (message.data?.text) {
                // Add examiner message
                addMessage("examiner", message.data.text);
                setIsExaminerSpeaking(true);
              }
              break;

            case "response.text.done":
              setIsExaminerSpeaking(false);
              // Auto-start recording after AI finishes speaking
              setTimeout(() => {
                if (!isRecording && !preparationMode) {
                  toggleRecording();
                }
              }, 1000);
              break;

            case "conversation.item.input_audio_transcription.completed":
              if (message.transcription?.text) {
                const text = message.transcription.text.trim();
                if (text) {
                  // Check if the content is IELTS-appropriate
                  const isNonIELTSContent = detectNonIELTSContent(text);

                  if (isNonIELTSContent) {
                    // Send a reminder to stay on topic
                    sendTextMessage(
                      dc,
                      "Sorry, I'm John Al-Sheikh, and I'm not allowed to speak about anything else. Let's focus on the matter at hand - this is an IELTS speaking test.",
                    );
                  } else {
                    // Add candidate message
                    addMessage("candidate", text);

                    // Save transcript for later analysis
                    testTranscriptRef.current += `Candidate: ${text}\n`;

                    // Store conversation in sessionStorage
                    saveConversationToStorage();
                  }
                }
              }
              break;

            case "input_audio_buffer.speech_stopped":
              if (isRecording && !preparationMode) {
                // Stop recording when speech stops
                toggleRecording();
              }
              break;

            default:
              // Handle other event types if needed
              break;
          }
        } catch (error) {
          console.error("Error processing WebRTC message:", error);
        }
      };

      // Initialize the session configuration
      await sendSessionUpdate(dc);

      return { pc, dc };
    } catch (error) {
      console.error("Failed to initialize WebRTC:", error);
      return { pc: null, dc: null };
    }
  }, [isRecording, preparationMode]);

  // Function to add a message to the conversation
  const addMessage = useCallback((role: "examiner" | "candidate", content: string) => {
    setMessages(prevMessages => [
      ...prevMessages,
      {
        role,
        content,
        timestamp: new Date().toISOString(),
      },
    ]);

    // Save to transcript reference
    if (role === "examiner") {
      testTranscriptRef.current += `Examiner: ${content}\n`;
    }
  }, []);

  // Save conversation to sessionStorage
  const saveConversationToStorage = useCallback(() => {
    try {
      sessionStorage.setItem(
        "ieltsConversation",
        JSON.stringify({
          messages,
          transcript: testTranscriptRef.current,
          currentSection,
          topic: sectionTopic,
        }),
      );
    } catch (error) {
      console.error("Failed to save conversation to storage:", error);
    }
  }, [messages, currentSection, sectionTopic]);

  // Handle starting the test
  const handleStartTest = useCallback(() => {
    setShowOverlay(false);
    setIsProcessing(true);

    // Initialize WebRTC
    void initializeWebRTC().then(({ pc, dc }) => {
      if (pc && dc) {
        peerConnectionRef.current = pc;
        dataChannelRef.current = dc;
        setIsProcessing(false);
      } else {
        setIsProcessing(false);
        // Show error message if initialization fails
        alert("Failed to connect to the examiner. Please try again.");
      }
    });
  }, [initializeWebRTC]);

  // Start/stop recording
  const toggleRecording = useCallback(() => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      console.error("Cannot toggle recording: WebRTC data channel not ready");
      return;
    }

    // Toggle recording state
    setIsRecording(prevState => {
      const newState = !prevState;
      const dc = dataChannelRef.current;

      if (newState && dc) {
        // Start recording
        clearAudioBuffer(dc);
        setTimerRunning(true);
      } else if (dc) {
        // Stop recording
        commitAudioBuffer(dc);
        setTimerRunning(false);
      }

      return newState;
    });
  }, []);

  // Handle timer completion
  const handleTimeUp = useCallback(() => {
    const dc = dataChannelRef.current;
    if (!dc || dc.readyState !== "open") {
      console.error("WebRTC data channel not ready");
      return;
    }

    if (preparationMode) {
      // After preparation time, switch to recording mode
      setPreparationMode(false);
      setTimerRunning(false);

      // Inform the candidate that preparation time is up
      sendTextMessage(
        dc,
        "Your preparation time is up. Please start speaking about the topic now. You have 2 minutes.",
      );

      // Start recording after a short delay
      setTimeout(() => {
        toggleRecording();
      }, 2000);
    } else {
      // Normal recording time up
      setIsRecording(false);
      setTimerRunning(false);

      if (dc) {
        // Progress to next section based on current section
        if (currentSection === 1) {
          // Move to section 2
          setCurrentSection(2);
          setSectionName("الثانية");
          setPreparationMode(true);

          // Generate a random topic for section 2
          const topics = [
            "Describe a skill you would like to learn",
            "Describe a place you enjoy visiting",
            "Describe a person who has influenced you",
            "Describe a hobby or activity you enjoy",
            "Describe a challenge you have overcome",
          ];
          const randomIndex = Math.floor(Math.random() * topics.length);
          const selectedTopic = topics[randomIndex] || "Describe a skill you would like to learn";
          setSectionTopic(selectedTopic);

          // Send section 2 instructions with the selected topic
          const section2Prompt = `Now, let's move on to Section 2. I'm going to give you a topic to talk about. The topic is: ${selectedTopic}. You have one minute to prepare and then you should speak for up to two minutes. You can make notes if you wish.`;
          sendTextMessage(dc, section2Prompt);

          // Start preparation timer
          setTimeout(() => {
            setTimerRunning(true);
          }, 2000);
        } else if (currentSection === 2) {
          // Move to section 3
          setCurrentSection(3);
          setSectionName("الثالثة");

          // Send section 3 instructions
          handleSectionTransition(dc, 3);
        } else {
          // Test complete
          sendTextMessage(dc, "The test is now complete. Thank you for your participation.");

          // Save final conversation and navigate to results page
          saveConversationToStorage();

          // Navigate to results page
          setTimeout(() => {
            alert("Test complete! Your results have been saved.");
          }, 3000);
        }
      }
    }
  }, [currentSection, preparationMode, saveConversationToStorage, toggleRecording]);

  // Placeholder function for section duration
  const getSectionDuration = useCallback((): number => {
    if (preparationMode) {
      return 60; // 1 minute preparation time
    } else if (currentSection === 2 && !preparationMode) {
      return 120; // 2 minutes speaking time for section 2
    } else {
      return MAX_RECORDING_TIME; // Default time for other sections
    }
  }, [currentSection, preparationMode]);

  // Cleanup function for WebRTC resources
  useEffect(() => {
    return () => {
      closeOpenaiConnection();
    };
  }, []);

  return (
    <main className="min-h-fit bg-white flex flex-col items-center">
      <AuroraText className="m-2 mt-0 sticky top-12 py-1 shadow bg-white w-full text-center z-20 text-2xl font-bold text-gray-900 select-none">
        اختبار المحادثة
      </AuroraText>

      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white select-none rounded-lg p-8 shadow-lg max-w-md text-center">
            <h2 className="mb-6 text-2xl font-bold">اختبار المحادثة باللغة الإنجليزية</h2>
            <p className="mb-8 text-gray-600">
              سيقوم{" "}
              <strong className="text-blue-700" aria-label={env.NEXT_PUBLIC_APP_NAME}>
                {env.NEXT_PUBLIC_APP_NAME}
              </strong>{" "}
              بتوجيه أسئلة لك باللغة الإنجليزية. يرجى الإجابة بشكل طبيعي كما في اختبار حقيقي.
            </p>
            <Button
              variant="pressable"
              size="lg"
              className="cursor-pointer font-black text-lg"
              onClick={handleStartTest}
              disabled={isProcessing}
            >
              {isProcessing ? "جاري التحميل..." : "إبدا الإختبار"}
            </Button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-4xl mx-auto">
        <InteractiveGridPattern
          className={cn(
            "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
            "absolute inset-x-0 inset-y-0 h-full w-full z-0 opacity-50",
          )}
          width={70}
          height={70}
          squares={[30, 30]}
          squaresClassName="hover:fill-blue-200"
        />

        <div className="relative z-10 flex flex-col min-h-[600px] bg-white rounded-lg overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 ltr">
            {preparationMode && currentSection === 2 && (
              <div className="bg-blue-50 p-4 rounded-lg text-center my-4">
                <h3 className="font-bold text-blue-800 mb-2">وقت التحضير</h3>
                <p className="text-blue-700">{sectionTopic}</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={clsx("flex", {
                  "justify-start": message.role === "examiner",
                  "justify-end": message.role === "candidate",
                })}
              >
                <div
                  className={clsx("max-w-[80%] rounded-lg p-3", {
                    "bg-blue-100 text-blue-900": message.role === "examiner",
                    "bg-green-100 text-green-900": message.role === "candidate",
                  })}
                >
                  <p className="text-sm ltr">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isProcessing && messages.length === 0 && (
              <div className="flex justify-center py-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-blue-500 border-t-transparent"></div>
              </div>
            )}

            {isExaminerSpeaking && (
              <div className="flex justify-start">
                <div className="bg-blue-100 text-blue-900 max-w-[80%] rounded-lg p-3">
                  <div className="flex space-x-1 items-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 w-full bg-gray-50 flex flex-col">
        <div className="flex justify-between items-center select-none px-4 py-2">
          <Timer
            isRunning={timerRunning}
            onTimeUp={handleTimeUp}
            totalSeconds={getSectionDuration()}
            mode={preparationMode ? "preparation" : "recording"}
          />
          <strong>المرحلة {sectionName}</strong>
        </div>
      </div>

      <audio className="hidden" controls />
    </main>
  );
}
