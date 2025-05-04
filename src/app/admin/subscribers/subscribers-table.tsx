"use client";

import { DataTable } from "@/components/custom/data-table";
import { baseColumns } from "@/components/custom/data-table/base-columns";
import { subscribersColumns } from "./subscribers-columns";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type { SubscribedEmail } from "@/server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";

export default function SubscribersTable({ subscribers }: { subscribers: SubscribedEmail[] }) {
  const columns = [...baseColumns(), ...subscribersColumns];

  return (
    <DataTable<SubscribedEmail & BaseEntity>
      columns={columns as ColumnDef<SubscribedEmail & BaseEntity>[]}
      data={subscribers}
      emptyStateMessage="Sorry, No Subscribers Found."
    />
  );
}
