"use client";

import { useEffect, useRef, useState } from "react";

const TITLE = "Hoobit Hacks 2026";
const TYPE_INTERVAL_MS = 165;
const FLICKER_SETTLE_MS = 1000;

type TypewriterTitleProps = {
  onSettledComplete?: () => void;
};

export function TypewriterTitle({ onSettledComplete }: TypewriterTitleProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isSettled, setIsSettled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedAudioRef = useRef(false);
  const hasCalledCompleteRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/Effects/Sound_Typing.mp3");
    audio.loop = true;
    audio.volume = 0.28;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
      hasStartedAudioRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (visibleCount >= TITLE.length) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      hasStartedAudioRef.current = false;

      const settleTimeoutId = window.setTimeout(() => {
        setIsSettled(true);
      }, FLICKER_SETTLE_MS);

      return () => {
        window.clearTimeout(settleTimeoutId);
      };
    }

    if (!hasStartedAudioRef.current && audioRef.current) {
      hasStartedAudioRef.current = true;
      void audioRef.current.play().catch(() => {
        return;
      });
    }

    const timeoutId = window.setTimeout(() => {
      setVisibleCount((current) => current + 1);
    }, TYPE_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [visibleCount]);

  useEffect(() => {
    if (!isSettled || hasCalledCompleteRef.current) {
      return;
    }

    hasCalledCompleteRef.current = true;
    onSettledComplete?.();
  }, [isSettled, onSettledComplete]);

  return (
    <h1
      className="relative min-h-[1em] w-full overflow-visible text-center text-[clamp(0.95rem,6vw,6rem)] font-normal uppercase leading-none tracking-[0.05em]"
      aria-label={TITLE}
    >
      <span className="typewriter-stage" aria-hidden="true">
        <span className={`typewriter-live ${isSettled ? "" : "hero-flicker"}`.trim()}>
          <span className="terminal-title">{TITLE.slice(0, visibleCount)}</span>
          {!isSettled ? (
            <span className="typewriter-cursor" aria-hidden="true">
              _
            </span>
          ) : null}
        </span>
      </span>
    </h1>
  );
}
