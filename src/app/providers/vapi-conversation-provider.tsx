"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CallStatus } from "@/hooks/use-vapi-conversation";
import { vapi } from "@/lib/vapi.sdk";

// Create a context with default values
type VapiConversationContextType = {
  callStatus: CallStatus;
  isSpeaking: boolean;
};

const VapiConversationContext = createContext<VapiConversationContextType>({
  callStatus: CallStatus.INACTIVE,
  isSpeaking: false,
});

// Provider component
export function VapiConversationProvider({ children }: { children: React.ReactNode }) {
  // Initialize state
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Set up global event listeners
  useEffect(() => {
    const handleCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const handleCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const handleCallStartProgress = () => {
      setCallStatus(CallStatus.CONNECTING_PROGRESS);
    };

    const handleCallStartSuccess = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const handleCallStartFailed = () => {
      setCallStatus(CallStatus.FAILED);
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
    vapi.on("call-start-progress", handleCallStartProgress);
    vapi.on("call-start-success", handleCallStartSuccess);
    vapi.on("call-start-failed", handleCallStartFailed);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);

    // Clean up on unmount
    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("call-start-progress", handleCallStartProgress);
      vapi.off("call-start-success", handleCallStartSuccess);
      vapi.off("call-start-failed", handleCallStartFailed);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
    };
  }, []);

  // Create the value object that will be provided to consumers
  const value = {
    callStatus,
    isSpeaking,
  };

  return (
    <VapiConversationContext.Provider value={value}>{children}</VapiConversationContext.Provider>
  );
}

// Custom hook to use the VAPI conversation context
export function useGlobalVapiConversation() {
  const context = useContext(VapiConversationContext);
  if (context === undefined) {
    throw new Error("useGlobalVapiConversation must be used within a VapiConversationProvider");
  }
  return context;
}
