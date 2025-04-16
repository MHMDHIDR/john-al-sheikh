import { Suspense } from "react";
import { LoadingCard } from "@/components/custom/data-table/loading";
import { api } from "@/trpc/server";
import UsersTable from "./users-table";

export default async function Users() {
  const { users, count } = await api.users.getUsers();

  return (
    <div className="container max-w-6xl md:px-3.5 px-2 py-3">
      <Suspense fallback={<LoadingCard renderedSkeletons={count} />}>
        <UsersTable users={users} />
      </Suspense>
    </div>
  );
}
