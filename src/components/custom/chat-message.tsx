import { MessageCircleReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ChatMessageProps = {
  timestamp?: string;
  message?: string;
  isReply?: boolean;
  onReply?: () => void;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  timestamp,
  message,
  isReply,
  onReply,
}) => {
  return (
    <div className={`flex ${isReply ? "justify-end" : "justify-start"} my-2`}>
      <Card className={`p-4 max-w-[80%] ${isReply ? "bg-primary/10" : "bg-white"}`}>
        <div className="flex flex-col gap-2">
          <div className="h-8 bg-gray-100 rounded-md overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-purple-100 to-purple-200 animate-pulse">
              {message}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-xs text-gray-500">{timestamp || "00:00"}</span>
            {!isReply && (
              <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={onReply}>
                <MessageCircleReply className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
