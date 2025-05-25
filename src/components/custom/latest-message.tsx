import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Message = {
  role: "examiner" | "candidate";
  content: string;
  timestamp: string;
};

export default function LatestMessage({ message }: { message: Message | undefined }) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message | undefined>(undefined);

  useEffect(() => {
    if (message !== currentMessage) {
      // Start fade out
      setIsVisible(false);

      // Wait for fade out, then update message and fade in
      const timer = setTimeout(() => {
        setCurrentMessage(message);
        setIsVisible(true);
      }, 300); // Match this with the transition duration

      return () => clearTimeout(timer);
    }
  }, [message, currentMessage]);

  if (!currentMessage) return null;

  return (
    <div
      className={cn(
        "transition-opacity ltr duration-300 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] mx-auto rounded-lg p-4 mb-4",
          currentMessage.role === "examiner"
            ? "bg-blue-100 text-blue-900"
            : "bg-green-100 text-green-900",
        )}
      >
        <div className="font-semibold mb-1">
          {currentMessage.role === "examiner" ? "Examiner" : "You"}
        </div>
        <div className="whitespace-pre-wrap break-words">{currentMessage.content}</div>
        <div className="text-xs mt-2 opacity-70">{currentMessage.timestamp}</div>
      </div>
    </div>
  );
}
