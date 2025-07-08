"use client";

import { DataTable } from "@/components/custom/data-table";
import { userColumns } from "./test-users-columns";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type { SpeakingTest, Users } from "@/server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";

export default function TestUsersTable({
  testUsers,
}: {
  testUsers: (SpeakingTest & BaseEntity)[];
}) {
  const columns = [...userColumns];

  return (
    <DataTable<SpeakingTest & BaseEntity>
      columns={columns as ColumnDef<SpeakingTest & BaseEntity>[]}
      data={testUsers}
      emptyStateMessage="Sorry, No Test Users Found."
      exportFilename="test_users_export"
    />
  );
}
