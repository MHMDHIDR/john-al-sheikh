"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmationDialog } from "@/components/custom/data-table/confirmation-dialog";
import { useMockTestStore } from "@/hooks/use-mock-test-store";
import { CallStatus, useVapiConversation } from "@/hooks/use-vapi-conversation";
import type { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  const { callStatus, endSession } = useVapiConversation();
  const mockTestStore = useMockTestStore();
  const [isTestRunning, setIsTestRunning] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const isTestPage = pathname === "/mock-test" || pathname === "/general-english";
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const pendingUrl = useRef<string | null>(null);
  const originalPushRef = useRef<typeof router.push | null>(null);
  const originalReplaceRef = useRef<typeof router.replace | null>(null);

  // Force test running state update
  useEffect(() => {
    if (callStatus === CallStatus.ACTIVE) {
      setIsTestRunning(true);
    } else if (callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE) {
      setIsTestRunning(false);
    }
  }, [callStatus]);

  // Check if navigation should be prevented
  const shouldPreventNavigation = useCallback(() => {
    return isTestPage && isTestRunning;
  }, [isTestPage, isTestRunning]);

  // Store the destination URL and show confirmation dialog
  const interceptNavigation = useCallback(
    (url: string) => {
      if (shouldPreventNavigation()) {
        pendingUrl.current = url;
        setShowExitConfirmation(true);
        return true;
      }
      return false;
    },
    [shouldPreventNavigation],
  );

  // Clean up test state and resources
  const cleanupTest = useCallback(() => {
    // End the VAPI session
    endSession();

    // Clear mock test state
    mockTestStore.clearTest();

    // Clear test running state
    setIsTestRunning(false);

    // Clear session storage directly as a fallback
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("mock_test_state");
    }
  }, [endSession, mockTestStore]);

  // Handle exit confirmation
  const handleExitConfirm = useCallback(() => {
    setShowExitConfirmation(false);

    // Clean up test resources
    cleanupTest();

    // Navigate to the stored URL using the original push method to avoid re-interception
    if (pendingUrl.current) {
      const targetUrl = pendingUrl.current;
      pendingUrl.current = null;
      // Use the original router method to navigate
      if (originalPushRef.current) {
        originalPushRef.current(targetUrl);
      } else {
        router.push(targetUrl);
      }
    } else {
      if (originalPushRef.current) {
        originalPushRef.current("/");
      } else {
        router.push("/");
      }
    }
  }, [router, cleanupTest]);

  // Handle exit cancellation
  const handleExitCancel = useCallback(() => {
    setShowExitConfirmation(false);
    pendingUrl.current = null;
  }, []);

  // Handle browser refresh and tab close
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldPreventNavigation()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldPreventNavigation]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (shouldPreventNavigation()) {
        // This will prevent the actual navigation
        window.history.pushState(null, "", pathname);
        interceptNavigation(document.referrer || "/");
      }
    };

    // Set up an initial history entry to make the popstate work
    window.history.pushState(null, "", pathname);
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname, shouldPreventNavigation, interceptNavigation]);

  // Aggressively patch all Next.js navigation methods
  useEffect(() => {
    // Always store original methods even if we're not intercepting yet
    originalPushRef.current ??= router.push.bind(router);
    originalReplaceRef.current ??= router.replace.bind(router);

    // If we shouldn't prevent navigation, don't apply patches
    if (!shouldPreventNavigation()) return;

    // Override the router's push method to intercept navigation
    const patchedPush = (url: string, options?: NavigateOptions) => {
      if (shouldPreventNavigation() && url !== pathname) {
        interceptNavigation(url);
        return Promise.resolve(true);
      }
      return originalPushRef.current!(url, options);
    };

    // Override the router's replace method
    const patchedReplace = (url: string, options?: NavigateOptions) => {
      if (shouldPreventNavigation() && url !== pathname) {
        interceptNavigation(url);
        return Promise.resolve(true);
      }
      return originalReplaceRef.current!(url, options);
    };

    // Apply patches - use defineProperty to override methods
    Object.defineProperty(router, "push", {
      value: patchedPush,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(router, "replace", {
      value: patchedReplace,
      configurable: true,
      writable: true,
    });

    // Hijack navigation globally
    if (typeof window !== "undefined") {
      const originalHistoryPushState = window.history.pushState.bind(window.history);
      window.history.pushState = function (data, unused, url) {
        if (shouldPreventNavigation() && url !== pathname) {
          interceptNavigation(url as string);
          return;
        }
        return originalHistoryPushState.call(this, data, unused, url);
      };

      return () => {
        // Restore original router methods
        if (originalPushRef.current) {
          Object.defineProperty(router, "push", {
            value: originalPushRef.current,
            configurable: true,
            writable: true,
          });
        }

        if (originalReplaceRef.current) {
          Object.defineProperty(router, "replace", {
            value: originalReplaceRef.current,
            configurable: true,
            writable: true,
          });
        }

        // Restore original window.history.pushState
        window.history.pushState = originalHistoryPushState;
      };
    }
  }, [pathname, router, shouldPreventNavigation, interceptNavigation]);

  // Patch all link clicks globally with capture phase
  useEffect(() => {
    if (!shouldPreventNavigation()) return;

    const handleGlobalClick = (e: MouseEvent) => {
      // Check if the clicked element or any of its parents is a link
      let element = e.target as HTMLElement | null;
      while (element) {
        // Next.js Link components have data-next-link attributes
        const isNextJsLink = element.hasAttribute("data-next-link");

        // Check for both standard links and Next.js Link components
        if (element.tagName === "A" || isNextJsLink) {
          const href = element.getAttribute("href");

          // If it's a link with an href that would navigate away
          if (href && href !== pathname && !href.startsWith("#")) {
            e.preventDefault();
            e.stopPropagation();
            interceptNavigation(href);
            return;
          }
        }
        element = element.parentElement;
      }
    };

    // Use capturing phase to get events before they reach their targets
    document.addEventListener("click", handleGlobalClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [shouldPreventNavigation, interceptNavigation, pathname]);

  // Intercept data-next-link clicks through mutation observer
  useEffect(() => {
    if (!shouldPreventNavigation()) return;

    const observer = new MutationObserver(mutations => {
      // Look for attributes that might indicate a Next.js link
      mutations.forEach(mutation => {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "href" || mutation.attributeName === "data-next-link")
        ) {
          const element = mutation.target as HTMLElement;
          const href = element.getAttribute("href");

          if (href && href !== pathname && !href.startsWith("#")) {
            // Add a click interceptor
            element.addEventListener(
              "click",
              e => {
                if (shouldPreventNavigation()) {
                  e.preventDefault();
                  e.stopPropagation();
                  interceptNavigation(href);
                }
              },
              { capture: true, once: true },
            );
          }
        }
      });
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["href", "data-next-link"],
    });

    return () => observer.disconnect();
  }, [shouldPreventNavigation, interceptNavigation, pathname]);

  return (
    <>
      {children}

      <ConfirmationDialog
        open={showExitConfirmation}
        onOpenChange={handleExitCancel}
        title="إنهاء الإختبار"
        description={
          <p className="text-red-600 font-semibold">
            سيتم إنهاء الاختبار الخاص بك إذا غادرت هذه الصفحة. هل أنت متأكد؟ سيتم{" "}
            <strong>إنهاء الإختبار</strong> وفقدان الدقائق المنقضية في الإختبار ولن تتحصل على نتيجة
            الإختبار إذا قمت بإنهاء الإختبار الآنّ
          </p>
        }
        buttonText="نعم، إنهاء الإختبار"
        buttonClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={handleExitConfirm}
        cancelVariant="active"
      />
    </>
  );
}
