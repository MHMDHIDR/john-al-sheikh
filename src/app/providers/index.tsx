import NextTopLoader from "nextjs-toploader";
import { MockTestProvider } from "@/app/providers/mock-test-provider";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader color="#999" showAtBottom={false} zIndex={1600} />
      <TRPCReactProvider>
        <MockTestProvider>{children}</MockTestProvider>
      </TRPCReactProvider>
      <Toaster />
    </>
  );
}
