"use client";

import { FastForward, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AudioProgressControl } from "@/components/custom/audio-progress-control";
import { AudioVolumeControl } from "@/components/custom/audio-volume-control";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  subtitle?: string;
}

export default function AudioPlayer({
  audioUrl,
  title = "Audio Track",
  subtitle,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const prevVolume = useRef(1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector("header");
      const player = playerRef.current;
      if (!header || !player) return;

      const headerRect = header.getBoundingClientRect();
      const playerRect = player.getBoundingClientRect();

      setHeaderHeight(headerRect.height);

      // Check if the player's top reaches the header's bottom
      const headerBottom = headerRect.bottom;
      const playerTop = playerRect.top;
      setIsScrolled(playerTop <= headerBottom + 16); // 16px = top-4
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    // If metadata is already loaded (e.g. cached), set duration immediately
    if (audio.readyState >= 1) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const resetAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    if (isPlaying) {
      void audio.play();
    }
  };

  const handleProgressChange = (newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
      prevVolume.current = newVolume;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume.current || 1);
    } else {
      setIsMuted(true);
      prevVolume.current = volume;
      setVolume(0);
    }
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 10, duration);
    setCurrentTime(audio.currentTime);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 10, 0);
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card
      ref={playerRef}
      className={`w-full select-none max-w-2xl mx-auto mb-5 bg-black/85 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl transition-all duration-400 ${
        isScrolled ? "sticky shadow-2xl scale-[0.98] z-30 opacity-85 bg-black/75" : ""
      }`}
      style={isScrolled ? { top: `${headerHeight + 4}px` } : {}}
    >
      <CardHeader className={`pb-1 transition-all ${isScrolled ? "scale-0 h-0" : ""}`}>
        <CardTitle className="text-center text-xl font-bold text-white drop-shadow-sm">
          {title}
        </CardTitle>
        {subtitle && <p className="text-center text-sm text-white/70">{subtitle}</p>}
      </CardHeader>

      <CardContent className="px-5 py-3 text-white space-y-6">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <AudioProgressControl
              value={currentTime}
              max={duration}
              onChange={handleProgressChange}
              className="w-full"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-1 md:gap-2 ltr px-1">
            {/* Go Backward 10s */}
            <Button
              variant="ghost"
              size="icon"
              onClick={skipBackward}
              className="size-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:shadow-md transition"
            >
              <FastForward className="size-4.5 rotate-180" />
            </Button>
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="size-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:shadow-md transition"
            >
              {isPlaying ? <Pause className="size-4.5" /> : <Play className="size-4.5 ml-0.5" />}
            </Button>
            {/* Skip Forward 10s */}
            <Button
              variant="ghost"
              size="icon"
              onClick={skipForward}
              className="size-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:shadow-md transition"
            >
              <FastForward className="size-4.5" />
            </Button>
            {/* Reset */}
            <Button
              variant="ghost"
              size="icon"
              onClick={resetAudio}
              className="size-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:shadow-md transition"
            >
              <RotateCcw className="size-4.5" />
            </Button>
            {/* Volume Control */}
            <div
              className="flex items-center ltr relative"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              onFocus={() => setShowVolumeSlider(true)}
              onBlur={() => setShowVolumeSlider(false)}
            >
              {/* Mobile: Only icon, toggles mute */}
              <button
                type="button"
                aria-label={isMuted ? "Unmute" : "Mute"}
                onClick={toggleMute}
                className="md:hidden p-1"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="size-4.5" />
                ) : (
                  <Volume2 className="size-4.5" />
                )}
              </button>
              {/* Desktop: Icon + slider on hover/focus */}
              <div className="hidden md:flex items-center relative group">
                <button
                  type="button"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  onClick={toggleMute}
                  className="p-1 cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="size-4.5" />
                  ) : (
                    <Volume2 className="size-4.5" />
                  )}
                </button>
                <div
                  className={`transition-all duration-200 overflow-hidden flex items-center ml-2 ${
                    showVolumeSlider ? "w-28 opacity-100" : "w-0 opacity-0"
                  }`}
                >
                  <AudioVolumeControl
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-full"
                    showLabel
                  />
                </div>
              </div>
            </div>
            {/* Time Display */}
            <span className="flex-1 text-xs tabular-nums text-muted dark:text-muted-foreground min-w-[60px] text-right drop-shadow">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
