"use client";

import confetti from "canvas-confetti";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export type ConfettiRef = {
  fire: (options?: confetti.Options) => void;
};

export type ConfettiProps = {
  className?: string;
  onMouseEnter?: () => void;
  onClick?: () => void;
};

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(
  ({ className, onMouseEnter, onClick }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
      fire: (options = {}) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const myConfetti = confetti.create(canvas, {
          resize: true,
          useWorker: true,
        });

        return myConfetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          ...options,
        });
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        className={cn("pointer-events-auto", className)}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
      />
    );
  },
);

Confetti.displayName = "Confetti";

export function ConfettiSideCannons({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const handleClick = () => {
    const end = Date.now() + 3 * 1000; // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };

    frame();
  };

  return (
    <Button
      className={cn(className)}
      onClick={e => {
        handleClick();
        props.onClick?.(e);
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

export function ConfettiCelebration() {
  const fireConfetti = () => {
    const end = Date.now() + 3 * 1000;
    const colors = ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"];

    (function frame() {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Also fire from the top
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0 },
      colors: colors,
    });
  };

  return { fireConfetti };
}
