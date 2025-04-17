import { Mic, Square } from "lucide-react";

type RecordButtonProps = {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function ButtonRecord({ isRecording, onClick, disabled = false }: RecordButtonProps) {
  return (
    <button
      id="recording-button"
      className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded-full transition-all ${
        isRecording ? "animate-pulse bg-red-600" : "bg-black text-white hover:bg-gray-800"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {isRecording ? (
        <Square className="h-8 w-8 text-white" />
      ) : (
        <Mic className="h-8 w-8 text-white" />
      )}
    </button>
  );
}
