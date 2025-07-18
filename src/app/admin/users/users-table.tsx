"use client";

import { DataTable } from "@/components/custom/data-table";
import { baseColumns } from "@/components/custom/data-table/base-columns";
import { userColumns } from "./users-columns";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type { Users } from "@/server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";

export default function UsersTable({ users }: { users: (Users & BaseEntity)[] }) {
  const columns = [...baseColumns(), ...userColumns];

  return (
    <DataTable<Users & BaseEntity>
      columns={columns as ColumnDef<Users & BaseEntity>[]}
      data={users}
      emptyStateMessage="لا يوجد مستخدمين."
      exportFilename="users_export"
      searchPlaceholder="البحث في بيانات المستخدمين..."
    />
  );
}
