import type { CSSProperties } from "react";
import Link from "next/link";

const defaultLinks = [
  {
    label: "Registration",
    href: "https://hoobit-hacks-2026.devpost.com/",
    tone: "registration",
  },
  {
    label: "Discord",
    href: "https://discord.gg/ZdZhurPz2b",
    tone: "discord",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/hoobit_official/",
    tone: "instagram",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@hoobit.official",
    tone: "youtube",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/112567391/",
    tone: "linkedin",
  },
];

const toneStyles = {
  registration: {
    color: "#8effa6",
    glow: "rgba(39, 255, 64, 0.22)",
  },
  discord: {
    color: "#b6c0ff",
    glow: "rgba(64, 78, 237, 0.22)",
  },
  instagram: {
    color: "#ffb5da",
    glow: "rgba(255, 67, 152, 0.22)",
  },
  youtube: {
    color: "#ffb3b3",
    glow: "rgba(255, 49, 49, 0.22)",
  },
  linkedin: {
    color: "#9dd1ff",
    glow: "rgba(10, 102, 194, 0.22)",
  },
} as const;

type ToneName = keyof typeof toneStyles;

function getToneStyle(tone?: string): CSSProperties {
  const resolvedTone =
    tone && tone in toneStyles
      ? toneStyles[tone as ToneName]
      : toneStyles.registration;

  return {
    "--nav-link-color": resolvedTone.color,
    "--nav-link-glow": resolvedTone.glow,
  } as CSSProperties;
}

type BottomHoverNavProps = {
  className?: string;
  links?: ReadonlyArray<{
    label: string;
    href: string;
    tone?: string;
  }>;
};

export function BottomHoverNav({
  className = "",
  links = defaultLinks,
}: BottomHoverNavProps) {
  return (
    <nav
      className={`fixed inset-x-0 bottom-4 z-50 px-4 sm:bottom-6 ${className}`.trim()}
      aria-label="Social and registration links"
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="bottom-hover-nav-shell pointer-events-auto">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-label={link.label}
              title={link.label}
              className="nav-link-bar-item"
              target="_blank"
              rel="noopener noreferrer"
              style={getToneStyle(link.tone)}
            >
              <span className="nav-link-bar-label">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
