"use client";

import { IconLogout2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { handleSignout } from "./actions/handle-signout";

export function SignoutButton() {
  const handleSignoutClick = async () => {
    const savedResult = sessionStorage.getItem("ieltsResult");
    if (savedResult) {
      sessionStorage.removeItem("ieltsResult");
    }

    await handleSignout();
  };

  return (
    <Button onClick={handleSignoutClick} className="cursor-pointer" variant={"destructive"}>
      <IconLogout2 className="w-5 h-5 mx-1" />
      <span>تسجيل الخروج</span>
    </Button>
  );
}
