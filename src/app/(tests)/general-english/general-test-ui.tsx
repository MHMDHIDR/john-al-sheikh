"use client";

import ConversationUI from "@/components/custom/conversation-ui";
import type { UserProfile } from "@/components/custom/ielts-speaking-recorder";

export default function GeneralEnglishTestUI({
  user,
  isFreeTrialEnded,
}: {
  user: UserProfile;
  isFreeTrialEnded: boolean;
}) {
  return (
    <ConversationUI
      user={user}
      isFreeTrialEnded={isFreeTrialEnded}
      mode="general-english"
      title="محادثة اللغة الإنجليزية العامة"
    />
  );
}
