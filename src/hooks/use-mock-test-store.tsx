import React, { createContext, useContext, useEffect, useState } from "react";

export type MockTestMessage = {
  role: "examiner" | "candidate";
  content: string;
  timestamp: string;
  audioUrl?: string; // For examiner's TTS audio
};

export type MockTestState = {
  messages: MockTestMessage[];
  currentSection: "intro" | "topic" | "followup" | "complete";
  selectedTopic?: string;
  lastQuestionTime?: string;
};

type MockTestContextType = {
  state: MockTestState;
  addMessage: (message: MockTestMessage) => void;
  setSection: (section: MockTestState["currentSection"]) => void;
  setTopic: (topic: string) => void;
  clearTest: () => void;
};

const STORAGE_KEY = "mock_test_state";

// Create context with initial state
const MockTestContext = createContext<MockTestContextType | null>(null);

// Provider component
export function MockTestContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MockTestState>(() => {
    if (typeof window === "undefined") return { messages: [], currentSection: "intro" };
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as MockTestState) : { messages: [], currentSection: "intro" };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addMessage = (message: MockTestMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      lastQuestionTime: message.role === "examiner" ? message.timestamp : prev.lastQuestionTime,
    }));
  };

  const setSection = (section: MockTestState["currentSection"]) => {
    setState(prev => ({ ...prev, currentSection: section }));
  };

  const setTopic = (topic: string) => {
    setState(prev => ({ ...prev, selectedTopic: topic }));
  };

  const clearTest = () => {
    setState({ messages: [], currentSection: "intro" });
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const value: MockTestContextType = {
    state,
    addMessage,
    setSection,
    setTopic,
    clearTest,
  };

  return <MockTestContext.Provider value={value}>{children}</MockTestContext.Provider>;
}

// Hook to use the store
export function useMockTestStore() {
  const context = useContext(MockTestContext);
  if (!context) {
    throw new Error("useMockTestStore must be used within a MockTestProvider");
  }
  return {
    messages: context.state.messages,
    currentSection: context.state.currentSection,
    selectedTopic: context.state.selectedTopic,
    lastQuestionTime: context.state.lastQuestionTime,
    addMessage: context.addMessage,
    setSection: context.setSection,
    setTopic: context.setTopic,
    clearTest: context.clearTest,
  };
}
