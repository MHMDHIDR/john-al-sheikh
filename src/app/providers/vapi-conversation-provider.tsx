"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CallStatus } from "@/hooks/use-vapi-conversation";
import { vapi } from "@/lib/vapi.sdk";

// Create a context with default values
type VapiConversationContextType = {
  callStatus: CallStatus;
  isSpeaking: boolean;
  isMuted: boolean;
};

const VapiConversationContext = createContext<VapiConversationContextType>({
  callStatus: CallStatus.INACTIVE,
  isSpeaking: false,
  isMuted: false,
});

// Provider component
export function VapiConversationProvider({ children }: { children: React.ReactNode }) {
  // Initialize state
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Set up global event listeners
  useEffect(() => {
    const handleCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const handleCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const handleSpeechStart = () => {
      setIsSpeaking(true);
    };

    const handleSpeechEnd = () => {
      setIsSpeaking(false);
    };

    // Register event listeners
    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);

    // Clean up on unmount
    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
    };
  }, []);

  // Create the value object that will be provided to consumers
  const value = {
    callStatus,
    isSpeaking,
    isMuted,
  };

  return (
    <VapiConversationContext.Provider value={value}>{children}</VapiConversationContext.Provider>
  );
}

// Hook for consuming components
export function useGlobalVapiConversation() {
  const context = useContext(VapiConversationContext);
  if (context === undefined) {
    throw new Error("useGlobalVapiConversation must be used within a VapiConversationProvider");
  }
  return context;
}
