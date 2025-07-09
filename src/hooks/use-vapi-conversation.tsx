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
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
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
};

export function useVapiConversation({
  onConnect,
  onDisconnect,
  onMessage,
  onError,
  onSpeechStart,
  onSpeechEnd,
  onWindDownTriggered,
}: UseVapiConversationProps = {}) {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [windDownTriggered, setWindDownTriggered] = useState(false);

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
    vapi.on("message", handleMessage);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("error", handleError);

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("message", handleMessage);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("error", handleError);
    };
  }, [onConnect, onDisconnect, onMessage, onError, onSpeechStart, onSpeechEnd]);

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

        await vapi.start(fullConfig, fullOverrides);
      } catch (error) {
        setCallStatus(CallStatus.INACTIVE);
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
    startSession,
    endSession,
    setVolume,
    triggerWindDown,
  };
}
