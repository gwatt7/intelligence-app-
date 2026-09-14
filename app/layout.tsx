import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/nav/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NORTHSTAR",
  description: "Coaching analytics and game-management platform",
  icons: {
    icon: "/uws-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Vercel sets these automatically at build time — surfacing them in the
  // sidebar makes it possible to tell, just by looking at the live site,
  // whether a given push actually made it into the deployment being served
  // (rather than guessing from the Vercel dashboard).
  const buildSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const buildEnv = process.env.VERCEL_ENV;

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-background text-foreground">
        <Sidebar buildSha={buildSha} buildEnv={buildEnv} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
