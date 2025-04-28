import { createContext, useContext } from "react";

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

export type MockTestContextType = {
  state: MockTestState;
  addMessage: (message: MockTestMessage) => void;
  setSection: (section: MockTestState["currentSection"]) => void;
  setTopic: (topic: string) => void;
  clearTest: () => void;
};

export const STORAGE_KEY = "mock_test_state";

export const MockTestContext = createContext<MockTestContextType | null>(null);

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
