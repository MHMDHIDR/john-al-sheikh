"use client";

import { DataTable } from "@/components/custom/data-table";
import { subscribersColumns } from "./subscribers-columns";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type { SubscribedEmail } from "@/server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";

export default function SubscribersTable({ subscribers }: { subscribers: SubscribedEmail[] }) {
  const columns = [...subscribersColumns];

  return (
    <DataTable<SubscribedEmail & BaseEntity>
      columns={columns as ColumnDef<SubscribedEmail & BaseEntity>[]}
      data={subscribers}
      emptyStateMessage="Sorry, No Subscribers Found."
      exportFilename="subscribers_export"
    />
  );
}
