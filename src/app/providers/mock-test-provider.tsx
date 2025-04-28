"use client";

import { useEffect, useState } from "react";
import { MockTestContext, STORAGE_KEY } from "@/hooks/use-mock-test-store";
import type {
  MockTestContextType,
  MockTestMessage,
  MockTestState,
} from "@/hooks/use-mock-test-store";
import type { ReactNode } from "react";

export function MockTestProvider({ children }: { children: ReactNode }) {
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
