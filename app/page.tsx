"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BottomHoverNav } from "./components/bottom-hover-nav";
import { TypewriterTitle } from "./components/typewriter-title";

const sectionIds = [
  "hero",
  "social-proof",
  "hackathon-overview",
  "theme-lock",
] as const;

const SOCIAL_PROOF_ROW_COUNT = 4;
const fallbackSocialProofAvatarFiles = [
  "abdulkadernafees.png",
  "abhinavmgarg.png",
  "aditisingh2310.png",
  "adityavshah1018work.png",
  "aghoshjohnsonofficial.jpg",
  "ajaymudliyar66.png",
  "akhileshgupta26.jpg",
  "akilan513.png",
  "anamasgard.jpg",
  "aryanji9628.png",
  "ashley-aa511.jpg",
  "ashwindh-ramesh2325.jpg",
  "atharv.jpg",
  "baruauttapal005.png",
] as const;

type SocialProofTile = {
  key: string;
  tone: number;
  avatarSrc: string;
};

type SocialProofRowGroup = {
  key: string;
  tiles: SocialProofTile[];
};

type AvatarManifest = {
  files?: string[];
};

const socialProofRows = {
  top: [
    { key: "top-1", direction: "right", speed: 42, toneOffset: 0 },
    { key: "top-2", direction: "left", speed: 36, toneOffset: 1 },
  ],
  bottom: [
    { key: "bot-1", direction: "left", speed: 34, toneOffset: 2 },
    { key: "bot-2", direction: "right", speed: 40, toneOffset: 0 },
  ],
};

const socialProofRowDefinitions = [
  ...socialProofRows.top,
  ...socialProofRows.bottom,
] as const;

function shuffleValues<T>(values: T[]): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function buildSocialProofRowGroups(files: string[]): SocialProofRowGroup[] {
  const shuffledFiles = shuffleValues(files);
  const baseChunkSize = Math.floor(shuffledFiles.length / SOCIAL_PROOF_ROW_COUNT);
  const remainder = shuffledFiles.length % SOCIAL_PROOF_ROW_COUNT;
  let startIndex = 0;

  return socialProofRowDefinitions.map((row, rowIndex) => {
    const chunkSize = baseChunkSize + (rowIndex < remainder ? 1 : 0);
    const rowFiles = shuffledFiles.slice(startIndex, startIndex + chunkSize);
    startIndex += chunkSize;

    return {
      key: row.key,
      tiles: rowFiles.map((fileName, tileIndex) => ({
        key: `${row.key}-${tileIndex}-${fileName}`,
        tone: (tileIndex % 4) + 1,
        avatarSrc: `/community-avatars/${fileName}`,
      })),
    };
  });
}

function buildFallbackSocialProofRowGroups(): SocialProofRowGroup[] {
  const files = [...fallbackSocialProofAvatarFiles];
  const baseChunkSize = Math.floor(files.length / SOCIAL_PROOF_ROW_COUNT);
  const remainder = files.length % SOCIAL_PROOF_ROW_COUNT;
  let startIndex = 0;

  return socialProofRowDefinitions.map((row, rowIndex) => {
    const chunkSize = baseChunkSize + (rowIndex < remainder ? 1 : 0);
    const rowFiles = files.slice(startIndex, startIndex + chunkSize);
    startIndex += chunkSize;

    return {
      key: row.key,
      tiles: rowFiles.map((fileName, tileIndex) => ({
        key: `${row.key}-${tileIndex}-${fileName}`,
        tone: (tileIndex % 4) + 1,
        avatarSrc: `/community-avatars/${fileName}`,
      })),
    };
  });
}

const hackathonQuestions = [
  {
    key: "eligibility",
    placement: "top-left",
    question: "Who can join?",
    answer:
      "Students ages 13 to 24 from around the world. High school, university, bootcamp, or younger all fit here.",
  },
  {
    key: "challenge",
    placement: "top-right",
    question: "What are we building?",
    answer:
      "An AI-powered tool or platform around a locked theme that gets revealed on opening day.",
  },
  {
    key: "timeline",
    placement: "middle-left",
    question: "How long do we get?",
    answer:
      "Four weeks online, with submissions due on July 1, 2026 at 8:00pm GMT+2.",
  },
  {
    key: "prototype",
    placement: "middle-right",
    question: "Prototype or pitch deck?",
    answer:
      "Prototype. If full access is tough, a short demo video still needs to show something real working.",
  },
  {
    key: "beginner",
    placement: "bottom-left",
    question: "Is it beginner friendly?",
    answer:
      "Yes. It is designed for students learning in public, trying new tools, and building with support.",
  },
  {
    key: "ai",
    placement: "bottom-right",
    question: "Can I use AI?",
    answer:
      "Absolutely for prototyping, coding, and design. Just disclose it and do not let it replace your own ideas or voice.",
  },
] as const;

export default function Home() {
  const [showAfterIntro, setShowAfterIntro] = useState(false);
  const [themeLockShakeTick, setThemeLockShakeTick] = useState(0);
  const [showThemePopup, setShowThemePopup] = useState(false);
  const [socialProofRowGroups, setSocialProofRowGroups] = useState<SocialProofRowGroup[]>(
    () => buildFallbackSocialProofRowGroups(),
  );
  const snapLockUntilRef = useRef(0);
  const snapReleaseTimerRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadAvatarManifest = async () => {
      try {
        const response = await fetch("/community-avatars/manifest.json", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const manifest = (await response.json()) as AvatarManifest;

        if (!manifest.files || manifest.files.length === 0) {
          return;
        }

        setSocialProofRowGroups(buildSocialProofRowGroups(manifest.files));
      } catch {
        return;
      }
    };

    void loadAvatarManifest();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!showThemePopup) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowThemePopup(false);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [showThemePopup]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const sections = sectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length < 2) {
      return;
    }

    lastScrollYRef.current = window.scrollY;

    const releaseSnapLock = () => {
      snapLockUntilRef.current = 0;
      snapReleaseTimerRef.current = null;
    };

    const snapToSection = (sectionIndex: number) => {
      const section = sections[sectionIndex];

      if (!section) {
        return;
      }

      snapLockUntilRef.current = Date.now() + 700;

      if (snapReleaseTimerRef.current !== null) {
        window.clearTimeout(snapReleaseTimerRef.current);
      }

      snapReleaseTimerRef.current = window.setTimeout(releaseSnapLock, 700);

      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    const evaluateScroll = () => {
      scrollFrameRef.current = null;

      if (Date.now() < snapLockUntilRef.current) {
        return;
      }

      const currentScrollY = window.scrollY;
      const direction =
        currentScrollY > lastScrollYRef.current
          ? 1
          : currentScrollY < lastScrollYRef.current
            ? -1
            : 0;

      lastScrollYRef.current = currentScrollY;

      if (direction === 0) {
        return;
      }

      const currentIndex = sections.findIndex((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;

        if (index === sections.length - 1) {
          return currentScrollY >= sectionTop && currentScrollY <= sectionBottom;
        }

        return currentScrollY >= sectionTop && currentScrollY < sectionBottom;
      });

      const activeIndex =
        currentIndex === -1
          ? Math.min(
              sections.length - 1,
              Math.max(0, Math.floor(currentScrollY / window.innerHeight)),
            )
          : currentIndex;

      const activeSection = sections[activeIndex];

      if (!activeSection) {
        return;
      }

      const sectionOffset = currentScrollY - activeSection.offsetTop;
      const snapThreshold = window.innerHeight * 0.2;

      if (
        direction > 0 &&
        sectionOffset > snapThreshold &&
        activeIndex < sections.length - 1
      ) {
        snapToSection(activeIndex + 1);
      }

      if (direction < 0 && sectionOffset < snapThreshold && activeIndex > 0) {
        snapToSection(activeIndex - 1);
      }
    };

    const handleScroll = () => {
      if (scrollFrameRef.current !== null) {
        return;
      }

      scrollFrameRef.current = window.requestAnimationFrame(evaluateScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }

      if (snapReleaseTimerRef.current !== null) {
        window.clearTimeout(snapReleaseTimerRef.current);
      }
    };
  }, []);

  function handleScrollDown() {
    document.getElementById("social-proof")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main className="min-h-screen bg-black">
      <section
        id="hero"
        className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 text-center"
      >
        <div className="w-full">
          <TypewriterTitle onSettledComplete={() => setShowAfterIntro(true)} />
        </div>

        <div className="mt-8 flex min-h-[104px] w-full items-start justify-center sm:min-h-[116px]">
          <p
            className={`intro-copy mx-auto max-w-3xl text-base leading-8 text-white/90 sm:text-lg lg:text-xl ${
              showAfterIntro ? "intro-copy-visible" : ""
            }`.trim()}
            aria-hidden={!showAfterIntro}
          >
            Hoobit Hacks 2026 is a four-week global student hackathon where you
            build an AI-powered prototype, uncover the theme on opening day,
            and ship something real with a community behind you.
          </p>
        </div>

        {showAfterIntro ? (
          <button
            type="button"
            onClick={handleScrollDown}
            className="scroll-cue mt-8 scroll-cue-visible"
            aria-label="Scroll down"
          >
            <span className="sr-only">Scroll down</span>
            <span className="scroll-cue-arrows" aria-hidden="true">
              <svg
                viewBox="0 0 24 14"
                className="scroll-cue-arrow scroll-cue-arrow-first"
              >
                <path d="M3 3L12 11L21 3" />
              </svg>
              <svg
                viewBox="0 0 24 14"
                className="scroll-cue-arrow scroll-cue-arrow-second"
              >
                <path d="M3 3L12 11L21 3" />
              </svg>
            </span>
          </button>
        ) : null}
      </section>

      <BottomHoverNav
        className={showAfterIntro ? "nav-reveal nav-reveal-visible" : "nav-reveal"}
      />

      <section
        id="social-proof"
        className="social-proof-section mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-24 sm:px-10"
      >
        <div className="social-proof-stage">
          <div className="social-proof-row-group" aria-hidden="true">
            {socialProofRows.top.map((row) => {
              const rowTiles =
                socialProofRowGroups.find((group) => group.key === row.key)?.tiles ?? [];

              return (
              <div key={row.key} className="social-proof-row-wrap">
                <div
                  className={`social-proof-row-track social-proof-row-track-${row.direction}`}
                  style={{ animationDuration: `${row.speed}s` }}
                >
                  {Array.from({ length: 2 }).map((_, copyIndex) =>
                    rowTiles.map((tile, tileIndex) => (
                      <span
                        key={`${row.key}-${copyIndex}-${tile.key}`}
                        className={`social-proof-box social-proof-box-tone-${
                          ((tile.tone + row.toneOffset + tileIndex) % 4) + 1
                        }`}
                      >
                        <Image
                          src={tile.avatarSrc}
                          alt=""
                          className="social-proof-avatar"
                          width={128}
                          height={128}
                          sizes="(max-width: 640px) 3rem, 5rem"
                          loading="lazy"
                        />
                      </span>
                    )),
                  )}
                </div>
              </div>
              );
            })}
          </div>

          <div className="social-proof-center">
            <div className="social-proof-copy">
              <p
                className="social-proof-kicker terminal-title hero-flicker"
                aria-label="We are Hoobit"
              >
                WE ARE HOOBIT
              </p>
              <p className="social-proof-subtitle">
                A community of 1000+ students across the globe
              </p>
            </div>
          </div>

          <div className="social-proof-row-group" aria-hidden="true">
            {socialProofRows.bottom.map((row) => {
              const rowTiles =
                socialProofRowGroups.find((group) => group.key === row.key)?.tiles ?? [];

              return (
              <div key={row.key} className="social-proof-row-wrap">
                <div
                  className={`social-proof-row-track social-proof-row-track-${row.direction}`}
                  style={{ animationDuration: `${row.speed}s` }}
                >
                  {Array.from({ length: 2 }).map((_, copyIndex) =>
                    rowTiles.map((tile, tileIndex) => (
                      <span
                        key={`${row.key}-${copyIndex}-${tile.key}`}
                        className={`social-proof-box social-proof-box-tone-${
                          ((tile.tone + row.toneOffset + tileIndex) % 4) + 1
                        }`}
                      >
                        <Image
                          src={tile.avatarSrc}
                          alt=""
                          className="social-proof-avatar"
                          width={128}
                          height={128}
                          sizes="(max-width: 640px) 3rem, 5rem"
                          loading="lazy"
                        />
                      </span>
                    )),
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="hackathon-overview"
        className="hackathon-section mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-24 sm:px-10"
      >
        <div className="hackathon-stage">
          <div className="hackathon-core">
            <p className="hackathon-core-prompt">What&apos;s Hoobit Hacks 2026?</p>
            <h2 className="hackathon-core-title terminal-title hero-flicker">
              A global student hackathon for builders who ship.
            </h2>
            <p className="hackathon-core-copy">
                Four weeks. One challenge. A theme revealed on opening day. Your
                mission is to make an AI-powered prototype people can actually
                use, not just a deck about what you might build someday.
              </p>
            </div>

            <div className="hackathon-question-field">
              {hackathonQuestions.map((item, index) => (
                <article
                  key={item.key}
                  className={`hackathon-question-card hackathon-question-card-${item.placement}`}
                  style={{ animationDelay: `${index * 180}ms` }}
                >
                  <p className="hackathon-question-title">{item.question}</p>
                  <p className="hackathon-question-answer">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
      </section>

      <section
        id="theme-lock"
        className="theme-section mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-24 sm:px-10"
      >
        <div className="theme-stage">
          <button
            type="button"
            className="theme-lock-button"
            onClick={() => {
              setThemeLockShakeTick((value) => value + 1);
              setShowThemePopup(true);
            }}
            aria-label="Locked theme vault"
            aria-describedby={showThemePopup ? "theme-lock-status" : undefined}
          >
            <span
              key={themeLockShakeTick}
              className={`theme-lock-icon ${
                themeLockShakeTick > 0 ? "theme-lock-icon-shake" : ""
              }`.trim()}
              aria-hidden="true"
            >
              <span className="theme-lock-shackle" />
              <span className="theme-lock-body">
                <span className="theme-lock-keyhole" />
              </span>
            </span>
          </button>

          {showThemePopup ? (
            <div
              id="theme-lock-status"
              className="theme-popup theme-popup-visible"
              aria-live="polite"
              role="status"
            >
              <p className="theme-popup-title">Access denied</p>
              <p className="theme-popup-body">
                Theme reveal in a few weeks. You&apos;ll have to wait.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
