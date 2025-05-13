import { Suspense } from "react";
import { LoadingCard } from "@/components/custom/data-table/loading";
import { AuroraText } from "@/components/magicui/aurora-text";
import { api } from "@/trpc/server";
import TestUsersTable from "./test-users-table";

export default async function Users() {
  const { speakingTestUser, count } = await api.users.getTotalTestUsers();

  return (
    <div className="container max-w-6xl md:px-3.5 px-2 py-3 mx-auto">
      <h1 className="text-xl select-none mb-5 font-bold text-center">
        <AuroraText>يوجد {count} ممتحن</AuroraText>
      </h1>
      <Suspense fallback={<LoadingCard renderedSkeletons={count} />}>
        <TestUsersTable testUsers={speakingTestUser} />
      </Suspense>
    </div>
  );
}
