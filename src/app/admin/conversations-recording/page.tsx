import { Suspense } from "react";
import { LoadingCard } from "@/components/custom/data-table/loading";
import { AuroraText } from "@/components/magicui/aurora-text";
import { api } from "@/trpc/server";
import ConversationRecordingsTable from "./conversation-recordings-table";

export default async function ConversationRecordingPage() {
  const { recordings, totalCount } = await api.vapi.getConversationRecordings();

  return (
    <div className="container max-w-6xl md:px-3.5 px-2 py-3 mx-auto">
      <h1 className="text-xl select-none mb-5 font-bold text-center">
        <AuroraText>يوجد {totalCount} تسجيل محادثة</AuroraText>
      </h1>
      <Suspense fallback={<LoadingCard renderedSkeletons={totalCount} />}>
        <ConversationRecordingsTable recordings={recordings} />
      </Suspense>
    </div>
  );
}
