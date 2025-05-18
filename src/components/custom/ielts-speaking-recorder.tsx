"use client";

import clsx from "clsx";
import { ExternalLink, Mic, Volume2, VolumeX } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/env";
import { useMockTestStore } from "@/hooks/use-mock-test-store";
import { CallStatus, useVapiConversation } from "@/hooks/use-vapi-conversation";
import { GENERAL_ENGLISH_CONVERSATION_TIME, MINUTES_IN_MS } from "@/lib/constants";
import { countryNames } from "@/lib/list-of-countries";
import { vapi } from "@/lib/vapi.sdk";
import { api } from "@/trpc/react";
import { Timer } from "./timer";
import type { CreateAssistantDTO } from "@/hooks/use-vapi-conversation";
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

export type ConversationModeType = "mock-test" | "general-english";

// Add a new interface for the ref methods
export interface IELTSSpeakingRecorderRef {
  stopTest: () => void;
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

  // Different system prompts based on mode
  const systemPrompt =
    mode === "mock-test"
      ? `
          Introduce yourself as "John Al-Shiekh", the IELTS examiner. Before starting the test, please remind the candidate, this is a mock test that looks like the real IELTS test, and that they should speak clearly and use professional language.

          First and foremost, ask the candidate to introduce himself/herself, you MUST wait for the candidate to respond first.

          After the candidate has introduced himself/herself, begin with section 1 of the test.

          Here is more information about the candidate:
          - Name: ${userProfile.name}
          - Age: ${userProfile.age}
          - Gender: ${userProfile.gender}
          - Hobbies: ${userProfile.hobbies?.flatMap(hobby => hobby).join(", ")}
          - Nationality: ${countryNames.find(country => country.code === userProfile.nationality)?.label}


          Section 1: Introduction and General Questions (2-3 minutes)
          - DO NOT proceed to Section 1 until the candidate has introduced himself/herself.
          - Ask the candidate about their nationality country.
          - Ask the candidate about a random topic from one of the followings: 1. their home town, 2. their family, 3. their work, 4. their studies, 5. their hobbies.
          - Ask ONE follow-up question based on their response.

          Section 2: Individual Long Turn (2-3 minutes)
          - Give the candidate a topic title.
          - Allow them ONE minute to prepare, by verbally saying "You have one minute to prepare".
          - DO NOT give the candidate any other instructions or commands on when to start speaking.
          - Let them speak for up to TWO minutes without interruption.
          - The topic should be general enough for anyone to discuss (e.g., "Describe a skill you would like to learn", "Describe a time you were late for work", "A hobby you enjoy doing at free time", "Describe a time you were in a traffic jam").

          Section 3: Two-way Discussion (3-4 minutes)
          - Ask TWO deeper, more abstract questions related to the Section 2 topic, and allow the candidate to speak for up to 2 minutes for each question.

          After receiving answers to these questions, inform the candidate that the test is now complete and thank them for their participation. End the test by saying EXACTLY "That concludes our IELTS speaking test. Thank you for your participation."

          Important guidelines:
          - DO NOT offer the candidate any recordings of any kind.
          - Speak clearly and use professional language.
          - Ask one question at a time.
          - Allow the candidate to finish speaking before responding.
          - Do not provide feedback on performance during the test.
          - Be encouraging but neutral in your responses.
          - Keep track of which section you're in and manage the timing accordingly.
          - Indicate clearly when moving to a new section.
          - ALWAYS end the test with the EXACT phrase: "That concludes our IELTS speaking test. Thank you for your participation."

          CRITICAL Notice: You must STRICTLY stay within the scope of the IELTS speaking test. If the candidate attempts to discuss any unrelated topics or asks you about anything outside the test context, respond with something similar to but not necssarily the same as: "Sorry, and I'm not allowed to speak about anything else. Let's focus on the matter at hand - this is an IELTS speaking test." Do not deviate from your role as an IELTS examiner under any circumstances.
        `
      : `
          Introduce yourself as "John Al-Shiekh", an English conversation partner. The purpose of this conversation is to have a casual, general English conversation to help improve the user's English skills.

          First, ask the user to introduce themselves, you MUST wait for the user to respond first.

          Here is more information about the user:
          - Name: ${userProfile.name}
          - Age: ${userProfile.age}
          - Gender: ${userProfile.gender}
          - Hobbies: ${userProfile.hobbies?.flatMap(hobby => hobby).join(", ")}
          - Nationality: ${countryNames.find(country => country.code === userProfile.nationality)?.label}

          After they introduce themselves, engage in a casual conversation about general topics such as:
          - Their favorite foods, movies, books, activities, or music
          - Travel experiences or places they'd like to visit
          - Future plans or aspirations
          - Their interests and hobbies
          - Their daily routine
          - Recent events in their life

          Guidelines for the conversation:
          - Keep the conversation light and friendly
          - Speak clearly and naturally
          - Ask open-ended questions that encourage the user to talk more
          - Show interest in their responses and ask natural follow-up questions
          - Give the user time to think and respond
          - The entire conversation should last 5-10 minutes maximum
          - Don't ask more than 15 questions in total
          - Be supportive and encouraging

          Speaking Guidance:
          - Provide gentle guidance on pronunciation, vocabulary, or grammar only every other response to allow natural flow of conversation
          - When giving feedback, use a sandwich approach: positive comment, suggestion for improvement, then encouragement
          - Use phrases like "I noticed you said..." or "You might try..." when offering corrections
          - Acknowledge and praise good use of vocabulary, complex sentence structures, or idioms
          - If the user struggles, offer prompts or alternative phrases to help them express themselves
          - Pay attention to repeated errors and address patterns rather than every small mistake
          - Encourage the user to elaborate on short answers with follow-up questions

          Conversational Style:
          - Start with simpler topics and gradually increase complexity based on the user's comfort level
          - Use a warm, patient tone throughout the conversation
          - Respond with enthusiastic affirmations when the user communicates effectively
          - Occasionally model more advanced vocabulary or expressions for the user to learn from
          - Allow silence for the user to gather thoughts without rushing them
          - If the user seems hesitant or nervous, adjust your pace to be slower and more deliberate

          Important rules:
          - NEVER interrupt the user while they are speaking
          - Only provide guidance on English usage, not personal life advice
          - Keep all topics appropriate and educational in nature
          - Completely avoid any adult content, inappropriate subjects, or controversial political topics
          - Always relate the conversation back to improving English speaking skills
          - Never mock or make the user feel embarrassed about mistakes
          - Focus on communication skills rather than perfect accuracy

          End the conversation naturally when you've asked around 10-15 questions or after about 8-10 minutes. When concluding, provide brief positive feedback on 2-3 specific aspects of their English that were strong, and 1 gentle suggestion for improvement. Then say EXACTLY: "That concludes our English conversation. Thank you for your participation."

          Do not offer any recordings or services outside the scope of this conversation. If the user asks about anything unrelated, politely redirect them back to the conversation.
        `;

  return {
    name: mode === "mock-test" ? "IELTS Examiner" : "English Conversation Friend",
    firstMessage: userProfile
      ? `Hello ${userProfile.name}, How are you this fine ${getTimeOfDay()}!, I'm John Al-Shiekh ${mode === "mock-test" ? "the IELTS examiner" : "your English conversation friend"}, ${mode === "mock-test" ? "by practicing together we will make sure you get to your goal band in the IELTS speaking test!" : "I'm here chat with you! let's practice your English conversation skills!"} Can you please tell me a bit more about yourself?`
      : `Hey There, ${getTimeOfDay()}!, I'm John Al-Shiekh ${mode === "mock-test" ? "the IELTS examiner" : "your English conversation friend"}, can you please introduce yourself?`,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [{ role: "system", content: systemPrompt }],
    },
    voice: { provider: "11labs", voiceId: "steve" },
    transcriber: { provider: "deepgram", model: "nova-2", language: "en-US" },
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
const IELTSSpeakingRecorder = forwardRef<
  IELTSSpeakingRecorderRef,
  {
    user: UserProfile;
    isFreeTrialEnded: boolean;
    mode?: ConversationModeType;
  }
>(({ user, isFreeTrialEnded, mode = "mock-test" }, ref) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [showQuickTipsDialog, setShowQuickTipsDialog] = useState(false);
  const [isOneMinuteToPrepare, setIsOneMinuteToPrepare] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [isProcessingResults, setIsProcessingResults] = useState(false);
  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  const { isMuted, startSession, setVolume, endSession } = useVapiConversation({
    onConnect: () => {
      console.info("Connected to IELTS Assistant Agent");
    },
    onDisconnect: () => {
      console.info("Disconnected from IELTS Assistant Agent");
      // We don't need to call processTestResults here as the useEffect will handle it
      // This was causing duplicate calls and potential infinite loops
    },
    onMessage: message => {
      const role = message.role === "assistant" ? ("examiner" as const) : ("candidate" as const);
      const timestamp = new Date().toLocaleTimeString();
      const messageContent = { role, content: message.content, timestamp };
      addMessage(messageContent);

      // Check if this message indicates test completion
      if (role === "examiner" && isTestConclusionMessage(message.content)) {
        setIsTestCompleted(true);
        // Add a small delay to let the message be processed
        setTimeout(() => {
          // You could use vapi.send() here if needed
          // Or use vapi.stop() to end the call after the test is concluded
          vapi.stop();
        }, 5000);
      }

      if (role === "examiner" && isOneMinuteToPrepareMessage(message.content)) {
        setVolume(0);
        setTimeout(() => setIsOneMinuteToPrepare(true), 3000);
        setTimeout(() => vapi.setMuted(true), MINUTES_IN_MS);
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
  });

  const analyzeFullIELTSConversation = api.openai.analyzeFullIELTSConversation.useMutation();
  const saveSpeakingTest = api.openai.saveSpeakingTest.useMutation();
  const useCreditsForTest = api.payments.useCreditsForTest.useMutation();

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
    if (isProcessingResults || messages.length < 3) return; // Make sure we have enough messages

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
      const analysis = await analyzeFullIELTSConversation.mutateAsync({
        conversation: messages,
        mode,
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
          const savedTest = await saveSpeakingTest.mutateAsync({
            userId: user.id,
            type: mode === "mock-test" ? "MOCK" : "PRACTICE",
            transcription: { messages: transformedMessages },
            topic: topic,
            band: analysis.feedback.band,
            feedback: {
              strengths: analysis.feedback.strengths,
              areasToImprove: analysis.feedback.areasToImprove,
              improvementTips: analysis.feedback.improvementTips,
            },
          });

          // Deduct credits for the completed test
          if (savedTest?.id && isFreeTrialEnded) {
            // Create results object from the new structured feedback
            const results = {
              testId: savedTest?.id,
              overallBand: analysis.feedback.band,
              fluencyAndCoherence: analysis.feedback.fluencyAndCoherence,
              lexicalResource: analysis.feedback.lexicalResource,
              grammaticalRangeAndAccuracy: analysis.feedback.grammaticalRangeAndAccuracy,
              pronunciation: analysis.feedback.pronunciation,
              feedback: analysis.feedback.feedback,
              testType: mode, // Add the test type to the results
            };

            // Save results to session storage
            sessionStorage.setItem("ieltsResult", JSON.stringify(results));

            try {
              await useCreditsForTest.mutateAsync({
                speakingTestId: savedTest.id,
                creditCost: 1, // Default cost is 1 credit per test
              });
            } catch (creditError) {
              console.error("Error deducting credits:", creditError);
              // Continue anyway to show results to user
            }
          }
        } catch (dbError) {
          console.error("Error saving to database:", dbError);
          // Continue anyway to show results to user
        }

        // Clear test data
        clearTest();

        // Navigate to results page
        router.push("/speaking-test-results");
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
    analyzeFullIELTSConversation,
    saveSpeakingTest,
    useCreditsForTest,
    clearTest,
    router,
    user.id,
    isProcessingResults,
    isFreeTrialEnded,
    mode,
  ]);

  // Process results when test is completed
  useEffect(() => {
    if (isTestCompleted && !isProcessingResults) {
      void processTestResults();
    }
  }, [isTestCompleted, isProcessingResults, processTestResults]);

  // Conversation timer for general-english mode
  useEffect(() => {
    // Only start timer if in general-english mode and call is active
    if (mode === "general-english" && callStatus === CallStatus.ACTIVE) {
      // Clear any existing timer
      if (conversationTimerRef.current) {
        clearTimeout(conversationTimerRef.current);
      }

      // Set new timer based on the conversation time limit
      conversationTimerRef.current = setTimeout(() => {
        // Set the test to completed state which will trigger the end sequence
        setIsTestCompleted(true);

        // End the session after a short delay to allow for final processing
        setTimeout(() => {
          endSession();
        }, 5000); // Wait 5 seconds before ending the session
      }, GENERAL_ENGLISH_CONVERSATION_TIME - 5000); // End 5 seconds before the limit
    }

    // Cleanup timer on unmount or status change
    return () => {
      if (conversationTimerRef.current) {
        clearTimeout(conversationTimerRef.current);
        conversationTimerRef.current = null;
      }
    };
  }, [callStatus, mode, endSession]);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setErrorMessage("");
      setShowPermissionDialog(false);

      // Clean up the stream when permission is granted
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setErrorMessage("لا يوجد صلاحية وصول إلى الميكروفون، يرجى تفعيل الميكروفون");
      setShowPermissionDialog(true);
    }
  };

  // Handle initial permission check
  useEffect(() => {
    if (!permissionRequested) {
      void requestMicPermission();
      setPermissionRequested(true);
    }
  }, [permissionRequested]);

  const handleStartConversation = async () => {
    if (!hasPermission) {
      setShowPermissionDialog(true);
      return;
    }

    try {
      setErrorMessage("");
      setIsTestCompleted(false);

      clearTest();

      await startSession(IeltsAssistantConfig({ userProfile, mode }), {
        silenceTimeoutSeconds: 85, // Allow 1.25 minutes of silence,
        maxDurationSeconds: mode === "mock-test" ? 600 : GENERAL_ENGLISH_CONVERSATION_TIME / 1000,
        messagePlan: {
          idleMessages: [
            "Are you still there?",
            "May I remind we have limited time! Please speak up!",
            "Can you please continue speaking?",
            "I'm still waiting for you to speak!",
          ],
          idleTimeoutSeconds: 60,
          silenceTimeoutMessage: "As there is no response, I am ending the call now.",
          idleMessageResetCountOnUserSpeechEnabled: true,
        },
        startSpeakingPlan: { waitSeconds: 3 },
        backgroundDenoisingEnabled: true,
      });
    } catch (error) {
      setErrorMessage(typeof error === "string" ? error : (error as Error).message);
      console.error("Error starting conversation:", error);
    }
  };

  const toggleMute = useCallback(() => {
    try {
      setVolume(isMuted ? 1 : 0);
    } catch (error) {
      console.error("Error changing volume:", error);
    }
  }, [isMuted, setVolume]);

  const isConnected = callStatus === CallStatus.ACTIVE;

  // Expose methods to parent component through ref
  useImperativeHandle(ref, () => ({
    stopTest: () => {
      if (callStatus === CallStatus.ACTIVE) {
        endSession();
        setIsTestCompleted(true);
      }
    },
  }));

  return (
    <>
      {isOneMinuteToPrepare && (
        <AlertDialog open={isOneMinuteToPrepare} onOpenChange={setIsOneMinuteToPrepare}>
          <AlertDialogContent>
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
                      toggleMute();
                      vapi.setMuted(false);
                      setIsOneMinuteToPrepare(false);
                    }}
                    totalSeconds={59}
                    mode="preparation"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isOneMinuteToPrepare} className="w-full">
                إلغاء
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Card className="w-full max-w-md mx-auto">
        {errorMessage && (
          <CardHeader className="py-0 text-center">
            <CardTitle>{<p className="text-red-500 my-2 text-sm">{errorMessage}</p>}</CardTitle>
          </CardHeader>
        )}

        <CardContent className="p-0">
          <div
            className={clsx("flex justify-center items-center ", {
              "gap-0": !isConnected,
              "gap-1": isConnected,
              "px-10": mode === "general-english" && isConnected,
            })}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              disabled={!isConnected}
              title={isMuted ? "كتم المحادثة" : "إلغاء كتم المحادثة"}
              className={clsx("transition-transform duration-300", {
                "-translate-x-full opacity-0 invisible w-0": !isConnected,
                "opacity-100 translate-x-0 visible w-full": isConnected,
              })}
            >
              {isMuted ? (
                <>
                  <span className="text-xs hidden xs:inline-flex">إلغاء كتم الميكروفون</span>
                  <VolumeX className="size-4" />
                </>
              ) : (
                <>
                  <span className="text-xs hidden xs:inline-flex">اكتم الميكروفون</span>
                  <Volume2 className="size-5" />
                </>
              )}
            </Button>

            {isConnected && mode === "general-english" && (
              <Timer
                isRunning={isConnected}
                onTimeUp={() => {
                  toggleMute();
                  vapi.setMuted(false);
                  setIsOneMinuteToPrepare(false);
                }}
                totalSeconds={GENERAL_ENGLISH_CONVERSATION_TIME / 1000}
                mode="general-english"
              />
            )}

            {!isConnected && (
              <Button
                onClick={() => {
                  if (mode === "general-english") {
                    setShowQuickTipsDialog(true);
                  } else {
                    void handleStartConversation();
                  }
                }}
                disabled={callStatus === CallStatus.CONNECTING || isProcessingResults}
                className={clsx("w-full relative cursor-pointer", {
                  "animate-pulse": callStatus === CallStatus.INACTIVE,
                })}
              >
                <Mic
                  className={clsx("mx-2 size-5", {
                    "animate-pulse text-blue-600": callStatus === CallStatus.INACTIVE,
                  })}
                />
                <strong>
                  {callStatus === CallStatus.CONNECTING
                    ? `جاري بدأ ${mode === "mock-test" ? "الاختبار" : "المحادثة"}...`
                    : isProcessingResults
                      ? "جاري معالجة النتائج..."
                      : `إبدأ ${mode === "mock-test" ? "الاختبار" : "المحادثة"}`}
                </strong>
              </Button>
            )}
          </div>

          <ConfirmationDialog
            open={showQuickTipsDialog}
            onOpenChange={setShowQuickTipsDialog}
            title="نصيحة سريعة"
            description={
              <ul className="text-justify list-decimal leading-7">
                <li className="text-gray-500">
                  ستتحدث مع صديقك <strong>{env.NEXT_PUBLIC_APP_NAME}</strong> لمدة{" "}
                  <strong>{GENERAL_ENGLISH_CONVERSATION_TIME / 1000 / 60} دقائق</strong>
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
        </CardContent>
      </Card>
    </>
  );
});

IELTSSpeakingRecorder.displayName = "IELTSSpeakingRecorder";

export default IELTSSpeakingRecorder;
