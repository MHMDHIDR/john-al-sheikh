"use client";

import { DataTable } from "@/components/custom/data-table";
import { baseColumns } from "@/components/custom/data-table/base-columns";
import { premiumUserColumns } from "./premium-users-columns";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type { Users } from "@/server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";

export default function PremiumUsersTable({ users }: { users: (Users & BaseEntity)[] }) {
  const columns = [...baseColumns(), ...premiumUserColumns];

  return (
    <DataTable<Users & BaseEntity>
      columns={columns as ColumnDef<Users & BaseEntity>[]}
      data={users}
      emptyStateMessage="Sorry, No Premium Users Found."
      exportFilename="users_export"
    />
  );
}
