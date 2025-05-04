import { Suspense } from "react";
import { LoadingCard } from "@/components/custom/data-table/loading";
import { api } from "@/trpc/server";
import SubscribersTable from "./subscribers-table";

export default async function Subscribers() {
  const { subscribers, count } = await api.subscribedEmails.getSubscribers();

  return (
    <div className="container max-w-6xl md:px-3.5 px-2 py-3 mx-auto">
      <Suspense fallback={<LoadingCard renderedSkeletons={count} />}>
        <SubscribersTable subscribers={subscribers} />
      </Suspense>
    </div>
  );
}
