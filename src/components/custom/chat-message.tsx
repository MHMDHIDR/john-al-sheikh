import { format } from "date-fns";
import { MessageCircleReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChatMessageProps = {
  message: string;
  timestamp: string;
  isReply?: boolean;
  onReply?: () => void;
};

export function ChatMessage({ message, timestamp, isReply = false, onReply }: ChatMessageProps) {
  return (
    <div className={cn("flex w-full", isReply ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-4",
          isReply ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <p className="text-sm">{message}</p>
        <p className="mt-1 text-xs opacity-70">{format(new Date(timestamp), "h:mm a")}</p>
      </div>
    </div>
  );
}
