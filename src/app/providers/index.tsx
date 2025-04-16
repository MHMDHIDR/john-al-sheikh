import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader color="#999" showAtBottom={false} zIndex={1600} />
      <TRPCReactProvider>{children}</TRPCReactProvider>
      <Toaster />
    </>
  );
}
