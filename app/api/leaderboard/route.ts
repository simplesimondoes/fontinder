import { NextResponse } from "next/server";
import {
  FONT_BY_SLUG,
  buildLeaderboard,
  getAllTallies,
  score,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const raw = await getAllTallies();
  const board = buildLeaderboard(raw)
    .map((t) => {
      const meta = FONT_BY_SLUG.get(t.slug)!;
      const total = t.likes + t.nopes;
      return {
        ...t,
        name: meta.name,
        image: meta.image,
        total,
        pct: total ? Math.round((t.likes / total) * 100) : 0,
        score: score(t),
      };
    })
    .sort((a, b) => b.score - a.score || b.likes - a.likes);

  const totalVotes = board.reduce((s, b) => s + b.total, 0);
  return NextResponse.json({ board, totalVotes });
}
