"use client";

import { useState } from "react";
import { AudioControls } from "@/components/custom/audio-controls";
import { ChatMessage } from "@/components/custom/chat-message";
import { AuroraText } from "@/components/magicui/aurora-text";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SpeechChat() {
  const [isRecording, setIsRecording] = useState(false);

  const demoMessages = [
    { message: "Section 1: Introduction", timestamp: "00:00" },
    { message: "Reply to introduction", timestamp: "01:00", isReply: true },
    { message: "Section 2: Main topic", timestamp: "00:45" },
    { message: "Section 3: Conclusion", timestamp: "01:00" },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg h-[600px] flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b">
          <h1 className="text-center text-2xl font-black">
            <AuroraText>اختبار المحادثة التجريبي</AuroraText>
          </h1>
        </div>

        {/* Chat messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {demoMessages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                message={msg.message}
                timestamp={msg.timestamp}
                isReply={msg.isReply}
                onReply={() => console.log("Reply to:", msg.message)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Audio controls */}
        <AudioControls
          isRecording={isRecording}
          onToggleRecording={() => setIsRecording(!isRecording)}
        />
      </Card>
    </div>
  );
}
