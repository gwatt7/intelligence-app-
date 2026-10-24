import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { missingAuthConfig } from "@/lib/auth/credentials";
import { safeNextPath } from "@/lib/auth/session";

export const metadata = { title: "Sign in · UWS Men's Hockey · NORTHSTAR" };

const ERRORS: Record<string, string> = {
  invalid: "That username/email and password don't match. Please try again.",
  "not-configured": "Sign-in isn't set up yet. Ask your administrator to configure Northstar accounts.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; signedOut?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const configured = missingAuthConfig().length === 0;
  const error = params.error ? ERRORS[params.error] : undefined;

  return (
    // Overrides the dashboard's dark default border color (globals.css) for this light page.
    <div
      className="min-h-screen bg-[#bebebe] text-black flex flex-col items-center justify-center px-4 py-10"
      style={{ "--border": "#d4d4d4" } as React.CSSProperties}
    >
      <Link href="/" aria-label="Northstar home">
        <Image src="/northstar.png" alt="Northstar" width={1536} height={1024} className="w-56 h-auto" priority />
      </Link>

      <div className="mt-4 w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
        {/* Team identity */}
        <div className="flex items-center gap-3 border-b pb-5">
          <Image src="/uws-logo.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-md" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Team workspace</p>
            <h1 className="text-xl font-black italic tracking-wide">UWS MEN&apos;S HOCKEY</h1>
          </div>
        </div>

        <p className="mt-5 text-sm text-neutral-600">Sign in to open the UWS Men&apos;s Hockey analytics dashboard.</p>

        {params.signedOut && !error && (
          <p role="status" className="mt-4 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
            You&apos;ve been signed out.
          </p>
        )}

        {!configured ? (
          <p role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {ERRORS["not-configured"]}
          </p>
        ) : (
          error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )
        )}

        <LoginForm next={next} disabled={!configured} />

        <Link
          href="/"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
