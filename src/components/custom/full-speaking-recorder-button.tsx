"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useGlobalVapiConversation } from "@/app/providers/vapi-conversation-provider";
import { ConfirmationDialog } from "@/components/custom/data-table/confirmation-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/env";
import { useMockTestStore } from "@/hooks/use-mock-test-store";
import { CallStatus, useVapiConversation } from "@/hooks/use-vapi-conversation";
import {
  GENERAL_ENGLISH_CONVERSATION_TIME,
  GENERAL_ENGLISH_WIND_DOWN_TRIGGER_TIME,
  MINUTES_IN_MS,
  MOCK_TEST_CONVERSATION_TIME,
  MOCK_TEST_WIND_DOWN_TRIGGER_TIME,
} from "@/lib/constants";
import { generateSystemPrompt } from "@/lib/conversation-prompts";
import { vapi } from "@/lib/vapi.sdk";
import { api } from "@/trpc/react";
import { Timer } from "./timer";
import type { CreateAssistantDTO } from "@/hooks/use-vapi-conversation";
import type { ConversationModeType } from "@/lib/conversation-prompts";
import type { Users } from "@/server/db/schema";

export type UserProfile = {
  id: Users["id"];
  name: Users["name"];
  age: Users["age"];
  gender: Users["gender"];
  hobbies: Users["hobbies"];
  nationality: Users["nationality"];
  goalBand: Users["goalBand"];
};

// Add a new interface for the ref methods
export interface FullSpeakingRecorderButtonRef {
  stopTest: () => void;
  getSessionStartTime: () => number | null;
  startConversation: () => void;
}

/**
 * IELTS Assistant Configuration
 * @param {Object} { userProfile, mode } - The component props
 * @param {UserProfile} props.userProfile - The user's profile
 * @param {ConversationModeType} props.mode - The conversation mode
 * @returns {CreateAssistantDTO} The configuration for the IELTS Assistant
 */
function IeltsAssistantConfig({
  userProfile,
  mode = "mock-test",
}: {
  userProfile: Omit<UserProfile, "id">;
  mode?: ConversationModeType;
}): CreateAssistantDTO {
  const getTimeOfDay = () => {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) return "Morning";
    if (hours < 18) return "Afternoon";
    return "Evening";
  };

  // Generate system prompt using the utility function
  const systemPrompt = generateSystemPrompt({ userProfile, mode });

  return {
    name: mode === "mock-test" ? "IELTS Examiner" : "English Conversation Friend",
    firstMessage: userProfile
      ? `Hello ${userProfile.name}, How are you this fine ${getTimeOfDay()}!, I'm John Al-Shiekh ${mode === "mock-test" ? "the IELTS examiner" : "your English conversation friend"}, ${mode === "mock-test" ? "by practicing together we will make sure you get to your goal band in the IELTS speaking test!" : "I'm here chat with you! let's practice your English conversation skills!"} Can you please tell me a bit more about yourself?`
      : `Hey There, ${getTimeOfDay()}!, I'm John Al-Shiekh ${mode === "mock-test" ? "the IELTS examiner" : "your English conversation friend"}, can you please introduce yourself?`,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [{ role: "system", content: systemPrompt }],
    },
    transcriber: { provider: "deepgram", model: "nova-3-general", language: "en" },
    voice: { provider: "11labs", voiceId: "lUTamkMw7gOzZbFIwmq4" }, // James or steve for the voiceId
  };
}

// Words or phrases that indicate the test is complete
const TEST_CONCLUSION_PHRASES = [
  "concludes our",
  "end of the test",
  "test is complete",
  "test is now complete",
  "test has ended",
  "thank you for your participation",
  "that concludes",
  "concludes our English conversation",
  "thank you, this concludes our English conversation",
];

const TEST_ONE_MINUTE_TO_PREPARE = [
  "you have one minute to prepare",
  "one minute to prepare",
  "1 minute",
  "1 minute to prepare",
];

// Modify component to use forwardRef
const FullSpeakingRecorderButton = forwardRef<
  FullSpeakingRecorderButtonRef,
  {
    user: UserProfile;
    mode?: ConversationModeType;
  }
>(({ user, mode = "mock-test" }, ref) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [showQuickTipsDialog, setShowQuickTipsDialog] = useState(false);
  const [isOneMinuteToPrepare, setIsOneMinuteToPrepare] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [isProcessingResults, setIsProcessingResults] = useState(false);

  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const windDownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const preparationStartTimeRef = useRef<number | null>(null);

  const userProfile = {
    name: user.name,
    hobbies: user.hobbies,
    gender: user.gender,
    age: user.age,
    nationality: user.nationality,
    goalBand: user.goalBand,
  };

  const router = useRouter();
  const { messages, clearTest, addMessage } = useMockTestStore();
  const { callStatus } = useGlobalVapiConversation();
  const { startSession, setVolume, endSession, triggerWindDown, windDownTriggered, callId } =
    useVapiConversation({
      onConnect: () => {
        // Set the session start time when the call actually becomes active
        sessionStartTimeRef.current = Date.now();
      },
      onMessage: message => {
        const role = message.role === "assistant" ? ("examiner" as const) : ("candidate" as const);
        const timestamp = new Date().toLocaleTimeString();
        const messageContent = { role, content: message.content, timestamp };
        addMessage(messageContent);

        // Check if this message indicates test completion
        if (role === "examiner" && isTestConclusionMessage(message.content)) {
          setIsTestCompleted(true);
          setTimeout(() => {
            vapi.stop();
          }, 5000);
        }

        // Handle one minute preparation - FIXED VERSION
        if (role === "examiner" && isOneMinuteToPrepareMessage(message.content)) {
          // Immediately mute the microphone
          vapi.setMuted(true);
          setVolume(0);

          // Store the preparation start time
          preparationStartTimeRef.current = Date.now();

          // Show the preparation dialog after a small delay
          setTimeout(() => {
            setIsOneMinuteToPrepare(true);
          }, 500);
        }
      },
      onError: error => {
        const errorMsg =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "errorMsg" in error
              ? (error as { errorMsg: string }).errorMsg
              : JSON.stringify(error);

        setErrorMessage(
          typeof error === "object" && error !== null && "errorMsg" in error
            ? (error as { errorMsg: string }).errorMsg
            : errorMsg,
        );
        console.error("Error:", errorMsg);
      },
      onWindDownTriggered: () => {
        setVolume(0);
        vapi.setMuted(true);
      },
    });

  const isConnected = callStatus === CallStatus.ACTIVE;
  const analyzeFullEnglishConversation = api.openai.analyzeFullEnglishConversation.useMutation();
  const saveSpeakingTest = api.openai.saveSpeakingTest.useMutation();
  const deductUserMinutes = api.payments.deductUserMinutes.useMutation();

  // Live minute deduction state
  const [lastDeductedMinute, setLastDeductedMinute] = useState(0);
  const lastDeductedMinuteRef = useRef(0);
  const deductionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedSecondsRef = useRef(0);

  function secondsToMinutes(seconds: number) {
    // 0:00–1:39 → 1, 1:40–2:39 → 2, etc.
    if (seconds < 100) return 1;
    return Math.ceil((seconds - 40) / 60) + 1;
  }

  // Start timer and deduct minutes in real time
  useEffect(() => {
    if (isConnected) {
      let initialElapsed = 0;
      let initialDeducted = 0;
      const saved = sessionStorage.getItem(`live-minutes-${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved) as { elapsedSeconds: number; lastDeductedMinute: number };
        initialElapsed = parsed.elapsedSeconds ?? 0;
        initialDeducted = parsed.lastDeductedMinute ?? 0;
      }
      elapsedSecondsRef.current = initialElapsed;
      setLastDeductedMinute(initialDeducted);
      lastDeductedMinuteRef.current = initialDeducted;
      deductionTimerRef.current = setInterval(() => {
        elapsedSecondsRef.current += 1;
        const minutesNow = secondsToMinutes(elapsedSecondsRef.current);
        if (minutesNow > lastDeductedMinuteRef.current) {
          deductUserMinutes.mutate({ minutes: 1, callId });
          setLastDeductedMinute(minutesNow);
          lastDeductedMinuteRef.current = minutesNow;
        }
        sessionStorage.setItem(
          `live-minutes-${user.id}`,
          JSON.stringify({
            elapsedSeconds: elapsedSecondsRef.current,
            lastDeductedMinute: lastDeductedMinuteRef.current,
          }),
        );
      }, 1000);
    }
    return () => {
      if (deductionTimerRef.current) {
        clearInterval(deductionTimerRef.current);
        deductionTimerRef.current = null;
      }
    };
  }, [isConnected, callId, user.id, deductUserMinutes]);

  // On reload or navigation, deduct all used minutes
  useEffect(() => {
    const handleUnload = () => {
      const saved = sessionStorage.getItem(`live-minutes-${user.id}`);
      let totalMinutes = 0;
      let elapsed = elapsedSecondsRef.current;
      if (saved) {
        const parsed = JSON.parse(saved) as { elapsedSeconds: number };
        elapsed = parsed.elapsedSeconds ?? elapsed;
      }
      totalMinutes = secondsToMinutes(elapsed);
      if (totalMinutes > lastDeductedMinute) {
        const toDeduct = totalMinutes - lastDeductedMinute;
        if (toDeduct > 0) {
          deductUserMinutes.mutate({ minutes: toDeduct, callId });
        }
      }
      sessionStorage.removeItem(`live-minutes-${user.id}`);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [lastDeductedMinute, callId, user.id, deductUserMinutes]);

  // Check if the message contains any test conclusion phrases
  const isTestConclusionMessage = useCallback((content: string) => {
    const lowerContent = content.toLowerCase();
    return TEST_CONCLUSION_PHRASES.some(phrase => lowerContent.includes(phrase));
  }, []);

  const isOneMinuteToPrepareMessage = useCallback((content: string) => {
    const lowerContent = content.toLowerCase();
    return TEST_ONE_MINUTE_TO_PREPARE.some(phrase => lowerContent.includes(phrase));
  }, []);

  // Process the test results
  const processTestResults = useCallback(async () => {
    if (isProcessingResults || messages.length < 3) {
      return;
    }

    setIsProcessingResults(true);

    try {
      // Check if we have any messages to analyze
      if (messages.length < 3) {
        setErrorMessage("لم يتم إكمال الاختبار بشكل صحيح");
        setIsProcessingResults(false);
        setIsTestCompleted(false);
        return;
      }

      // Get topic from examiner messages (typically from section 2)
      const topicMessage = messages.find(
        msg =>
          msg.role === "examiner" &&
          (msg.content.toLowerCase().includes("describe") ||
            msg.content.toLowerCase().includes("talk about")),
      );

      const topic = topicMessage?.content ?? "IELTS Speaking Test";

      // Use the new procedure that analyzes the full conversation
      const analysis = await analyzeFullEnglishConversation.mutateAsync({
        conversation: messages,
        mode,
        userId: user.id,
      });

      if (analysis.success && analysis.feedback) {
        // Save results to the database
        try {
          // Convert messages format for database
          const transformedMessages = messages.map(msg => ({
            role: msg.role === "examiner" ? ("examiner" as const) : ("user" as const),
            content: msg.content,
            timestamp: msg.timestamp,
          }));

          // Save to database
          const validBand =
            analysis.feedback.band && !isNaN(analysis.feedback.band) ? analysis.feedback.band : 5.0;
          const savedTest = await saveSpeakingTest.mutateAsync({
            userId: user.id,
            type: mode === "mock-test" ? "MOCK" : "PRACTICE",
            transcription: { messages: transformedMessages },
            topic: topic,
            band: validBand,
            feedback: analysis.feedback.feedback,
            callId,
          });

          // Deduct credits for the completed test
          if (savedTest.id) {
            // Navigate to dashboard with the test id
            router.push(`/dashboard/${savedTest.id}`);
          }
        } catch (dbError) {
          console.error("Error saving to database:", dbError);
          // Continue anyway to show results to user
        }

        // Clear test data
        clearTest();
      } else {
        // Set error message and prevent further processing attempts
        setErrorMessage("فشل في تحليل نتائج الاختبار");
        setIsTestCompleted(false); // Reset this flag to prevent further attempts
      }
    } catch (error) {
      console.error("Error processing test results:", error);
      setErrorMessage("حدث خطأ أثناء معالجة نتائج الاختبار");
      setIsTestCompleted(false); // Reset this flag to prevent further attempts
    } finally {
      setIsProcessingResults(false);
    }
  }, [
    messages,
    analyzeFullEnglishConversation,
    saveSpeakingTest,
    clearTest,
    router,
    user.id,
    isProcessingResults,
    mode,
    callId,
  ]);

  // Process results when test is completed
  useEffect(() => {
    if (isTestCompleted && !isProcessingResults) {
      void processTestResults();
    }
  }, [isTestCompleted, isProcessingResults, processTestResults]);

  // Conversation timer for general-english mode
  useEffect(() => {
    // Determine timing based on mode
    const isGeneralEnglish = mode === "general-english";
    const totalDuration = isGeneralEnglish
      ? GENERAL_ENGLISH_CONVERSATION_TIME
      : MOCK_TEST_CONVERSATION_TIME;
    const windDownTriggerTime = isGeneralEnglish
      ? GENERAL_ENGLISH_WIND_DOWN_TRIGGER_TIME
      : MOCK_TEST_WIND_DOWN_TRIGGER_TIME;

    if (
      (isGeneralEnglish || mode === "mock-test") &&
      callStatus === CallStatus.ACTIVE &&
      sessionStartTimeRef.current
    ) {
      const elapsed = Date.now() - sessionStartTimeRef.current;
      const windDownRemaining = windDownTriggerTime - elapsed;
      const totalRemaining = totalDuration - elapsed;

      // Set up wind-down timer
      if (windDownRemaining > 0 && !windDownTriggered) {
        windDownTimerRef.current = setTimeout(() => {
          if (callStatus === CallStatus.ACTIVE && !windDownTriggered) {
            void triggerWindDown();
          }
        }, windDownRemaining);
      }

      // Set up final timer (fallback in case wind-down doesn't work)
      if (totalRemaining > 0) {
        conversationTimerRef.current = setTimeout(() => {
          if (callStatus === CallStatus.ACTIVE) {
            setIsTestCompleted(true);
            setTimeout(() => {
              endSession();
            }, 1000);
          }
        }, totalRemaining);
      } else {
        // Already expired, end session immediately
        setIsTestCompleted(true);
        endSession();
      }
    }

    return () => {
      if (conversationTimerRef.current) {
        clearTimeout(conversationTimerRef.current);
        conversationTimerRef.current = null;
      }
      if (windDownTimerRef.current) {
        clearTimeout(windDownTimerRef.current);
        windDownTimerRef.current = null;
      }
    };
  }, [callStatus, mode, endSession, triggerWindDown, windDownTriggered]);

  const checkMicPermission = async () => {
    try {
      // First check if we've stored the permission state locally
      const storedPermission = localStorage.getItem("mic-permission-granted");
      if (storedPermission === "true") {
        // Double-check by trying to access the microphone briefly
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setHasPermission(true);
          setErrorMessage("");
          return;
        } catch {
          // If we can't access it despite stored permission, clear the stored state
          localStorage.removeItem("mic-permission-granted");
        }
      }

      // Try using the permissions API if available
      if ("permissions" in navigator) {
        try {
          const permission = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });

          if (permission.state === "granted") {
            setHasPermission(true);
            setErrorMessage("");
            localStorage.setItem("mic-permission-granted", "true");
            return;
          }

          if (permission.state === "denied") {
            setHasPermission(false);
            setErrorMessage("لا يوجد صلاحية وصول إلى الميكروفون، يرجى تفعيل الميكروفون");
            localStorage.removeItem("mic-permission-granted");
            return;
          }
        } catch (e) {
          console.error("Permissions API not fully supported, using fallback method", e);
        }
      }

      // If permission is prompt or permissions API is not available, set as not granted
      setHasPermission(false);
    } catch (error) {
      console.error("Error checking microphone permission:", error);
      // Fallback: assume permission not granted
      setHasPermission(false);
    }
  };

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setErrorMessage("");
      setShowPermissionDialog(false);

      // Store permission state for future checks
      localStorage.setItem("mic-permission-granted", "true");

      // Clean up the stream when permission is granted
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setErrorMessage("لا يوجد صلاحية وصول إلى الميكروفون، يرجى تفعيل الميكروفون");
      setShowPermissionDialog(true);

      // Clear any stored permission state since access was denied
      localStorage.removeItem("mic-permission-granted");
    }
  };

  // Handle initial permission check - FIXED VERSION
  useEffect(() => {
    if (!permissionRequested) {
      setPermissionRequested(true);
      void checkMicPermission();
    }
  }, [permissionRequested]);

  // Listen for permission changes if supported
  useEffect(() => {
    let permissionChangeListener: (() => void) | null = null;

    const setupPermissionListener = async () => {
      if ("permissions" in navigator) {
        try {
          const permission = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });

          permissionChangeListener = () => {
            if (permission.state === "granted") {
              setHasPermission(true);
              setErrorMessage("");
              localStorage.setItem("mic-permission-granted", "true");
            } else if (permission.state === "denied") {
              setHasPermission(false);
              localStorage.removeItem("mic-permission-granted");
            }
          };

          permission.addEventListener("change", permissionChangeListener);
        } catch (error) {
          console.error("Permission change listener not supported", error);
        }
      }
    };

    void setupPermissionListener();

    return () => {
      if (permissionChangeListener && "permissions" in navigator) {
        navigator.permissions
          .query({
            name: "microphone" as PermissionName,
          })
          .then(permission => {
            permission.removeEventListener("change", permissionChangeListener!);
          })
          .catch(() => {
            // Ignore cleanup errors
          });
      }
    };
  }, []);

  const handleStartConversation = async () => {
    if (!hasPermission) {
      // Before showing dialog, try one more time to check permission
      await checkMicPermission();
      if (!hasPermission) {
        setShowPermissionDialog(true);
        return;
      }
    }

    try {
      setErrorMessage("");
      setIsTestCompleted(false);
      clearTest();

      await startSession(IeltsAssistantConfig({ userProfile, mode }), {
        name: "John Al-Shiekh",
        silenceTimeoutSeconds: 100, // Allow 1.66 minutes of silence,
        maxDurationSeconds:
          mode === "mock-test"
            ? MOCK_TEST_CONVERSATION_TIME / 1000 // 10 minutes for mock-test mode
            : GENERAL_ENGLISH_CONVERSATION_TIME / 1000, // 5 minutes for general-english mode
        endCallMessage:
          mode === "general-english"
            ? "Thank you for our conversation! I hope you enjoyed practicing your English with me. Have a great day!"
            : `Thanks for the conversation ${userProfile.name}! I hope you enjoyed practicing your English with me today.`,
        messagePlan: {
          idleMessages: [
            "I'm here whenever you're ready to continue.",
            "Are you still there?",
            "May I remind we have limited time! Please speak up!",
            "Can you please continue speaking?",
            "I'm still waiting for you to speak!",
          ],
          idleTimeoutSeconds: 60,
          silenceTimeoutMessage: "As there is no response, I am ending the call now.",
          idleMessageResetCountOnUserSpeechEnabled: true,
        },
        startSpeakingPlan: {
          waitSeconds: 3,
          smartEndpointingPlan: {
            provider: "livekit",
          },
        },
        backgroundSpeechDenoisingPlan: {
          smartDenoisingPlan: {
            enabled: true,
          },
        },
      });
    } catch (error) {
      setErrorMessage(typeof error === "string" ? error : (error as Error).message);
      console.error("Error starting conversation:", error);
    }
  };

  // Expose methods to parent component through ref
  useImperativeHandle(ref, () => ({
    stopTest: () => {
      if (isConnected) {
        setIsTestCompleted(true);
        // Add a small delay before ending the session
        setTimeout(() => {
          endSession();
        }, 1000);
      }
    },
    getSessionStartTime: () => sessionStartTimeRef.current,
    startConversation: () => {
      setShowQuickTipsDialog(true);
    },
  }));

  return (
    <>
      {isProcessingResults && (
        <AlertDialog open={isProcessingResults}>
          <AlertDialogContent onEscapeKeyDown={e => e.preventDefault()}>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center">جاري معالجة النتائج</AlertDialogTitle>
              <AlertDialogDescription asChild className="text-center">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="animate-spin rounded-full size-11" />
                  <p className="text-sm text-gray-600">
                    يرجى الانتظار بينما نقوم بتحليل محادثتك وإعداد النتائج...
                  </p>
                  <small className="text-gray-500">
                    سيتم تحويلك بعدها لعرض نتيجتك .. شكراً لإنتظارك 😊
                  </small>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isOneMinuteToPrepare && (
        <AlertDialog open={isOneMinuteToPrepare} onOpenChange={setIsOneMinuteToPrepare}>
          <AlertDialogContent onEscapeKeyDown={e => e.preventDefault()}>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center">دقيقة واحدة للتحضير</AlertDialogTitle>
              <AlertDialogDescription asChild className="text-right">
                <div key="one-minute-preparation-dialog">
                  <p className="text-sm text-green-600 font-bold">
                    لديك دقيقة واحدة للتحضير الرجاء ترك هذه النافذة مفتوحة حتى ينتهي الوقت وكتابة
                    ملاحظاتك عن الموضوع
                  </p>
                  <Timer
                    isRunning={true}
                    onTimeUp={() => {
                      // Automatically unmute when timer reaches 0
                      setVolume(1);
                      vapi.setMuted(false);
                      setIsOneMinuteToPrepare(false);
                      preparationStartTimeRef.current = null;
                    }}
                    startTime={preparationStartTimeRef.current} // Use the stored start time
                    duration={MINUTES_IN_MS}
                    mode="preparation"
                    isMuted={true}
                    isConnected={true}
                    isPreparationMode={true} // Add this new prop
                    windDownTriggered={windDownTriggered}
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={true} // Disable cancel during preparation
                className="w-full opacity-50 cursor-not-allowed"
              >
                إلغاء
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Card className="w-full max-w-md mx-auto shadow-none border-none">
        {/* Maybe remove this from the UI in the future and send errorMessage to Posthog */}
        {errorMessage && (
          <CardHeader className="py-0 text-center">
            {/* <CardTitle>{<p className="text-red-500 my-2 text-sm">{errorMessage}</p>}</CardTitle> */}
            <CardTitle>
              {<p className="text-red-500 my-2 text-sm">{"عفواً حدث خطأ تقني!"}</p>}
            </CardTitle>
          </CardHeader>
        )}

        <ConfirmationDialog
          open={showQuickTipsDialog}
          onOpenChange={setShowQuickTipsDialog}
          title="نصيحة سريعة"
          description={
            <ul className="text-justify list-decimal leading-7">
              <li className="text-gray-500">
                ستتحدث مع صديقك <strong>{env.NEXT_PUBLIC_APP_NAME}</strong> لمدة
                <strong className="text-green-600 mx-1">
                  {mode === "mock-test"
                    ? MOCK_TEST_CONVERSATION_TIME / 1000 / 60
                    : GENERAL_ENGLISH_CONVERSATION_TIME / 1000 / 60}
                </strong>
                دقائق
              </li>
              <li className="text-purple-500 font-bold">
                إجعل إجابتك واضحة ومنظمة في محور السؤال باللغة الإنجليزية
              </li>
              <li className="text-red-400 font-bold text-sm">
                تحدث بصوت واضح وفي مكان قليل الضوضاء
              </li>
              <li className="text-green-600 dark:text-green-400">
                في نهاية الوقت سيقوم <strong>{env.NEXT_PUBLIC_APP_NAME}</strong> بإنهاء المحادثة
                وإعطائك تقييم على مستوى المحادثة لديك
              </li>
            </ul>
          }
          buttonText="مـوافق"
          buttonClass="bg-green-600 hover:bg-green-700"
          onConfirm={() => {
            setShowQuickTipsDialog(false);
            void handleStartConversation();
          }}
        />

        <ConfirmationDialog
          open={showPermissionDialog}
          onOpenChange={setShowPermissionDialog}
          title="الميكروفون مطلوب"
          description={
            <div className="flex flex-col text-right">
              <p>
                <strong>يرجى السماح بوصول الميكروفون لاستخدام المحادثة بالصوت</strong>
              </p>
              <Link
                href="https://support.google.com/chrome/answer/2693767?hl=en-GB"
                target="_blank"
              >
                <Button variant="link" className="px-0">
                  <ExternalLink className="size-4" />
                  كيف أسمح بوصول الميكروفون للمحادثة بالصوت؟
                </Button>
              </Link>
            </div>
          }
          buttonText="السماح بوصول الميكروفون"
          buttonClass="bg-yellow-600 hover:bg-yellow-700"
          onConfirm={requestMicPermission}
        />
      </Card>
    </>
  );
});

FullSpeakingRecorderButton.displayName = "FullSpeakingRecorderButton";

export default FullSpeakingRecorderButton;
