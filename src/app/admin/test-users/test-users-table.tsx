"use client";

import { DataTable } from "@/components/custom/data-table";
import { userColumns } from "./test-users-columns";
import type { TableTestUser } from "./page";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type { ColumnDef } from "@tanstack/react-table";

export default function TestUsersTable({
  testUsers,
}: {
  testUsers: (TableTestUser & BaseEntity)[];
}) {
  const columns = [...userColumns];

  return (
    <DataTable<TableTestUser & BaseEntity>
      columns={columns as ColumnDef<TableTestUser & BaseEntity>[]}
      data={testUsers}
      emptyStateMessage="Sorry, No Test Users Found."
      exportFilename="test_users_export"
      searchPlaceholder="البحث في بيانات الممتحنين..."
    />
  );
}
