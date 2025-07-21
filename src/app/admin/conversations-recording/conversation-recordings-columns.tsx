import { IconMoustache, IconWoman } from "@tabler/icons-react";
import { ArrowUpDown, Headphones, MoreHorizontal } from "lucide-react";
import Link from "next/link";
// import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format-date";
// import { api } from "@/trpc/react";
import type { ConversationRecording } from "./conversation-recordings-table";
import type { ColumnDef } from "@tanstack/react-table";

// Wrapper component to handle actions
const ConversationRecordingsActionsCell: React.FC<{ recording: ConversationRecording }> = ({
  recording,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">الإجراءات</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="rtl">
        <DropdownMenuLabel className="select-none bg-accent">الإجراءات</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/admin/conversations-recording/${recording.callId ?? ""}`}>
            <Headphones className="mr-0.5 size-4" />
            استماع للتسجيل
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// // Helper to format seconds as mm:ss
// function formatDuration(seconds: number) {
//   if (!seconds || isNaN(seconds)) return "-";
//   const mins = Math.floor(seconds / 60);
//   const secs = Math.floor(seconds % 60);
//   return `${mins}:${secs.toString().padStart(2, "0")}`;
// }

// // Duration cell component
// const DurationCell: React.FC<{ callId: string | null }> = ({ callId }) => {
//   const [duration, setDuration] = useState<number | null>(null);
//   const { data, isLoading } = api.vapi.getRecordingUrl.useQuery(
//     { callId: callId ?? "" },
//     { enabled: !!callId },
//   );

//   // Use a hidden audio element to extract duration
//   return callId ? (
//     data?.recordingUrl ? (
//       <span>
//         <audio
//           src={data.recordingUrl}
//           preload="metadata"
//           style={{ display: "none" }}
//           onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
//         />
//         {duration !== null ? (
//           formatDuration(duration)
//         ) : (
//           <span className="text-xs text-muted-foreground">...</span>
//         )}
//       </span>
//     ) : (
//       <span className="text-xs text-muted-foreground">
//         {isLoading ? <Skeleton className="w-full h-3" /> : "—"}
//       </span>
//     )
//   ) : (
//     <span className="text-muted-foreground select-none">-</span>
//   );
// };

export const conversationRecordingsColumns: ColumnDef<ConversationRecording>[] = [
  {
    accessorKey: "user.name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        الإسم
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const user = row.original.user;
      const name = user?.name;
      const gender = user.gender;
      const callId = row.original.callId;

      return (
        <TooltipProvider>
          <span className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                {gender === "male" ? <IconMoustache /> : <IconWoman />}
              </TooltipTrigger>
              <TooltipContent>{gender === "male" ? "ذكر" : "أنثى"}</TooltipContent>
            </Tooltip>
            <Link href={`/admin/conversations-recording/${callId ?? ""}`}>
              <span className="text-muted-foreground select-none">{name}</span>
            </Link>
          </span>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "user.email",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        البريد الإلكتروني
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const email = row.original.user.email;
      const callId = row.original.callId;
      return <Link href={`/admin/conversations-recording/${callId ?? ""}`}>{email}</Link>;
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        رقم الهاتف
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const phone = row.original.user.phone;

      return phone ? (
        <Link href={`tel:${phone}`} dir="auto">
          <Button variant={"link"} className="p-0 select-none">
            {phone}
          </Button>
        </Link>
      ) : (
        <span className="text-muted-foreground select-none">غير متوفر</span>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        نوع الاختبار
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const type = String(row.getValue("type"));
      const typeMap = {
        MOCK: "تجريبي",
        PRACTICE: "تدريبي",
        OFFICIAL: "رسمي",
      };
      const callId = row.original.callId;
      return (
        <Link href={`/admin/conversations-recording/${callId ?? ""}`}>
          {typeMap[type as keyof typeof typeMap] || type}
        </Link>
      );
    },
  },
  // {
  //   accessorKey: "duration",
  //   header: () => <span>مدة التسجيل</span>,
  //   cell: ({ row }) => <DurationCell callId={row.original.callId} />,
  //   enableSorting: false,
  // },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        تاريخ المحادثة
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt");
      const callId = row.original.callId;
      return (
        <Link href={`/admin/conversations-recording/${callId ?? ""}`}>
          {formatDate(String(date), true, true)}
        </Link>
      );
    },
  },
  {
    accessorKey: "actions",
    header: "الإجراءات",
    cell: ({ row }) => <ConversationRecordingsActionsCell recording={row.original} />,
  },
];
