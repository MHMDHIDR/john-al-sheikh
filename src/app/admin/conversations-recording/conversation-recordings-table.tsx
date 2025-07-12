"use client";

import { DataTable } from "@/components/custom/data-table";
import { conversationRecordingsColumns } from "./conversation-recordings-columns";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type { Users } from "@/server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";

export type ConversationRecording = {
  id: string;
  topic: string;
  type: "MOCK" | "PRACTICE" | "OFFICIAL";
  callId: string | null;
  createdAt: Date;
  user: {
    id: Users["id"];
    name: Users["name"];
    username: Users["username"];
    phone: Users["phone"];
    displayName: Users["displayName"];
    email: Users["email"];
    gender: Users["gender"];
  };
};

export default function ConversationRecordingsTable({
  recordings,
}: {
  recordings: (ConversationRecording & BaseEntity)[];
}) {
  return (
    <DataTable<ConversationRecording & BaseEntity>
      columns={conversationRecordingsColumns as ColumnDef<ConversationRecording & BaseEntity>[]}
      data={recordings}
      emptyStateMessage="عذراً، لم يتم العثور على تسجيلات محادثات."
      exportFilename="conversation_recordings_export"
      searchPlaceholder="البحث في تسجيلات المحادثات..."
    />
  );
}
