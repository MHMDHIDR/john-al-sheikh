"use client";

import { IconLogout2 } from "@tabler/icons-react";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/custom/data-table/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { useMockTestStore } from "@/hooks/use-mock-test-store";
import { CallStatus, useVapiConversation } from "@/hooks/use-vapi-conversation";
import { handleSignout } from "./actions/handle-signout";

export function SignoutButton() {
  const { callStatus, endSession } = useVapiConversation();
  const { clearTest } = useMockTestStore();

  const isConnected = callStatus === CallStatus.ACTIVE;
  const [confirmSignoutDialog, setConfirmSignoutDialog] = useState(false);

  async function handleSignoutClick() {
    const savedResult = sessionStorage.getItem("ieltsResult");
    if (savedResult) {
      sessionStorage.removeItem("ieltsResult");
    }

    await handleSignout();
  }

  function handleConfirmedSignoutWhileIsConnected() {
    setConfirmSignoutDialog(false);

    endSession();
    clearTest();

    setTimeout(() => {
      if (!isConnected) {
        void handleSignoutClick();
      }
    }, 800);
  }

  return (
    <>
      <Button
        onClick={() => {
          if (isConnected) {
            setConfirmSignoutDialog(true);
          } else {
            void handleSignoutClick();
          }
        }}
        className="cursor-pointer"
        variant={"destructive"}
      >
        <IconLogout2 className="w-5 h-5 mx-1" />
        <span>تسجيل الخروج</span>
      </Button>

      <ConfirmationDialog
        open={confirmSignoutDialog}
        onOpenChange={setConfirmSignoutDialog}
        title="تسجيل الخروج"
        description={
          <div className="flex flex-col text-right">
            <p>سيتم إنهاء جلسة المحادثة الحالية.</p>
            <strong className="text-red-500">هل أنت متأكد من تسجيل الخروج؟</strong>
          </div>
        }
        buttonText="تسجيل الخروج"
        buttonClass="bg-yellow-600 hover:bg-yellow-700"
        onConfirm={handleConfirmedSignoutWhileIsConnected}
      />
    </>
  );
}
