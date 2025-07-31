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

  // Enhanced mobile state tracking
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pageStateRef = useRef({
    isActive: true,
    lastActiveTime: Date.now(),
    reloadAttempted: false,
    heartbeatInterval: null as NodeJS.Timeout | null,
    stateCheckInterval: null as NodeJS.Timeout | null,
  });

  // Detect mobile device and user interaction
  useEffect(() => {
    const checkMobile = () => {
      return !!(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        ) ||
        (navigator.maxTouchPoints &&
          navigator.maxTouchPoints > 2 &&
          navigator.platform.includes("MacIntel"))
      );
    };

    setIsMobile(checkMobile());

    // Track user interactions for sticky activation
    const trackInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
      }
      pageStateRef.current.lastActiveTime = Date.now();
    };

    // Multiple event types to ensure we catch user interaction
    const interactionEvents = [
      "touchstart",
      "touchend",
      "click",
      "keydown",
      "scroll",
      "mousemove",
      "focus",
    ];
    interactionEvents.forEach(event => {
      document.addEventListener(event, trackInteraction, { passive: true });
    });

    return () => {
      interactionEvents.forEach(event => {
        document.removeEventListener(event, trackInteraction);
      });
    };
  }, [hasUserInteracted]);

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
      // Clear our state tracking
      window.sessionStorage.removeItem("test_page_state");
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
    // Reset reload attempt flag
    pageStateRef.current.reloadAttempted = false;
  }, []);

  // Aggressive reload detection using multiple strategies
  useEffect(() => {
    if (!shouldPreventNavigation()) return;

    const startTime = Date.now();
    pageStateRef.current.isActive = true;
    pageStateRef.current.lastActiveTime = startTime;

    // Capture the current state reference at effect creation time
    const currentState = pageStateRef.current;

    // Store initial state in session storage
    const stateKey = "test_page_state";
    const initialState = {
      startTime,
      isTestActive: true,
      pathname,
      lastHeartbeat: startTime,
    };

    try {
      window.sessionStorage.setItem(stateKey, JSON.stringify(initialState));
    } catch {
      console.warn("Session storage not available");
    }

    // Heartbeat system to detect page reload
    const heartbeat = () => {
      if (!shouldPreventNavigation()) return;

      const now = Date.now();
      const state = {
        startTime,
        isTestActive: true,
        pathname,
        lastHeartbeat: now,
      };

      try {
        window.sessionStorage.setItem(stateKey, JSON.stringify(state));
      } catch {
        // Ignore storage errors
      }

      pageStateRef.current.lastActiveTime = now;
    };

    // Check for reload detection
    const checkForReload = () => {
      if (!shouldPreventNavigation()) return;

      const storedState = window.sessionStorage.getItem(stateKey);
      if (storedState) {
        const state = JSON.parse(storedState) as {
          startTime: number;
          isTestActive: boolean;
          pathname: string;
          lastHeartbeat: number;
        };
        const now = Date.now();

        if (
          now - state.lastHeartbeat > 3000 ||
          (now - state.startTime < 1000 && state.startTime !== startTime)
        ) {
          if (!pageStateRef.current.reloadAttempted) {
            pageStateRef.current.reloadAttempted = true;
            setShowExitConfirmation(true);
          }
        }
      }
    };

    // Start heartbeat and checking intervals
    currentState.heartbeatInterval = setInterval(heartbeat, 1000);
    currentState.stateCheckInterval = setInterval(checkForReload, 500);

    return () => {
      // Use the captured reference instead of pageStateRef.current
      if (currentState.heartbeatInterval) {
        clearInterval(currentState.heartbeatInterval);
        currentState.heartbeatInterval = null;
      }
      if (currentState.stateCheckInterval) {
        clearInterval(currentState.stateCheckInterval);
        currentState.stateCheckInterval = null;
      }
    };
  }, [shouldPreventNavigation, pathname]);

  // Enhanced beforeunload with all possible events
  useEffect(() => {
    if (!shouldPreventNavigation()) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUserInteracted) {
        // Standard preventDefault approach
        event.preventDefault();
        event.returnValue = "";

        // Mobile-specific handling
        if (isMobile) {
          const message = "سيتم إنهاء الاختبار الخاص بك إذا غادرت هذه الصفحة. هل أنت متأكد؟";
          event.returnValue = message;
          return message;
        }
      }
    };

    const handlePageHide = () => {
      if (!pageStateRef.current.reloadAttempted) {
        pageStateRef.current.reloadAttempted = true;
        // For mobile, we can't prevent the navigation, but we can try to show the dialog
        // when the page becomes visible again
        setTimeout(() => {
          if (document.visibilityState === "visible" && shouldPreventNavigation()) {
            setShowExitConfirmation(true);
          }
        }, 100);
      }
    };

    const handleVisibilityChange = () => {
      const now = Date.now();

      if (document.visibilityState === "hidden") {
        pageStateRef.current.isActive = false;
        // Mark as potential reload attempt if it happens quickly
        if (now - pageStateRef.current.lastActiveTime < 1000) {
          pageStateRef.current.reloadAttempted = true;
        }
      } else if (document.visibilityState === "visible") {
        const wasInactive = !pageStateRef.current.isActive;
        pageStateRef.current.isActive = true;
        pageStateRef.current.lastActiveTime = now;

        // If we detected a reload attempt and page is now visible again, show dialog
        if (pageStateRef.current.reloadAttempted && wasInactive && shouldPreventNavigation()) {
          setTimeout(() => {
            setShowExitConfirmation(true);
          }, 100);
        }
      }
    };

    // Add all possible event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide as EventListener);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide as EventListener);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [shouldPreventNavigation, hasUserInteracted, isMobile]);

  // Mobile-specific touch gesture prevention and detection
  useEffect(() => {
    if (!shouldPreventNavigation() || !isMobile) return;

    let startY = 0;
    let startX = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches?.[0]) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        touchStartTime = Date.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches?.[0]) {
        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const deltaY = currentY - startY;
        const deltaX = Math.abs(currentX - startX);

        // Prevent pull-to-refresh
        if (deltaY > 0 && deltaX < 50 && window.scrollY === 0) {
          e.preventDefault();

          // Show confirmation dialog for significant pull-down
          if (deltaY > 80 && !pageStateRef.current.reloadAttempted) {
            pageStateRef.current.reloadAttempted = true;
            setShowExitConfirmation(true);
          }
        }
      }
    };

    const handleTouchEnd = () => {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;

      // Detect rapid taps that might trigger refresh
      if (touchDuration < 200 && !pageStateRef.current.reloadAttempted) {
        // Check if touch was near top of screen (potential address bar tap)
        if (startY < 100) {
          setTimeout(() => {
            if (document.visibilityState === "hidden") {
              pageStateRef.current.reloadAttempted = true;
            }
          }, 100);
        }
      }
    };

    // Prevent common mobile refresh gestures
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    // Prevent pinch-to-zoom which can sometimes trigger refresh
    const handleGestureStart = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", handleGestureStart, { passive: false });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("gesturestart", handleGestureStart);
    };
  }, [shouldPreventNavigation, isMobile]);

  // Detect address bar interactions and page focus changes
  useEffect(() => {
    if (!shouldPreventNavigation()) return;

    let focusLossTime = 0;

    const handleFocus = () => {
      const now = Date.now();
      const timeSinceFocusLoss = now - focusLossTime;

      // If focus was lost and regained quickly, might be refresh attempt
      if (focusLossTime > 0 && timeSinceFocusLoss < 2000 && timeSinceFocusLoss > 100) {
        if (!pageStateRef.current.reloadAttempted) {
          pageStateRef.current.reloadAttempted = true;
          setTimeout(() => {
            if (shouldPreventNavigation()) {
              setShowExitConfirmation(true);
            }
          }, 100);
        }
      }

      pageStateRef.current.lastActiveTime = now;
    };

    const handleBlur = () => {
      focusLossTime = Date.now();
    };

    // Detect window resize (address bar show/hide on mobile)
    const handleResize = () => {
      if (isMobile) {
        const now = Date.now();
        if (now - pageStateRef.current.lastActiveTime < 1000) {
          // Quick resize might indicate address bar interaction
          setTimeout(() => {
            if (document.visibilityState === "hidden" && !pageStateRef.current.reloadAttempted) {
              pageStateRef.current.reloadAttempted = true;
            }
          }, 200);
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("resize", handleResize);
    };
  }, [shouldPreventNavigation, isMobile]);

  // Enhanced popstate handling for back/forward/refresh
  useEffect(() => {
    if (!shouldPreventNavigation()) return;

    const handlePopState = (_e: PopStateEvent) => {
      // Always prevent back/forward navigation during test
      window.history.pushState(null, "", pathname);

      if (!pageStateRef.current.reloadAttempted) {
        pageStateRef.current.reloadAttempted = true;
        interceptNavigation(document.referrer || "/");
      }
    };

    // Set up history state
    window.history.pushState(null, "", pathname);
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname, shouldPreventNavigation, interceptNavigation]);

  // Router and navigation patching (keeping original implementation)
  useEffect(() => {
    originalPushRef.current ??= router.push.bind(router);
    originalReplaceRef.current ??= router.replace.bind(router);

    if (!shouldPreventNavigation()) return;

    const patchedPush = (url: string, options?: NavigateOptions) => {
      if (shouldPreventNavigation() && url !== pathname) {
        interceptNavigation(url);
        return Promise.resolve(true);
      }
      return originalPushRef.current!(url, options);
    };

    const patchedReplace = (url: string, options?: NavigateOptions) => {
      if (shouldPreventNavigation() && url !== pathname) {
        interceptNavigation(url);
        return Promise.resolve(true);
      }
      return originalReplaceRef.current!(url, options);
    };

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

        window.history.pushState = originalHistoryPushState;
      };
    }
  }, [pathname, router, shouldPreventNavigation, interceptNavigation]);

  // Link click interception (keeping original implementation)
  useEffect(() => {
    if (!shouldPreventNavigation()) return;

    const handleGlobalClick = (e: MouseEvent) => {
      let element = e.target as HTMLElement | null;
      while (element) {
        const isNextJsLink = element.hasAttribute("data-next-link");

        if (element.tagName === "A" || isNextJsLink) {
          const href = element.getAttribute("href");

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

    document.addEventListener("click", handleGlobalClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [shouldPreventNavigation, interceptNavigation, pathname]);

  // Mutation observer for dynamic links (keeping original implementation)
  useEffect(() => {
    if (!shouldPreventNavigation()) return;

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "href" || mutation.attributeName === "data-next-link")
        ) {
          const element = mutation.target as HTMLElement;
          const href = element.getAttribute("href");

          if (href && href !== pathname && !href.startsWith("#")) {
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
          <p className="text-red-600 font-semibold text-justify leading-loose">
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
