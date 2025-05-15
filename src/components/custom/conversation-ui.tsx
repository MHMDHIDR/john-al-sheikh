"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ConfirmationDialog } from "@/components/custom/data-table/confirmation-dialog";
import IELTSSpeakingRecorder from "@/components/custom/ielts-speaking-recorder";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { useMockTestStore } from "@/hooks/use-mock-test-store";
import { cn } from "@/lib/utils";
import type {
  IELTSSpeakingRecorderRef,
  UserProfile,
} from "@/components/custom/ielts-speaking-recorder";

// Create a context to expose the stopTest functionality
export const TestContext = createContext<{ stopTest: () => void } | null>(null);

// Custom hook to access the stopTest function
export function useTestContext() {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error("useTestContext must be used within a ConversationUI component");
  }
  return context;
}

export type ConversationModeType = "mock-test" | "general-english";

interface ConversationUIProps {
  user: UserProfile;
  isFreeTrialEnded: boolean;
  mode: ConversationModeType;
  title?: string;
}

export default function ConversationUI({
  user,
  isFreeTrialEnded,
  mode,
  title = "اختبار المحادثة",
}: ConversationUIProps) {
  const { messages, clearTest } = useMockTestStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<IELTSSpeakingRecorderRef>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const navigationAttemptRef = useRef<{ url: string; navigate: () => void } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useLayoutEffect(() => {
    clearTest();
    return () => clearTest();
  });

  useEffect(() => scrollToBottom(), [messages]);

  // Function to stop the test and clear state
  const stopTest = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stopTest();
    }
    clearTest();
  }, [clearTest]);

  // Handle navigation confirmation
  const handleNavigation = useCallback(
    (url: string, navigateFunction?: () => void) => {
      // Store the navigation attempt with the callback to execute later if confirmed
      navigationAttemptRef.current = {
        url,
        navigate: navigateFunction ?? (() => router.push(url)),
      };
      // Show confirmation dialog
      setShowExitConfirmation(true);
      // Return false to prevent the default navigation
      return false;
    },
    [router],
  );

  // Handle exit confirmation
  const handleExitTest = useCallback(() => {
    // Stop the VAPI test and clear state
    stopTest();

    // Get the stored navigation attempt
    const navigationAttempt = navigationAttemptRef.current;

    // Close the dialog
    setShowExitConfirmation(false);

    // Execute the navigation if it exists
    if (navigationAttempt) {
      // Small timeout to ensure test cleanup happens first
      setTimeout(() => {
        navigationAttempt.navigate();
      }, 50);
    } else {
      // If no navigation attempt was saved, go to dashboard
      void router.push("/dashboard");
    }
  }, [stopTest, router]);

  // Handle browser navigation events (back/forward buttons)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const confirmationMessage = "يرجى الإنتباه في حال غادرت هذه الصفحة سيتم إنهاء الاختبار";
      e.preventDefault();
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    };

    // Add event listener for browser's back/forward buttons
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Show confirmation dialog
      handleNavigation(window.location.pathname);
      // Push the current state back to maintain the URL in the address bar
      window.history.pushState(null, "", pathname);
    };

    // Push an initial state to make the popstate event work
    window.history.pushState(null, "", pathname);

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [handleNavigation, pathname]);

  // Intercept link clicks within the page
  useEffect(() => {
    // We need to handle capture phase to intercept before default behavior
    const handleLinkClick = (e: MouseEvent) => {
      // Check if the clicked element is a link or has a link parent
      const findLink = (element: HTMLElement | null): HTMLAnchorElement | null => {
        if (!element) return null;
        if (element.tagName === "A") return element as HTMLAnchorElement;
        if (element.parentElement) return findLink(element.parentElement);
        return null;
      };

      const target = e.target as HTMLElement;
      const link = findLink(target);

      if (link) {
        const href = link.getAttribute("href");
        // Only intercept links to the same site that aren't anchor links
        if (
          href &&
          !href.startsWith("#") &&
          !href.startsWith("http") &&
          !href.startsWith("mailto:")
        ) {
          // Check if this is not the current page
          if (href !== pathname) {
            // Stop the default behavior
            e.preventDefault();
            e.stopPropagation();

            // Create a navigation function that will be called if confirmed
            const navigateFunction = () => {
              void router.push(href);
            };

            // Show confirmation
            handleNavigation(href, navigateFunction);
            return false;
          }
        }
      }
    };

    // Add event listener for all clicks (use capture to get event before it reaches the target)
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [handleNavigation, pathname, router]);

  // This patch is needed to intercept Next.js router.push calls
  useEffect(() => {
    // Define types for router methods
    type RouterPushFunction = typeof router.push;
    type RouterReplaceFunction = typeof router.replace;

    // Store the original push method
    const originalPush = router.push.bind(router);
    const originalReplace = router.replace.bind(router);

    // Override router.push
    const newPush: RouterPushFunction = function (url, options) {
      // If it's the same page, allow the navigation
      if (url === pathname) {
        return originalPush(url, options);
      }

      // Create navigation function
      const navigateFunction = () => {
        originalPush(url, options);
      };

      // Show confirmation dialog and store the navigation function
      handleNavigation(url, navigateFunction);
      return void Promise.resolve(false);
    };

    // Override router.replace
    const newReplace: RouterReplaceFunction = function (url, options) {
      // If it's the same page, allow the navigation
      if (url === pathname) {
        return originalReplace(url, options);
      }

      // Create navigation function
      const navigateFunction = () => {
        originalReplace(url, options);
      };

      // Show confirmation dialog and store the URL
      handleNavigation(url, navigateFunction);
      return void Promise.resolve(false);
    };

    // Apply the overrides
    router.push = newPush;
    router.replace = newReplace;

    return () => {
      // Restore original methods when component unmounts
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [handleNavigation, pathname, router]);

  return (
    <TestContext.Provider value={{ stopTest }}>
      <main className="min-h-screen grid grid-rows-[auto_1fr_auto] grid-cols-[minmax(0,1fr)] overflow-x-clip">
        <AuroraText
          className={
            "m-2 sticky mt-0 top-12 md:top-13 py-1.5 mx-0 shadow min-w-full text-center z-20 text-xl font-bold bg-white/50 dark:bg-black/50 backdrop-blur-md text-gray-900 select-none"
          }
        >
          {title}
        </AuroraText>

        <div className="relative w-full max-w-5xl mx-auto">
          <InteractiveGridPattern
            className={cn(
              "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
              "absolute inset-x-0 inset-y-0 h-full w-full z-0 opacity-50",
            )}
            width={70}
            height={70}
            squares={[30, 30]}
            squaresClassName="hover:fill-blue-200"
          />

          <div className="relative z-10 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 ltr">
              {messages.map((message, index) => (
                <div
                  key={`${message.timestamp}-${index}`}
                  className={`flex w-full ${
                    message.role === "examiner" ? "justify-start" : "justify-end"
                  } mb-4`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "examiner"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-green-100 text-green-900"
                    }`}
                  >
                    <div className="font-semibold mb-1">
                      {message.role === "examiner" ? "Examiner" : "You"}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    <div className="text-xs mt-2 opacity-70">{message.timestamp}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 shadow-inner z-20 w-full bg-white/50 dark:bg-black/50 py-2 backdrop-blur-md flex flex-col">
          <div className="flex justify-between items-center select-none px-4">
            <IELTSSpeakingRecorder
              ref={recorderRef}
              user={user}
              isFreeTrialEnded={isFreeTrialEnded}
              mode={mode}
            />
          </div>
        </div>

        {/* Exit Confirmation Dialog */}
        <ConfirmationDialog
          open={showExitConfirmation}
          onOpenChange={setShowExitConfirmation}
          title="انهاء الاختبار"
          description={
            <div className="text-red-600 font-semibold">
              سيتم إنهاء الاختبار الخاص بك إذا غادرت هذه الصفحة. هل أنت متأكد؟
            </div>
          }
          buttonText="نعم، إنهاء الاختبار"
          buttonClass="bg-red-600 hover:bg-red-700 text-white"
          onConfirm={handleExitTest}
        />
      </main>
    </TestContext.Provider>
  );
}
