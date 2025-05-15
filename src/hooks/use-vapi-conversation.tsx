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
};

export function useVapiConversation({
  onConnect,
  onDisconnect,
  onMessage,
  onError,
  onSpeechStart,
  onSpeechEnd,
}: UseVapiConversationProps = {}) {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const handleCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      onConnect?.();
    };

    const handleCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
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
  }, []);

  const setVolume = useCallback((volume: number) => {
    vapi.setMuted(!volume);
    setIsMuted(!volume);
  }, []);

  return {
    callStatus,
    isSpeaking,
    isMuted,
    startSession,
    endSession,
    setVolume,
  };
}
