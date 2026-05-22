import { TypewriterTitle } from "./components/typewriter-title";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center">
      <div className="max-w-5xl">
        <TypewriterTitle />
        <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-white/90 sm:text-lg lg:text-xl">
          A clean black terminal-style landing page with Mojangles as the default
          font and a flickering green headline centered on screen.
        </p>
      </div>
    </main>
  );
}
