import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/nav/Sidebar";
import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Vercel sets these automatically at build time — surfacing them in the
  // sidebar makes it possible to tell, just by looking at the live site,
  // whether a given push actually made it into the deployment being served
  // (rather than guessing from the Vercel dashboard).
  const buildSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const buildEnv = process.env.VERCEL_ENV;

  // Real season/team data for the sidebar's bottom-left brand block — same
  // source every page already uses, not a separate/duplicated lookup.
  const season = await getCurrentSeason();
  const team = season ? await prisma.team.findUnique({ where: { seasonId: season.id } }) : null;

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-background text-foreground">
        <Sidebar buildSha={buildSha} buildEnv={buildEnv} teamName={team?.name} seasonName={season?.name} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
