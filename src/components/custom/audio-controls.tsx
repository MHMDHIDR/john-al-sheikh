import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type AudioControlsProps = {
  isRecording: boolean;
  onToggleRecording: () => void;
  disabled?: boolean;
};

export const AudioControls: React.FC<AudioControlsProps> = ({
  isRecording,
  onToggleRecording,
  disabled = false,
}) => {
  return (
    <div className="flex justify-center items-center p-4 border-t">
      <Button
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        className="rounded-full w-12 h-12 p-0 cursor-pointer"
        onClick={onToggleRecording}
        disabled={disabled}
      >
        {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>
    </div>
  );
};
