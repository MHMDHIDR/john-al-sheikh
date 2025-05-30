"use client";

import NextTopLoader from "nextjs-toploader";
import { MockTestProvider } from "@/app/providers/mock-test-provider";
import { PostHogProvider } from "@/app/providers/posthog-provider";
import { VapiConversationProvider } from "@/app/providers/vapi-conversation-provider";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <NextTopLoader color="#999" showAtBottom={false} zIndex={1600} />
      <TRPCReactProvider>
        <MockTestProvider>
          <VapiConversationProvider>{children}</VapiConversationProvider>
        </MockTestProvider>
      </TRPCReactProvider>
      <Toaster />
    </PostHogProvider>
  );
}
