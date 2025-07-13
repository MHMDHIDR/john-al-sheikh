import { Suspense } from "react";
import { LoadingCard } from "@/components/custom/data-table/loading";
import { AuroraText } from "@/components/magicui/aurora-text";
import { api } from "@/trpc/server";
import TestUsersTable from "./test-users-table";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type { RouterOutputs } from "@/trpc/react";

export type UniqueTestUser = RouterOutputs["users"]["getTotalTestUsers"]["uniqueTestUsers"][number];

// Create a modified type for the table rows
export type TableTestUser = Omit<UniqueTestUser, "latestTestDate"> & {
  id: string;
  latestTestDate: Date | null;
};

export default async function Users() {
  const { uniqueTestUsers, count } = await api.users.getTotalTestUsers();

  const tableRows: (TableTestUser & BaseEntity)[] = uniqueTestUsers.map(
    (uniqueUsers: UniqueTestUser) => ({
      ...uniqueUsers,
      id: uniqueUsers.user.id,
      name: uniqueUsers.user.name,
      gender: uniqueUsers.user.gender,
      phone: uniqueUsers.user.phone,
      latestTestDate: uniqueUsers.latestTestDate ? new Date(uniqueUsers.latestTestDate) : null,
      testCount: Number(uniqueUsers.testCount),
    }),
  );

  return (
    <div className="container max-w-6xl md:px-3.5 px-2 py-3 mx-auto">
      <h1 className="text-xl select-none mb-5 font-bold text-center">
        <AuroraText>يوجد {count} ممتحن</AuroraText>
      </h1>
      <Suspense fallback={<LoadingCard renderedSkeletons={count} />}>
        <TestUsersTable testUsers={tableRows} />
      </Suspense>
    </div>
  );
}
