"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const inputClass =
  "mt-1 block w-full rounded-xl border-2 bg-white px-3 py-2.5 text-base text-black placeholder:text-neutral-400 focus:outline-none focus:ring-[3px] focus:ring-[#fcd306] disabled:bg-neutral-100";
// globals.css forces a dark color-scheme on inputs; this page is light.
const inputStyle = { colorScheme: "light" } as const;

// Posts to /api/auth/login, which checks the credentials on the server and
// sets the session cookie. Works without JavaScript too.
export function LoginForm({ next, disabled }: { next: string; disabled: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form action="/api/auth/login" method="post" className="mt-5 space-y-4" onSubmit={() => setSubmitting(true)}>
      <input type="hidden" name="next" value={next} />

      <label className="block text-sm font-semibold text-neutral-800">
        Username or email
        <input
          name="identifier"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          disabled={disabled}
          className={inputClass}
          style={inputStyle}
        />
      </label>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-neutral-800">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={disabled}
            className={`${inputClass} pr-24`}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-controls="password"
            disabled={disabled}
            className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-base font-black uppercase tracking-[0.15em] text-[#fcd306] hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign In
      </button>
    </form>
  );
}
