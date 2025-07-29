import { useCallback, useEffect, useState } from "react";
import { vapi } from "@/lib/vapi.sdk";
import type {
  AssistantOverrides as BaseAssistantOverrides,
  CreateAssistantDTO as BaseCreateAssistantDTO,
} from "@vapi-ai/web/dist/api";

// Create our own modified types where clientMessages and serverMessages are optional
export type CreateAssistantDTO = Omit<
  BaseCreateAssistantDTO,
  "clientMessages" | "serverMessages"
> & {
  clientMessages?: BaseCreateAssistantDTO["clientMessages"];
  serverMessages?: BaseCreateAssistantDTO["serverMessages"];
};

export type AssistantOverrides = Omit<
  BaseAssistantOverrides,
  "clientMessages" | "serverMessages"
> & {
  clientMessages?: BaseAssistantOverrides["clientMessages"];
  serverMessages?: BaseAssistantOverrides["serverMessages"];
};

export type VapiError = {
  errorMsg: string;
  error: {
    details: undefined;
    msg: string;
    type: string;
  };
  callClientId: string;
  action: "error";
};

export enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  CONNECTING_PROGRESS = "CONNECTING_PROGRESS",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  FAILED = "FAILED",
}

type SavedMessage = {
  role: "user" | "system" | "assistant";
  content: string;
};

type UseVapiConversationProps = {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: SavedMessage) => void;
  onError?: (error: VapiError) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onWindDownTriggered?: () => void;
  onCallStartProgress?: () => void;
  onCallStartSuccess?: () => void;
  onCallStartFailed?: () => void;
};

export function useVapiConversation({
  onConnect,
  onDisconnect,
  onMessage,
  onError,
  onSpeechStart,
  onSpeechEnd,
  onWindDownTriggered,
  onCallStartProgress,
  onCallStartSuccess,
  onCallStartFailed,
}: UseVapiConversationProps = {}) {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [windDownTriggered, setWindDownTriggered] = useState(false);
  const [callId, setCallId] = useState<string>();

  useEffect(() => {
    const handleCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      setWindDownTriggered(false);
      onConnect?.();
    };

    const handleCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      setWindDownTriggered(false);
      onDisconnect?.();
    };

    const handleCallStartProgress = () => {
      setCallStatus(CallStatus.CONNECTING_PROGRESS);
      onCallStartProgress?.();
    };

    const handleCallStartSuccess = () => {
      setCallStatus(CallStatus.ACTIVE);
      setWindDownTriggered(false);
      onCallStartSuccess?.();
      onConnect?.();
    };

    const handleCallStartFailed = () => {
      setCallStatus(CallStatus.FAILED);
      onCallStartFailed?.();
    };

    const handleMessage = (message: {
      type: string;
      transcriptType: string;
      transcript: string;
      role: SavedMessage["role"];
    }) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        onMessage?.({
          role: message.role,
          content: message.transcript,
        });
      }
    };

    const handleSpeechStart = () => {
      setIsSpeaking(true);
      onSpeechStart?.();
    };

    const handleSpeechEnd = () => {
      setIsSpeaking(false);
      onSpeechEnd?.();
    };

    const handleError = (error: VapiError) => {
      console.error("VAPI Error:", error);
      onError?.(error);
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("call-start-progress", handleCallStartProgress);
    vapi.on("call-start-success", handleCallStartSuccess);
    vapi.on("call-start-failed", handleCallStartFailed);
    vapi.on("message", handleMessage);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("error", handleError);

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("call-start-progress", handleCallStartProgress);
      vapi.off("call-start-success", handleCallStartSuccess);
      vapi.off("call-start-failed", handleCallStartFailed);
      vapi.off("message", handleMessage);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("error", handleError);
    };
  }, [
    onConnect,
    onDisconnect,
    onMessage,
    onError,
    onSpeechStart,
    onSpeechEnd,
    onCallStartProgress,
    onCallStartSuccess,
    onCallStartFailed,
  ]);

  const startSession = useCallback(
    async (config: CreateAssistantDTO, assistantOverrides: AssistantOverrides) => {
      try {
        setCallStatus(CallStatus.CONNECTING);
        setWindDownTriggered(false);

        // Cast our modified types back to the original types expected by the vapi SDK
        const fullConfig: BaseCreateAssistantDTO = {
          ...config,
          clientMessages: config.clientMessages!,
          serverMessages: config.serverMessages!,
        };

        const fullOverrides: BaseAssistantOverrides = {
          ...assistantOverrides,
          clientMessages: assistantOverrides.clientMessages!,
          serverMessages: assistantOverrides.serverMessages!,
        };

        const result = await vapi.start(fullConfig, fullOverrides);
        // The call ID should be available in the result or through vapi.getCallId()
        if (result && typeof result === "object" && "id" in result) {
          setCallId(result.id);
        }
      } catch (error) {
        setCallStatus(CallStatus.FAILED);
        throw error;
      }
    },
    [],
  );

  const endSession = useCallback(() => {
    vapi.stop();
    setCallStatus(CallStatus.FINISHED);
    setWindDownTriggered(false);
  }, []);

  const setVolume = useCallback((volume: number) => {
    vapi.setMuted(!volume);
    setIsMuted(!volume);
  }, []);

  const triggerWindDown = useCallback(async () => {
    if (windDownTriggered || callStatus !== CallStatus.ACTIVE) {
      return;
    }

    try {
      setWindDownTriggered(true);
      onWindDownTriggered?.();
      vapi.setMuted(true);
      setIsMuted(true);

      // Send a message to the assistant to start winding down
      vapi.send({
        type: "add-message",
        message: {
          role: "system",
          content:
            "We're approaching the end of our conversation time. Please start wrapping up naturally by providing a brief summary of what we discussed and prepare to conclude the conversation gracefully within the next 30 seconds. End with the exact phrase: 'That concludes our English conversation. Thank you for your participation.'",
        },
      });

      // Set a fallback timer to force end the conversation if the assistant doesn't conclude naturally
      setTimeout(() => {
        if (callStatus === CallStatus.ACTIVE) {
          endSession();
        }
      }, 45000); // 45 seconds fallback
    } catch (error) {
      console.error("Error triggering wind down:", error);
      // Fallback to immediate end if message sending fails
      setTimeout(() => {
        if (callStatus === CallStatus.ACTIVE) {
          endSession();
        }
      }, 5000);
    }
  }, [windDownTriggered, callStatus, onWindDownTriggered, endSession]);

  return {
    callStatus,
    isSpeaking,
    isMuted,
    windDownTriggered,
    callId,
    startSession,
    endSession,
    setVolume,
    triggerWindDown,
  };
}
