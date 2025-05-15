"use client";

import { IconLogout2 } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTestContext } from "@/components/custom/conversation-ui";
import { ConfirmationDialog } from "@/components/custom/data-table/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { handleSignout } from "./actions/handle-signout";

export function SignoutButton() {
  const pathname = usePathname();
  const isTestPage = pathname === "/mock-test" || pathname === "/general-english";
  const [showConfirmation, setShowConfirmation] = useState(false);

  const testContext = useTestContext();

  const handleSignoutClick = () => {
    // If on a test page, show confirmation dialog
    if (isTestPage) {
      setShowConfirmation(true);
      return;
    }

    // Otherwise, sign out directly
    void performSignout();
  };

  const performSignout = async () => {
    // If we're on a test page and have access to the test context, stop the test
    if (isTestPage && testContext) {
      testContext.stopTest();
    }

    // Clean up test results if any
    const savedResult = sessionStorage.getItem("ieltsResult");
    if (savedResult) {
      sessionStorage.removeItem("ieltsResult");
    }

    // Sign out
    await handleSignout();
  };

  return (
    <>
      <Button onClick={handleSignoutClick} className="cursor-pointer" variant={"destructive"}>
        <IconLogout2 className="w-5 h-5 mx-1" />
        <span>تسجيل الخروج</span>
      </Button>

      {isTestPage && (
        <ConfirmationDialog
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          title="انهاء الاختبار"
          description={
            <div className="text-red-600 font-semibold">
              سيتم إنهاء الاختبار الخاص بك إذا قمت بتسجيل الخروج. هل أنت متأكد؟
            </div>
          }
          buttonText="نعم، تسجيل الخروج"
          buttonClass="bg-red-600 hover:bg-red-700 text-white"
          onConfirm={performSignout}
        />
      )}
    </>
  );
}
