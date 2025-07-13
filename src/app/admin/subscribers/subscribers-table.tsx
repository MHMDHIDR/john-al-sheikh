"use client";

import { DataTable } from "@/components/custom/data-table";
import { subscribersColumns } from "./subscribers-columns";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type { ColumnDef } from "@tanstack/react-table";

// Type for combined subscriber data
export type CombinedSubscriber = {
  id: string;
  fullname: string;
  email: string;
  ieltsGoal: number;
  createdAt: Date;
  source: "subscribed_emails" | "users";
};

export default function SubscribersTable({ subscribers }: { subscribers: CombinedSubscriber[] }) {
  const columns = [...subscribersColumns];

  return (
    <DataTable<CombinedSubscriber & BaseEntity>
      columns={columns as ColumnDef<CombinedSubscriber & BaseEntity>[]}
      data={subscribers}
      emptyStateMessage="Sorry, No Subscribers Found."
      exportFilename="subscribers_export"
      searchPlaceholder="البحث في بيانات مشتركون النشرة البريدية..."
    />
  );
}
