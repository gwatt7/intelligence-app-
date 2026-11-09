import { Sidebar } from "@/components/nav/Sidebar";
import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";

// Every page under this layout reads live data from the database, so render
// it per request rather than at build time. Railway's private database
// network isn't reachable during the build step, so prerendering these pages
// would fail the build there.
export const dynamic = "force-dynamic";

// Layout for the existing analytics dashboard and all its tabs (sidebar + page).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Vercel sets these automatically at build time — surfacing them in the
  // sidebar makes it possible to tell, just by looking at the live site,
  // whether a given push actually made it into the deployment being served
  // (rather than guessing from the Vercel dashboard).
  // Railway sets its own equivalents, so the label works on either host.
  const buildSha = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA)?.slice(0, 7);
  const buildEnv = process.env.VERCEL_ENV ?? (process.env.RAILWAY_ENVIRONMENT_NAME ? `railway ${process.env.RAILWAY_ENVIRONMENT_NAME}` : undefined);

  // Real season/team data for the sidebar's bottom-left brand block — same
  // source every page already uses, not a separate/duplicated lookup.
  const season = await getCurrentSeason();
  const team = season ? await prisma.team.findUnique({ where: { seasonId: season.id } }) : null;

  return (
    <div className="min-h-screen flex">
      <Sidebar
        buildSha={buildSha}
        buildEnv={buildEnv}
        teamName={team?.name}
        seasonName={season?.name}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
