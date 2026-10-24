import Link from "next/link";
import { format } from "date-fns";
import { Gamepad2 } from "lucide-react";
import { CardHeader, SoftIconTile, panel } from "@/components/dashboard/dashboardUi";

interface MiniGameLite {
  id: string;
  date: Date;
}

/** "Next Mini Game" card — the same Mini Game schedule data as the Mini Games tab. */
export function NextMiniGameCard({ miniGame }: { miniGame: MiniGameLite | null }) {
  return (
    <section className={panel}>
      <CardHeader
        title="Next Mini Game"
        action={
          <Link href="/mini-games/new" className="text-[13px] font-semibold text-[#5b626b] hover:text-[#0d1116]">
            + Schedule
          </Link>
        }
      />
      {miniGame ? (
        <Link href={`/mini-games/${miniGame.id}`} className="flex items-center gap-[14px] px-[18px] py-[18px] hover:bg-[#fafafa]">
          <SoftIconTile>
            <Gamepad2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </SoftIconTile>
          <div>
            <p className="text-[15px] font-semibold text-[#0d1116]">{format(miniGame.date, "EEE, MMM d, yyyy")}</p>
            <p className="text-[13px] text-[#5b626b]">Open the Mini Game to log stats.</p>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-[14px] px-[18px] py-[18px]">
          <SoftIconTile>
            <Gamepad2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </SoftIconTile>
          <div>
            <p className="text-[15px] font-semibold text-[#0d1116]">Nothing scheduled</p>
            <p className="text-[13px] text-[#5b626b]">Set up a skills challenge or scrimmage.</p>
          </div>
        </div>
      )}
    </section>
  );
}
