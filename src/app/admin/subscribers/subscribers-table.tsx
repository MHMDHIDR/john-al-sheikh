"use client";

import { DataTable } from "@/components/custom/data-table";
import { baseColumns } from "@/components/custom/data-table/base-columns";
import { subscribersColumns } from "./subscribers-columns";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type { SubscribedEmail, Users } from "@/server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";

// Type for combined subscriber data
export type CombinedSubscriber = {
  id: SubscribedEmail["id"];
  name: SubscribedEmail["fullname"];
  email: SubscribedEmail["email"];
  gender: Users["gender"];
  createdAt: SubscribedEmail["createdAt"];
  source: "subscribed_emails" | "users";
};

export default function SubscribersTable({ subscribers }: { subscribers: CombinedSubscriber[] }) {
  const columns = [...baseColumns(), ...subscribersColumns];

  return (
    <DataTable<CombinedSubscriber & BaseEntity>
      columns={columns as ColumnDef<CombinedSubscriber & BaseEntity>[]}
      data={subscribers}
      emptyStateMessage="لم يتم العثور على مشتركين."
      exportFilename="subscribers_export"
      searchPlaceholder="البحث في بيانات مشتركون النشرة البريدية..."
    />
  );
}
