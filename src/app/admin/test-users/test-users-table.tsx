"use client";

import { DataTable } from "@/components/custom/data-table";
import { baseColumns } from "@/components/custom/data-table/base-columns";
import { userColumns } from "./test-users-columns";
import type { TableTestUser } from "./page";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type { ColumnDef } from "@tanstack/react-table";

export default function TestUsersTable({
  testUsers,
}: {
  testUsers: (TableTestUser & BaseEntity)[];
}) {
  const columns = [...baseColumns(), ...userColumns];

  return (
    <DataTable<TableTestUser & BaseEntity>
      columns={columns as ColumnDef<TableTestUser & BaseEntity>[]}
      data={testUsers}
      emptyStateMessage="لا يوجد ممتحنين."
      exportFilename="test_users_export"
      searchPlaceholder="البحث في بيانات الممتحنين..."
    />
  );
}
