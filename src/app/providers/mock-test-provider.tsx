"use client";

import { MockTestContextProvider } from "@/hooks/use-mock-test-store";

export function MockTestProvider({ children }: { children: React.ReactNode }) {
  return <MockTestContextProvider>{children}</MockTestContextProvider>;
}
