"use client";

import { useState } from "react";
import { panel, display, HeadingBar } from "@/components/dashboard/dashboardUi";

export interface TrendGame {
  id: string;
  /** e.g. "vs Bethel · Oct 30" — shown as a tooltip */
  title: string;
  /** stat key → team total for that game (from getStatValue on existing team stat entries) */
  values: Record<string, number | null>;
}

const TABS = {
  offense: {
    label: "Offense",
    series: [
      { key: "shots", label: "Shots", color: "#0d1116" },
      { key: "scoringChances", label: "Scoring chances", color: "#a3a8b0" },
      { key: "goals", label: "Goals", color: "#e9b000", fill: true },
    ],
  },
  defense: {
    label: "Defense",
    series: [
      { key: "disruptions", label: "Disruptions", color: "#0d1116" },
      { key: "blocks", label: "Blocks", color: "#a3a8b0" },
      { key: "hits", label: "Hits", color: "#e9b000", fill: true },
    ],
  },
  special: { label: "Special Teams", series: [] },
} as const;

type TabKey = keyof typeof TABS;
type Series = { key: string; label: string; color: string; fill?: boolean };

const RANGES = [
  { key: "5", label: "Last 5 games" },
  { key: "10", label: "Last 10 games" },
  { key: "all", label: "Season" },
] as const;

// Chart geometry (SVG user units; the SVG scales to the card width)
const W = 666;
const H = 232;
const PAD = { left: 34, right: 22, top: 12, bottom: 30 };

/** Top of the y-axis: four equal, round steps (e.g. 0-10-20-30-40, 0-25-50-75-100). */
function niceMax(v: number): number {
  if (v <= 0) return 40;
  const raw = v / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const multiples = mag >= 10 ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10]; // 2.5 only where it stays a whole number (25, 250)
  const step = multiples.map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return Math.max(4, step * 4);
}

function avg(nums: (number | null)[]): number | null {
  const real = nums.filter((n): n is number => n !== null);
  return real.length ? real.reduce((a, b) => a + b, 0) / real.length : null;
}

function Chart({ games, series }: { games: TrendGame[]; series: readonly Series[] }) {
  const all = series.flatMap((s) => games.map((g) => g.values[s.key])).filter((n): n is number => n !== null);
  const yMax = niceMax(all.length ? Math.max(...all) : 0);
  const ticks = [0, 1, 2, 3, 4].map((i) => (yMax / 4) * i);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (games.length <= 1 ? plotW / 2 : (plotW * i) / (games.length - 1));
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;
  const labelEvery = Math.max(1, Math.ceil(games.length / 10));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Team trend chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#eef0f2" strokeWidth="1" />
            <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" fontSize="12" fill="#6b7078">
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          </g>
        ))}

        {series.map((s) => {
          const pts = games
            .map((g, i) => ({ i, v: g.values[s.key] }))
            .filter((p): p is { i: number; v: number } => p.v !== null);
          if (pts.length === 0) return null;
          const line = pts.map((p, n) => `${n === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
          const area = `${line} L${x(pts[pts.length - 1].i).toFixed(1)},${y(0)} L${x(pts[0].i).toFixed(1)},${y(0)} Z`;
          const last = pts[pts.length - 1];
          return (
            <g key={s.key}>
              {s.fill && <path d={area} fill="#f5b800" fillOpacity="0.28" />}
              <path d={line} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={x(last.i)} cy={y(last.v)} r="4.5" fill="#fff" stroke={s.color} strokeWidth="2" />
            </g>
          );
        })}

        {games.map((g, i) =>
          i % labelEvery === 0 || i === games.length - 1 ? (
            <text key={g.id} x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fill="#6b7078">
              <title>{g.title}</title>G{i + 1}
            </text>
          ) : null
        )}
      </svg>

      {games.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-6 text-center">
          <p className="text-[14px] font-semibold text-[#0d1116]">No games played yet</p>
          <p className="mt-1 text-[13px] text-[#5b626b]">Trends fill in after the first game.</p>
        </div>
      )}
    </div>
  );
}

/** "Team Trends" card: per-game team totals from official games, by tab and range. */
export function TeamTrendsCard({ games }: { games: TrendGame[] }) {
  const [tab, setTab] = useState<TabKey>("offense");
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("5");

  const shown = range === "all" ? games : games.slice(-Number(range));
  const series = TABS[tab].series as readonly Series[];

  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-[20px] pt-[20px]">
        <h3 className={`${display} flex items-center gap-[10px] text-[22px] font-bold uppercase leading-none text-[#0d1116]`}>
          <HeadingBar />
          Team Trends
        </h3>
        <label className="flex items-center gap-[10px] text-[13px] text-[#5b626b]">
          Range
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as typeof range)}
            className="h-[36px] rounded-[4px] border [--border:#d1d5db] bg-white px-[12px] pr-[8px] text-[14px] text-[#0d1116]"
          >
            {RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div role="tablist" className="mt-[14px] flex gap-[24px] border-b [--border:#eef0f2] px-[20px]">
        {(Object.keys(TABS) as TabKey[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`${display} relative pb-[10px] text-[15px] font-bold uppercase tracking-[0.12em] ${
              tab === k ? "text-[#0d1116]" : "text-[#6b7280] hover:text-[#0d1116]"
            }`}
          >
            {TABS[k].label}
            {tab === k && <span aria-hidden className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-[#f5b800]" />}
          </button>
        ))}
      </div>

      {series.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
          <p className="text-[14px] font-semibold text-[#0d1116]">Special-teams stats aren&apos;t tracked per game yet</p>
          <p className="mt-1 text-[13px] text-[#5b626b]">Power-play and penalty-kill numbers will appear here once they&apos;re logged.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-x-[20px] gap-y-1 px-[20px] pt-[18px] text-[13px] text-[#0d1116]">
            {series.map((s) => (
              <span key={s.key} className="flex items-center gap-[8px]">
                <span aria-hidden className="inline-block h-[3px] w-[14px] rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>

          <div className="px-[10px] pt-[8px]">
            <Chart games={shown} series={series} />
          </div>

          <div className="overflow-x-auto px-[20px] pb-[14px]">
            <table className="w-full min-w-[520px] text-[14px]">
              <thead>
                <tr className="border-b [--border:#eef0f2]">
                  <th className={`${display} py-[7px] text-left text-[12px] font-semibold uppercase tracking-[0.14em] text-[#4b525b]`}>Stat</th>
                  {shown.map((g, i) => (
                    <th key={g.id} title={g.title} className={`${display} py-[7px] text-right text-[12px] font-semibold uppercase tracking-[0.1em] text-[#4b525b]`}>
                      G{i + 1}
                    </th>
                  ))}
                  <th className={`${display} py-[7px] text-right text-[12px] font-bold uppercase tracking-[0.1em] text-[#0d1116]`}>Avg</th>
                </tr>
              </thead>
              <tbody>
                {series.map((s) => {
                  const vals = shown.map((g) => g.values[s.key]);
                  const a = avg(vals);
                  return (
                    <tr key={s.key} className="border-b [--border:#eef0f2] last:border-b-0">
                      <td className="py-[7px] font-semibold text-[#0d1116]">{s.label}</td>
                      {vals.map((v, i) => (
                        <td key={shown[i].id} className="py-[7px] text-right text-[#0d1116]">
                          {v ?? "–"}
                        </td>
                      ))}
                      <td className="py-[7px] text-right font-bold text-[#0d1116]">{a === null ? "–" : a.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
