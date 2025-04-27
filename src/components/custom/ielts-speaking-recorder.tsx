"use client";

import { useConversation } from "@11labs/react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/env";
import { useMockTestStore } from "@/hooks/use-mock-test-store";

export default function IELTSSpeakingRecorder() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { addMessage } = useMockTestStore();

  const agentId = env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  const { status, isSpeaking, startSession, endSession, setVolume } = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
    },
    onMessage: ({ message: content, source }) => {
      const role = source === "ai" ? "examiner" : "candidate";
      const timestamp = new Date().toLocaleTimeString();

      addMessage({ role, content, timestamp });

      console.log("Received message:", content);
    },
    onError: (error: string | Error) => {
      setErrorMessage(typeof error === "string" ? error : error.message);
      console.error("Error:", error);
    },
  });

  useEffect(() => {
    // Request microphone permission on component mount
    const requestMicPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
      } catch (error) {
        setErrorMessage("Microphone access denied");
        console.error("Error accessing microphone:", error);
      }
    };

    requestMicPermission();
  }, []);

  const handleStartConversation = async () => {
    try {
      // Replace with your actual agent ID or URL
      const conversationId = await startSession({
        agentId,
      });
      console.log("Started conversation:", conversationId);
    } catch (error) {
      setErrorMessage("Failed to start conversation");
      console.error("Error starting conversation:", error);
    }
  };

  const handleEndConversation = async () => {
    try {
      await endSession();
    } catch (error) {
      setErrorMessage("Failed to end conversation");
      console.error("Error ending conversation:", error);
    }
  };

  const toggleMute = async () => {
    try {
      await setVolume({ volume: isMuted ? 1 : 0 });
      setIsMuted(!isMuted);
    } catch (error) {
      setErrorMessage("Failed to change volume");
      console.error("Error changing volume:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader hidden>
        <CardTitle className="flex items-center justify-between"></CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex justify-center items-center gap-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            disabled={status !== "connected"}
          >
            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>

          {status === "connected" ? (
            <Button variant="destructive" onClick={handleEndConversation} className="w-full">
              <MicOff className="mx-2 h-4 w-4" />
              إيقاف المحادثة
            </Button>
          ) : (
            <Button
              onClick={handleStartConversation}
              disabled={!hasPermission}
              className="w-full cursor-pointer"
            >
              <Mic className="mx-2 h-4 w-4" />
              بدأ المحادثة
            </Button>
          )}
        </div>

        {/* <div className="text-center text-sm">
          {status === "connected" && (
            <p className="text-green-600">{isSpeaking ? "Agent is speaking..." : "Listening..."}</p>
          )}
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          {!hasPermission && (
            <p className="text-yellow-600">Please allow microphone access to use voice chat</p>
          )}
        </div> */}
      </CardContent>
    </Card>
  );
}
