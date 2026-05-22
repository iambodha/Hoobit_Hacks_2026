import Link from "next/link";

const defaultLinks = [
  { label: "Registration", href: "#registration" },
  { label: "Discord", href: "#discord" },
  { label: "Instagram", href: "#instagram" },
  { label: "YouTube", href: "#youtube" },
  { label: "LinkedIn", href: "#linkedin" },
];

type BottomHoverNavProps = {
  links?: ReadonlyArray<{
    label: string;
    href: string;
  }>;
};

export function BottomHoverNav({ links = defaultLinks }: BottomHoverNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 px-4 sm:bottom-6" aria-label="Social and registration links">
      <div className="mx-auto w-full max-w-4xl">
        <div className="group pointer-events-auto rounded-full border border-white/12 bg-black/70 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#65ff6d]/35 hover:bg-black/85 sm:px-5">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
            <span className="text-[0.68rem] uppercase tracking-[0.35em] text-white/45 transition-colors duration-300 group-hover:text-[#65ff6d]/90">
              Hover for links
            </span>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.12em] text-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#65ff6d]/40 hover:bg-[#65ff6d]/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}