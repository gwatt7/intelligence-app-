import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { HurtsToWin } from "@/components/landing/HurtsToWin";

// Public Northstar landing page — the first screen of the app.
// It is separate from the analytics dashboard (app/(app)/dashboard); the
// ENTER button takes you there.
export default function LandingPage() {
  return (
    // The app's global CSS (globals.css) styles the dark dashboard: it sets a
    // dark default border color and adds a gold tick to headings inside
    // <main>. This light page overrides --border locally and uses
    // role="main" so neither leaks in.
    <div
      className="min-h-screen bg-[#bfbfbf] text-black flex flex-col"
      style={{ "--border": "#d4d4d4" } as React.CSSProperties}
    >
      <div role="main" className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-14">
        <h1 className="sr-only">Northstar</h1>

        {/* Exact northstar.png supplied by the team (public/northstar.png). */}
        <Image
          src="/northstar.png"
          alt="Northstar"
          width={1536}
          height={1024}
          priority
          className="w-full max-w-[560px] h-auto"
        />

        <HurtsToWin className="-mt-4 sm:-mt-8 w-full max-w-[460px] h-auto" />

        <p className="mt-5 text-lg sm:text-xl font-semibold text-neutral-800 text-center">
          Your team&apos;s performance starts here.
        </p>

        {/* Team selection */}
        <section aria-labelledby="team-heading" className="mt-10 w-full max-w-md">
          <h2 id="team-heading" className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-700 text-center mb-3">
            Select your team
          </h2>

          <div
            role="radiogroup"
            aria-labelledby="team-heading"
            className="rounded-2xl bg-white/80 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
          >
            <div
              role="radio"
              aria-checked="true"
              className="flex items-center gap-4 rounded-xl border-2 bg-white px-4 py-4 shadow-[0_0_0_3px_#fcd306]"
              style={{ borderColor: "#000" }}
            >
              <Image src="/uws-logo.png" alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-black italic tracking-wide text-black leading-tight">UWS MEN&apos;S HOCKEY</p>
                <p className="text-sm text-neutral-600">UW–Superior Yellow Jackets</p>
              </div>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fcd306] text-black">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-4 text-lg font-black uppercase tracking-[0.2em] text-[#fcd306] shadow-[0_6px_0_#fcd306] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#fcd306]"
          >
            Enter
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        </section>
      </div>

      <footer className="pb-6 text-center text-xs text-neutral-600">© Northstar · UWS Men&apos;s Hockey</footer>
    </div>
  );
}
